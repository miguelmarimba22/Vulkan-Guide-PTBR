# Arrays de Descritores

Este capítulo ajuda a explicar como você pode criar um array de descritores no Vulkan.

## Bindings vs. Arrays

Dentro de um único *descriptor set*, pode haver múltiplos *bindings*. A principal vantagem de usar múltiplos *bindings* ocorre quando você possui diferentes tipos de descritores no *descriptor set* (*samplers*, *uniform buffers*, etc.).

Quando você possui vários descritores do mesmo tipo, pode preferir usar um array de descritores em vez disso.

Como exemplo simples, se tivermos 4 objetos `VkBuffer` que queremos transformar em 4 *Uniform Buffers* diferentes, poderíamos representar isso como 4 *bindings* diferentes no *descriptor set*:

```glsl
layout(set = 0, binding = 0) uniform UBO0 {
    uint data_0;
};
layout(set = 0, binding = 1) uniform UBO1 {
    uint data_1;
};
layout(set = 0, binding = 2) uniform UBO2 {
    uint data_2;
};
layout(set = 0, binding = 3) uniform UBO3 {
    uint data_3;
};
```

Também poderíamos representar isso como um array de 4 descritores:

```glsl
layout(set = 0, binding = 0) uniform UBO0 {
    uint data;
} buffers[4];
```

Se você tiver o recurso `runtimeDescriptorArray` disponível na extensão `VK_EXT_descriptor_indexing`, também poderá informar ao shader que o tamanho do array será conhecido apenas em tempo de execução:

```glsl
layout(set = 0, binding = 0) uniform UBO0 {
    uint data;
} buffers[];
```

## Configurando um Array de Descritores

Usando o exemplo:

```glsl
layout(set = 0, binding = 0) uniform UBO0 {
    uint data;
} buffers[4];
```

a configuração é bastante simples. Você só precisa definir `VkDescriptorSetLayoutBinding::descriptorCount` como `4`.

Ao atualizar os descritores, você tem 2 opções:

* Usar um array de 4 `VkDescriptorBufferInfo` (geralmente a maneira mais fácil):

```cpp
const std::array<VkDescriptorBufferInfo, 4> buffer_infos{{
    { .buffer = buffer_0, .offset = 0, .range = VK_WHOLE_SIZE },
    { .buffer = buffer_1, .offset = 0, .range = VK_WHOLE_SIZE },
    { .buffer = buffer_2, .offset = 0, .range = VK_WHOLE_SIZE },
    { .buffer = buffer_3, .offset = 0, .range = VK_WHOLE_SIZE },
}};

const VkWriteDescriptorSet write{
    .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
    .pNext = nullptr,
    .dstSet = descriptorSet,
    .dstBinding = 0,
    .dstArrayElement = 0,
    .descriptorCount = static_cast<uint32_t>(buffer_infos.size()), // consumirá 4 itens de pBufferInfo
    .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
    .pBufferInfo = buffer_infos.data(),
};
```

* Usar um array de 4 `VkWriteDescriptorSet`:

```cpp
const std::array<VkWriteDescriptorSet, 4> writes{{
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 0,
        .dstArrayElement = 0, // aponta qual descritor no array será atualizado
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .pBufferInfo = &buffer_info_0,
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 0,
        .dstArrayElement = 1,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .pBufferInfo = &buffer_info_1,
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 0,
        .dstArrayElement = 2,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .pBufferInfo = &buffer_info_2,
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 0,
        .dstArrayElement = 3,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .pBufferInfo = &buffer_info_3,
    },
}};
```

## Atualizações de Bindings Consecutivos

Ao atualizar múltiplos *bindings* de uma só vez, existe o conceito de [Atualizações de Bindings Consecutivos na Especificação do Vulkan](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-updates-consecutive) (*Consecutive Binding Updates*).

A seguir, um exemplo para ajudar a ilustrar como isso funciona. Teremos 5 descritores distribuídos em 3 *bindings* diferentes. O código do shader é expresso como:

```glsl
layout(set = 0, binding = 1) uniform sampler Samplers_A[2];

layout(set = 0, binding = 2) uniform sampler Samplers_B;

layout(set = 0, binding = 6) uniform sampler Samplers_C[2];
```

Na API Vulkan, isso é expresso como:

```cpp
constexpr VkDescriptorSetLayoutBinding sampler_a{
    .binding = 1,
    .descriptorType = VK_DESCRIPTOR_TYPE_SAMPLER,
    .descriptorCount = 2,
    .stageFlags = VK_SHADER_STAGE_ALL,
};

constexpr VkDescriptorSetLayoutBinding sampler_b{
    .binding = 2,
    .descriptorType = VK_DESCRIPTOR_TYPE_SAMPLER,
    .descriptorCount = 1,
    .stageFlags = VK_SHADER_STAGE_ALL,
};

constexpr VkDescriptorSetLayoutBinding sampler_c{
    .binding = 6,
    .descriptorType = VK_DESCRIPTOR_TYPE_SAMPLER,
    .descriptorCount = 2,
    .stageFlags = VK_SHADER_STAGE_ALL,
};
```

Se atualizarmos todos os descritores juntos, a estrutura `VkWriteDescriptorSet` ficará assim:

```cpp
std::array<VkDescriptorImageInfo, 5> image_infos{};

const VkWriteDescriptorSet write{
    .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
    .pNext = nullptr,
    .dstSet = descriptorSet,
    .dstBinding = 1,
    .dstArrayElement = 0,
    .descriptorCount = static_cast<uint32_t>(image_infos.size()),
    .descriptorType = VK_DESCRIPTOR_TYPE_SAMPLER,
    .pImageInfo = image_infos.data(),
};
```

Aqui, `VkWriteDescriptorSet::descriptorCount` é `5`. Ele atribuirá os elementos da seguinte forma:

* `image_infos[0]` para o *binding* 1, índice 0
* `image_infos[1]` para o *binding* 1, índice 1
* `image_infos[2]` para o *binding* 2, índice 0
* `image_infos[3]` para o *binding* 6, índice 0
* `image_infos[4]` para o *binding* 6, índice 1
