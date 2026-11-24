# Offset Dinâmico de Descritores

O Vulkan oferece dois tipos de descritores que permitem ajustar o *offset* (deslocamento) no momento da vinculação (*bind time*), conforme [definido na especificação](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptors-binding-dynamicoffsets):

* *dynamic uniform buffer* (`VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER_DYNAMIC`)
* *dynamic storage buffer* (`VK_DESCRIPTOR_TYPE_STORAGE_BUFFER_DYNAMIC`)

## Exemplo

Neste exemplo, teremos um buffer de 32 bytes e 16 desses bytes serão configurados no momento da chamada `vkUpdateDescriptorSets`. Neste primeiro passo, não adicionaremos nenhum *offset* dinâmico.

```cpp
VkDescriptorSet descriptorSet = VK_NULL_HANDLE; // alocado previamente
VkBuffer buffer = VK_NULL_HANDLE;               // tamanho de 32 bytes

const VkDescriptorBufferInfo bufferInfo{
    .buffer = buffer,
    .offset = 4,
    .range = 16,
};

const VkWriteDescriptorSet writeInfo{
    .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
    .pNext = nullptr,
    .dstSet = descriptorSet,
    .descriptorCount = 1,
    .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER_DYNAMIC,
    .pBufferInfo = &bufferInfo,
};

vkUpdateDescriptorSets(
    device,
    1,          // descriptorWriteCount
    &writeInfo, // pDescriptorWrites
    0,          // descriptorCopyCount
    nullptr     // pDescriptorCopies
);

// Sem offset dinâmico
vkCmdBindDescriptorSets(
    commandBuffer,
    VK_PIPELINE_BIND_POINT_GRAPHICS,
    pipelineLayout,
    0,              // firstSet
    1,              // descriptorSetCount
    &descriptorSet, // pDescriptorSets
    0,              // dynamicOffsetCount
    nullptr         // pDynamicOffsets
);
```

Nosso buffer se parece com o seguinte neste momento:

![Buffer com offset base de 4 bytes e range de 16 bytes, sem offset dinâmico](images/descriptor_dynamic_offset_example_a.png)

Em seguida, um *offset* dinâmico de 8 bytes será aplicado no momento da vinculação:

```cpp
constexpr std::array<uint32_t, 1> offsets{ 8 };
vkCmdBindDescriptorSets(
    commandBuffer,
    VK_PIPELINE_BIND_POINT_GRAPHICS,
    pipelineLayout,
    0,                                     // firstSet
    1,                                     // descriptorSetCount
    &descriptorSet,                        // pDescriptorSets
    static_cast<uint32_t>(offsets.size()), // dynamicOffsetCount
    offsets.data()                         // pDynamicOffsets
);
```

Nosso buffer se parece com o seguinte agora:

![Buffer com offset base de 4 bytes mais offset dinâmico de 8 bytes e range de 16 bytes](images/descriptor_dynamic_offset_example_b.png)

## Exemplo com `VK_WHOLE_SIZE`

Desta vez, o valor `VK_WHOLE_SIZE` será usado para o intervalo (`range`). Tudo permanece igual ao exemplo anterior, exceto `VkDescriptorBufferInfo::range`:

```cpp
VkDescriptorSet descriptorSet = VK_NULL_HANDLE; // alocado previamente
VkBuffer buffer = VK_NULL_HANDLE;               // tamanho de 32 bytes

const VkDescriptorBufferInfo bufferInfo{
    .buffer = buffer,
    .offset = 4,
    .range = VK_WHOLE_SIZE,
};

const VkWriteDescriptorSet writeInfo{
    .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
    .pNext = nullptr,
    .dstSet = descriptorSet,
    .descriptorCount = 1,
    .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER_DYNAMIC,
    .pBufferInfo = &bufferInfo,
};

vkUpdateDescriptorSets(
    device,
    1,          // descriptorWriteCount
    &writeInfo, // pDescriptorWrites
    0,          // descriptorCopyCount
    nullptr     // pDescriptorCopies
);

// Sem offset dinâmico
vkCmdBindDescriptorSets(
    commandBuffer,
    VK_PIPELINE_BIND_POINT_GRAPHICS,
    pipelineLayout,
    0,              // firstSet
    1,              // descriptorSetCount
    &descriptorSet, // pDescriptorSets
    0,              // dynamicOffsetCount
    nullptr         // pDynamicOffsets
);
```

Nosso buffer se parece com o seguinte neste momento:

![Buffer com offset base de 4 bytes e VK_WHOLE_SIZE, sem offset dinâmico](images/descriptor_dynamic_offset_example_c.png)

Desta vez, se tentarmos aplicar um *offset* dinâmico, ocorrerá comportamento indefinido e as [camadas de validação emitirão um erro](https://github.com/KhronosGroup/Vulkan-ValidationLayers/issues/2846):

```cpp
// Inválido
constexpr std::array<uint32_t, 1> offsets{ 8 };
vkCmdBindDescriptorSets(
    commandBuffer,
    VK_PIPELINE_BIND_POINT_GRAPHICS,
    pipelineLayout,
    0,                                     // firstSet
    1,                                     // descriptorSetCount
    &descriptorSet,                        // pDescriptorSets
    static_cast<uint32_t>(offsets.size()), // dynamicOffsetCount
    offsets.data()                         // pDynamicOffsets
);
```

É assim que fica a situação com o *offset* dinâmico inválido:

![Buffer com offset dinâmico inválido ultrapassando o limite ao usar VK_WHOLE_SIZE](images/descriptor_dynamic_offset_example_d.png)

## Limites

É importante também verificar os limites `minUniformBufferOffsetAlignment` e `minStorageBufferOffsetAlignment`, pois tanto o *offset* base quanto o *offset* dinâmico devem ser múltiplos desses limites.
