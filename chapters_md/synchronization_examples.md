# Exemplos de Sincronização

> **Nota:** Esta página reúne exemplos para as APIs da extensão `VK_KHR_synchronization2` (consulte o capítulo sobre `VK_KHR_synchronization2`) — exemplos para as APIs originais de sincronização podem ser encontrados aqui: [Legacy-synchronization-APIs](https://github.com/KhronosGroup/Vulkan-Docs/wiki/Synchronization-Examples-(Legacy-synchronization-APIs)).

A sincronização no Vulkan pode ser confusa. Leva bastante tempo para entendê-la e, mesmo depois disso, é fácil tropeçar em pequenos detalhes. No entanto, os usos mais comuns da sincronização no Vulkan podem ser reduzidos a um punhado de casos de uso, e esta página lista vários exemplos.

Note que os exemplos geralmente são expressos como uma *pipeline barrier*, mas *events* ou *subpass dependencies* podem ser usados de forma semelhante.

## Dependências de Compute para Compute

### Primeiro *dispatch* escreve em um *storage buffer*; segundo *dispatch* lê desse *storage buffer*

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

### Primeiro *dispatch* lê de um *storage buffer*; segundo *dispatch* escreve nesse *storage buffer*

*Hazards* do tipo WAR (*Write-After-Read*) não precisam de operações de disponibilidade (*availability*) ou visibilidade (*visibility*) entre si — dependências de execução (*execution dependencies*) são suficientes. Uma *pipeline barrier* ou um *event* sem nenhuma *access flag* constitui uma dependência de execução.

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

### Primeiro *dispatch* escreve em uma *storage image*; segundo *dispatch* lê dessa *storage image*

```cpp
vkCmdDispatch(...);

// Dependências de storage image para storage image estão sempre no layout GENERAL; não é necessária transição de layout
VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

### Três *dispatches*: o primeiro escreve em um *storage buffer*, o segundo escreve em uma região não sobreposta do mesmo *storage buffer*, e o terceiro lê ambas as regiões

```cpp
vkCmdDispatch(...);
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

### Três *dispatches*: o primeiro escreve em um *storage buffer*, o segundo escreve em um *storage buffer* diferente, e o terceiro lê ambos

Idêntico ao exemplo anterior — uma *memory barrier* global cobre todos os recursos. Geralmente é considerado mais eficiente utilizar uma *memory barrier* global do que barreiras por recurso; barreiras por recurso normalmente devem ser usadas para transferências de propriedade de *queue* (*queue ownership transfers*) e transições de layout de imagem — caso contrário, use barreiras globais.

```cpp
vkCmdDispatch(...);
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

## Dependências de Compute para Graphics

Note que interações com *graphics* devem idealmente ser realizadas utilizando *subpass dependencies* (externas ou não) em vez de *pipeline barriers*, mas a maioria dos exemplos a seguir ainda é descrita como *pipeline barriers* por brevidade.

### *Dispatch* escreve em um *storage buffer*; *draw* consome esse buffer como *index buffer*

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do render pass, etc.

vkCmdDraw(...);
```

### *Dispatch* escreve em um *storage buffer*; *draw* consome esse buffer como *index buffer*; um *compute shader* subsequente lê do buffer como *uniform buffer*

```cpp
vkCmdDispatch(...);

// Agrupe barreiras sempre que possível, desde que isso não altere como a sincronização ocorre
VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_INDEX_INPUT_BIT_KHR | VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_INDEX_READ_BIT_KHR | VK_ACCESS_2_UNIFORM_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do render pass, etc.

vkCmdDraw(...);

// ... Finalização do render pass, etc.

vkCmdDispatch(...);
```

### *Dispatch* escreve em um *storage buffer*; *draw* consome esse buffer como *draw indirect buffer*

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_DRAW_INDIRECT_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do render pass, etc.

vkCmdDrawIndirect(...);
```

### *Dispatch* escreve em uma *storage image*; *draw* amostra essa imagem em um *fragment shader*

```cpp
vkCmdDispatch(...);

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_GENERAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do render pass, etc.

vkCmdDraw(...);
```

### *Dispatch* escreve em um *storage texel buffer*; *draw* consome esse buffer como *draw indirect buffer* e, em seguida, novamente como *uniform buffer* no *fragment shader*

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_DRAW_INDIRECT_BIT_KHR | VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_INDIRECT_COMMAND_READ_BIT_KHR | VK_ACCESS_2_UNIFORM_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDrawIndirect(...);
```

## Dependências de Graphics para Compute

### *Draw* escreve em um *color attachment*; *dispatch* amostra dessa imagem

Note que a escrita em *color attachment* **NÃO** ocorre no *fragment shader*; ela possui seu próprio estágio de pipeline dedicado!

```cpp
vkCmdDraw(...);

// ... Finalização do render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

### *Draw* escreve em um *depth attachment*; *dispatch* amostra dessa imagem

Note que a escrita em *depth attachment* **NÃO** ocorre no *fragment shader*; ela possui seus próprios estágios de pipeline dedicados!

```cpp
vkCmdDraw(...);

// ... Finalização do render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_EARLY_FRAGMENT_TESTS_BIT_KHR | VK_PIPELINE_STAGE_2_LATE_FRAGMENT_TESTS_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

## Dependências de Graphics para Graphics

Muitas dependências de *graphics* para *graphics* podem ser expressas como uma *subpass dependency* dentro de um *render pass*, o que geralmente é mais eficiente do que uma *pipeline barrier* ou um *event*. Onde isso for possível nos exemplos abaixo, o exemplo é expresso em termos de uma *subpass dependency*.

### Primeiro *draw* escreve em um *depth attachment*; segundo *draw* lê dele como *input attachment* no *fragment shader*

A transição de `VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL` para `VK_IMAGE_LAYOUT_DEPTH_STENCIL_READ_ONLY_OPTIMAL` acontece automaticamente como parte da execução do *render pass*.

```cpp
// Defina isto como o índice em VkRenderPassCreateInfo::pAttachments onde a imagem de profundidade é descrita.
uint32_t depthAttachmentIndex = /* ... */;

std::array<VkSubpassDescription, 2> subpasses{};

VkAttachmentReference depthAttachment{
    .attachment = depthAttachmentIndex,
    .layout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

// Subpass contendo o primeiro draw
subpasses[0] = VkSubpassDescription{
    // ...
    .pDepthStencilAttachment = &depthAttachment,
    // ...
};

VkAttachmentReference depthAsInputAttachment{
    .attachment = depthAttachmentIndex,
    .layout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
};

// Subpass contendo o segundo draw
subpasses[1] = VkSubpassDescription{
    // ...
    .inputAttachmentCount = 1,
    .pInputAttachments = &depthAsInputAttachment,
    // ...
};

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

// Se initialLayout não corresponder ao layout da referência do attachment no primeiro subpass,
// haverá uma transição implícita antes de iniciar o render pass.
// Se finalLayout não corresponder ao layout da referência do attachment no último subpass,
// haverá uma transição implícita ao final.
VkAttachmentDescription depthFramebufferAttachment{
    // ...
    .initialLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .finalLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
};

VkRenderPassCreateInfo renderPassCreateInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &depthFramebufferAttachment,
    .subpassCount = static_cast<uint32_t>(subpasses.size()),
    .pSubpasses = subpasses.data(),
    .dependencyCount = 1,
    .pDependencies = &dependency,
};

vkCreateRenderPass(device, &renderPassCreateInfo, nullptr, &renderPass);

// ...
```

### Primeiro *draw* escreve em um *depth attachment*; segundo *draw* amostra dessa imagem de profundidade no *fragment shader* (ex.: renderização de *shadow map*)

```cpp
vkCmdDraw(...);

// ... Finalização do primeiro render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_EARLY_FRAGMENT_TESTS_BIT_KHR | VK_PIPELINE_STAGE_2_LATE_FRAGMENT_TESTS_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do segundo render pass, etc.

vkCmdDraw(...);
```

### Primeiro *draw* escreve em um *color attachment*; segundo *draw* lê dele como *input attachment* no *fragment shader*

```cpp
// Defina isto como o índice em VkRenderPassCreateInfo::pAttachments onde a imagem de cor é descrita.
uint32_t colorAttachmentIndex = /* ... */;

std::array<VkSubpassDescription, 2> subpasses{};

VkAttachmentReference colorAttachment{
    .attachment = colorAttachmentIndex,
    .layout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

// Subpass contendo o primeiro draw
subpasses[0] = VkSubpassDescription{
    // ...
    .colorAttachmentCount = 1,
    .pColorAttachments = &colorAttachment,
    // ...
};

VkAttachmentReference colorAsInputAttachment{
    .attachment = colorAttachmentIndex,
    .layout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
};

// Subpass contendo o segundo draw
subpasses[1] = VkSubpassDescription{
    // ...
    .inputAttachmentCount = 1,
    .pInputAttachments = &colorAsInputAttachment,
    // ...
};

VkSubpassDependency dependency{
    .srcSubpass = 0,
    .dstSubpass = 1,
    .srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
    .dstStageMask = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    .srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_INPUT_ATTACHMENT_READ_BIT,
    .dependencyFlags = VK_DEPENDENCY_BY_REGION_BIT,
};

// Se initialLayout não corresponder ao layout da referência do attachment no primeiro subpass,
// haverá uma transição implícita antes de iniciar o render pass.
// Se finalLayout não corresponder ao layout da referência do attachment no último subpass,
// haverá uma transição implícita ao final.
VkAttachmentDescription colorFramebufferAttachment{
    // ...
    .initialLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .finalLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
};

VkRenderPassCreateInfo renderPassCreateInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &colorFramebufferAttachment,
    .subpassCount = static_cast<uint32_t>(subpasses.size()),
    .pSubpasses = subpasses.data(),
    .dependencyCount = 1,
    .pDependencies = &dependency,
};

vkCreateRenderPass(device, &renderPassCreateInfo, nullptr, &renderPass);

// ...
```

### Primeiro *draw* escreve em um *color attachment*; segundo *draw* amostra dessa imagem de cor no *fragment shader*

```cpp
vkCmdDraw(...);

// ... Finalização do primeiro render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do segundo render pass, etc.

vkCmdDraw(...);
```

### Primeiro *draw* escreve em um *color attachment*; segundo *draw* amostra dessa imagem de cor no *vertex shader*

```cpp
vkCmdDraw(...);

// ... Finalização do primeiro render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_VERTEX_SHADER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do segundo render pass, etc.

vkCmdDraw(...);
```

### Primeiro *draw* amostra uma textura no *fragment shader*; segundo *draw* escreve nessa textura como *color attachment*

Este é um *hazard* do tipo WAR, para o qual você normalmente precisaria apenas de uma dependência de execução — o que significa que não precisaria fornecer nenhuma *memory barrier*. Neste caso, porém, você ainda precisa de uma *memory barrier* para realizar uma transição de layout, mas não precisa de nenhum tipo de acesso na *srcAccessMask*. A transição de layout em si é considerada uma operação de escrita, portanto você precisa que a *dstAccessMask* esteja correta — caso contrário, haveria um *hazard* WAW entre a transição de layout e a escrita no *color attachment*.

```cpp
vkCmdDraw(...);

// ... Finalização do primeiro render pass, etc.

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Configuração do segundo render pass, etc.

vkCmdDraw(...);
```

### Primeiro *render pass* escreve em um *depth attachment*; segundo *render pass* reutiliza o mesmo *depth attachment*

Este é um exemplo de *hazard* WAW (*Write-After-Write*), que sempre requer uma dependência de memória (*memory dependency*). Mesmo que o *render pass* não leia a saída do passe anterior (na verdade, neste exemplo, o conteúdo anterior da imagem explicitamente não é preservado pela natureza de transicionar a partir de `UNDEFINED`), ainda precisamos de uma dependência de memória para garantir que as escritas na imagem não sejam reordenadas.

Além disso, como estamos usando uma transição automática de layout (`initialLayout` difere de `layout`), é importante garantir que a transição não ocorra cedo demais. Isso normalmente requer especificar explicitamente uma *subpass dependency* com `VK_SUBPASS_EXTERNAL`, pois a dependência implícita padrão (que tem `srcStageMask = TOP`) não é suficiente. (Veja "Aquisição e Apresentação de Imagens da Swapchain" para outro exemplo disso.)

Este exemplo usa uma *subpass dependency* com `VK_SUBPASS_EXTERNAL` para atingir ambos os objetivos (resolver o *hazard* WAW e segurar a transição automática de layout), mas, como sempre, uma *pipeline barrier* também pode ser usada.

```cpp
// Estamos usando o depth buffer como um depth-stencil attachment
VkAttachmentReference depthAttachment{
    .attachment = 0,
    .layout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

VkAttachmentDescription depthFramebufferAttachment{
    // ...
    .loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR,              // Desejamos limpar o buffer no início do subpass
    .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED,         // Não há necessidade de preservar o conteúdo anterior da imagem
    .finalLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,  // Ao terminar, mantém o layout usado no subpass (sem transição no final)
};

// Subpass usando o depth buffer
VkSubpassDescription subpass{
    // ...
    .pDepthStencilAttachment = &depthAttachment,
    // ...
};

// Usa uma subpass dependency de entrada para garantir:
// * Que o uso anterior do depth buffer foi concluído (dependência de execução).
// * Que o hazard WAW foi resolvido (ex.: caches são descarregados e invalidados para que escritas antigas e novas não sejam reordenadas).
// * Que a transição UNDEFINED -> VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL aconteça após o uso anterior em EARLY/LATE_FRAGMENT_TESTS.
// * Que as alterações feitas na imagem pela transição sejam contempladas ao definir a dstAccessMask apropriada.
VkSubpassDependency dependency{
    .srcSubpass = VK_SUBPASS_EXTERNAL,
    .dstSubpass = 0,
    .srcStageMask = VK_PIPELINE_STAGE_LATE_FRAGMENT_TESTS_BIT,  // Store op é sempre executada nos testes tardios, após o acesso do subpass
    .dstStageMask = VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT, // Load op é sempre executada nos testes iniciais, antes do acesso do subpass
    .srcAccessMask = VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT | VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT,
    .dependencyFlags = 0,
};

VkRenderPassCreateInfo renderPassCreateInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &depthFramebufferAttachment,
    .subpassCount = 1,
    .pSubpasses = &subpass,
    .dependencyCount = 1,
    .pDependencies = &dependency,
};

vkCreateRenderPass(device, &renderPassCreateInfo, nullptr, &renderPass);

// ...

// Primeiro render pass
vkCmdBeginRenderPass(...);
// ...
vkCmdEndRenderPass(commandBuffer);

// ...

// Segundo render pass (pode ser no mesmo frame ou em um frame diferente)
vkCmdBeginRenderPass(...);
// ...
vkCmdEndRenderPass(commandBuffer);
```

## Dependências de Transferência

### Enviar dados da CPU para um *vertex buffer*

#### Memória Discreta de *Host* e *Device*

Se houver um tipo de memória com `HOST_VISIBLE` e sem `DEVICE_LOCAL`, e um tipo separado com `DEVICE_LOCAL` habilitado, utilize o caminho de configuração a seguir. Sistemas UMA são descritos no próximo bloco de código, embora este código também funcione nesses sistemas ao custo de uma sobrecarga adicional de memória.

Configuração:

```cpp
// Dados e tamanho desses dados
const uint32_t vertexDataSize = /* ... */;
const void* pData = /* ... */;

// Cria um staging buffer para upload
VkBufferCreateInfo stagingCreateInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr,
    .size = vertexDataSize,
    .usage = VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
    // ...
};

VkBuffer stagingBuffer = VK_NULL_HANDLE;
vkCreateBuffer(device, &stagingCreateInfo, nullptr, &stagingBuffer);

// Cria o vertex buffer
VkBufferCreateInfo vertexCreateInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr,
    .size = vertexDataSize,
    .usage = VK_BUFFER_USAGE_TRANSFER_DST_BIT | VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
    // ...
};

VkBuffer vertexBuffer = VK_NULL_HANDLE;
vkCreateBuffer(device, &vertexCreateInfo, nullptr, &vertexBuffer);

// ...

// Aloque e vincule (bind) memória para esses buffers.
// Certifique-se de que o staging buffer use um tipo de memória que possua a propriedade
// VK_MEMORY_PROPERTY_HOST_VISIBLE e NÃO possua VK_MEMORY_PROPERTY_DEVICE_LOCAL.
// A memória do vertex buffer deve ser o oposto — deve incluir
// VK_MEMORY_PROPERTY_DEVICE_LOCAL e não deve possuir VK_MEMORY_PROPERTY_HOST_VISIBLE.
// Utilize o código de exemplo documentado na descrição de
// VkPhysicalDeviceMemoryProperties:
// https://www.khronos.org/registry/vulkan/specs/latest/man/html/VkPhysicalDeviceMemoryProperties.html

// ...

// Mapeia os staging buffers — se você planeja reutilizá-los (o que você deveria),
// mantenha-os mapeados.
// Idealmente, mapeie o intervalo inteiro de uma só vez também.
void* stagingData = nullptr;

vkMapMemory(
    device,
    stagingMemory,
    stagingMemoryOffset,
    vertexDataSize,
    0,
    &stagingData);

// Escreve os dados diretamente no ponteiro mapeado
vertexFile.read(static_cast<char*>(stagingData), vertexDataSize);

// Faz o flush do intervalo de memória.
// Se o tipo de memória de stagingMemory incluir VK_MEMORY_PROPERTY_HOST_COHERENT, pule esta etapa.

// Alinha ao VkPhysicalDeviceProperties::nonCoherentAtomSize
VkDeviceSize alignedSize = (vertexDataSize - 1) - ((vertexDataSize - 1) % nonCoherentAtomSize) + nonCoherentAtomSize;

// Configura o intervalo
VkMappedMemoryRange stagingRange{
    .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
    .pNext = nullptr,
    .memory = stagingMemory,
    .offset = stagingMemoryOffset,
    .size = alignedSize,
};

// Faz o flush do intervalo
vkFlushMappedMemoryRanges(device, 1, &stagingRange);
```

Gravação e submissão do *command buffer* para uma *queue* unificada de *transfer*/*graphics* (ou separada):

```cpp
vkBeginCommandBuffer(...);

// A submissão garante que a escrita do host foi concluída, conforme:
// https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-submission-host-writes
// Portanto, não há necessidade de uma barreira antes da transferência.

// Copia o conteúdo do staging buffer para o vertex buffer
VkBufferCopy vertexCopyRegion{
    .srcOffset = stagingMemoryOffset,
    .dstOffset = vertexMemoryOffset,
    .size = vertexDataSize,
};

vkCmdCopyBuffer(
    commandBuffer,
    stagingBuffer,
    vertexBuffer,
    1,
    &vertexCopyRegion);

// Se a queue de graphics e a queue de transfer forem a mesma queue
if (isUnifiedGraphicsAndTransferQueue) {
    // Se houver um signal + wait de semaphore entre esta submissão e o uso do
    // vertex buffer, então pule esta pipeline barrier.

    // Pipeline barrier antes de usar os dados de vértice.
    // Note que isso pode se aplicar a todos os buffers enviados da mesma forma, então
    // idealmente agrupe todas as cópias antes disto.
    VkMemoryBarrier2KHR memoryBarrier{
        .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
        .srcAccessMask = VK_ACCESS_2_MEMORY_WRITE_BIT_KHR,
        .dstStageMask = VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR,
        .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR,
    };

    VkDependencyInfoKHR dependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .memoryBarrierCount = 1,
        .pMemoryBarriers = &memoryBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    vkQueueSubmit2KHR(unifiedQueue, ...);
} else {
    // Pipeline barrier para iniciar uma transferência de propriedade de queue após a cópia
    VkBufferMemoryBarrier2KHR releaseBarrier{
        .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
        .srcAccessMask = VK_ACCESS_2_MEMORY_WRITE_BIT_KHR,
        .srcQueueFamilyIndex = transferQueueFamilyIndex,
        .dstQueueFamilyIndex = graphicsQueueFamilyIndex,
        .buffer = vertexBuffer,
        .offset = 0,
        .size = VK_WHOLE_SIZE,
    };

    VkDependencyInfoKHR releaseDependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .bufferMemoryBarrierCount = 1,
        .pBufferMemoryBarriers = &releaseBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &releaseDependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    // Certifique-se de sinalizar aqui um semaphore que será aguardado pela graphics queue.
    vkQueueSubmit2KHR(transferQueue, ...);

    // Grava um command buffer para a graphics queue.
    vkBeginCommandBuffer(...);

    // Pipeline barrier antes de usar o vertex buffer, após finalizar a transferência de propriedade
    VkBufferMemoryBarrier2KHR acquireBarrier{
        .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .dstStageMask = VK_PIPELINE_STAGE_2_VERTEX_ATTRIBUTE_INPUT_BIT_KHR,
        .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR,
        .srcQueueFamilyIndex = transferQueueFamilyIndex,
        .dstQueueFamilyIndex = graphicsQueueFamilyIndex,
        .buffer = vertexBuffer,
        .offset = 0,
        .size = VK_WHOLE_SIZE,
    };

    VkDependencyInfoKHR acquireDependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .bufferMemoryBarrierCount = 1,
        .pBufferMemoryBarriers = &acquireBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &acquireDependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    vkQueueSubmit2KHR(graphicsQueue, ...);
}
```

#### Memória Unificada (*Unified Memory*)

Para sistemas UMA, você pode usar a abordagem acima, mas utilizará menos memória se evitar o *staging buffer* nesses sistemas, conforme a configuração a seguir. Não há necessidade de realizar nenhuma sincronização no lado do dispositivo (*device-side*), assumindo que os primeiros comandos que utilizam o buffer sejam submetidos *após* o upload (em vez de usar `VkEvent`, o que não é recomendado e não é descrito aqui).

Configuração:

```cpp
// Dados e tamanho desses dados
const uint32_t vertexDataSize = /* ... */;
const void* pData = /* ... */;

// Cria o vertex buffer
VkBufferCreateInfo vertexCreateInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr,
    .size = vertexDataSize,
    .usage = VK_BUFFER_USAGE_TRANSFER_DST_BIT | VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
    // ...
};

