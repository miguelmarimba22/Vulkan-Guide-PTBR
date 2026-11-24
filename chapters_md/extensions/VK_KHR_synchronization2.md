# VK_KHR_synchronization2

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.3.

A extensão `VK_KHR_synchronization2` oferece melhorias para *pipeline barriers*, *events*, transições de layout de imagem e submissão em *queues*. Este documento mostra a diferença entre as operações originais de sincronização do Vulkan e aquelas fornecidas pela extensão. Há também exemplos de como atualizar o código da aplicação para utilizar a extensão.

## Repensando Estágios de Pipeline e Flags de Acesso

Uma das principais mudanças da extensão é fazer com que os estágios de pipeline (*pipeline stages*) e as *flags* de acesso (*access flags*) sejam especificados juntos nas estruturas de *memory barrier*. Isso torna a conexão entre ambos muito mais evidente.

O único novo tipo de estrutura necessário é `VkDependencyInfoKHR`, que encapsula todas as barreiras em um único local.

![Estágios de pipeline e flags de acesso na VK_KHR_synchronization2](images/extensions/VK_KHR_synchronization2_stage_access.png)

### Adicionando barreiras ao definir eventos

Note que, com a introdução de `VkDependencyInfoKHR`, a função `vkCmdSetEvent2KHR`, diferentemente de `vkCmdSetEvent`, tem a capacidade de adicionar barreiras. Isso foi adicionado para tornar `VkEvent` mais útil. Como a implementação de um `VkEvent` da `synchronization2` provavelmente é substancialmente diferente de um `VkEvent` do Vulkan 1.2, você não deve misturar chamadas da extensão e da API *core* para um mesmo `VkEvent`. Por exemplo, você não deve chamar `vkCmdSetEvent2KHR()` e depois `vkCmdWaitEvents()`.

## Reutilizando os mesmos nomes de estágios de pipeline e flags de acesso

Devido ao esgotamento dos 32 bits em `VkAccessFlag`, o tipo `VkAccessFlags2KHR` foi criado com um intervalo de 64 bits. Para evitar o mesmo problema com `VkPipelineStageFlags`, o tipo `VkPipelineStageFlags2KHR` também foi criado com um intervalo de 64 bits.

Tipos de enumeração de 64 bits não estão disponíveis em todos os compiladores C/C++, portanto o código para os novos campos usa valores `static const` em vez de um `enum`. Como resultado disso, não existem tipos equivalentes a `VkPipelineStageFlagBits` e `VkAccessFlagBits`. Alguns códigos, incluindo funções do Vulkan como `vkCmdWriteTimestamp()`, usavam o tipo `Bits` para indicar que o chamador só poderia passar um único valor de bit, em vez de uma máscara com múltiplos bits. Essas chamadas precisam ser convertidas para aceitar o tipo `Flags` e impor a limitação de "apenas 1 bit" por meio de *Valid Usage* ou pela convenção de código apropriada no seu projeto, exatamente como foi feito em `vkCmdWriteTimestamp2KHR()`.

As novas *flags* incluem bits idênticos aos das *flags* originais de sincronização, com o mesmo nome base e valores idênticos. *Flags* antigas podem ser usadas diretamente nas novas APIs, respeitando quaisquer restrições de conversão de tipos do ambiente de programação. Os dois exemplos a seguir mostram as diferenças de nomenclatura:

- `VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT` para `VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR`
- `VK_ACCESS_SHADER_READ_BIT` para `VK_ACCESS_2_SHADER_READ_BIT_KHR`

## VkSubpassDependency

Atualizar o uso dos estágios de pipeline e das *flags* de acesso em `VkSubpassDependency` requer simplesmente usar `VkSubpassDependency2`, que pode receber uma `VkMemoryBarrier2KHR` encadeada em `pNext`.

Um exemplo seria transformar:

```cpp
// Sem VK_KHR_synchronization2
VkSubpassDependency dependency{
    .srcSubpass = 0,
    .dstSubpass = 1,
    .srcStageMask = VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT |
                    VK_PIPELINE_STAGE_LATE_FRAGMENT_TESTS_BIT,
    .dstStageMask = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    .srcAccessMask = VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_INPUT_ATTACHMENT_READ_BIT,
    .dependencyFlags = VK_DEPENDENCY_BY_REGION_BIT,
};
```

em:

