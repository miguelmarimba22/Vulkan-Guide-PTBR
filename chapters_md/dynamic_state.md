# Estado Dinâmico de Pipeline (*Pipeline Dynamic State*)

> **Nota:** Consulte o capítulo sobre o Mapa de Estados Dinâmicos (*Dynamic State Map*) para ver a lista de todos os estados dinâmicos com detalhes.

## Visão Geral

Ao criar um objeto `VkPipeline` gráfico, o fluxo lógico para definir um estado é:

```cpp
// Usando o estado de viewport como exemplo
VkViewport viewport{
    .x = 0.0f,
    .y = 0.0f,
    .width = 32.0f,
    .height = 32.0f,
    .minDepth = 0.0f,
    .maxDepth = 1.0f,
};

// Define o valor do estado
VkPipelineViewportStateCreateInfo viewportStateCreateInfo{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO,
    .pNext = nullptr,
    .viewportCount = 1,
    .pViewports = &viewport,
};

// Cria o pipeline com o valor do estado definido
VkGraphicsPipelineCreateInfo pipelineCreateInfo{
    .sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO,
    .pNext = nullptr,
    .pViewportState = &viewportStateCreateInfo,
};
vkCreateGraphicsPipelines(pipelineCreateInfo, &pipeline);

vkBeginCommandBuffer();
// Seleciona o pipeline e desenha com o valor estático do estado
vkCmdBindPipeline(pipeline);
vkCmdDraw();
vkEndCommandBuffer();
```

Quando o `VkPipeline` utiliza [estado dinâmico (*dynamic state*)](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-dynamic-state), algumas informações do pipeline podem ser omitidas no momento da criação e, em vez disso, definidas durante a gravação do *command buffer*. O novo fluxo lógico passa a ser:

```cpp
// Usando o estado de viewport como exemplo
VkViewport viewport{
    .x = 0.0f,
    .y = 0.0f,
    .width = 32.0f,
    .height = 32.0f,
    .minDepth = 0.0f,
    .maxDepth = 1.0f,
};
constexpr std::array dynamicStates{VK_DYNAMIC_STATE_VIEWPORT};

// Não é usado agora
VkPipelineViewportStateCreateInfo viewportStateCreateInfo{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO,
    .pNext = nullptr,
    // Ainda é necessário informar quantos viewports serão usados aqui
    .viewportCount = 1,
    .pViewports = nullptr,
};

// Define o estado como dinâmico
VkPipelineDynamicStateCreateInfo dynamicStateCreateInfo{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_DYNAMIC_STATE_CREATE_INFO,
    .pNext = nullptr,
    .dynamicStateCount = static_cast<uint32_t>(dynamicStates.size()),
    .pDynamicStates = dynamicStates.data(),
};

// Cria o pipeline com o valor do estado desconhecido
VkGraphicsPipelineCreateInfo pipelineCreateInfo{
    .sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO,
    .pNext = nullptr,
    .pViewportState = &viewportStateCreateInfo,
    .pDynamicState = &dynamicStateCreateInfo,
};
vkCreateGraphicsPipelines(pipelineCreateInfo, &pipeline);

vkBeginCommandBuffer();
vkCmdBindPipeline(pipeline);
// Define o estado para o pipeline no momento da gravação
vkCmdSetViewport(viewport);
vkCmdDraw();
viewport.height = 64.0f;
// Define um novo valor de estado entre chamadas de desenho
vkCmdSetViewport(viewport);
vkCmdDraw();
vkEndCommandBuffer();
```

## Quando usar estado dinâmico

> **Nota:** O Vulkan é uma ferramenta, portanto, como na maioria dos casos, não existe uma resposta única para isso.

Algumas implementações podem apresentar perda de desempenho ao utilizar determinado estado `VkDynamicState` em vez de um valor estático; no entanto, estados dinâmicos podem evitar que uma aplicação precise criar diversas permutações de objetos de pipeline, o que frequentemente é um objetivo mais importante para a aplicação.

## Tempo de vida do estado dinâmico

A especificação explica que existe um [tempo de vida do estado dinâmico (*dynamic state lifetime*)](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#dynamic-state-lifetime). Os exemplos a seguir ilustram melhor esse comportamento:

```cpp
// Exemplo 1 - válido
vkCmdSetViewport();
vkCmdBindPipeline(); // estado estático
vkCmdDraw();

// Exemplo 2 - válido
vkCmdBindPipeline(); // estado estático
vkCmdSetViewport();
vkCmdBindPipeline(); // estado dinâmico
vkCmdDraw();

// Exemplo 3 - inválido (VUID-vkCmdDraw-None-07831)
vkCmdBindPipeline(); // estado estático
vkCmdBindPipeline(); // estado dinâmico
vkCmdDraw();

// Exemplo 4 - inválido (VUID-vkCmdDraw-None-08608)
vkCmdBindPipeline(); // estado dinâmico
vkCmdBindPipeline(); // estado estático
vkCmdSetViewport();
vkCmdDraw();

// Exemplo 5 - inválido (VUID-vkCmdDraw-None-07831)
vkCmdSetViewport();
vkCmdBindPipeline(); // estado estático
vkCmdBindPipeline(); // estado dinâmico
vkCmdDraw();

// Exemplo 6 - inválido (VUID-vkCmdDraw-None-07831)
vkCmdSetViewport();
vkCmdBindPipeline(); // estado estático
vkCmdDraw();
vkCmdBindPipeline(); // estado dinâmico
vkCmdDraw();
```

## Quais estados são dinâmicos

A lista completa de possíveis estados dinâmicos pode ser encontrada em [VkDynamicState](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#VkDynamicState).

As extensões `VK_EXT_extended_dynamic_state`, `VK_EXT_extended_dynamic_state2`, `VK_EXT_extended_dynamic_state3`, `VK_EXT_vertex_input_dynamic_state`, `VK_EXT_attachment_feedback_loop_dynamic_state` e `VK_EXT_color_write_enable` foram adicionadas com o objetivo de dar suporte a aplicações que precisam reduzir a quantidade de objetos de estado de pipeline que compilam e vinculam (*bind*).