VkBuffer vertexBuffer = VK_NULL_HANDLE;
vkCreateBuffer(device, &vertexCreateInfo, nullptr, &vertexBuffer);

// ...

// Aloque e vincule memória para este buffer.
// Deve usar um tipo de memória que inclua HOST_VISIBLE e, idealmente, também
// DEVICE_LOCAL se disponível.
// Utilize o código de exemplo documentado na descrição de
// VkPhysicalDeviceMemoryProperties:
// https://www.khronos.org/registry/vulkan/specs/latest/man/html/VkPhysicalDeviceMemoryProperties.html

// ...

// Mapeia o vertex buffer
void* vertexData = nullptr;

vkMapMemory(
    device,
    vertexMemory,
    vertexMemoryOffset,
    vertexDataSize,
    0,
    &vertexData);

// Escreve os dados diretamente no ponteiro mapeado
vertexFile.read(static_cast<char*>(vertexData), vertexDataSize);

// Faz o flush do intervalo de memória.
// Se o tipo de memória de vertexMemory incluir VK_MEMORY_PROPERTY_HOST_COHERENT, pule esta etapa.

// Alinha ao VkPhysicalDeviceProperties::nonCoherentAtomSize
VkDeviceSize alignedSize = (vertexDataSize - 1) - ((vertexDataSize - 1) % nonCoherentAtomSize) + nonCoherentAtomSize;

