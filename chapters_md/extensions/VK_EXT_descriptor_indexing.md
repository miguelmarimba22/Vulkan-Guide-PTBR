# VK_EXT_descriptor_indexing

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.
>
> - [SPV_EXT_descriptor_indexing](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_descriptor_indexing.html)
> - [GLSL - GL_EXT_nonuniform_qualifier](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_nonuniform_qualifier.txt)
> - Apresentação do Montreal Developer Day ([vídeo](https://www.youtube.com/watch?v=tXipcoeuNh4) e [slides](https://www.khronos.org/assets/uploads/developers/library/2018-vulkan-devday/10-DescriptorIndexing.pdf))

Esta extensão foi projetada para ser dividida em vários recursos menores e distintos, permitindo que as implementações adicionem suporte a cada recurso conforme possível.

## Atualização Após Vinculação (Update after Bind)

Sem esta extensão, os *descriptors* de uma aplicação não podem ser atualizados entre a gravação do *command buffer* e a execução dos *command buffers*. Com esta extensão, uma aplicação pode consultar o suporte a `descriptorBinding*UpdateAfterBind` para o tipo de *descriptor* utilizado, permitindo então atualizá-lo entre a gravação e a execução.

> **Nota (Exemplo):** Se uma aplicação utiliza um *descriptor* do tipo `StorageBuffer`, ela consultará o suporte a `descriptorBindingStorageBufferUpdateAfterBind`.

Após habilitar o suporte ao recurso desejado para atualização após vinculação, a aplicação precisa configurar o seguinte para usar um *descriptor* que pode ser atualizado após o *bind*:

- A *flag* `VK_DESCRIPTOR_POOL_CREATE_UPDATE_AFTER_BIND_BIT_EXT` em qualquer `VkDescriptorPool` do qual o *descriptor* seja alocado.
- A *flag* `VK_DESCRIPTOR_SET_LAYOUT_CREATE_UPDATE_AFTER_BIND_POOL_BIT_EXT` em qualquer `VkDescriptorSetLayout` ao qual o *descriptor* pertença.
- A *flag* `VK_DESCRIPTOR_BINDING_UPDATE_AFTER_BIND_BIT_EXT` para cada *binding* no `VkDescriptorSetLayout` que o *descriptor* utilizará.

O diagrama a seguir ilustra a diferença entre habilitar a atualização após vinculação e não habilitá-la:

![Comparação entre o fluxo com e sem update after bind](images/extensions/VK_EXT_descriptor_indexing_update_after_bind.png)

## Parcialmente Vinculado (Partially Bound)

Com o recurso `descriptorBindingPartiallyBound` e o uso de `VK_DESCRIPTOR_BINDING_PARTIALLY_BOUND_BIT_EXT` em `VkDescriptorSetLayoutBindingFlagsCreateInfo::pBindingFlags`, o desenvolvedor da aplicação não é obrigado a atualizar todos os *descriptors* no momento do uso.

Um exemplo seria quando o código GLSL da aplicação declara:

```glsl
layout(set = 0, binding = 0) uniform sampler2D textureSampler[64];
```

mas a aplicação vincula apenas os primeiros 32 *slots* do array. Isso também pressupõe que a aplicação garanta que não indexará os *slots* não vinculados do array.

## Indexação Dinâmica (Dynamic Indexing)

Normalmente, quando uma aplicação indexa um array de *descriptors* vinculados, o índice precisa ser conhecido em tempo de compilação. Com o recurso `shader*ArrayDynamicIndexing`, um determinado tipo de *descriptor* pode ser indexado por inteiros "dinamicamente uniformes" (*dynamically uniform*). Isso já era suportado em `VkPhysicalDeviceFeatures` para a maioria dos *descriptors*, mas esta extensão adiciona a struct `VkPhysicalDeviceDescriptorIndexingFeatures`, que permite às implementações expor suporte para indexação dinâmica uniforme também para *input attachments*, *uniform texel buffers* e *storage texel buffers*.

A palavra-chave aqui é "uniforme", o que significa que todas as invocações em um grupo de invocações SPIR-V (*Invocation Group*) precisam usar o mesmo índice dinâmico. Isso se traduz em todas as invocações dentro de uma única chamada `vkCmdDraw*` ou de um único *workgroup* de uma chamada `vkCmdDispatch*`.

Um exemplo de indexação dinâmica uniforme em GLSL:

```glsl
layout(set = 0, binding = 0) uniform sampler2D mySampler[64];
layout(set = 0, binding = 1) uniform UniformBufferObject {
    int textureId;
} ubo;

// ...

void main() {
    // ...
    vec4 samplerColor = texture(mySampler[ubo.textureId], uvCoords);
    // ...
}
```

Este exemplo é "dinâmico" porque o valor de `ubo.textureId` só será conhecido em tempo de execução. Ele também é "uniforme" porque todas as invocações usarão o mesmo `ubo.textureId` neste shader.

## Indexação Dinâmica Não Uniforme (Dynamic Non-Uniform Indexing)

Ser dinamicamente **não uniforme** significa que é possível que invocações diferentes indexem posições diferentes em um array de *descriptors*, e isso só será conhecido em tempo de execução. Esta extensão expõe em `VkPhysicalDeviceDescriptorIndexingFeatures` um conjunto de bits de recurso `shader*ArrayNonUniformIndexing` para indicar para quais tipos de *descriptor* uma implementação suporta indexação dinâmica não uniforme. A extensão SPIR-V adiciona a decoração `NonUniform`, que pode ser definida em GLSL com o auxílio da palavra-chave `nonuniformEXT`.

Um exemplo de indexação dinâmica não uniforme em GLSL:

```glsl
#version 450
#extension GL_EXT_nonuniform_qualifier : enable

layout(set = 0, binding = 0) uniform sampler2D mySampler[64];
layout(set = 0, binding = 1) uniform UniformBufferObject {
    int textureId;
} ubo;

// ...

void main() {
    // ...
    if (uvCoords.x > runtimeThreshold) {
        index = 0;
    } else {
        index = 1;
    }
    vec4 samplerColor = texture(mySampler[nonuniformEXT(index)], uvCoords);
    // ...
}
```

Este exemplo é não uniforme porque algumas invocações indexam `mySampler[0]` e outras indexam `mySampler[1]`. Nesse caso, o uso de `nonuniformEXT()` é obrigatório.
