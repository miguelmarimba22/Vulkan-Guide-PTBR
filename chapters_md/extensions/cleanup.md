# Extensões de Limpeza (Cleanup Extensions)

> **Nota:** Estas são extensões informalmente chamadas de "extensões de limpeza" (*cleanup extensions*). O Vulkan Guide as define assim por sua natureza de adicionar apenas uma pequena quantidade de funcionalidade ou por serem extensões muito simples e autoexplicativas quanto ao seu propósito.

## VK_KHR_driver_properties

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão adiciona mais informações que podem ser consultadas sobre cada implementação. O campo [`VkDriverId`](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#VkDriverId) fornece um identificador registrado do fabricante para a implementação. O campo [`VkConformanceVersion`](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#VkConformanceVersion) exibe qual versão da *Vulkan Conformance Test Suite* (consulte o capítulo sobre a Vulkan CTS) a implementação aprovou.

## VK_EXT_host_query_reset

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão permite que uma aplicação chame `vkResetQueryPool` a partir do *host*, em vez de precisar configurar lógica para submeter `vkCmdResetQueryPool`, já que na maioria das implementações isso é basicamente apenas uma escrita rápida em memória.

## VK_KHR_separate_depth_stencil_layouts

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão permite que uma aplicação, ao usar um formato de profundidade/estêncil (*depth/stencil*), realize a transição de layout de imagem separadamente para a profundidade e para o estêncil. A partir do Vulkan 1.2, essa funcionalidade é obrigatória para todas as implementações.

## VK_KHR_depth_stencil_resolve

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão adiciona suporte para resolver automaticamente *attachments* de profundidade/estêncil com *multisampling* em uma *subpass*, de forma semelhante aos *attachments* de cor.

Para mais informações, confira a apresentação da GDC ([slides](https://www.khronos.org/assets/uploads/developers/presentations/Vulkan-Depth-Stencil-Resolve-GDC-Mar19.pdf) e [vídeo](https://www.youtube.com/watch?v=GnnEmJFFC7Q&t=1980s)).

## VK_EXT_separate_stencil_usage

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Existem formatos que expressam tanto o uso de profundidade quanto o de estêncil, mas não havia uma forma de especificar usos diferentes para cada um deles. A estrutura `VkImageStencilUsageCreateInfo` agora permite que uma aplicação passe um `VkImageUsageFlags` separado para o uso de estêncil de uma imagem. O uso de profundidade continua sendo o uso original passado em `VkImageCreateInfo::usage` e, sem o uso de `VkImageStencilUsageCreateInfo`, o uso de estêncil também será idêntico a ele.

Um bom caso de uso para isso é em conjunto com a extensão `VK_KHR_image_format_list` (consulte o capítulo sobre `VK_KHR_image_format_list`). Isso fornece à aplicação uma maneira de descrever mais explicitamente as possíveis *image views* de sua `VkImage` no momento da criação, permitindo que algumas implementações realizem otimizações específicas dependendo dos usos definidos.

## VK_KHR_dedicated_allocation

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.1.

Normalmente, as aplicações alocam grandes blocos de `VkDeviceMemory` e depois fazem subalocações para diversos *buffers* e imagens. Há momentos em que pode ser melhor ter uma alocação dedicada para uma `VkImage` ou um `VkBuffer`. Uma aplicação pode encadear `VkMemoryDedicatedRequirements` em `vkGetBufferMemoryRequirements2` ou `vkGetImageMemoryRequirements2` para descobrir se uma alocação dedicada é preferível ou obrigatória. Ao lidar com memória externa, frequentemente será exigida uma alocação dedicada.

## VK_EXT_sampler_filter_minmax

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Por padrão, *samplers* Vulkan que utilizam filtragem linear retornam um valor de texel filtrado produzido pelo cálculo de uma média ponderada de uma coleção de texels na vizinhança da coordenada de textura fornecida. Esta extensão fornece um novo parâmetro de *sampler* que permite às aplicações produzir um valor de texel filtrado calculando o mínimo (`VK_SAMPLER_REDUCTION_MODE_MIN`) ou o máximo (`VK_SAMPLER_REDUCTION_MODE_MAX`) componente a componente dos texels que normalmente seriam calculados na média. Isso é semelhante à extensão [GL EXT_texture_filter_minmax](https://registry.khronos.org/OpenGL/extensions/EXT/EXT_texture_filter_minmax.txt).

## VK_KHR_sampler_mirror_clamp_to_edge

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão adiciona um novo modo de endereçamento de *sampler* (`VK_SAMPLER_ADDRESS_MODE_MIRROR_CLAMP_TO_EDGE`) que efetivamente utiliza um mapa de textura duas vezes maior que a imagem original, no qual a metade adicional da nova imagem é uma imagem espelhada da imagem original. Esse novo modo elimina a necessidade de gerar imagens cujas bordas opostas coincidam, usando a imagem original para gerar uma "imagem espelhada" correspondente. Esse modo permite que a textura seja espelhada apenas uma vez nas direções negativas `s`, `t` e `r`.

## VK_EXT_4444_formats e VK_EXT_ycbcr_2plane_444_formats

> **Nota:** Promovidas para o núcleo (*core*) no Vulkan 1.3.

Estas extensões adicionam novos valores de `VkFormat` que não estavam originalmente na especificação.

## VK_KHR_format_feature_flags2

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.

Esta extensão adiciona um novo tipo de *flag* de recurso de formato de 64 bits, `VkFormatFeatureFlagBits2KHR`, para estender o `VkFormatFeatureFlagBits` existente, que é limitado a 31 *flags*.

## VK_EXT_rgba10x6_formats

Esta extensão adiciona uma exceção para `VK_FORMAT_R10X6G10X6B10X6A10X6_UNORM_4PACK16` nas [camadas de validação (*validation layers*)](https://github.com/KhronosGroup/Vulkan-ValidationLayers/pull/3397) para permitir renderizar nesse formato.

## Extensões de Manutenção (Maintenance Extensions)

As extensões de manutenção adicionam uma coleção de pequenos recursos que foram deixados de fora intencionalmente ou passaram despercebidos na versão original do Vulkan 1.0.

Atualmente, existem 11 extensões de manutenção. As 3 primeiras foram incorporadas ao núcleo no Vulkan 1.1. Todos os detalhes de cada uma estão bem definidos na página de apêndice de extensões:

- [VK_KHR_maintenance1](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance1.html) — núcleo no Vulkan 1.1
- [VK_KHR_maintenance2](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance2.html) — núcleo no Vulkan 1.1
- [VK_KHR_maintenance3](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance3.html) — núcleo no Vulkan 1.1
- [VK_KHR_maintenance4](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance4.html) — núcleo no Vulkan 1.3
- [VK_KHR_maintenance5](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance5.html) — núcleo no Vulkan 1.4
- [VK_KHR_maintenance6](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance6.html) — núcleo no Vulkan 1.4
- [VK_KHR_maintenance7](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance7.html) — apenas extensão
- [VK_KHR_maintenance8](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance8.html) — apenas extensão
- [VK_KHR_maintenance9](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance9.html) — apenas extensão
- [VK_KHR_maintenance10](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance10.html) — apenas extensão
- [VK_KHR_maintenance11](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance11.html) — apenas extensão

## Expansões de pNext

Em algumas ocasiões, o *Vulkan Working Group* percebeu que certas structs na especificação original do Vulkan 1.0 não podiam ser estendidas adequadamente por não possuírem os campos `sType`/`pNext`.

Manter a compatibilidade retroativa entre versões é muito importante, então a melhor solução foi criar uma extensão para corrigir a omissão. Essas extensões introduzem principalmente novas structs, mas também precisam criar novos pontos de entrada de função para utilizá-las.

A lista atual de extensões que se encaixam nesta categoria é:

- `VK_KHR_get_memory_requirements2`
  - Adicionada ao núcleo no Vulkan 1.1
- `VK_KHR_get_physical_device_properties2`
  - Adicionada ao núcleo no Vulkan 1.1
- `VK_KHR_bind_memory2`
  - Adicionada ao núcleo no Vulkan 1.1
- `VK_KHR_create_renderpass2`
  - Adicionada ao núcleo no Vulkan 1.2
- `VK_KHR_copy_commands2`
  - Adicionada ao núcleo no Vulkan 1.3

Todas elas são extensões muito simples e foram promovidas para o núcleo em suas respectivas versões para facilitar o uso sem a necessidade de consultar suporte.

> **Nota:** `VK_KHR_get_physical_device_properties2` possui funcionalidade adicional, pois permite consultar suporte a recursos (*features*) de extensões e de versões mais recentes do Vulkan. Por isso, tornou-se um requisito para a maioria das outras extensões Vulkan.

### Exemplo

Usando `VK_KHR_bind_memory2` como exemplo, em vez de usar a função padrão `vkBindImageMemory`:

```cpp
// std::array<VkImage, 3> images;
// std::array<VkDeviceMemory, 2> memories;

vkBindImageMemory(myDevice, images[0], memories[0], 0);
vkBindImageMemory(myDevice, images[1], memories[0], 64);
vkBindImageMemory(myDevice, images[2], memories[1], 0);
```

Elas agora podem ser agrupadas em lote (*batched*):

```cpp
// std::array<VkImage, 3> images;
// std::array<VkDeviceMemory, 2> memories;

const std::array<VkBindImageMemoryInfo, 3> infos{{
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = nullptr,
        .image = images[0],
        .memory = memories[0],
        .memoryOffset = 0,
    },
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = nullptr,
        .image = images[1],
        .memory = memories[0],
        .memoryOffset = 64,
    },
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = nullptr,
        .image = images[2],
        .memory = memories[1],
        .memoryOffset = 0,
    },
}};

vkBindImageMemory2(myDevice, static_cast<uint32_t>(infos.size()), infos.data());
```

Algumas extensões, como `VK_KHR_sampler_ycbcr_conversion`, expõem structs que podem ser passadas na cadeia `pNext`:

```cpp
std::array<VkBindImagePlaneMemoryInfo, 2> planeInfo{{
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_PLANE_MEMORY_INFO,
        .pNext = nullptr,
        .planeAspect = VK_IMAGE_ASPECT_PLANE_0_BIT,
    },
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_PLANE_MEMORY_INFO,
        .pNext = nullptr,
        .planeAspect = VK_IMAGE_ASPECT_PLANE_1_BIT,
    },
}};

// Agora é possível passar structs de outras extensões no pNext, ausente em vkBindImageMemory()
const std::array<VkBindImageMemoryInfo, 2> infos{{
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = &planeInfo[0],
        .image = image,
        .memory = memories[0],
        .memoryOffset = 0,
    },
    {
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = &planeInfo[1],
        .image = image,
        .memory = memories[1],
        .memoryOffset = 0,
    },
}};

vkBindImageMemory2(myDevice, static_cast<uint32_t>(infos.size()), infos.data());
```

### Não há problema em não utilizá-las

A menos que uma aplicação precise usar uma das extensões que dependem das extensões acima, normalmente não há problema em continuar usando as funções e structs originais.

Uma forma possível de lidar com isso em ferramentas ou implementações é a seguinte:

```cpp
void handleVkBindImageMemoryInfo(const VkBindImageMemoryInfo& info) {
    // ...
}

//
// Pontos de entrada na ferramenta/implementação
//
void vkBindImageMemory(VkDevice device,
                       VkImage image,
                       VkDeviceMemory memory,
                       VkDeviceSize memoryOffset) {
    // A chamada original não possui pNext nem sType
    const VkBindImageMemoryInfo info{
        .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
        .pNext = nullptr,
        // Preenche o restante da struct da mesma forma
        .image = image,
        .memory = memory,
        .memoryOffset = memoryOffset,
    };

    handleVkBindImageMemoryInfo(info);
}

void vkBindImageMemory2(VkDevice device,
                        uint32_t bindInfoCount,
                        const VkBindImageMemoryInfo* pBindInfos) {
    for (const auto& info : std::span{pBindInfos, bindInfoCount}) {
        handleVkBindImageMemoryInfo(info);
    }
}
```