// Configura o intervalo
VkMappedMemoryRange vertexRange{
    .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
    .pNext = nullptr,
    .memory = vertexMemory,
    .offset = vertexMemoryOffset,
    .size = alignedSize,
};

// Faz o flush do intervalo
vkFlushMappedMemoryRanges(device, 1, &vertexRange);

// Você pode querer pular isto caso vá modificar os dados novamente
vkUnmapMemory(device, vertexMemory);
```

### Enviar dados da CPU para uma imagem amostrada em um *fragment shader*

Este caminho é universal tanto para sistemas UMA quanto para sistemas discretos, pois as imagens devem ser convertidas para *optimal tiling* durante o upload.

Configuração:

```cpp
// Dados e tamanho desses dados
const uint32_t imageDataSize = /* ... */;

// Cria um staging buffer para upload
VkBufferCreateInfo stagingCreateInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr,
    .size = imageDataSize,
    .usage = VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
    // ...
};

VkBuffer stagingBuffer = VK_NULL_HANDLE;
vkCreateBuffer(device, &stagingCreateInfo, nullptr, &stagingBuffer);

// Cria a imagem amostrada (sampled image)
VkImageCreateInfo imageCreateInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    // Defina as dimensões da imagem conforme apropriado
    .tiling = VK_IMAGE_TILING_OPTIMAL,
    .usage = VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT,
    // ...
};

