# Formas de Fornecer SPIR-V

Este capítulo foi elaborado para qualquer pessoa que deseje escrever uma ferramenta para inspecionar, consumir, editar ou realizar qualquer operação relacionada aos módulos SPIR-V passados para o Vulkan.

Ao longo dos anos, cada vez mais formas foram criadas para passar SPIR-V ao driver, e este capítulo percorre todas elas.

## `vkCreateShaderModule`

No lançamento do Vulkan 1.0, este era o único método existente para passar SPIR-V para o Vulkan. Trata-se de um fluxo de trabalho muito simples:

```cpp
const VkShaderModuleCreateInfo shader_module_ci{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .codeSize = spirv_source.size() * sizeof(uint32_t),
    .pCode = spirv_source.data(),
};

VkShaderModule shader_module = VK_NULL_HANDLE;
vkCreateShaderModule(device, &shader_module_ci, nullptr, &shader_module);

// Usado para criar o VkPipeline
const VkPipelineShaderStageCreateInfo pipeline_stage_ci{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .stage = VK_SHADER_STAGE_VERTEX_BIT,
    .module = shader_module,
    .pName = "main",
    .pSpecializationInfo = nullptr,
};
```

O problema mais comum para ferramentas ou drivers que consomem `vkCreateShaderModule` é que ainda faltam diversas informações:

* Para um pipeline gráfico, quais descriptor set layouts estarão vinculados;
* Quais são os outros estágios de shader que serão linkados a esse `VkShaderModule`;
* Caso haja múltiplos pontos de entrada (*entry points*), qual deles será escolhido (via `VkPipelineShaderStageCreateInfo::pName`);
* Quais são os valores finais das *Specialization Constants*.

## Inlining dentro de `VkPipelineShaderStageCreateInfo`

Se você tiver suporte a `VK_KHR_maintenance5` ou `VK_EXT_graphics_pipeline_library`, pode simplesmente dispensar por completo o objeto `VkShaderModule`.

Ao criar o `VkPipeline`, basta passar o SPIR-V diretamente naquele momento:

```cpp
const VkShaderModuleCreateInfo shader_module_ci{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .codeSize = spirv_source.size() * sizeof(uint32_t),
    .pCode = spirv_source.data(),
};

const VkPipelineShaderStageCreateInfo pipeline_stage_ci{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
    .pNext = &shader_module_ci,
    .flags = 0,
    .stage = VK_SHADER_STAGE_VERTEX_BIT,
    .module = VK_NULL_HANDLE,
    .pName = "main",
    .pSpecializationInfo = nullptr,
};
```

## Shader Module Identifier

A extensão `VK_EXT_shader_module_identifier` permite que a aplicação nem sequer precise mais do código-fonte SPIR-V; em vez disso, o `VkShaderModule` pode ser armazenado em cache no disco e, em uma execução futura da aplicação, um "ID" apontando para esse cache pode ser utilizado.

O maior desafio para ferramentas é que, se você não tiver a oportunidade de ver a chamada original a `vkGetShaderModuleIdentifierEXT`, não haverá nenhuma maneira de saber o que está dentro do SPIR-V.

O código a seguir mostra um exemplo do fluxo de trabalho que uma aplicação utilizará:

```cpp
// Primeira execução de uma aplicação
VkShaderModule shader_module = VK_NULL_HANDLE;
vkCreateShaderModule(device, &shader_module_ci, nullptr, &shader_module);

VkShaderModuleIdentifierEXT sm_identifier{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_IDENTIFIER_EXT,
    .pNext = nullptr,
};
vkGetShaderModuleIdentifierEXT(device, shader_module, &sm_identifier);

SaveToDisk(sm_identifier);

// -----------
// Potencialmente uma 2ª execução separada da aplicação
// -----------

VkShaderModuleIdentifierEXT loaded_identifier{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_IDENTIFIER_EXT,
    .pNext = nullptr,
};
LoadFromDisk(loaded_identifier);

const VkPipelineShaderStageModuleIdentifierCreateInfoEXT shader_module_id_ci{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_MODULE_IDENTIFIER_CREATE_INFO_EXT,
    .pNext = nullptr,
    .identifierSize = loaded_identifier.identifierSize,
    .pIdentifier = loaded_identifier.identifier,
};

// Inline ao criar o pipeline
const VkPipelineShaderStageCreateInfo pipeline_stage_ci{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
    .pNext = &shader_module_id_ci,
    .flags = 0,
    .stage = VK_SHADER_STAGE_VERTEX_BIT,
    .module = VK_NULL_HANDLE,
    .pName = "main",
    .pSpecializationInfo = nullptr,
};
```

