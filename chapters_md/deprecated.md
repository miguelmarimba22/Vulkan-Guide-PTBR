# Recursos Descontinuados (Deprecated)

Este guia fornece instruções de fallback para itens descontinuados no Vulkan. Ele ajuda os desenvolvedores a entender o que esses recursos descontinuados eram, o que faziam e como utilizar seus substitutos modernos mantendo a compatibilidade retroativa quando necessário.

## Itens Descontinuados

A tabela a seguir lista os itens descontinuados no Vulkan junto com seus substitutos e links para instruções detalhadas de fallback:

| Item Descontinuado | O que era / fazia | Substituto | Quando foi descontinuado | Link no GPU Info |
| --- | --- | --- | --- | --- |
| Device Layers (Camadas de Dispositivo) | As *device layers* eram uma forma de interceptar, avaliar e modificar funções Vulkan no nível do dispositivo. | Devem ser usadas *instance layers* (camadas de instância). Toda a funcionalidade de camadas agora está disponível por meio de camadas de instância. | No início da história do Vulkan | |
| Consultas de Dispositivo Físico (*Physical Device Queries*) | Funções como `vkGetPhysicalDeviceFeatures` usadas para consultar capacidades do dispositivo. | Use `vkGetPhysicalDeviceFeatures2` e funções relacionadas que oferecem maior extensibilidade. Consulte a seção *Consultas de Dispositivo Físico* abaixo para mais detalhes. | Vulkan 1.1 | [Ver no GPU Info](https://vulkan.gpuinfo.org/listreports.php?instanceextension=VK_KHR_get_physical_device_properties2&platform=all) |
| Macros de Versão | Macros como `VK_MAKE_VERSION` e `VK_VERSION_MAJOR` que não levam em consideração a variante da API. | Use macros que incluem a variante da API, como `VK_MAKE_API_VERSION` e `VK_API_VERSION_MAJOR`. Consulte a seção *Macros de Versão* abaixo para mais detalhes. | Vulkan 1.1 | [Ver na Especificação](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.1) |
| Funções de *Render Pass* | Funções originais de criação e gerenciamento de *render pass*. | Use as funções da versão 2, como `vkCreateRenderPass2`, que oferecem maior extensibilidade. Consulte a seção *Funções de Render Pass* abaixo para mais detalhes. | Vulkan 1.2 | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_create_renderpass2) |
| Objetos de *Render Pass* | Objetos `VkRenderPass` e `VkFramebuffer` usados para definir operações de renderização. | Use renderização dinâmica (*dynamic rendering*) por meio de `vkCmdBeginRendering` e `vkCmdEndRendering`. Consulte a seção *Objetos de Render Pass* abaixo para mais detalhes. | Vulkan 1.4 | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_dynamic_rendering) |
| `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` | Usada na sincronização para representar o estágio mais inicial possível do pipeline. | Substitutos diferentes dependendo do contexto de uso. Consulte a seção `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` abaixo para mais detalhes. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` | Usada na sincronização para representar o estágio mais final possível do pipeline. | Substitutos diferentes dependendo do contexto de uso. Consulte a seção `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` abaixo para mais detalhes. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| `VK_PIPELINE_STAGE_VERTEX_INPUT_BIT` | Usada para representar o estágio de entrada de vértices no pipeline. | Dividida em flags mais específicas: `VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT_KHR` e `VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR`. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| `VK_PIPELINE_STAGE_TRANSFER_BIT` | Usada para representar todas as operações de transferência no pipeline. | Dividida em flags mais específicas: `VK_PIPELINE_STAGE_2_COPY_BIT_KHR`, `VK_PIPELINE_STAGE_2_RESOLVE_BIT_KHR`, `VK_PIPELINE_STAGE_2_BLIT_BIT_KHR` e `VK_PIPELINE_STAGE_2_CLEAR_BIT_KHR`. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| `VK_ACCESS_SHADER_READ_BIT` | Usada para representar todas as operações de leitura por shaders. | Dividida em flags mais específicas: `VK_ACCESS_2_UNIFORM_READ_BIT_KHR`, `VK_ACCESS_2_SHADER_SAMPLED_READ_BIT_KHR` e `VK_ACCESS_2_SHADER_STORAGE_READ_BIT_KHR`. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| `VK_ACCESS_SHADER_WRITE_BIT` | Usada para representar operações de escrita por shaders. | Renomeada para `VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT_KHR` para descrever melhor o escopo dos recursos no shader abrangidos pela flag de acesso. | Com `VK_KHR_synchronization2` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_KHR_synchronization2) |
| Objetos de *Pipeline* | Objetos `VkPipeline` (gráficos e de computação) usados para vincular shaders e estado de função fixa como uma unidade monolítica. | Use *Shader Objects* via `VK_EXT_shader_object` para um fluxo de trabalho sem pipelines que vincula shaders e estado diretamente. Consulte a seção *Objetos de Pipeline* abaixo para mais detalhes. | Com `VK_EXT_shader_object` | [Ver no GPU Info](https://vulkan.gpuinfo.org/displayextensiondetail.php?extension=VK_EXT_shader_object) |

## Como Usar Este Guia

1. **Identifique Itens Descontinuados**: Determine se sua aplicação utiliza algum recurso descontinuado do Vulkan.
2. **Entenda o Substituto**: Leia sobre o que cada item descontinuado fazia e qual é o substituto recomendado.
3. **Implemente Fallbacks**: Utilize as seções detalhadas abaixo para implementar fallbacks adequados visando compatibilidade retroativa.
4. **Teste Exaustivamente**: Garanta que sua aplicação funcione corretamente tanto com o item descontinuado quanto com o seu substituto.

## Notas sobre Descontinuação

* Itens descontinuados ainda continuarão funcionando nas implementações atuais do Vulkan.
* O uso dos substitutos para itens descontinuados frequentemente oferece melhor desempenho ou controle mais preciso.
* Ao mirar em versões mais recentes do Vulkan, a melhor prática é utilizar os substitutos recomendados.
* Para compatibilidade retroativa com implementações mais antigas do Vulkan, código de fallback pode ser necessário.

## Recursos Adicionais

* [Especificação do Vulkan](https://docs.vulkan.org/spec/latest/): Documentação oficial para todos os recursos do Vulkan
* [Recursos Legados na Especificação do Vulkan](https://docs.vulkan.org/spec/latest/appendices/legacy.html): Lista oficial atual de recursos legados do Vulkan
* [Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples): Código de exemplo demonstrando diversos recursos do Vulkan
* *Verificação de Suporte*: Consulte o capítulo sobre verificação de suporte para um guia sobre como consultar suporte a recursos em tempo de execução
* *Versões do Vulkan*: Consulte o capítulo sobre versões do Vulkan para informações sobre as diferentes versões e seus recursos

## Instruções Detalhadas de Fallback

### Device Layers (Camadas de Dispositivo)

As *device layers* eram uma forma de interceptar, avaliar e modificar funções Vulkan no nível do dispositivo. Elas foram descontinuadas logo no início da história do Vulkan em favor das *instance layers* (camadas de instância).

#### O que eram

As *device layers* eram semelhantes às *instance layers*, mas ficavam associadas a um `VkDevice` específico. Elas permitiam validação e depuração específicas por dispositivo.

#### Substituto

Toda a funcionalidade de camadas agora está disponível por meio de *instance layers*. As camadas de instância podem interceptar tanto funções Vulkan em nível de instância quanto em nível de dispositivo.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando camadas de dispositivo (device layers)
constexpr std::array<const char*, 1> deviceLayerNames = {
    "VK_LAYER_LUNARG_standard_validation"
};

VkDeviceCreateInfo deprecatedCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .enabledLayerCount = static_cast<uint32_t>(deviceLayerNames.size()),
    .ppEnabledLayerNames = deviceLayerNames.data(),
};
vkCreateDevice(physicalDevice, &deprecatedCreateInfo, nullptr, &device);

// RECOMENDADO: Usando apenas camadas de instância (instance layers)
constexpr std::array<const char*, 1> instanceLayerNames = {
    "VK_LAYER_KHRONOS_validation"
};

VkInstanceCreateInfo instanceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
    .pNext = nullptr,
    .enabledLayerCount = static_cast<uint32_t>(instanceLayerNames.size()),
    .ppEnabledLayerNames = instanceLayerNames.data(),
};
vkCreateInstance(&instanceCreateInfo, nullptr, &instance);

// Ao criar o dispositivo, não especifique nenhuma camada
VkDeviceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .enabledLayerCount = 0,
    .ppEnabledLayerNames = nullptr,
};
vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
```