VkImage image = VK_NULL_HANDLE;
vkCreateImage(device, &imageCreateInfo, nullptr, &image);

// ...

// Aloque e vincule memória para esses recursos.
// Certifique-se de que o staging buffer use um tipo de memória que possua a propriedade
// VK_MEMORY_PROPERTY_HOST_VISIBLE e NÃO possua VK_MEMORY_PROPERTY_DEVICE_LOCAL.
// A memória da imagem deve ser o oposto — deve incluir
// VK_MEMORY_PROPERTY_DEVICE_LOCAL e não deve possuir VK_MEMORY_PROPERTY_HOST_VISIBLE.
// Utilize o código de exemplo documentado na descrição de
// VkPhysicalDeviceMemoryProperties:
// https://www.khronos.org/registry/vulkan/specs/latest/man/html/VkPhysicalDeviceMemoryProperties.html

// ...

// Mapeia os staging buffers — se você planeja reutilizá-los (o que você deveria),
// mantenha-os mapeados.
// Idealmente, mapeie o intervalo inteiro de uma só vez também.
void* stagingData = nullptr;

vkMapMemory(
    device,
    stagingMemory,
    stagingMemoryOffset,
    imageDataSize,
    0,
    &stagingData);

// Escreve os dados diretamente no ponteiro mapeado
imageFile.read(static_cast<char*>(stagingData), imageDataSize);