```cpp
// Com VK_KHR_synchronization2
VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_EARLY_FRAGMENT_TESTS_BIT_KHR |
                    VK_PIPELINE_STAGE_2_LATE_FRAGMENT_TESTS_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_INPUT_ATTACHMENT_READ_BIT_KHR,
};

// Os 4 campos não definidos são ignorados de acordo com a especificação
// quando VkMemoryBarrier2KHR é passado em pNext
VkSubpassDependency2 dependency{
    .sType = VK_STRUCTURE_TYPE_SUBPASS_DEPENDENCY_2,
    .pNext = &memoryBarrier,
    .srcSubpass = 0,
    .dstSubpass = 1,
    .dependencyFlags = VK_DEPENDENCY_BY_REGION_BIT,
};
```

## Dividindo estágios de pipeline e máscaras de acesso

Alguns valores de `VkAccessFlags` e `VkPipelineStageFlags` eram ambíguos quanto ao que estavam mirando no hardware. Os novos `VkAccessFlags2KHR` e `VkPipelineStageFlags2KHR` dividem esses valores em alguns casos, mantendo o valor antigo por questões de compatibilidade e manutenibilidade.

### Dividindo `VK_PIPELINE_STAGE_VERTEX_INPUT_BIT`

O estágio `VK_PIPELINE_STAGE_VERTEX_INPUT_BIT` (agora `VK_PIPELINE_STAGE_2_VERTEX_INPUT_BIT_KHR`) foi dividido em 2 novas *flags* de estágio que especificam um estágio dedicado tanto para a entrada de índices quanto para a entrada de atributos de vértice, em vez de mantê-los combinados em uma única *flag*:

- `VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT_KHR`
- `VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR`

### Dividindo `VK_PIPELINE_STAGE_TRANSFER_BIT`

O estágio `VK_PIPELINE_STAGE_TRANSFER_BIT` (agora `VK_PIPELINE_STAGE_2_ALL_TRANSFER_BIT_KHR`) foi dividido em 4 novas *flags* de estágio que especificam um estágio dedicado para os diversos comandos de transferência, em vez de mantê-los combinados em uma única *flag*:

- `VK_PIPELINE_STAGE_2_COPY_BIT_KHR`
- `VK_PIPELINE_STAGE_2_RESOLVE_BIT_KHR`
- `VK_PIPELINE_STAGE_2_BLIT_BIT_KHR`
- `VK_PIPELINE_STAGE_2_CLEAR_BIT_KHR`

### Dividindo `VK_ACCESS_SHADER_READ_BIT`

A *flag* `VK_ACCESS_SHADER_READ_BIT` (agora `VK_ACCESS_2_SHADER_READ_BIT_KHR`) foi dividida em 3 novas *flags* de acesso que especificam um acesso dedicado para cada caso, em vez de mantê-los combinados em uma única *flag*:

- `VK_ACCESS_2_UNIFORM_READ_BIT_KHR`
- `VK_ACCESS_2_SHADER_SAMPLED_READ_BIT_KHR`
- `VK_ACCESS_2_SHADER_STORAGE_READ_BIT_KHR`

### Combinando estágios de shader pré-rasterização

Além de dividir *flags*, `VK_PIPELINE_STAGE_2_PRE_RASTERIZATION_SHADERS_BIT_KHR` foi adicionada para combinar os estágios de shader que ocorrem antes da rasterização em uma única *flag* conveniente.

## Alias para `VK_ACCESS_SHADER_WRITE_BIT`

A *flag* `VK_ACCESS_SHADER_WRITE_BIT` (agora `VK_ACCESS_2_SHADER_WRITE_BIT_KHR`) recebeu o *alias* `VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT_KHR` para descrever melhor o escopo dos recursos no shader abrangidos por essa *flag* de acesso.

## Depreciação de `TOP_OF_PIPE` e `BOTTOM_OF_PIPE`

O uso de `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` e `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` agora está depreciado (*deprecated*), e a atualização é tão simples quanto seguir os 4 casos abaixo com os novos equivalentes:

- `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` no primeiro escopo de sincronização:

```cpp
// De
.srcStageMask = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,

// Para
.srcStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
.srcAccessMask = VK_ACCESS_2_NONE_KHR,
```

- `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` no segundo escopo de sincronização:

```cpp
// De
.dstStageMask = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,

// Para
.dstStageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
.dstAccessMask = VK_ACCESS_2_NONE_KHR,
```

