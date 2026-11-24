# Push Constants

A especificação Vulkan define `Push Constants` como:

> **Nota:** Um pequeno banco de valores gravável por meio da API e acessível nos shaders. As push constants permitem que a aplicação defina valores usados nos shaders sem criar buffers nem modificar e vincular descriptor sets a cada atualização.

* [Como usar](#como-usar)
  * [Código do Shader](#código-do-shader)
  * [Pipeline Layout](#pipeline-layout)
  * [Atualizando durante a gravação](#atualizando-durante-a-gravação)
  * [Offsets](#offsets)
* [Compatibilidade de Pipeline Layout](#compatibilidade-de-pipeline-layout)
* [Tempo de vida das push constants](#tempo-de-vida-das-push-constants)
  * [Vincular descriptor sets não tem efeito](#vincular-descriptor-sets-não-tem-efeito)
  * [Misturando bind points](#misturando-bind-points)
  * [Vinculando pipelines incompatíveis](#vinculando-pipelines-incompatíveis)
  * [Layouts sem push constants estáticas](#layouts-sem-push-constants-estáticas)
  * [Atualização incremental](#atualização-incremental)

## Como usar

### Código do Shader

Do ponto de vista do shader, as push constants são semelhantes a um uniform buffer. A especificação fornece detalhes sobre a [interface de push constants](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-pushconst) entre Vulkan e SPIR-V.

Um exemplo simples de fragment shader em GLSL ([Experimente Online](https://godbolt.org/z/93WaYd8dE)):

```glsl
layout(push_constant, std430) uniform pc {
    vec4 data;
};

layout(location = 0) out vec4 outColor;

void main() {
    outColor = data;
}
```

Observando partes do SPIR-V desmontado:

```text
                  OpMemberDecorate %pc 0 Offset 0
                  OpDecorate %pc Block

         %float = OpTypeFloat 32
       %v4float = OpTypeVector %float 4

%pc             = OpTypeStruct %v4float
%pc_ptr         = OpTypePointer PushConstant %pc
%pc_var         = OpVariable %pc_ptr PushConstant
%pc_v4float_ptr = OpTypePointer PushConstant %v4float

%access_chain   = OpAccessChain %pc_v4float_ptr %pc_var %int_0
```

isso corresponde à descrição da [especificação Vulkan](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-pushconst) de ser um tipo `OpTypeStruct` com a decoração `Block`.

### Pipeline Layout

Ao chamar `vkCreatePipelineLayout`, os [intervalos de push constants](https://www.khronos.org/registry/vulkan/specs/latest/man/html/VkPushConstantRange.html) (`VkPushConstantRange`) precisam ser configurados em [`VkPipelineLayoutCreateInfo`](https://www.khronos.org/registry/vulkan/specs/latest/man/html/VkPipelineLayoutCreateInfo.html).

Um exemplo usando o shader anterior:

```cpp
constexpr VkPushConstantRange range{
    .stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT,
    .offset = 0,
    .size = 16, // %v4float (vec4) tem tamanho definido de 16 bytes
};

const VkPipelineLayoutCreateInfo create_info{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .setLayoutCount = 0,
    .pSetLayouts = nullptr,
    .pushConstantRangeCount = 1,
    .pPushConstantRanges = &range,
};

VkPipelineLayout pipeline_layout = VK_NULL_HANDLE;
vkCreatePipelineLayout(device, &create_info, nullptr, &pipeline_layout);
```

### Atualizando durante a gravação

Por fim, o valor das push constants precisa ser atualizado para o valor desejado usando [`vkCmdPushConstants`](https://www.khronos.org/registry/vulkan/specs/latest/man/html/vkCmdPushConstants.html).

```cpp
constexpr std::array<float, 4> data{0.0f, 1.0f, 2.0f, 3.0f}; // onde sizeof(float) == 4 bytes

// vkBeginCommandBuffer()
constexpr uint32_t offset = 0;
constexpr uint32_t size = static_cast<uint32_t>(sizeof(data));
vkCmdPushConstants(command_buffer, pipeline_layout, VK_SHADER_STAGE_FRAGMENT_BIT, offset, size, data.data());
// draw / dispatch / trace rays / etc.
// vkEndCommandBuffer()
```

### Offsets

Partindo do shader acima, um desenvolvedor pode adicionar um deslocamento (*offset*) ao bloco de push constants:

```patch
layout(push_constant, std430) uniform pc {
-   vec4 data;
+   layout(offset = 32) vec4 data;
};

layout(location = 0) out vec4 outColor;

void main() {
   outColor = data;
}
```

A diferença no SPIR-V desmontado acima está apenas na decoração do membro:

```patch
- OpMemberDecorate %pc 0 Offset 0
+ OpMemberDecorate %pc 0 Offset 32
```

A partir daí, o offset de `32` também precisa ser especificado em `VkPushConstantRange` para cada estágio de shader que o utiliza:

```patch
constexpr VkPushConstantRange range{
    .stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT,
-   .offset = 0,
+   .offset = 32,
    .size = 16,
};
```

O diagrama a seguir fornece uma visualização de como os offsets de push constants funcionam:

![Visualização de offsets em push constants](images/push_constant_offset.png)

## Compatibilidade de Pipeline Layout

A especificação Vulkan define a [compatibilidade para push constants](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-compatibility) como:

> **Nota:** se eles foram criados com intervalos de push constants idênticos.

Isso significa que, antes de um [comando de pipeline vinculado ser emitido](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-bindpoint-commands) (`vkCmdDraw`, `vkCmdDispatch`, etc.), o `VkPipelineLayout` usado na última chamada a `vkCmdPushConstants` e em `vkCmdBindPipeline` (para o `VkPipelineBindPoint` apropriado) deve ter tido `VkPushConstantRange` **idênticos**.

## Tempo de vida das push constants

O tempo de vida das push constants pode abrir margem para alguns casos extremos (como nas issues [#1081](https://github.com/KhronosGroup/Vulkan-Docs/issues/1081) e [#1485](https://github.com/KhronosGroup/Vulkan-Docs/issues/1485)), e os exemplos a seguir foram elaborados para ilustrar casos comuns do que é e do que não é válido com push constants.

> **Nota:** Existem testes na CTS em `dEQP-VK.pipeline.push_constant.lifetime.*`.

### Vincular descriptor sets não tem efeito

Como as push constants não são vinculadas a descritores, o uso de `vkCmdBindDescriptorSets` não tem nenhum efeito sobre o tempo de vida nem sobre a [compatibilidade de pipeline layout](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-compatibility) das push constants.

### Misturando bind points

É possível usar dois `VkPipelineBindPoint` diferentes, cada um com usos distintos de push constants em seus respectivos shaders:

```cpp
// Intervalos diferentes e, portanto, layouts incompatíveis
VkPipelineLayout layout_graphics = VK_NULL_HANDLE; // VK_SHADER_STAGE_FRAGMENT_BIT
VkPipelineLayout layout_compute = VK_NULL_HANDLE;  // VK_SHADER_STAGE_COMPUTE_BIT

// vkBeginCommandBuffer()
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_graphics); // layout_graphics
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_COMPUTE, pipeline_compute);   // layout_compute

vkCmdPushConstants(command_buffer, layout_graphics, VK_SHADER_STAGE_FRAGMENT_BIT, offset, size, data);
// Ainda válido, pois o último pipeline e push constant gráficos são compatíveis
vkCmdDraw(command_buffer, 3, 1, 0, 0);

vkCmdPushConstants(command_buffer, layout_compute, VK_SHADER_STAGE_COMPUTE_BIT, offset, size, data);
vkCmdDispatch(command_buffer, 1, 1, 1); // válido
// vkEndCommandBuffer()
```

### Vinculando pipelines incompatíveis

A especificação afirma:

> **Nota:** Vincular um pipeline com um layout que não seja compatível com o layout das push constants não perturba os valores das push constants.

Os exemplos a seguir ajudam a ilustrar isso:

```cpp
// vkBeginCommandBuffer()
vkCmdPushConstants(command_buffer, layout_0, stage_flags, offset, size, data);
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_b); // incompatível com layout_0
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_a); // compatível com layout_0
vkCmdDraw(command_buffer, 3, 1, 0, 0); // válido
// vkEndCommandBuffer()

// vkBeginCommandBuffer()
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_b); // incompatível com layout_0
vkCmdPushConstants(command_buffer, layout_0, stage_flags, offset, size, data);
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_a); // compatível com layout_0
vkCmdDraw(command_buffer, 3, 1, 0, 0); // válido
// vkEndCommandBuffer()

// vkBeginCommandBuffer()
vkCmdPushConstants(command_buffer, layout_0, stage_flags, offset, size, data);
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_a); // compatível com layout_0
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline_b); // incompatível com layout_0
vkCmdDraw(command_buffer, 3, 1, 0, 0); // INVÁLIDO
// vkEndCommandBuffer()
```

### Layouts sem push constants estáticas

Também é válido ter um `VkPushConstantRange` no pipeline layout, mas nenhuma push constant no shader, por exemplo:

```cpp
constexpr VkPushConstantRange range{
    .stageFlags = VK_SHADER_STAGE_VERTEX_BIT,
    .offset = 0,
    .size = 4,
};
const VkPipelineLayoutCreateInfo pipeline_layout_info{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .setLayoutCount = 0,
    .pSetLayouts = nullptr,
    .pushConstantRangeCount = 1,
    .pPushConstantRanges = &range,
};
```

```glsl
void main() {
    gl_Position = vec4(1.0);
}
```

Se um `VkPipeline` for criado com o shader e o pipeline layout acima, **ainda é válido** chamar `vkCmdPushConstants` nele.

O modelo mental pode ser entendido considerando que `vkCmdPushConstants` está ligado ao uso de `VkPipelineLayout`, e é por isso que eles precisam corresponder antes de uma chamada a um comando como `vkCmdDraw()`.

Da mesma forma que é possível vincular descriptor sets que nunca são usados pelo shader, o mesmo vale para push constants.

### Atualização incremental

As push constants podem ser atualizadas incrementalmente ao longo de um command buffer.

O código a seguir mostra um exemplo dos valores de uma push constant do tipo `vec4`:

```cpp
// vkBeginCommandBuffer()
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline);

constexpr std::array<uint32_t, 4> init_values{0, 0, 0, 0};
vkCmdPushConstants(command_buffer, pipeline_layout, stage_flags, 0, 16, init_values.data());
vkCmdDraw(command_buffer, 3, 1, 0, 0); // valores = [0, 0, 0, 0]

constexpr std::array<uint32_t, 2> mid_values{1, 1};
vkCmdPushConstants(command_buffer, pipeline_layout, stage_flags, 4, 8, mid_values.data());
vkCmdDraw(command_buffer, 3, 1, 0, 0); // valores = [0, 1, 1, 0]

constexpr std::array<uint32_t, 2> end_values{2, 2};
vkCmdPushConstants(command_buffer, pipeline_layout, stage_flags, 8, 8, end_values.data());
vkCmdDraw(command_buffer, 3, 1, 0, 0); // valores = [0, 1, 2, 2]
// vkEndCommandBuffer()
```