#### Estratégia de Fallback

Como as camadas de dispositivo foram descontinuadas muito cedo, não há necessidade de uma estratégia de fallback. Todas as implementações Vulkan devem oferecer suporte a camadas de instância em vez de camadas de dispositivo.

### `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT`

`VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` era usada na sincronização para representar o estágio mais inicial possível do pipeline. Ela foi descontinuada com a introdução da extensão `VK_KHR_synchronization2`.

#### O que era

Essa flag representava um "pseudoestágio" no início do pipeline, antes do começo de qualquer trabalho real. Ela era frequentemente usada em primitivas de sincronização para indicar que uma dependência deveria ser satisfeita antes de qualquer trabalho real começar.

#### Substituto

O substituto depende do contexto em que `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT` é utilizada:

1. Quando usada no primeiro escopo de sincronização (`srcStageMask`):
   * Substitua por `VK_PIPELINE_STAGE_2_NONE_KHR` e `VK_ACCESS_2_NONE_KHR`

2. Quando usada no segundo escopo de sincronização (`dstStageMask`):
   * Substitua por `VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR` e `VK_ACCESS_2_NONE_KHR`

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT em srcStageMask
VkMemoryBarrier memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = 0,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,     // srcStageMask
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, // dstStageMask
    0,
    1, &memoryBarrier,
    0, nullptr,
    0, nullptr
);

// RECOMENDADO: Usando VK_PIPELINE_STAGE_2_NONE_KHR em srcStageMask
VkMemoryBarrier2KHR memoryBarrier2{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
    .srcAccessMask = VK_ACCESS_2_NONE_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier2,
    .bufferMemoryBarrierCount = 0,
    .pBufferMemoryBarriers = nullptr,
    .imageMemoryBarrierCount = 0,
    .pImageMemoryBarriers = nullptr,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

Para oferecer suporte tanto à API descontinuada quanto à nova API, você pode verificar a disponibilidade da extensão `VK_KHR_synchronization2`:

```cpp
bool hasSync2 = false;
// Verifica se VK_KHR_synchronization2 está disponível
uint32_t extensionCount = 0;
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, nullptr);
std::vector<VkExtensionProperties> extensions(extensionCount);
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, extensions.data());

hasSync2 = std::ranges::any_of(extensions, [](const VkExtensionProperties& extension) {
    return std::string_view{extension.extensionName} == VK_KHR_SYNCHRONIZATION_2_EXTENSION_NAME;
});

// Função para criar uma barreira com base nas extensões disponíveis
void createBarrier(VkCommandBuffer commandBuffer, bool isSourceTopOfPipe) {
    if (hasSync2) {
        // Usa a API synchronization2
        VkMemoryBarrier2KHR memoryBarrier2{
            .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
            .pNext = nullptr,
            .srcStageMask = isSourceTopOfPipe
                ? VK_PIPELINE_STAGE_2_NONE_KHR
                : VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
            .srcAccessMask = VK_ACCESS_2_NONE_KHR,
            .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
            .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
        };

        VkDependencyInfoKHR dependencyInfo{
            .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
            .pNext = nullptr,
            .dependencyFlags = 0,
            .memoryBarrierCount = 1,
            .pMemoryBarriers = &memoryBarrier2,
            .bufferMemoryBarrierCount = 0,
            .pBufferMemoryBarriers = nullptr,
            .imageMemoryBarrierCount = 0,
            .pImageMemoryBarriers = nullptr,
        };

        vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
    } else {
        // Usa a API original
        VkMemoryBarrier memoryBarrier{
            .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER,
            .pNext = nullptr,
            .srcAccessMask = 0,
            .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
        };

        vkCmdPipelineBarrier(
            commandBuffer,
            VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,     // srcStageMask
            VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, // dstStageMask
            0,
            1, &memoryBarrier,
            0, nullptr,
            0, nullptr
        );
    }
}
```

### `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT`

`VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` era usada na sincronização para representar o estágio mais final possível do pipeline. Ela foi descontinuada com a introdução da extensão `VK_KHR_synchronization2`.

#### O que era

Essa flag representava um "pseudoestágio" ao final do pipeline, após a conclusão de todo o trabalho real. Ela era frequentemente usada em primitivas de sincronização para indicar que uma dependência deveria ser satisfeita após a conclusão de todo o trabalho.

#### Substituto

O substituto depende do contexto em que `VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT` é utilizada:

1. Quando usada no primeiro escopo de sincronização (`srcStageMask`):
   * Substitua por `VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR` e `VK_ACCESS_2_NONE_KHR`

2. Quando usada no segundo escopo de sincronização (`dstStageMask`):
   * Substitua por `VK_PIPELINE_STAGE_2_NONE_KHR` e `VK_ACCESS_2_NONE_KHR`

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT em dstStageMask
VkMemoryBarrier memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = 0,
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, // srcStageMask
    VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT,  // dstStageMask
    0,
    1, &memoryBarrier,
    0, nullptr,
    0, nullptr
);