- `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` no primeiro escopo de sincronização:

```cpp
// De
.srcStageMask = VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT,

// Para
.srcStageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
.srcAccessMask = VK_ACCESS_2_NONE_KHR,
```

- `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` no segundo escopo de sincronização:

```cpp
// De
.dstStageMask = VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT,

// Para
.dstStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
.dstAccessMask = VK_ACCESS_2_NONE_KHR,
```

## Utilizando novos layouts de imagem

A extensão `VK_KHR_synchronization2` adiciona 2 novos layouts de imagem, `VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL_KHR` e `VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL_KHR`, para facilitar as transições de layout.

O exemplo a seguir usa o caso de um *draw* que escreve tanto em um *color attachment* quanto em um *depth/stencil attachment*, os quais são então ambos amostrados (*sampled*) no *draw* seguinte. Anteriormente, o desenvolvedor precisava garantir que os layouts e as máscaras de acesso correspondessem corretamente, como no código abaixo:

```cpp
VkImageMemoryBarrier colorImageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .oldLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
};

VkImageMemoryBarrier depthStencilImageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .oldLayout = VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
};
```

Com `VK_KHR_synchronization2`, isso fica muito mais simples:

```cpp
VkImageMemoryBarrier2KHR colorImageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL_KHR, // novo layout da VK_KHR_synchronization2
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL_KHR,  // novo layout da VK_KHR_synchronization2
};

VkImageMemoryBarrier2KHR depthStencilImageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL_KHR, // novo layout da VK_KHR_synchronization2
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL_KHR,  // novo layout da VK_KHR_synchronization2
};
```

No novo caso, `VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL_KHR` funciona aplicando-se contextualmente com base no formato da imagem utilizada. Portanto, desde que `colorImageMemoryBarrier` seja usada em um formato de cor, `VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL_KHR` mapeia para `VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL`.

Além disso, com `VK_KHR_synchronization2`, se `oldLayout` for igual a `newLayout`, nenhuma transição de layout é executada e o conteúdo da imagem é preservado. O layout usado nem sequer precisa corresponder ao layout atual da imagem, portanto a barreira a seguir é válida:

```cpp
VkImageMemoryBarrier2KHR depthStencilImageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    // outros campos omitidos
    .oldLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    .newLayout = VK_IMAGE_LAYOUT_UNDEFINED,
};
```

## Novo fluxo de submissão

A extensão `VK_KHR_synchronization2` adiciona o comando `vkQueueSubmit2KHR`, cujo principal objetivo é limpar a sintaxe da função encapsulando *command buffers* e *semaphores* em estruturas extensíveis, incorporando mudanças do Vulkan 1.1, `VK_KHR_device_group` e `VK_KHR_timeline_semaphore`.

Tomando o exemplo a seguir de uma chamada normal de submissão em *queue*:

```cpp
#include <array>
#include <cstdint>

VkSemaphore waitSemaphore = VK_NULL_HANDLE;
VkSemaphore signalSemaphore = VK_NULL_HANDLE;
std::array<VkCommandBuffer, 8> commandBuffers{};
VkPipelineStageFlags waitStage = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;

// Possível pNext de VK_KHR_timeline_semaphore
VkTimelineSemaphoreSubmitInfo timelineSemaphoreSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_TIMELINE_SEMAPHORE_SUBMIT_INFO,
    .pNext = nullptr,
    // ...
};

// Possível pNext de VK_KHR_device_group
VkDeviceGroupSubmitInfo deviceGroupSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_GROUP_SUBMIT_INFO,
    .pNext = &timelineSemaphoreSubmitInfo,
    // ...
};

// Possível pNext do Vulkan 1.1
VkProtectedSubmitInfo protectedSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_PROTECTED_SUBMIT_INFO,
    .pNext = &deviceGroupSubmitInfo,
    // ...
};

VkSubmitInfo submitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
    .pNext = &protectedSubmitInfo, // Encadeia todas as 3 estruturas extensíveis
    .waitSemaphoreCount = 1,
    .pWaitSemaphores = &waitSemaphore,
    .pWaitDstStageMask = &waitStage,
    .commandBufferCount = static_cast<uint32_t>(commandBuffers.size()),
    .pCommandBuffers = commandBuffers.data(),
    .signalSemaphoreCount = 1,
    .pSignalSemaphores = &signalSemaphore,
};

vkQueueSubmit(queue, 1, &submitInfo, fence);
```