// Faz o flush do intervalo de memória.
// Se o tipo de memória de stagingMemory incluir VK_MEMORY_PROPERTY_HOST_COHERENT, pule esta etapa.

// Alinha ao VkPhysicalDeviceProperties::nonCoherentAtomSize
VkDeviceSize alignedSize = (imageDataSize - 1) - ((imageDataSize - 1) % nonCoherentAtomSize) + nonCoherentAtomSize;

// Configura o intervalo
VkMappedMemoryRange stagingRange{
    .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
    .pNext = nullptr,
    .memory = stagingMemory,
    .offset = stagingMemoryOffset,
    .size = alignedSize,
};

// Faz o flush do intervalo
vkFlushMappedMemoryRanges(device, 1, &stagingRange);
```

Gravação e submissão do *command buffer*:

```cpp
vkBeginCommandBuffer(...);

// A submissão garante que a escrita do host foi concluída, conforme:
// https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-submission-host-writes
// Portanto, não há necessidade de uma barreira antes da transferência para esse fim,
// mas uma barreira é necessária para as mudanças de layout da imagem.

// Pipeline barrier antes da cópia para realizar a transição de layout
VkImageMemoryBarrier2KHR preCopyMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .dstStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_MEMORY_WRITE_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    .newLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = image,
    .subresourceRange = /* ... */, // Transicione o máximo possível da imagem de uma só vez.
};

VkDependencyInfoKHR preCopyDependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &preCopyMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &preCopyDependencyInfo);

// Configura cópias para todas as regiões necessárias (devem ser agrupadas em uma única chamada sempre que possível)
vkCmdCopyBufferToImage(
    commandBuffer,
    stagingBuffer,
    image,
    /* ... */);