// RECOMENDADO: Usando VK_PIPELINE_STAGE_2_NONE_KHR em dstStageMask
VkMemoryBarrier2KHR memoryBarrier2{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
    .dstAccessMask = VK_ACCESS_2_NONE_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier2,
    .bufferMemoryBarrierCount = 0,
    .pBufferMemoryBarriers = nullptr,
    .imageMemoryBarrierCount = 0,
    .pImageMemoryBarriers = nullptr,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

A estratégia de fallback é semelhante à de `VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT`. Verifique a disponibilidade da extensão `VK_KHR_synchronization2` e utilize a API apropriada.

### `VK_PIPELINE_STAGE_VERTEX_INPUT_BIT`

`VK_PIPELINE_STAGE_VERTEX_INPUT_BIT` era usada para representar o estágio de entrada de vértices no pipeline. Com `VK_KHR_synchronization2`, ela foi dividida em flags mais específicas.

#### O que era

Essa flag representava o estágio do pipeline onde os dados de vértices e índices são consumidos. Ela era usada em primitivas de sincronização para indicar operações relacionadas à entrada de vértices.

#### Substituto

Dividida em flags mais específicas:

* `VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT_KHR`: Representa o estágio onde os dados de índice são consumidos
* `VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR`: Representa o estágio onde os dados de atributos de vértice são consumidos

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_PIPELINE_STAGE_VERTEX_INPUT_BIT
VkBufferMemoryBarrier bufferBarrier{
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_VERTEX_ATTRIBUTE_READ_BIT,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = vertexBuffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE,
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_TRANSFER_BIT,
    VK_PIPELINE_STAGE_VERTEX_INPUT_BIT,
    0,
    0, nullptr,
    1, &bufferBarrier,
    0, nullptr
);

// RECOMENDADO: Usando flags específicas do estágio de entrada de vértices
VkBufferMemoryBarrier2KHR bufferBarrier2{
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_VERTEX_ATTRIBUTE_READ_BIT_KHR,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = vertexBuffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 0,
    .pMemoryBarriers = nullptr,
    .bufferMemoryBarrierCount = 1,
    .pBufferMemoryBarriers = &bufferBarrier2,
    .imageMemoryBarrierCount = 0,
    .pImageMemoryBarriers = nullptr,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

Verifique a disponibilidade da extensão `VK_KHR_synchronization2` e use a API apropriada. Ao usar a nova API, escolha a flag mais específica que se aplica ao seu caso de uso.

### `VK_PIPELINE_STAGE_TRANSFER_BIT`

`VK_PIPELINE_STAGE_TRANSFER_BIT` era usada para representar todas as operações de transferência no pipeline. Com `VK_KHR_synchronization2`, ela foi dividida em flags mais específicas.

#### O que era

Essa flag representava todas as operações de transferência, incluindo operações de cópia (*copy*), resolução (*resolve*), *blit* e limpeza (*clear*). Ela era usada em primitivas de sincronização para indicar operações relacionadas à transferência de dados.

#### Substituto

Dividida em flags mais específicas:

* `VK_PIPELINE_STAGE_2_COPY_BIT_KHR`: Representa operações de cópia
* `VK_PIPELINE_STAGE_2_RESOLVE_BIT_KHR`: Representa operações de resolução (*resolve*)
* `VK_PIPELINE_STAGE_2_BLIT_BIT_KHR`: Representa operações de *blit*
* `VK_PIPELINE_STAGE_2_CLEAR_BIT_KHR`: Representa operações de limpeza (*clear*)

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_PIPELINE_STAGE_TRANSFER_BIT
VkImageMemoryBarrier imageBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = image,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_TRANSFER_BIT,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    0,
    0, nullptr,
    0, nullptr,
    1, &imageBarrier
);

// RECOMENDADO: Usando flags específicas de estágio de transferência
VkImageMemoryBarrier2KHR imageBarrier2{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COPY_BIT_KHR, // Assumindo uma operação de cópia
    .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = image,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 0,
    .pMemoryBarriers = nullptr,
    .bufferMemoryBarrierCount = 0,
    .pBufferMemoryBarriers = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageBarrier2,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

Verifique a disponibilidade da extensão `VK_KHR_synchronization2` e use a API apropriada. Ao usar a nova API, escolha a flag mais específica que se aplica ao seu caso de uso.

### `VK_ACCESS_SHADER_READ_BIT`

`VK_ACCESS_SHADER_READ_BIT` era usada para representar todas as operações de leitura realizadas por shaders. Com `VK_KHR_synchronization2`, ela foi dividida em flags mais específicas.

#### O que era

Essa flag representava todas as operações de leitura executadas por shaders, incluindo leitura de *uniform buffers*, *storage buffers* e imagens amostradas (*sampled images*). Ela era usada em primitivas de sincronização para indicar operações de leitura por shaders.

#### Substituto

Dividida em flags mais específicas:

* `VK_ACCESS_2_UNIFORM_READ_BIT_KHR`: Representa leituras de *uniform buffers*
* `VK_ACCESS_2_SHADER_SAMPLED_READ_BIT_KHR`: Representa leituras de imagens amostradas (*sampled images*)
* `VK_ACCESS_2_SHADER_STORAGE_READ_BIT_KHR`: Representa leituras de *storage buffers* e *storage images*

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_ACCESS_SHADER_READ_BIT
VkImageMemoryBarrier imageBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = image,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_TRANSFER_BIT,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    0,
    0, nullptr,
    0, nullptr,
    1, &imageBarrier
);

// RECOMENDADO: Usando flags específicas de acesso de leitura por shader
VkImageMemoryBarrier2KHR imageBarrier2{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_SAMPLED_READ_BIT_KHR, // Assumindo uma imagem amostrada
    .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = image,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 0,
    .pMemoryBarriers = nullptr,
    .bufferMemoryBarrierCount = 0,
    .pBufferMemoryBarriers = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageBarrier2,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

Verifique a disponibilidade da extensão `VK_KHR_synchronization2` e use a API apropriada. Ao usar a nova API, escolha a flag mais específica que se aplica ao seu caso de uso.

### `VK_ACCESS_SHADER_WRITE_BIT`

`VK_ACCESS_SHADER_WRITE_BIT` era usada para representar operações de escrita realizadas por shaders. Com `VK_KHR_synchronization2`, ela foi renomeada para descrever melhor o seu escopo.

#### O que era

Essa flag representava operações de escrita executadas por shaders em *storage buffers* e *storage images*. Ela era usada em primitivas de sincronização para indicar operações de escrita por shaders.

#### Substituto

Renomeada para `VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT_KHR` para descrever melhor o escopo dos recursos no shader abrangidos pela flag de acesso.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando VK_ACCESS_SHADER_WRITE_BIT
VkBufferMemoryBarrier bufferBarrier{
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_TRANSFER_READ_BIT,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = storageBuffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE,
};
vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_TRANSFER_BIT,
    0,
    0, nullptr,
    1, &bufferBarrier,
    0, nullptr
);

// RECOMENDADO: Usando VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT_KHR
VkBufferMemoryBarrier2KHR bufferBarrier2{
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_STORAGE_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_TRANSFER_READ_BIT_KHR,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = storageBuffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .dependencyFlags = 0,
    .memoryBarrierCount = 0,
    .pMemoryBarriers = nullptr,
    .bufferMemoryBarrierCount = 1,
    .pBufferMemoryBarriers = &bufferBarrier2,
    .imageMemoryBarrierCount = 0,
    .pImageMemoryBarriers = nullptr,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```

#### Estratégia de Fallback

Verifique a disponibilidade da extensão `VK_KHR_synchronization2` e utilize a API apropriada.

### Consultas de Dispositivo Físico (*Physical Device Queries*)

Funções de consulta de dispositivo físico como `vkGetPhysicalDeviceFeatures` eram usadas para consultar as capacidades do dispositivo no Vulkan 1.0. Elas foram descontinuadas com a introdução das funções de consulta versão 2 no Vulkan 1.1.

#### O que eram

As funções originais de consulta de dispositivo físico forneciam informações básicas sobre as capacidades do dispositivo, mas não ofereciam extensibilidade. As principais funções incluíam:

* `vkGetPhysicalDeviceFeatures`: Consultava recursos (*features*) suportados
* `vkGetPhysicalDeviceProperties`: Consultava propriedades do dispositivo
* `vkGetPhysicalDeviceMemoryProperties`: Consultava propriedades de memória
* `vkGetPhysicalDeviceQueueFamilyProperties`: Consultava propriedades das famílias de filas (*queue families*)

#### Substituto

As funções de consulta versão 2 oferecem a mesma funcionalidade, mas com maior extensibilidade por meio da cadeia `pNext`:

* `vkGetPhysicalDeviceFeatures2`: Substitui `vkGetPhysicalDeviceFeatures`
* `vkGetPhysicalDeviceProperties2`: Substitui `vkGetPhysicalDeviceProperties`
* `vkGetPhysicalDeviceMemoryProperties2`: Substitui `vkGetPhysicalDeviceMemoryProperties`
* `vkGetPhysicalDeviceQueueFamilyProperties2`: Substitui `vkGetPhysicalDeviceQueueFamilyProperties`

Ao habilitar recursos do dispositivo, `VkPhysicalDeviceFeatures2` deve ser fornecida na cadeia `pNext` de `VkDeviceCreateInfo`, em vez de usar `VkDeviceCreateInfo::pEnabledFeatures`.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando as funções originais de consulta de dispositivo físico
VkPhysicalDeviceFeatures deviceFeatures{};
vkGetPhysicalDeviceFeatures(physicalDevice, &deviceFeatures);

// Habilita recursos ao criar o dispositivo
VkDeviceCreateInfo deprecatedCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .pEnabledFeatures = &deviceFeatures,
};
vkCreateDevice(physicalDevice, &deprecatedCreateInfo, nullptr, &device);

// RECOMENDADO: Usando as funções de consulta versão 2
// É possível estender com structs adicionais de recursos
VkPhysicalDeviceVulkan11Features vulkan11Features{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_1_FEATURES,
    .pNext = nullptr,
};

VkPhysicalDeviceFeatures2 deviceFeatures2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &vulkan11Features,
};

vkGetPhysicalDeviceFeatures2(physicalDevice, &deviceFeatures2);

// Habilita recursos ao criar o dispositivo usando a cadeia pNext
VkDeviceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &deviceFeatures2, // Passa os recursos através de pNext
    .pEnabledFeatures = nullptr, // Não utilize mais este campo
};
vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
```

#### Estratégia de Fallback

Para oferecer suporte tanto ao Vulkan 1.0 quanto a versões mais recentes, verifique a disponibilidade das funções versão 2:

```cpp
// Verifica se o Vulkan 1.1 ou VK_KHR_get_physical_device_properties2 é suportado
bool hasPhysicalDeviceProperties2 = false;

// Verificação de versão no nível da instância
uint32_t apiVersion = VK_API_VERSION_1_0;
if (vkEnumerateInstanceVersion != nullptr) {
    vkEnumerateInstanceVersion(&apiVersion);
    if (apiVersion >= VK_API_VERSION_1_1) {
        hasPhysicalDeviceProperties2 = true;
    }
}

// Ou verifica a extensão caso não esteja usando Vulkan 1.1
if (!hasPhysicalDeviceProperties2) {
    uint32_t extensionCount = 0;
    vkEnumerateInstanceExtensionProperties(nullptr, &extensionCount, nullptr);
    std::vector<VkExtensionProperties> extensions(extensionCount);
    vkEnumerateInstanceExtensionProperties(nullptr, &extensionCount, extensions.data());

    hasPhysicalDeviceProperties2 = std::ranges::any_of(extensions, [](const VkExtensionProperties& extension) {
        return std::string_view{extension.extensionName} == VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME;
    });
}

// Função para consultar recursos com base na funcionalidade disponível
void queryDeviceFeatures(VkPhysicalDevice physicalDevice,
                         VkPhysicalDeviceFeatures& features,
                         VkPhysicalDeviceVulkan11Features* vulkan11Features = nullptr) {
    if (hasPhysicalDeviceProperties2 && vulkan11Features != nullptr) {
        // Usa consulta versão 2 com extensões
        VkPhysicalDeviceFeatures2 features2{
            .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
            .pNext = vulkan11Features,
        };

        vkGetPhysicalDeviceFeatures2(physicalDevice, &features2);
        features = features2.features;
    } else {
        // Fallback para a consulta original
        vkGetPhysicalDeviceFeatures(physicalDevice, &features);
    }
}
```

### Macros de Versão

Macros de versão que não levam em consideração a variante da API, como `VK_MAKE_VERSION` ou `VK_VERSION_MAJOR`, foram descontinuadas em favor de macros que incluem a variante da API.

#### O que eram

As macros de versão originais eram usadas para criar e manipular números de versão do Vulkan sem considerar a variante da API:

* `VK_MAKE_VERSION`: Criava um número de versão a partir dos componentes *major*, *minor* e *patch*
* `VK_VERSION_MAJOR`: Extraía a versão *major* de um número de versão
* `VK_VERSION_MINOR`: Extraía a versão *minor* de um número de versão
* `VK_VERSION_PATCH`: Extraía a versão *patch* de um número de versão
* `VK_API_VERSION`: Criava uma versão específica da API

#### Substituto

As macros substitutas incluem a variante da API:

* `VK_MAKE_API_VERSION`: Cria um número de versão incluindo a variante
* `VK_API_VERSION_MAJOR`: Extrai a versão *major*
* `VK_API_VERSION_MINOR`: Extrai a versão *minor*
* `VK_API_VERSION_PATCH`: Extrai a versão *patch*
* `VK_API_VERSION_VARIANT`: Extrai a variante

Em vez de `VK_API_VERSION`, devem ser usadas constantes específicas de versão (por exemplo, `VK_API_VERSION_1_0`) ou a macro `VK_MAKE_API_VERSION`.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando macros de versão originais
constexpr uint32_t oldVersion = VK_MAKE_VERSION(1, 2, 0);
constexpr uint32_t oldMajor = VK_VERSION_MAJOR(oldVersion);
constexpr uint32_t oldMinor = VK_VERSION_MINOR(oldVersion);
constexpr uint32_t oldPatch = VK_VERSION_PATCH(oldVersion);

// Usando VK_API_VERSION diretamente
constexpr uint32_t oldApiVersion = VK_API_VERSION(1, 0, 0);

// RECOMENDADO: Usando macros cientes da variante da API
constexpr uint32_t version = VK_MAKE_API_VERSION(0, 1, 2, 0);
constexpr uint32_t variant = VK_API_VERSION_VARIANT(version);
constexpr uint32_t major = VK_API_VERSION_MAJOR(version);
constexpr uint32_t minor = VK_API_VERSION_MINOR(version);
constexpr uint32_t patch = VK_API_VERSION_PATCH(version);

// Usando constantes específicas de versão
constexpr uint32_t apiVersion = VK_API_VERSION_1_0;
```

#### Estratégia de Fallback

As macros originais ainda funcionam nas implementações atuais do Vulkan, mas recomenda-se usar as macros mais recentes para compatibilidade futura. Não há necessidade de uma estratégia de fallback complexa, pois as macros são definidas nos cabeçalhos do Vulkan e estão disponíveis em todas as implementações Vulkan.

### Funções de *Render Pass*

As funções originais de *render pass* foram descontinuadas com a introdução das funções da versão 2 no Vulkan 1.2, que oferecem maior extensibilidade.

#### O que eram

As funções originais de *render pass* eram usadas para criar e gerenciar *render passes*:

* `vkCreateRenderPass`: Criava um objeto de *render pass*
* `vkCmdBeginRenderPass`: Iniciava um *render pass*
* `vkCmdNextSubpass`: Avançava para o próximo *subpass*
* `vkCmdEndRenderPass`: Finalizava um *render pass*

#### Substituto

As funções da versão 2 fornecem a mesma funcionalidade, mas com maior extensibilidade por meio de parâmetros adicionais e cadeias `pNext`:

* `vkCreateRenderPass2`: Substitui `vkCreateRenderPass`
* `vkCmdBeginRenderPass2`: Substitui `vkCmdBeginRenderPass`
* `vkCmdNextSubpass2`: Substitui `vkCmdNextSubpass`
* `vkCmdEndRenderPass2`: Substitui `vkCmdEndRenderPass`

Observe que os próprios objetos de *render pass* foram posteriormente descontinuados pela renderização dinâmica (*dynamic rendering*) no Vulkan 1.4.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando as funções originais de render pass
VkRenderPassBeginInfo deprecatedRenderPassBegin{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO,
    .pNext = nullptr,
    .renderPass = renderPass,
    .framebuffer = framebuffer,
    .renderArea = {.offset = {0, 0}, .extent = {width, height}},
    .clearValueCount = static_cast<uint32_t>(clearValues.size()),
    .pClearValues = clearValues.data(),
};

vkCmdBeginRenderPass(commandBuffer, &deprecatedRenderPassBegin, VK_SUBPASS_CONTENTS_INLINE);
// Operações de renderização...
vkCmdNextSubpass(commandBuffer, VK_SUBPASS_CONTENTS_INLINE);
// Mais operações de renderização...
vkCmdEndRenderPass(commandBuffer);

// RECOMENDADO: Usando as funções de render pass versão 2
VkRenderPassBeginInfo renderPassBegin{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO,
    .pNext = nullptr,
    .renderPass = renderPass,
    .framebuffer = framebuffer,
    .renderArea = {.offset = {0, 0}, .extent = {width, height}},
    .clearValueCount = static_cast<uint32_t>(clearValues.size()),
    .pClearValues = clearValues.data(),
};

VkSubpassBeginInfo subpassBeginInfo{
    .sType = VK_STRUCTURE_TYPE_SUBPASS_BEGIN_INFO,
    .pNext = nullptr,
    .contents = VK_SUBPASS_CONTENTS_INLINE,
};

VkSubpassEndInfo subpassEndInfo{
    .sType = VK_STRUCTURE_TYPE_SUBPASS_END_INFO,
    .pNext = nullptr,
};

vkCmdBeginRenderPass2(commandBuffer, &renderPassBegin, &subpassBeginInfo);
// Operações de renderização...
vkCmdNextSubpass2(commandBuffer, &subpassBeginInfo, &subpassEndInfo);
// Mais operações de renderização...
vkCmdEndRenderPass2(commandBuffer, &subpassEndInfo);
```

#### Estratégia de Fallback

Para oferecer suporte tanto às funções originais quanto às da versão 2 de *render pass*, verifique a disponibilidade do Vulkan 1.2 ou da extensão `VK_KHR_create_renderpass2`:

```cpp
// Verifica se Vulkan 1.2 ou VK_KHR_create_renderpass2 é suportado
bool hasRenderPass2 = false;

// Verificação de versão no nível do dispositivo
VkPhysicalDeviceProperties properties{};
vkGetPhysicalDeviceProperties(physicalDevice, &properties);
if (properties.apiVersion >= VK_API_VERSION_1_2) {
    hasRenderPass2 = true;
}

// Ou verifica a extensão caso não esteja usando Vulkan 1.2
if (!hasRenderPass2) {
    uint32_t extensionCount = 0;
    vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, nullptr);
    std::vector<VkExtensionProperties> extensions(extensionCount);
    vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, extensions.data());

    hasRenderPass2 = std::ranges::any_of(extensions, [](const VkExtensionProperties& extension) {
        return std::string_view{extension.extensionName} == VK_KHR_CREATE_RENDERPASS_2_EXTENSION_NAME;
    });
}

// Função para iniciar o render pass com base na funcionalidade disponível
void beginRenderPass(VkCommandBuffer commandBuffer, const VkRenderPassBeginInfo& renderPassBegin) {
    if (hasRenderPass2) {
        VkSubpassBeginInfo subpassBeginInfo{
            .sType = VK_STRUCTURE_TYPE_SUBPASS_BEGIN_INFO,
            .pNext = nullptr,
            .contents = VK_SUBPASS_CONTENTS_INLINE,
        };

        vkCmdBeginRenderPass2(commandBuffer, &renderPassBegin, &subpassBeginInfo);
    } else {
        vkCmdBeginRenderPass(commandBuffer, &renderPassBegin, VK_SUBPASS_CONTENTS_INLINE);
    }
}
```

### Objetos de *Render Pass*

Objetos de *render pass* (`VkRenderPass` e `VkFramebuffer`) foram descontinuados com a introdução da renderização dinâmica (*dynamic rendering*) no Vulkan 1.4.

#### O que eram

Os objetos de *render pass* definiam a estrutura das operações de renderização:

* `VkRenderPass`: Definia a estrutura de um *render pass*, incluindo anexos (*attachments*) e *subpasses*
* `VkFramebuffer`: Definia as *image views* específicas a serem usadas como anexos de um *render pass*

Esses objetos exigiam que as aplicações definissem toda a estrutura de renderização antecipadamente, o que podia ser inflexível para certas técnicas de renderização.

#### Substituto

A renderização dinâmica permite que as aplicações iniciem e finalizem passes de renderização sem criar objetos `VkRenderPass` e `VkFramebuffer`:

* `vkCmdBeginRendering`: Inicia um passe de renderização dinâmica
* `vkCmdEndRendering`: Finaliza um passe de renderização dinâmica

No Vulkan 1.4, `VK_KHR_dynamic_rendering_local_read` também foi promovida ao núcleo (*core*), o que permite expressar a maior parte das funcionalidades de *subpasses*.

#### Exemplo de Código

```cpp
// DESCONTINUADO: Usando objetos de render pass
// Criação do render pass
VkAttachmentDescription colorAttachment{};
// ... configura o anexo

VkAttachmentReference colorAttachmentRef{
    .attachment = 0,
    .layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
};

VkSubpassDescription subpass{
    .pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS,
    .colorAttachmentCount = 1,
    .pColorAttachments = &colorAttachmentRef,
};

VkRenderPassCreateInfo renderPassInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &colorAttachment,
    .subpassCount = 1,
    .pSubpasses = &subpass,
};
VkRenderPass renderPass = VK_NULL_HANDLE;
vkCreateRenderPass(device, &renderPassInfo, nullptr, &renderPass);

// Criação do framebuffer
VkFramebufferCreateInfo framebufferInfo{
    .sType = VK_STRUCTURE_TYPE_FRAMEBUFFER_CREATE_INFO,
    .pNext = nullptr,
    .renderPass = renderPass,
    .attachmentCount = 1,
    .pAttachments = &colorImageView,
    .width = width,
    .height = height,
    .layers = 1,
};
VkFramebuffer framebuffer = VK_NULL_HANDLE;
vkCreateFramebuffer(device, &framebufferInfo, nullptr, &framebuffer);

// Inicia o render pass
VkRenderPassBeginInfo renderPassBegin{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO,
    .pNext = nullptr,
    .renderPass = renderPass,
    .framebuffer = framebuffer,
    .renderArea = {.offset = {0, 0}, .extent = {width, height}},
    .clearValueCount = 1,
    .pClearValues = &clearValue,
};
vkCmdBeginRenderPass(commandBuffer, &renderPassBegin, VK_SUBPASS_CONTENTS_INLINE);
// Operações de renderização...
vkCmdEndRenderPass(commandBuffer);

// RECOMENDADO: Usando renderização dinâmica (dynamic rendering)
VkRenderingAttachmentInfo colorAttachmentInfo{
    .sType = VK_STRUCTURE_TYPE_RENDERING_ATTACHMENT_INFO,
    .pNext = nullptr,
    .imageView = colorImageView,
    .imageLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
    .loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR,
    .storeOp = VK_ATTACHMENT_STORE_OP_STORE,
    .clearValue = clearValue,
};

VkRenderingInfo renderingInfo{
    .sType = VK_STRUCTURE_TYPE_RENDERING_INFO,
    .pNext = nullptr,
    .renderArea = {.offset = {0, 0}, .extent = {width, height}},
    .layerCount = 1,
    .colorAttachmentCount = 1,
    .pColorAttachments = &colorAttachmentInfo,
};

vkCmdBeginRendering(commandBuffer, &renderingInfo);
// Operações de renderização...
vkCmdEndRendering(commandBuffer);
```

#### Estratégia de Fallback

Para oferecer suporte tanto a objetos de *render pass* quanto à renderização dinâmica, verifique a disponibilidade do Vulkan 1.3 ou da extensão `VK_KHR_dynamic_rendering`:

```cpp
// Verifica se Vulkan 1.3 ou VK_KHR_dynamic_rendering é suportado
bool hasDynamicRendering = false;

// Verificação de versão no nível do dispositivo
VkPhysicalDeviceProperties properties{};
vkGetPhysicalDeviceProperties(physicalDevice, &properties);
if (properties.apiVersion >= VK_API_VERSION_1_3) {
    hasDynamicRendering = true;
}

// Ou verifica a extensão caso não esteja usando Vulkan 1.3
if (!hasDynamicRendering) {
    uint32_t extensionCount = 0;
    vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, nullptr);
    std::vector<VkExtensionProperties> extensions(extensionCount);
    vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, extensions.data());

    hasDynamicRendering = std::ranges::any_of(extensions, [](const VkExtensionProperties& extension) {
        return std::string_view{extension.extensionName} == VK_KHR_DYNAMIC_RENDERING_EXTENSION_NAME;
    });
}

// Se for usar renderização dinâmica, é necessário habilitar o recurso
if (hasDynamicRendering) {
    VkPhysicalDeviceDynamicRenderingFeatures dynamicRenderingFeatures{
        .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_DYNAMIC_RENDERING_FEATURES,
        .pNext = nullptr,
        .dynamicRendering = VK_TRUE,
    };

    VkDeviceCreateInfo createInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
        .pNext = &dynamicRenderingFeatures,
        // ... outros parâmetros de criação do dispositivo
    };
    vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
}

// Função de renderização que escolhe o método apropriado conforme a disponibilidade
void renderFrame(VkCommandBuffer commandBuffer, VkImageView colorImageView, VkClearValue clearValue) {
    if (hasDynamicRendering) {
        // Usa renderização dinâmica
        VkRenderingAttachmentInfo colorAttachmentInfo{
            .sType = VK_STRUCTURE_TYPE_RENDERING_ATTACHMENT_INFO,
            .pNext = nullptr,
            .imageView = colorImageView,
            .imageLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
            .loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR,
            .storeOp = VK_ATTACHMENT_STORE_OP_STORE,
            .clearValue = clearValue,
        };

        VkRenderingInfo renderingInfo{
            .sType = VK_STRUCTURE_TYPE_RENDERING_INFO,
            .pNext = nullptr,
            .renderArea = {.offset = {0, 0}, .extent = {width, height}},
            .layerCount = 1,
            .colorAttachmentCount = 1,
            .pColorAttachments = &colorAttachmentInfo,
        };

        vkCmdBeginRendering(commandBuffer, &renderingInfo);
        // Operações de renderização...
        vkCmdEndRendering(commandBuffer);
    } else {
        // Usa render pass tradicional
        // ... (código para usar renderPass e framebuffer)
        vkCmdBeginRenderPass(commandBuffer, &renderPassBegin, VK_SUBPASS_CONTENTS_INLINE);
        // Operações de renderização...
        vkCmdEndRenderPass(commandBuffer);
    }
}
```

### Objetos de *Pipeline*

Objetos de *pipeline* (`VkPipeline` para gráficos e computação) não são formalmente descontinuados, mas quando `VK_EXT_shader_object` está disponível, recomenda-se substituí-los por *Shader Objects* para um fluxo de trabalho mais flexível e modular.

#### O que eram

Pipelines encapsulam estágios de shader e estado de função fixa em um único objeto monolítico criado antecipadamente (por exemplo, via `vkCreateGraphicsPipelines` / `vkCreateComputePipelines`). Eles são eficientes em tempo de execução, mas podem ser custosos para criar e inflexíveis quando shaders ou estados mudam com frequência.

#### Substituto

Os *Shader Objects* (`VK_EXT_shader_object`) permitem:

* Criar objetos de shader diretamente a partir de SPIR-V com `vkCreateShadersEXT`.
* Vinculá-los por estágio no momento da gravação de comandos com `vkCmdBindShadersEXT`.
* Definir a maioria dos estados de função fixa dinamicamente por meio dos comandos de estado dinâmico já existentes.

Essa abordagem "sem pipelines" reduz a explosão de permutações de pipelines e pode simplificar o *hot-reloading* e a iteração rápida.

Consulte também a seção de *Shader Objects* no capítulo sobre formas de fornecer SPIR-V.

#### Exemplo de Código

```cpp
// Tradicional: vincula um pipeline pré-compilado
vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, graphicsPipeline);

// Shader Objects: cria e vincula shaders diretamente
VkShaderCreateInfoEXT vsCreateInfo{
    .sType = VK_STRUCTURE_TYPE_SHADER_CREATE_INFO_EXT,
    .pNext = nullptr,
    .stage = VK_SHADER_STAGE_VERTEX_BIT,
    .codeType = VK_SHADER_CODE_TYPE_SPIRV_EXT,
    .codeSize = vertSpirvSize,
    .pCode = vertSpirv, // const void*
};

VkShaderCreateInfoEXT fsCreateInfo{
    .sType = VK_STRUCTURE_TYPE_SHADER_CREATE_INFO_EXT,
    .pNext = nullptr,
    .stage = VK_SHADER_STAGE_FRAGMENT_BIT,
    .codeType = VK_SHADER_CODE_TYPE_SPIRV_EXT,
    .codeSize = fragSpirvSize,
    .pCode = fragSpirv,
};

std::array<VkShaderEXT, 2> shaders{};
vkCreateShadersEXT(device, 1, &vsCreateInfo, nullptr, &shaders[0]);
vkCreateShadersEXT(device, 1, &fsCreateInfo, nullptr, &shaders[1]);

// Vincula shaders em vez de um pipeline
constexpr std::array<VkShaderStageFlagBits, 2> stages = {
    VK_SHADER_STAGE_VERTEX_BIT,
    VK_SHADER_STAGE_FRAGMENT_BIT,
};
vkCmdBindShadersEXT(cmd, static_cast<uint32_t>(stages.size()), stages.data(), shaders.data());

// Define estado dinâmico conforme necessário (exemplos)
vkCmdSetViewport(cmd, 0, 1, &viewport);
vkCmdSetScissor(cmd, 0, 1, &scissor);
// ... outros estados dinâmicos conforme necessário

// Desenha normalmente
vkCmdDraw(cmd, vertexCount, 1, 0, 0);
```

#### Estratégia de Fallback

Em vez de manter dois caminhos de código separados (um para *shader objects* e outro para pipelines tradicionais), a abordagem recomendada é escrever sua aplicação usando apenas a API de *Shader Objects* e contar com a [camada de extensão `VK_LAYER_KHRONOS_shader_object`](https://github.com/KhronosGroup/Vulkan-ExtensionLayer/blob/main/docs/shader_object_layer.md) para fornecer suporte transparente a `VK_EXT_shader_object` em drivers que não a implementam nativamente.

A camada de extensão traduz chamadas de *Shader Object* em operações baseadas em pipelines nos bastidores, de modo que sua aplicação não precisa incluir nenhuma lógica de fallback para pipelines.

1. Escreva seu código de renderização exclusivamente para a API de *Shader Objects* (`vkCreateShadersEXT`, `vkCmdBindShadersEXT`, comandos de estado dinâmico).
2. Habilite a camada `VK_LAYER_KHRONOS_shader_object` no momento da implantação em plataformas onde o suporte nativo a `VK_EXT_shader_object` não está disponível. A camada se desabilita automaticamente quando o driver subjacente já oferece a extensão.

```cpp
// Escreva apenas código de shader object — nenhum fallback de pipeline é necessário.
// Habilite VK_EXT_shader_object no momento da criação do dispositivo.

VkPhysicalDeviceShaderObjectFeaturesEXT shaderObjectFeatures{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_SHADER_OBJECT_FEATURES_EXT,
    .pNext = nullptr,
    .shaderObject = VK_TRUE,
};

VkDeviceCreateInfo devCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &shaderObjectFeatures,
    // adicione VK_EXT_shader_object à lista de extensões habilitadas
    // ...
};

vkCreateDevice(physicalDevice, &devCreateInfo, nullptr, &device);

// Grave command buffers usando apenas Shader Objects
vkCmdBindShadersEXT(cmd, static_cast<uint32_t>(stages.size()), stages.data(), shaders.data());
vkCmdSetViewport(cmd, 0, 1, &viewport);
vkCmdSetScissor(cmd, 0, 1, &scissor);
// ... outros estados dinâmicos conforme necessário
vkCmdDraw(cmd, vertexCount, 1, 0, 0);
```

> **Nota:** A camada de extensão requer suporte a `VK_KHR_dynamic_rendering` no dispositivo de destino. Ela não está disponível atualmente no Android, onde o suporte a `VK_KHR_dynamic_rendering` é limitado.
