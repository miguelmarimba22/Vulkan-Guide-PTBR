# Buffer Device Address

O recurso *Buffer Device Address* permite que você tenha um ponteiro para um `VkBuffer` dentro dos seus *shaders*. Há muitos outros casos de uso, como *Ray Tracing*, ferramentas no lado da GPU, entre outros.

> **Nota:** Este capítulo é um detalhamento técnico de como o recurso funciona; se você estiver procurando um guia simples de "como apenas usar isso", confira o exemplo no repositório [Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions/buffer_device_address).

## Extensão

A proposta original foi feita por meio da extensão `VK_EXT_buffer_device_address`. Logo em seguida, foi adicionada a `VK_KHR_buffer_device_address`, que trouxe algumas pequenas diferenças de funcionalidade. A partir do Vulkan 1.2, o recurso foi promovido ao núcleo (*core*) da API e está amplamente disponível em GPUs de todas as plataformas. A partir do Vulkan 1.3, tornou-se obrigatório; portanto, se você estiver usando Vulkan 1.3, o suporte é garantido.

### Nomes alternativos

A nomenclatura do recurso `Buffer Device Address` varia dependendo de onde você procura.

Em GLSL, ele é chamado de `buffer reference` (consulte [GL_EXT_buffer_reference](https://github.com/KhronosGroup/GLSL/blob/main/extensions/ext/GLSL_EXT_buffer_reference.txt)). Isso ocorre porque, sintaticamente, ele é usado de forma mais parecida com uma referência do C++ do que com um ponteiro.

Em SPIR-V, ele é chamado de `PhysicalStorageBuffer` (consulte [SPV_KHR_physical_storage_buffer](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_physical_storage_buffer.html)). O nome vem do fato de que já existia `StorageBuffer` e agora ele passa a ser "Physical" (`Physical` vem de *physical addressing*, um conceito presente no SPIR-V de `Kernel`).

Se você vem do DirectX, conhecerá esse recurso como `GPU virtual address`.

## Lado Vulkan

No código Vulkan, as únicas 3 coisas que você precisa fazer são:

1. Habilitar o recurso `bufferDeviceAddress` (e também a extensão, caso esteja usando Vulkan 1.0 ou 1.1).
2. Adicionar `VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT_KHR` ao criar seu `VkBuffer`.
3. Adicionar `VK_MEMORY_ALLOCATE_DEVICE_ADDRESS_BIT_KHR` ao alocar sua `VkDeviceMemory`.

A partir daí, você pode chamar `vkGetBufferDeviceAddress`, que retornará um `VkDeviceAddress`. Esse valor é agora o seu ponteiro de 64 bits para aquele `VkBuffer`, podendo ser passado para o seu *shader*.

> **Nota:** Para desenvolvedores de ferramentas, a função `vkGetBufferDeviceAddress` pode quebrar a premissa de que funções Vulkan retornam apenas `void` ou `VkResult`.

## Lado SPIR-V

> **Nota:** Se você estiver usando GLSL/HLSL/Slang/etc., tudo o que segue abaixo é tratado automaticamente pelo compilador!

### Capacidade (*Capability*)

O SPIR-V conterá a instrução `OpCapability PhysicalStorageBufferAddresses`, que corresponde a `VkPhysicalDeviceVulkan12Features::bufferDeviceAddress` (ou `VkPhysicalDeviceBufferDeviceAddressFeatures::bufferDeviceAddress`), informando a todos que o dispositivo suporta esse recurso.

### Modelo de Endereçamento (*Addressing Model*)

O SPIR-V possui um [Modelo de Endereçamento](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#Addressing_Model) com 3 grupos de opções:

1. `Logical` — é o utilizado pelo Vulkan 1.0, sem conceito de ponteiros.
2. `Physical32`/`Physical64` — utilizado para OpenCL.
3. `PhysicalStorageBuffer64` — é o que você utilizará ao fazer uso de *Buffer Device Address*.

### shaderInt64

Como esses `VkDeviceAddress` são representados como ponteiros inteiros de 64 bits no seu *shader*, você provavelmente desejará suporte a `shaderInt64` no seu dispositivo.

Alguns dispositivos podem suportar `bufferDeviceAddress`, mas não `shaderInt64`. A forma de contornar essa situação é representar tudo como um `uvec2` (consulte [GL_EXT_buffer_reference_uvec2](https://github.com/KhronosGroup/GLSL/blob/main/extensions/ext/GLSL_EXT_buffer_reference_uvec2.txt)).

### Alinhamento

Consulte o capítulo dedicado ao Alinhamento de Buffer Device Address.

### Nullptr

O SPIR-V possui `OpConstantNull`, mas essa instrução não pode ser usada com `PhysicalStorageBuffer`. A forma de contornar isso é converter o ponteiro para um inteiro com `OpConvertPtrToU` ou para um `uvec2` com `OpBitcast`.

O Vulkan define o valor inteiro `0` como nulo (exatamente como todos esperariam!).

### Variáveis entre estágios (*Cross stage variables*)

Ainda há discussões em andamento para esclarecer se/como funciona a passagem de ponteiros entre dois estágios (por exemplo, de *vertex* para *fragment*).

O principal problema é que você pode receber erros das *validation layers* na correspondência de `Location` (consulte [Vulkan-ValidationLayers#5349](https://github.com/KhronosGroup/Vulkan-ValidationLayers/pull/5349)).

A recomendação é simplesmente passar um `uvec2` ou `int64` entre estágios e fazer o *cast* novamente no estágio consumidor.

### OpTypeForwardPointer e loops infinitos

A instrução `OpTypeForwardPointer` é usada para declarar antecipadamente (*forward reference*) o tipo do ponteiro. Isso é útil se a aplicação quiser implementar estruturas como uma lista encadeada:

```glsl
layout(buffer_reference) buffer Node;

layout(buffer_reference, std430) buffer Node {
    Node next_node;
    int payload;
};

layout(set = 0, binding = 0, std430) buffer SSBO {
    Node start;
};
```

Você verá o seguinte código SPIR-V:

```text
            OpTypeForwardPointer %Node_ptr PhysicalStorageBuffer
    %SSBO = OpTypeStruct %Node_ptr
     %int = OpTypeInt 32 1
    %Node = OpTypeStruct %Node_ptr %int
%Node_ptr = OpTypePointer PhysicalStorageBuffer %Node
%SSBO_ptr = OpTypePointer StorageBuffer %SSBO
     %var = OpVariable %SSBO_ptr StorageBuffer
```

Ao fazer o *parsing* desse SPIR-V para realizar reflexão (*reflection*), é muito fácil cair em um loop infinito, portanto tome cuidado.

> **Nota:** Se você quiser alguns arquivos SPIR-V para testar isso, confira os testes `buffer_handle_*.spv` em [SPIR-V Reflect Tests](https://github.com/KhronosGroup/SPIRV-Reflect/blob/main/tests/glsl).

### Acessos

Considere o seguinte exemplo simples em GLSL:

```glsl
#version 450
#extension GL_EXT_buffer_reference : enable

layout(buffer_reference) buffer BDA {
    int a;
};

layout(set=0, binding=0) uniform InData {
    BDA b;
};

void main() {
    b.a = 0;
}
```

Você verá o seguinte código SPIR-V:

```text
%bda_ptr = OpTypePointer PhysicalStorageBuffer %bda_struct
%ubo_ptr = OpTypePointer Uniform %bda_ptr
%int_ptr = OpTypePointer PhysicalStorageBuffer %type_int

 %1 = OpAccessChain %ubo_ptr %3 %int_0
 %2 = OpLoad %bda_ptr %1
 %3 = OpAccessChain %int_ptr %2 %int_0
      OpStore %3 %int_0 Aligned 16
```

É fácil pensar que esse `OpLoad` está desreferenciando o ponteiro antes de armazenarmos nele.

Essa suposição está incorreta: na verdade, o `OpLoad` está carregando o ponteiro lógico a partir do `ubo`. A *access chain* calcula um deslocamento (*offset*) a partir dele para o ponteiro físico. A partir daí, o `OpStore` acessa o local correto na memória através do ponteiro.

Portanto, no exemplo acima, ocorre apenas um acesso de escrita nessa memória.

## Visão Geral

O diagrama a seguir busca ilustrar visualmente como o *Buffer Device Address* funciona:

![Diagrama de visão geral do funcionamento do Buffer Device Address](images/buffer_device_address_overview.png)
