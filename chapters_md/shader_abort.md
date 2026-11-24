# Shader Abort

Este capítulo aborda a extensão [`VK_KHR_shader_abort`](https://docs.vulkan.org/features/latest/features/proposals/VK_KHR_shader_abort.html).

`VK_KHR_shader_abort` fornece um `assert()` ao estilo de GPU para ajudar a depurar seus shaders com uma configuração simples.

A ideia central é a nova instrução `OpAbortKHR` que, quando executada, interrompe o shader (causando um *device lost*) e envia de volta os dados da mensagem de aborto para serem examinados no lado do host.

## As Extensões de Dependência

Esta extensão foi lançada junto com outras 2 extensões das quais depende:

* `VK_KHR_shader_constant_data` (`SPV_KHR_constant_data`)
  * Permite constantes grandes (strings) dentro de um shader.
  * Um shader só precisa dessa capacidade se utilizar dados constantes, o que o `glslang` faz para a string de mensagem.
* `VK_KHR_device_fault`
  * É a forma pela qual a aplicação lê a mensagem após a perda do dispositivo (*device lost*).

> **Nota:** Algumas toolchains de shader (`glslang`) usam um inteiro de 8 bits para os caracteres da string de mensagem, o que significa que o shader também declara a capacidade `Int8` e precisa do recurso `shaderInt8`.

## O que Acontece Quando um Shader Aborta

Quando uma invocação executa `OpAbortKHR`:

1. Essa invocação para exatamente naquele ponto. Apenas instruções anteriores a ela tiveram qualquer efeito colateral.
2. Outras invocações **não** são interrompidas instantaneamente. A implementação precisa interrompê-las em "tempo finito", portanto algumas delas podem executar até a conclusão e algumas também podem abortar.
3. O `VkDevice` é perdido e as chamadas passarão a retornar `VK_ERROR_DEVICE_LOST` (**Nota:** a especificação exige que o driver reporte *device lost* em um aborto).
4. A aplicação usa `vkGetDeviceFaultDebugInfoKHR` para obter a mensagem.

Como outras invocações podem continuar executando por um breve período, mais de uma delas pode atingir um aborto antes de o dispositivo ser desligado.

A implementação só é obrigada a relatar a mensagem do primeiro aborto executado. Ela pode relatar mais mensagens, mas não é obrigada a fazê-lo. Isso significa que uma aplicação deve estar preparada para lidar com o recebimento de uma ou várias mensagens, mas nunca deve esperar ver todas elas.

## O Formato da Mensagem

Quando o aborto ocorre, o driver envia os dados de volta em `VkDeviceFaultShaderAbortMessageInfoKHR::pMessageData`, que consiste em uma série de mensagens `(size, payload)`.

Neste exemplo, `VkDeviceFaultShaderAbortMessageInfoKHR::messageDataSize == 64` e existem 3 mensagens em seu interior:

![Layout base das mensagens de aborto em pMessageData](images/shader_abort_message_layout_base.svg)

Alguns pontos a observar:

* `size` é um inteiro sem sinal de 64 bits indicando o tamanho do `payload` em bytes (sem contar qualquer *padding* após ele).
* `payload` corresponde exatamente aos bytes da *Message*, dispostos conforme o *Message Type* na instrução `OpAbortKHR`.
* Cada par começa em um deslocamento alinhado a 8 bytes, portanto pode haver algum *padding* após um payload.

### O Estilo Comum `printf`

Tanto o `glslang` quanto o Slang fornecem um aborto funcional no estilo `printf` a partir do Vulkan SDK 1.4.363.0:

```glsl
// GLSL
#extension GL_EXT_abort : require
abortEXT("bad index: %u", index);

// Slang
abort("bad index: %u", index);
```

![Layout de mensagem de aborto simples no estilo printf](images/shader_abort_message_layout_simple.svg)

### Os Dados Podem Ser Qualquer Coisa

É **importante entender** que o driver envia os dados de volta para `pMessageData` **sem modificá-los**. Isso significa que a ideia de `printf` é apenas uma convenção e não precisa realmente ser seguida para usar `VK_KHR_shader_abort`.

Embora `glslang` e Slang não ofereçam uma maneira direta de fazer isso, não seria difícil injetar sua própria instrução `OpAbortKHR` parecida com isto (pseudocódigo):

```glsl
float myFloat;
void* myPointer;

abort(42, myFloat, myPointer);
```

![Layout avançado de mensagem de aborto com dados arbitrários](images/shader_abort_message_layout_advance.svg)

Isso exigiria apenas que a aplicação conhecesse esse layout ao decodificar a mensagem.

## Recuperando a Mensagem

Após detectar `VK_ERROR_DEVICE_LOST`, encadeie `VkDeviceFaultShaderAbortMessageInfoKHR` em `VkDeviceFaultDebugInfoKHR` e chame `vkGetDeviceFaultDebugInfoKHR`. Assim como outras chamadas do padrão "obter o tamanho e depois obter os dados", ela é chamada duas vezes:

```cpp
#include <cstdint>
#include <vector>

VkDeviceFaultShaderAbortMessageInfoKHR abort_info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_FAULT_SHADER_ABORT_MESSAGE_INFO_KHR,
    .pNext = nullptr,
    .messageDataSize = 0,
    .pMessageData = nullptr,
};

VkDeviceFaultDebugInfoKHR debug_info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_FAULT_DEBUG_INFO_KHR,
    .pNext = &abort_info,
};

// 1ª chamada: pMessageData é nullptr, portanto messageDataSize é preenchido com o tamanho necessário
vkGetDeviceFaultDebugInfoKHR(device, &debug_info);

// Nem toda perda de dispositivo (device lost) vem de um shader abort,
// portanto é esperado que messageDataSize seja zero em muitos casos
if (abort_info.messageDataSize > 0) {
    std::vector<uint8_t> data(abort_info.messageDataSize);
    abort_info.pMessageData = data.data();

    // 2ª chamada: as mensagens são gravadas em pMessageData
    vkGetDeviceFaultDebugInfoKHR(device, &debug_info);
    // ... decodificar
}
```

Neste ponto, você pode perceber que precisa implementar a lógica para iterar por todos os pares `(size, payload)` em `pMessageData` e ainda fazer sua própria formatação no estilo `snprintf`.

Para ajudar os desenvolvedores, existe um arquivo auxiliar simples e prático chamado `shader_abort_message.h` em [https://github.com/LunarG/ShaderAbortTools](https://github.com/LunarG/ShaderAbortTools) que cuida de tudo isso para você!