// Se a queue de graphics e a queue de transfer forem a mesma queue
if (isUnifiedGraphicsAndTransferQueue) {
    // Pipeline barrier antes de usar a imagem
    VkImageMemoryBarrier2KHR postCopyMemoryBarrier{
        .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
        .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT_KHR,
        .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
        .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
        .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
        .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
        .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
        .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
        .image = image,
        .subresourceRange = /* ... */, // Transicione o máximo possível da imagem de uma só vez.
    };

    VkDependencyInfoKHR postCopyDependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .imageMemoryBarrierCount = 1,
        .pImageMemoryBarriers = &postCopyMemoryBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &postCopyDependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    vkQueueSubmit2KHR(unifiedQueue, ...);
} else {
    // Pipeline barrier de liberação (release) antes de usar a imagem na outra queue
    VkImageMemoryBarrier2KHR postCopyTransferMemoryBarrier{
        .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT_KHR,
        .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT_KHR,
        .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
        .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
        .srcQueueFamilyIndex = transferQueueFamilyIndex,
        .dstQueueFamilyIndex = graphicsQueueFamilyIndex,
        .image = image,
        .subresourceRange = /* ... */, // Transicione o máximo possível da imagem de uma só vez.
    };

    VkDependencyInfoKHR transferDependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .imageMemoryBarrierCount = 1,
        .pImageMemoryBarriers = &postCopyTransferMemoryBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &transferDependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    vkQueueSubmit2KHR(transferQueue, ...);

    vkBeginCommandBuffer(...);

    // Pipeline barrier de aquisição (acquire) antes de usar a imagem
    VkImageMemoryBarrier2KHR postCopyGraphicsMemoryBarrier{
        .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
        .pNext = nullptr,
        .dstStageMask = VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT_KHR,
        .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT_KHR,
        .oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
        .newLayout = VK_IMAGE_LAYOUT_READ_ONLY_OPTIMAL,
        .srcQueueFamilyIndex = transferQueueFamilyIndex,
        .dstQueueFamilyIndex = graphicsQueueFamilyIndex,
        .image = image,
        .subresourceRange = /* ... */, // Transicione o máximo possível da imagem de uma só vez.
    };

    VkDependencyInfoKHR graphicsDependencyInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
        .pNext = nullptr,
        .imageMemoryBarrierCount = 1,
        .pImageMemoryBarriers = &postCopyGraphicsMemoryBarrier,
    };

    vkCmdPipelineBarrier2KHR(commandBuffer, &graphicsDependencyInfo);

    vkEndCommandBuffer(commandBuffer);

    vkQueueSubmit2KHR(graphicsQueue, ...);
}
```

### Leitura na CPU de dados escritos por um *compute shader*

Este exemplo mostra as etapas necessárias para trazer de volta à CPU dados escritos em um buffer por um *compute shader*.

```cpp
vkCmdDispatch(...);

VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_HOST_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_HOST_READ_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkEndCommandBuffer(commandBuffer);

vkQueueSubmit2KHR(..., fence); // Submete o command buffer com uma fence
```

A GPU levará tempo para processar, portanto isso deve ser *pipelined* junto com o gerenciamento de outros recursos (por exemplo, imagens da *swapchain*):

```cpp
vkWaitForFences(device, 1, &fence, VK_TRUE, UINT64_MAX);

// Se a memória for host coherent, pule esta etapa — caso contrário, a invalidação é necessária
if (memoryIsNotHostCoherent) {
    VkMappedMemoryRange mappedMemoryRange{
        .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
        .pNext = nullptr,
        .memory = bufferMemory, // Alocação VkDeviceMemory que sustenta o buffer
        .offset = 0,
        .size = VK_WHOLE_SIZE,
    };

    vkInvalidateMappedMemoryRanges(device, 1, &mappedMemoryRange);
}

// Lê os valores de volta a partir do ponteiro mapeado
auto value = mappedMemory[/* ... */];
```

## Interações com Semaphores

Se você tiver uma dependência em que os dois comandos sendo sincronizados possuam um par de sinalização/espera (*signal*/*wait*) de *semaphore* entre eles, a sincronização adicional feita por *pipeline barriers*, *events* ou *subpass dependencies* pode ser reduzida ou removida. Apenas os parâmetros afetados pela presença da dependência de *semaphore* são listados.

### Qualquer dependência em que apenas buffers sejam afetados, ou imagens cujo layout não mude

```cpp
// Nada para ver aqui — o semaphore sozinho é suficiente.
// Nenhuma sincronização adicional é necessária — remova essas barreiras.
```

Sinalizar um *semaphore* aguarda a conclusão de todos os estágios, e todos os acessos à memória são tornados disponíveis automaticamente. Da mesma forma, aguardar por um *semaphore* tornará todos os acessos à memória disponíveis e impedirá que trabalho adicional seja iniciado até que ele seja sinalizado. Note que, no caso de `vkQueueSubmit`, há um conjunto explícito de estágios impedidos de executar em `VkSubmitInfo::pWaitDstStageMask` — para todos os outros usos de *semaphore*, a execução de todo o trabalho é impedida.

### Dependência entre imagens que requer transição de layout, expressa antes da sinalização do *semaphore*

```cpp
vkCmdDispatch(...);

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    // ...
    .dstStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
    .dstAccessMask = VK_ACCESS_2_NONE_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

// ... Signal/wait do semaphore acontece aqui

vkCmdDispatch(...);
```

### Dependência entre imagens que requer transição de layout, expressa após a sinalização do *semaphore*

```cpp
vkCmdDispatch(...);

// ... Signal/wait do semaphore acontece aqui

VkImageMemoryBarrier2KHR imageMemoryBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    // ...
    .srcStageMask = VK_PIPELINE_STAGE_2_NONE_KHR,
    .srcAccessMask = VK_ACCESS_2_NONE_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &imageMemoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);