Isso agora pode ser transformado para `vkQueueSubmit2KHR` da seguinte forma:

```cpp
#include <array>
#include <cstdint>

// Usa os mesmos handles de semaphore e command buffer
VkSemaphore waitSemaphore = VK_NULL_HANDLE;
VkSemaphore signalSemaphore = VK_NULL_HANDLE;
std::array<VkCommandBuffer, 8> commandBuffers{};

VkSemaphoreSubmitInfoKHR waitSemaphoreSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = waitSemaphore,
    .value = 1, // substitui VkTimelineSemaphoreSubmitInfo
    .stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .deviceIndex = 0, // substitui VkDeviceGroupSubmitInfo
};

// Note que isso permite especificar um estágio para a operação de sinalização
VkSemaphoreSubmitInfoKHR signalSemaphoreSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = signalSemaphore,
    .value = 2, // substitui VkTimelineSemaphoreSubmitInfo
    .stageMask = VK_PIPELINE_STAGE_2_VERTEX_SHADER_BIT_KHR, // quando sinalizar o semaphore
    .deviceIndex = 0, // substitui VkDeviceGroupSubmitInfo
};

// Necessário um para cada VkCommandBuffer
std::array<VkCommandBufferSubmitInfoKHR, 8> commandBufferSubmitInfos{};
for (std::size_t i = 0; i < commandBuffers.size(); ++i) {
    commandBufferSubmitInfos[i] = VkCommandBufferSubmitInfoKHR{
        .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_SUBMIT_INFO_KHR,
        .pNext = nullptr,
        .commandBuffer = commandBuffers[i],
        .deviceMask = 0, // substitui VkDeviceGroupSubmitInfo
    };
}

VkSubmitInfo2KHR submitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2_KHR,
    .pNext = nullptr, // Todas as 3 structs acima já estão integradas em VkSubmitInfo2KHR
    .flags = VK_SUBMIT_PROTECTED_BIT_KHR, // também pode ser zero; substitui VkProtectedSubmitInfo
    .waitSemaphoreInfoCount = 1,
    .pWaitSemaphoreInfos = &waitSemaphoreSubmitInfo,
    .commandBufferInfoCount = static_cast<uint32_t>(commandBufferSubmitInfos.size()),
    .pCommandBufferInfos = commandBufferSubmitInfos.data(),
    .signalSemaphoreInfoCount = 1,
    .pSignalSemaphoreInfos = &signalSemaphoreSubmitInfo,
};

vkQueueSubmit2KHR(queue, 1, &submitInfo, fence);
```

A diferença entre os dois trechos de código acima é que `vkQueueSubmit2KHR` sinalizará `signalSemaphore` quando o estágio de *vertex shader* for concluído, em comparação com a chamada `vkQueueSubmit`, que aguarda até o final completo da submissão.

Para emular em `vkQueueSubmit2KHR` o mesmo comportamento de sinalização de *semaphore* de `vkQueueSubmit`, o campo `stageMask` pode ser definido como `VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT`:

```cpp
// Aguarda até que tudo seja concluído
VkSemaphoreSubmitInfoKHR signalSemaphoreSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    // ...
    .stageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT,
    // ...
};
```

## Camada de Emulação (*Emulation Layer*)

Para dispositivos que não oferecem suporte nativo a esta extensão, existe uma implementação portável no repositório [Vulkan-ExtensionLayer](https://github.com/KhronosGroup/Vulkan-ExtensionLayer). Essa camada deve funcionar com qualquer dispositivo Vulkan. Para mais informações, consulte a [documentação da camada](https://github.com/KhronosGroup/Vulkan-ExtensionLayer/blob/master/docs/synchronization2_layer.md) e o caso de teste [Sync2Compat.Vulkan10](https://github.com/KhronosGroup/Vulkan-ExtensionLayer/blob/bd8a72b14c67d011561cd795d777fb838c926e0f/tests/synchronization2_tests.cpp#L1243).

> **Nota:** A especificação da `VK_KHR_synchronization2` lista `VK_KHR_get_physical_device_properties2` ou Vulkan 1.1 como requisito. `VK_KHR_create_renderpass2` não é obrigatória; trata-se apenas de uma interação.
