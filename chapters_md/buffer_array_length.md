# Tamanho de Array em Buffer (`OpArrayLength`)

Às vezes, ao escrever seu shader, você pode não saber o tamanho do array dentro do seu buffer. Para resolver isso, existe a operação `OpArrayLength` no SPIR-V, que pode ser usada para consultar o tamanho em tempo de execução.

Os exemplos a seguir em [GLSL](https://godbolt.org/z/jbqq65cK5), [HLSL](https://godbolt.org/z/7jKr5Pdqz) e [Slang](https://godbolt.org/z/x7YW4rbsq) demonstram como obter o comprimento de um `VK_DESCRIPTOR_TYPE_STORAGE_BUFFER`:

```glsl
layout(set = 0, binding = 0) buffer StorageBuffer {
    uint header;
    uint payload[]; // Array com tamanho definido em tempo de execução
};

uint count = payload.length();
```

## Quando `OpArrayLength` é Permitido

Existem algumas restrições para `OpArrayLength`.

Primeiro, ela precisa ser usada com um array de tamanho em tempo de execução (*runtime array*, `OpTypeRuntimeArray`). As linguagens de shader já conseguem detectar o tamanho de um array estático por conta própria.

Segundo, ela precisa estar dentro de uma struct; isso [impede você](https://godbolt.org/z/4h4bn6oW3) de obter o comprimento de um array de descritores em tempo de execução.

**A resposta curta** é que `OpArrayLength` só é permitida para um **Storage Buffer**, e o array deve ser o **último elemento** da struct.

> **Nota:** Embora `VK_EXT_shader_uniform_buffer_unsized_array` permita arrays de tamanho em tempo de execução em um Uniform Buffer, o uso de `OpArrayLength` é proibido nele.

## Como o Comprimento é Calculado

A resposta é bem simples: com base no que você vinculou!

Imagine que temos um único `VkBuffer` de 1024 bytes e o utilizamos para todos os 3 SSBOs no seu shader, da seguinte forma:

```glsl
layout(binding = 0) buffer StorageBuffer_A {
    uint a[];
};
layout(binding = 1) buffer StorageBuffer_B {
    uint b[];
};
layout(binding = 2) buffer StorageBuffer_C {
    uint c[];
};
```

e, ao atualizar nossos descritores, fazemos:

```cpp
const std::array<VkDescriptorBufferInfo, 3> buffer_infos{{
    {.buffer = my_buffer, .offset = 0, .range = 64},            // bytes vinculados
    {.buffer = my_buffer, .offset = 0, .range = 257},           // não forma um uint completo
    {.buffer = my_buffer, .offset = 0, .range = VK_WHOLE_SIZE},
}};

const std::array<VkWriteDescriptorSet, 3> writes{{
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .pNext = nullptr,
        .dstSet = descriptor_set,
        .dstBinding = 0,
        .dstArrayElement = 0,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pBufferInfo = &buffer_infos[0],
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .pNext = nullptr,
        .dstSet = descriptor_set,
        .dstBinding = 1,
        .dstArrayElement = 0,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pBufferInfo = &buffer_infos[1],
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .pNext = nullptr,
        .dstSet = descriptor_set,
        .dstBinding = 2,
        .dstArrayElement = 0,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pBufferInfo = &buffer_infos[2],
    },
}};

vkUpdateDescriptorSets(device, static_cast<uint32_t>(writes.size()), writes.data(), 0, nullptr);
```

O código do shader agora consegue detectar o comprimento do array em tempo de execução:

```glsl
a.length() == 64 / sizeof(uint);
b.length() == 256 / sizeof(uint); // O driver arredonda para baixo, pois é inválido acessar um item parcialmente vinculado
c.length() == 1024 / sizeof(uint);
```

## Uso com Descriptor Buffers

Para quem utiliza `VK_EXT_descriptor_buffer` (consulte o capítulo sobre Descriptor Buffer), o tamanho vinculado não é decidido com `vkUpdateDescriptorSets`, mas sim com `vkGetDescriptorEXT`:

```cpp
const VkDescriptorAddressInfoEXT address_info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_ADDRESS_INFO_EXT,
    .pNext = nullptr,
    .address = buffer_device_address,
    .range = 256, // bytes vinculados
    .format = VK_FORMAT_UNDEFINED,
};

const VkDescriptorGetInfoEXT info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_GET_INFO_EXT,
    .pNext = nullptr,
    .type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
    .data = {.pStorageBuffer = &address_info},
};

vkGetDescriptorEXT(device, &info, descriptor_size, descriptor_dst);
```

## Uso com Descriptor Heaps

Para quem utiliza `VK_EXT_descriptor_heap` (consulte o capítulo sobre Descriptor Heap), o tamanho vinculado não é decidido com `vkUpdateDescriptorSets`, mas sim com `vkWriteResourceDescriptorsEXT`:

```cpp
const VkDeviceAddressRangeEXT address_range{
    .address = buffer_device_address,
    .size = 256, // bytes vinculados
};

const VkResourceDescriptorInfoEXT resource{
    .sType = VK_STRUCTURE_TYPE_RESOURCE_DESCRIPTOR_INFO_EXT,
    .pNext = nullptr,
    .type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
    .data = {.pAddressRange = &address_range},
};

vkWriteResourceDescriptorsEXT(device, 1, &resource, &host_range);
```

Ao usar `VK_EXT_descriptor_heap`, também é importante perceber que não é permitido usar `OpArrayLength` com os mapeamentos `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_ADDRESS_EXT`, `VK_DESCRIPTOR_MAPPING_SOURCE_SHADER_RECORD_ADDRESS_EXT` ou `VK_DESCRIPTOR_MAPPING_SOURCE_INDIRECT_ADDRESS_EXT`.

Algo como `VK_DESCRIPTOR_MAPPING_SOURCE_INDIRECT_ADDRESS_EXT` permite basicamente usar um Storage Buffer *inline*. Nesses cenários, como o intervalo agora é apenas um endereço bruto de GPU, o driver não consegue calcular de forma confiável o comprimento do recurso.