vkCmdDispatch(...);
```

Os estágios usados em `srcStageMask` devem ser iguais (ou logicamente posteriores) aos valores em `VkSubmitInfo::pWaitDstStageMask` definidos para a operação de espera do *semaphore* relevante; caso contrário, não há garantia de que a barreira ocorra após a espera do *semaphore*. Neste exemplo, estamos assumindo que o valor relevante de `pWaitDstStageMask` é igual a `VK_PIPELINE_STAGE_2_TOP_OF_PIPE_BIT_KHR`.

## Aquisição e Apresentação de Imagens da Swapchain

### Queue Combinada de Graphics/Present

```cpp
VkAttachmentReference attachmentReference{
    .attachment = 0,
    .layout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

// Subpass contendo o primeiro draw
VkSubpassDescription subpass{
    // ...
    .colorAttachmentCount = 1,
    .pColorAttachments = &attachmentReference,
    // ...
};

/* Adiciona dependências externas para garantir que as transições de layout
   aconteçam no momento correto.
   Diferentemente da synchronization 1, inserimos 2 dependências, pois as operações
   de wait e signal do semaphore acontecem em COLOR_ATTACHMENT_OUTPUT para reduzir
   seu escopo ao mínimo; ambas as subpass dependencies são então ajustadas para corresponder. */
std::array<VkSubpassDependency, 2> dependencies{{
    {
        .srcSubpass = VK_SUBPASS_EXTERNAL,
        .dstSubpass = 0,
        .srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
        .dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
        .srcAccessMask = VK_ACCESS_NONE_KHR,
        .dstAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT,
        .dependencyFlags = 0,
    },
    /* Nos casos em que a aplicação sinaliza o semaphore com
       VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT, ou usa vkQueueSubmit,
       esta segunda dependência pode ser omitida. */
    {
        .srcSubpass = 0,
        .dstSubpass = VK_SUBPASS_EXTERNAL,
        .srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
        .dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
        .srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT,
        .dstAccessMask = VK_ACCESS_NONE_KHR,
        .dependencyFlags = 0,
    },
}};

VkAttachmentDescription attachmentDescription{
    // ...
    .loadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE,
    .storeOp = VK_ATTACHMENT_STORE_OP_STORE,
    // ...
    // A imagem será automaticamente transicionada de UNDEFINED para COLOR_ATTACHMENT_OPTIMAL para renderização e depois para PRESENT_SRC_KHR ao final.
    .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    // Apresentar imagens no Vulkan exige um layout especial.
    .finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
};

VkRenderPassCreateInfo renderPassCreateInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &attachmentDescription,
    .subpassCount = 1,
    .pSubpasses = &subpass,
    .dependencyCount = static_cast<uint32_t>(dependencies.size()),
    .pDependencies = dependencies.data(),
};

vkCreateRenderPass(device, &renderPassCreateInfo, nullptr, &renderPass);

// ...

vkAcquireNextImageKHR(
    device,
    swapchain,
    UINT64_MAX,
    acquireCompleteSemaphore, // semaphore
    VK_NULL_HANDLE,
    &imageIndex);             // índice da imagem

VkSemaphoreSubmitInfoKHR acquireCompleteInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = acquireCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
};

VkSemaphoreSubmitInfoKHR renderingCompleteInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = renderingCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
};

VkSubmitInfo2KHR submitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2_KHR,
    .pNext = nullptr,
    .waitSemaphoreInfoCount = 1,
    .pWaitSemaphoreInfos = &acquireCompleteInfo,
    // ...
    .signalSemaphoreInfoCount = 1,
    .pSignalSemaphoreInfos = &renderingCompleteInfo,
};

vkQueueSubmit2KHR(queue, 1, &submitInfo, fence);

VkPresentInfoKHR presentInfo{
    .sType = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR,
    .pNext = nullptr,
    .waitSemaphoreCount = 1,
    .pWaitSemaphores = &renderingCompleteSemaphore,
    // ...
};

vkQueuePresentKHR(queue, &presentInfo);
```

### Múltiplas Queues

Se a *present queue* for diferente da *queue* onde a renderização é realizada, uma transferência de propriedade de *queue* (*queue ownership transfer*) deverá ser executada adicionalmente entre as duas *queues* tanto no momento da aquisição quanto no da apresentação, o que exige sincronização adicional.

Configuração do *render pass*:

```cpp
VkAttachmentReference attachmentReference{
    .attachment = 0,
    .layout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

// Subpass contendo o primeiro draw
VkSubpassDescription subpass{
    // ...
    .colorAttachmentCount = 1,
    .pColorAttachments = &attachmentReference,
    // ...
};

VkAttachmentDescription attachmentDescription{
    // ...
    .loadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE,
    .storeOp = VK_ATTACHMENT_STORE_OP_STORE,
    // ...
    .initialLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .finalLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
};

/* Devido a esses pontos extras de sincronização necessários, faz mais sentido
   omitir as dependências externas de subpass (que não conseguem expressar uma
   transferência de queue) e agrupar as operações relevantes com as novas
   pipeline barriers que estamos introduzindo. */

VkRenderPassCreateInfo renderPassCreateInfo{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO,
    .pNext = nullptr,
    .attachmentCount = 1,
    .pAttachments = &attachmentDescription,
    .subpassCount = 1,
    .pSubpasses = &subpass,
    .dependencyCount = 0,
    .pDependencies = nullptr,
};

vkCreateRenderPass(device, &renderPassCreateInfo, nullptr, &renderPass);
```

*Command buffer* de renderização — *graphics queue*:

```cpp
/* A transferência de propriedade de queue só é necessária quando precisamos que o conteúdo permaneça válido entre queues.
   Como estamos transicionando a partir de UNDEFINED — e, portanto, descartando o conteúdo da imagem desde o início —
   não somos obrigados a realizar uma transferência de propriedade da queue de apresentação para a de gráficos.

   Essa transição também poderia ser feita como uma dependência de render pass EXTERNAL -> subpass #0, como mostrado anteriormente. */

VkImageMemoryBarrier2KHR preRenderBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    .newLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR preRenderDependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &preRenderBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &preRenderDependencyInfo);

