# Visão Geral da Validação no Vulkan

> **Nota:** O propósito desta seção é fornecer uma visão geral completa de como o Vulkan lida com o *uso válido* (*valid usage*) da API.

## Uso Válido (Valid Usage — VU)

Uma **VU** é explicitamente [definida na Especificação do Vulkan](https://docs.vulkan.org/spec/latest/chapters/fundamentals.html#fundamentals-validusage) como:

> **Nota:** Um conjunto de condições que **devem** ser satisfeitas para alcançar um comportamento bem definido em tempo de execução em uma aplicação.

Uma das principais vantagens do Vulkan, como uma API explícita, é que a implementação (driver) não perde tempo verificando entradas válidas. No OpenGL, a implementação precisava verificar constantemente o uso válido, o que adicionava um *overhead* perceptível. Não existe equivalente a [glGetError](https://www.khronos.org/opengl/wiki/OpenGL_Error) no Vulkan.

As regras de uso válido são listadas na especificação após cada função e estrutura. Por exemplo, se uma VUID verifica um `VkImage` inválido em `vkBindImageMemory`, então o uso válido correspondente na especificação é encontrado em `vkBindImageMemory`. Isso ocorre porque as *Validation Layers* só terão todas as informações necessárias no momento em que `vkBindImageMemory` for chamado durante a execução da aplicação.

## Comportamento Indefinido (Undefined Behavior)

Quando uma aplicação fornece uma entrada inválida, de acordo com as regras de uso válido da especificação, o resultado é *comportamento indefinido* (*undefined behavior*). Nesse estado, o Vulkan não oferece garantias, pois [qualquer coisa é possível com comportamento indefinido](https://raphlinus.github.io/programming/rust/2018/08/17/undefined-behavior.html).

**MUITO IMPORTANTE**: Embora um comportamento indefinido possa parecer funcionar em uma implementação, há uma grande chance de falhar em outra.

### Valor Indefinido (Undefined Value)

Existem alguns pontos na especificação que resultam em *valor indefinido* (*undefined value*). São situações em que não é inválido realizar determinada operação, mas o valor retornado pelo hardware pode ser lixo de memória. Imagine o seguinte código:

```cpp
int x;
std::cout << x << '\n';
```

Ele nunca vai travar, mas o valor pode ser qualquer coisa, e confiar que o valor indefinido seja algo como `0` é perigoso.

## Identificador de Uso Válido (Valid Usage ID — VUID)

Um `VUID` é um identificador único atribuído a cada regra de uso válido. Isso fornece uma maneira fácil de apontar para uma regra específica na especificação.

Usando `VUID-vkBindImageMemory-memoryOffset-01046` como exemplo, basta adicionar o VUID como âncora na versão HTML da especificação ([vkspec.html#VUID-vkBindImageMemory-memoryOffset-01046](https://docs.vulkan.org/spec/latest/chapters/resources.html#VUID-vkBindImageMemory-memoryOffset-01046)) para ir diretamente à regra correspondente.

### Implícito vs. Explícito

*Validação Implícita* é a validação gerada automaticamente a partir do arquivo `vk.xml`. Ela cobre verificações "óbvias", como "`device` deve ser um handle `VkDevice` válido".

*Validação Explícita* refere-se às VUs escritas manualmente e encontradas em todo o restante da especificação.

Uma maneira simples de distinguir uma da outra é verificar se há um número no VUID:

- `VUID-vkBindImageMemory-image-01044` é explícito
- `VUID-vkBindImageMemory-memory-parameter` é implícito

## Khronos Validation Layer

Como o Vulkan não realiza verificação de erros por padrão, é **muito importante**, durante o desenvolvimento, habilitar imediatamente as [Validation Layers](https://github.com/KhronosGroup/Vulkan-ValidationLayers) para ajudar a capturar comportamentos inválidos. As aplicações também nunca devem distribuir as *Validation Layers* em produção, pois elas reduzem consideravelmente o desempenho e foram projetadas exclusivamente para a fase de desenvolvimento.

> **Nota:** A Khronos Validation Layer costumava ser composta por várias camadas separadas, mas foi unificada em uma única camada `VK_LAYER_KHRONOS_validation`. [Mais detalhes explicados no whitepaper da LunarG](https://www.lunarg.com/wp-content/uploads/2019/04/UberLayer_V3.pdf).

### Obtendo as Validation Layers

As *Validation Layers* estão em constante atualização e aprimoramento, portanto é sempre possível baixar o código-fonte e [compilá-las por conta própria](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/BUILD.md). Caso você prefira uma versão pré-compilada, há várias opções para todas as plataformas suportadas:

* **Android** — Os binários são [publicados no GitHub](https://github.com/KhronosGroup/Vulkan-ValidationLayers/releases) com a versão mais recente. O NDK também já inclui as *Validation Layers* compiladas, além de [informações sobre como utilizá-las](https://developer.android.com/ndk/guides/graphics/validation-layer).
* **Linux** — O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) inclui as *Validation Layers* compiladas e instruções de uso no [Linux](https://vulkan.lunarg.com/doc/sdk/latest/linux/khronos_validation_layer.html).
* **macOS** — O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) inclui as *Validation Layers* compiladas e instruções de uso no [macOS](https://vulkan.lunarg.com/doc/sdk/latest/mac/khronos_validation_layer.html).
* **Windows** — O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) inclui as *Validation Layers* compiladas e instruções de uso no [Windows](https://vulkan.lunarg.com/doc/sdk/latest/windows/khronos_validation_layer.html).

## Entendendo uma Mensagem de Erro de Validação

Essas informações podem ser encontradas na [documentação das Validation Layers](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/docs/error_messages.md).

## Tags de Uso Especial (Special Usage Tags)

A [camada de Best Practices](https://vulkan.lunarg.com/doc/sdk/latest/windows/best_practices.html) gera avisos quando uma aplicação tenta usar qualquer extensão com [tags de uso especial](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-specialuse). Um exemplo desse tipo de extensão é `VK_EXT_transform_feedback` (consulte o capítulo sobre Extensões de Camadas de Tradução), projetada apenas para camadas de emulação. Se o uso pretendido pela sua aplicação corresponder a um desses casos especiais, a abordagem a seguir permite ignorar esses avisos.

Ignorando avisos de uso especial com `VK_EXT_debug_report`:

```cpp
#include <string_view>

VKAPI_ATTR VkBool32 VKAPI_CALL DebugReportCallbackEXT(
    /* ... */ const char* pMessage /* ... */)
{
    // Se pMessage contiver "specialuse-extension", encerra e ignora o aviso
    if (pMessage != nullptr &&
        std::string_view{pMessage}.find("specialuse-extension") != std::string_view::npos) {
        return VK_FALSE;
    }

    // Trata as demais mensagens de validação
    return VK_FALSE;
}
```

Ignorando avisos de uso especial com `VK_EXT_debug_utils`:

```cpp
#include <string_view>

VKAPI_ATTR VkBool32 VKAPI_CALL DebugUtilsMessengerCallbackEXT(
    /* ... */ const VkDebugUtilsMessengerCallbackDataEXT* pCallbackData /* ... */)
{
    // Se pMessageIdName contiver "specialuse-extension", encerra e ignora o aviso
    if (pCallbackData != nullptr && pCallbackData->pMessageIdName != nullptr &&
        std::string_view{pCallbackData->pMessageIdName}.find("specialuse-extension") != std::string_view::npos) {
        return VK_FALSE;
    }

    // Trata as demais mensagens de validação
    return VK_FALSE;
}
```
