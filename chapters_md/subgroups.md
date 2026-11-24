# Subgroups

A especificação do Vulkan define *subgroups* (subgrupos) como:

> **Nota:** Um conjunto de invocações de shader que podem sincronizar e compartilhar dados entre si de forma eficiente. Em *compute shaders*, o *workgroup* local é um superconjunto do *subgroup*.

Para muitas implementações, um *subgroup* é o grupo de invocações que executam a mesma instrução simultaneamente. *Subgroups* permitem que o autor do shader trabalhe em uma granularidade mais fina do que um único *workgroup*.

## Recursos

Para informações mais detalhadas sobre *subgroups*, existe um excelente [artigo no blog da Khronos](https://www.khronos.org/blog/vulkan-subgroup-tutorial), bem como uma apresentação do Vulkan Developer Day 2018 ([slides](https://www.khronos.org/assets/uploads/developers/library/2018-vulkan-devday/06-subgroups.pdf) e [vídeo](https://www.youtube.com/watch?v=8MyqQLu_tW0)). O suporte em GLSL pode ser encontrado na extensão [GL_KHR_shader_subgroup](https://github.com/KhronosGroup/GLSL/blob/master/extensions/khr/GL_KHR_shader_subgroup.txt).

## Tamanho do Subgroup (*Subgroup size*)

Também é importante perceber que o tamanho de um *subgroup* pode ser dinâmico em uma implementação. Algumas implementações podem despachar shaders com tamanhos de *subgroup* variáveis para diferentes *subgroups*. Como resultado, elas podem dividir implicitamente um *subgroup* grande em *subgroups* menores ou representar um *subgroup* pequeno como um *subgroup* maior no qual algumas invocações já iniciam inativas.

### `VK_EXT_subgroup_size_control`

> **Nota:** Promovida ao núcleo no Vulkan 1.3.

Essa extensão foi criada porque algumas implementações possuem mais de um tamanho de *subgroup* e o Vulkan originalmente expunha apenas um único tamanho de *subgroup*.

Por exemplo, se uma implementação suportasse tanto *subgroups* de tamanho `4` quanto `16`, antes ela teria que expor apenas um tamanho, mas agora pode expor ambos. Isso permite que as aplicações potencialmente controlem o hardware em uma granularidade mais fina em implementações que expõem múltiplos tamanhos de *subgroup*. Se um dispositivo não suportar essa extensão, isso muito provavelmente significa que há apenas um tamanho de *subgroup* suportado para expor.

## Verificando o suporte

A partir do Vulkan 1.1, todas as informações sobre *subgroups* são encontradas em `VkPhysicalDeviceSubgroupProperties`:

```cpp
VkPhysicalDeviceSubgroupProperties subgroupProperties{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_SUBGROUP_PROPERTIES,
    .pNext = nullptr,
};

VkPhysicalDeviceProperties2 deviceProperties2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_PROPERTIES_2,
    .pNext = &subgroupProperties,
};
vkGetPhysicalDeviceProperties2(physicalDevice, &deviceProperties2);

// Exemplo de verificação de suporte em fragment shader
if ((subgroupProperties.supportedStages & VK_SHADER_STAGE_FRAGMENT_BIT) != 0) {
    // Suportado em fragment shaders
}

// Exemplo de verificação de suporte para operações de ballot
if ((subgroupProperties.supportedOperations & VK_SUBGROUP_FEATURE_BALLOT_BIT) != 0) {
    // Operações de subgroup do tipo ballot suportadas
}
```

### Suporte garantido

Para estágios suportados, a especificação do Vulkan garante o seguinte suporte:

> **Nota:** **`supportedStages`** terá o bit **`VK_SHADER_STAGE_COMPUTE_BIT`** definido se qualquer uma das *queues* do dispositivo físico suportar **`VK_QUEUE_COMPUTE_BIT`**.

Para operações suportadas, a especificação do Vulkan garante o seguinte suporte:

> **Nota:** **`supportedOperations`** terá o bit **`VK_SUBGROUP_FEATURE_BASIC_BIT`** definido se qualquer uma das *queues* do dispositivo físico suportar **`VK_QUEUE_GRAPHICS_BIT`** ou **`VK_QUEUE_COMPUTE_BIT`**.

## `VK_KHR_shader_subgroup_extended_types`

> **Nota:** Promovida ao núcleo no Vulkan 1.2. Consulte também [GLSL_EXT_shader_subgroup_extended_types](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_shader_subgroup_extended_types.txt).

Essa extensão permite que operações de *subgroup* utilizem inteiros de 8 bits, inteiros de 16 bits, inteiros de 64 bits, ponto flutuante de 16 bits e vetores desses tipos em operações de grupo com escopo de *subgroup*, desde que a implementação já suporte esses tipos.

Por exemplo, se uma implementação suportar inteiros de 8 bits, uma aplicação poderá usar a chamada GLSL `genI8Type subgroupAdd(genI8Type value);`, que será mapeada para `OpGroupNonUniformIAdd` em SPIR-V.

## `VK_EXT_shader_subgroup_ballot` e `VK_EXT_shader_subgroup_vote`

`VK_EXT_shader_subgroup_ballot` e `VK_EXT_shader_subgroup_vote` foram os esforços originais para expor *subgroups* no Vulkan. Se uma aplicação estiver usando Vulkan 1.1 ou superior, não há necessidade de usar essas extensões; em vez disso, deve-se usar a API principal (*core API*) para consultar o suporte a *subgroups*.