// ... Submissão do render pass.

// Operação de liberação de queue (queue release). dstAccessMask deve ser sempre 0.
VkImageMemoryBarrier2KHR releaseBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT_KHR,
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
    .srcQueueFamilyIndex = graphicsQueueFamilyIndex, // índice da família da graphics queue
    .dstQueueFamilyIndex = presentQueueFamilyIndex,  // índice da família da present queue
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR releaseDependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &releaseBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &releaseDependencyInfo);
```

Comandos pré-apresentação — *presentation queue*:

```cpp
// Após submeter o render pass...
VkImageMemoryBarrier2KHR acquireBarrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    // Uma transição de layout que ocorre como parte de uma transferência de propriedade precisa ser especificada duas vezes: uma para o release e outra para o acquire.
    // Nenhuma srcStageMask/srcAccessMask é necessária: aguardar por um semaphore faz isso automaticamente.
    // Nenhuma dstStageMask/dstAccessMask é necessária: sinalizar um semaphore faz isso automaticamente.
    .oldLayout = VK_IMAGE_LAYOUT_ATTACHMENT_OPTIMAL,
    .newLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
    .srcQueueFamilyIndex = graphicsQueueFamilyIndex, // índice da família da graphics queue
    .dstQueueFamilyIndex = presentQueueFamilyIndex,  // índice da família da present queue
    // .image e .subresourceRange devem identificar o sub-recurso da imagem acessado
};

VkDependencyInfoKHR acquireDependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .imageMemoryBarrierCount = 1,
    .pImageMemoryBarriers = &acquireBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &acquireDependencyInfo);
```

Submissão nas *queues*:

```cpp
vkAcquireNextImageKHR(
    device,
    swapchain,
    UINT64_MAX,
    acquireCompleteSemaphore, // semaphore
    VK_NULL_HANDLE,
    &imageIndex);             // índice da imagem

VkSemaphoreSubmitInfoKHR acquireCompleteInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = acquireCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
};

VkSemaphoreSubmitInfoKHR renderingCompleteInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = renderingCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT_KHR,
};

VkCommandBufferSubmitInfoKHR renderingCommandBufferInfo{
    .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .commandBuffer = renderingCommandBuffer,
};

VkSubmitInfo2KHR renderingSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2_KHR,
    .pNext = nullptr,
    .waitSemaphoreInfoCount = 1,
    .pWaitSemaphoreInfos = &acquireCompleteInfo,
    .commandBufferInfoCount = 1,
    .pCommandBufferInfos = &renderingCommandBufferInfo,
    .signalSemaphoreInfoCount = 1,
    .pSignalSemaphoreInfos = &renderingCompleteInfo,
};

vkQueueSubmit2KHR(renderQueue, 1, &renderingSubmitInfo, VK_NULL_HANDLE);

VkSemaphoreSubmitInfoKHR prePresentWaitInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = renderingCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
};

VkSemaphoreSubmitInfoKHR prePresentCompleteInfo{
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .semaphore = prePresentCompleteSemaphore,
    .stageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
};

VkCommandBufferSubmitInfoKHR prePresentCommandBufferInfo{
    .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_SUBMIT_INFO_KHR,
    .pNext = nullptr,
    .commandBuffer = prePresentCommandBuffer,
};

VkSubmitInfo2KHR prePresentSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2_KHR,
    .pNext = nullptr,
    .waitSemaphoreInfoCount = 1,
    .pWaitSemaphoreInfos = &prePresentWaitInfo,
    .commandBufferInfoCount = 1,
    .pCommandBufferInfos = &prePresentCommandBufferInfo,
    .signalSemaphoreInfoCount = 1,
    .pSignalSemaphoreInfos = &prePresentCompleteInfo,
};

vkQueueSubmit2KHR(presentQueue, 1, &prePresentSubmitInfo, fence);

VkPresentInfoKHR presentInfo{
    .sType = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR,
    .pNext = nullptr,
    .waitSemaphoreCount = 1,
    .pWaitSemaphores = &prePresentCompleteSemaphore,
    // ...
};

vkQueuePresentKHR(presentQueue, &presentInfo);
```

## Barreira de Pipeline Completa (*Full Pipeline Barrier*)

> **Aviso:** Você deve **USAR ISTO APENAS PARA DEPURAÇÃO** — isso não é algo que deva jamais ir para código de produção; isso irá descarregar (*flush*) e invalidar todos os caches e paralisar (*stall*) tudo — é uma ferramenta que não deve ser usada levianamente!

Dito isso, pode ser *muito* útil se você suspeitar de uma condição de corrida (*race condition*) na sua aplicação e quiser apenas serializar tudo para conseguir depurá-la.

Note que isso não cuida dos layouts de imagem — se estiver depurando, você pode definir o layout de todas as suas imagens como `GENERAL` para contornar isso, mas novamente: não faça isso em código de produção!

```cpp
VkMemoryBarrier2KHR memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2_KHR,
    .pNext = nullptr,
    .srcStageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
    .srcAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR |
                     VK_ACCESS_2_MEMORY_WRITE_BIT_KHR,
    .dstStageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT_KHR,
    .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT_KHR |
                     VK_ACCESS_2_MEMORY_WRITE_BIT_KHR,
};

VkDependencyInfoKHR dependencyInfo{
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO_KHR,
    .pNext = nullptr,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &memoryBarrier,
};

vkCmdPipelineBarrier2KHR(commandBuffer, &dependencyInfo);
```