## Graphics Pipeline Library

A extensão `VK_EXT_graphics_pipeline_library` divide o pipeline em 4 partes menores com o intuito de permitir um carregamento de pipelines mais rápido para aplicações que reutilizam os mesmos shaders ou estados em múltiplos pipelines.

Do ponto de vista de ferramentas, você pode ver até 5 chamadas diferentes a `vkCreateGraphicsPipelines`, mas apenas 2 delas conterão SPIR-V. O código a seguir mostra um exemplo de fluxo de trabalho:

```cpp
// Não haverá SPIR-V
VkPipeline vertex_input_lib = VK_NULL_HANDLE;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &vertex_input_ci, nullptr, &vertex_input_lib);

VkPipeline fragment_output_lib = VK_NULL_HANDLE;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &fragment_output_ci, nullptr, &fragment_output_lib);

// Haverá SPIR-V
VkPipeline pre_raster_lib = VK_NULL_HANDLE;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &pre_raster_ci, nullptr, &pre_raster_lib);

// Pode haver SPIR-V (é possível ter pipelines sem fragment shaders)
VkPipeline fragment_shader_lib = VK_NULL_HANDLE;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &fragment_shader_ci, nullptr, &fragment_shader_lib);

// Não haverá SPIR-V ao linkar bibliotecas de pipeline que já contêm o SPIR-V
const std::array<VkPipeline, 4> libraries{
    vertex_input_lib,
    pre_raster_lib,
    fragment_shader_lib,
    fragment_output_lib,
};

const VkPipelineLibraryCreateInfoKHR library_ci{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_LIBRARY_CREATE_INFO_KHR,
    .pNext = nullptr,
    .libraryCount = static_cast<uint32_t>(libraries.size()),
    .pLibraries = libraries.data(),
};

VkGraphicsPipelineCreateInfo link_ci{
    .sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO,
    .pNext = &library_ci,
};

VkPipeline executable_pipeline = VK_NULL_HANDLE;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &link_ci, nullptr, &executable_pipeline);
```

## Shader Objects

A extensão `VK_EXT_shader_object` criou um fluxo completamente novo para passar informações de estado no command buffer que não envolve pipelines. O exemplo a seguir mostra o fluxo para passar o SPIR-V:

```cpp
const VkShaderCreateInfoEXT shader_ci{
    .sType = VK_STRUCTURE_TYPE_SHADER_CREATE_INFO_EXT,
    .pNext = nullptr,
    .flags = 0,
    .stage = VK_SHADER_STAGE_VERTEX_BIT,
    .nextStage = VK_SHADER_STAGE_FRAGMENT_BIT,
    // Observe que o SPIR-V pode, na verdade, ser passado em um bloco binário
    .codeType = VK_SHADER_CODE_TYPE_SPIRV_EXT,
    .codeSize = spirv_source.size() * sizeof(uint32_t),
    // Observe que este é um ponteiro void, diferentemente do ponteiro uint32_t em VkShaderModuleCreateInfo
    .pCode = spirv_source.data(),
    .pName = "main",
};

VkShaderEXT shader_object = VK_NULL_HANDLE;
vkCreateShadersEXT(device, 1, &shader_ci, nullptr, &shader_object);
```

## `vkCreateRayTracingPipelinesKHR::deferredOperation`

Ao lidar com pipelines de Ray Tracing, é importante observar que um handle `VkDeferredOperationKHR` pode ser utilizado para adiar a criação do pipeline e desbloquear a thread da CPU.

A [especificação afirma](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_deferred_host_operations/deferred_host_operations.html#deferred-host-operations-requesting):

> Os parâmetros do comando que solicita uma operação adiada podem ser acessados pela implementação a qualquer momento até que a operação adiada entre no estado concluído (*complete*).

Nesse caso específico, isso significa que, se a sua ferramenta estiver manipulando o SPIR-V passado, **todos** os parâmetros enviados a `vkCreateRayTracingPipelinesKHR` — incluindo ponteiros, shader modules, SPIR-V inline, etc. — devem permanecer vivos até a conclusão da operação.
