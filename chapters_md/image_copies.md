# Cópias de Imagens (*Image Copies*)

Esta é uma visão geral sobre como copiar dados para e a partir de um `VkImage` de vários formatos.

## Permutações de Cópia de Imagem

Existem 3 maneiras principais de copiar para/de um `VkImage`:

| Tipo de Cópia | Original (Vulkan 1.0) | `VK_KHR_copy_commands2` (Vulkan 1.3) - Adicionou o `pNext` ausente nas structs | `VK_EXT_host_image_copy` (Vulkan 1.4) - Permite cópias no host sem `VkBuffer` ou `VkCommandBuffer` |
| --- | --- | --- | --- |
| Buffer para Imagem | `vkCmdCopyBufferToImage` | `vkCmdCopyBufferToImage2` | `vkCopyMemoryToImage` |
| Imagem para Buffer | `vkCmdCopyImageToBuffer` | `vkCmdCopyImageToBuffer2` | `vkCopyImageToMemory` |
| Imagem para Imagem | `vkCmdCopyImage` | `vkCmdCopyImage2` | `vkCopyImageToImage` |

## Sub-recurso de Imagem (*Image Subresource*)

Ao copiar uma imagem, você precisará especificar um *image subresource* (sub-recurso de imagem), usado para descrever a parte da imagem que está sendo copiada.

Existem 3 structs usadas para descrever o sub-recurso de imagem:

- `VkImageSubresource` - única camada de *array* (*array layer*), único nível de mip (*mip level*)
- `VkImageSubresourceLayers` - múltiplas camadas de *array*, único nível de mip
- `VkImageSubresourceRange` - múltiplas camadas de *array*, múltiplos níveis de mip

### O Layout de Imagem é Opaco

O motivo pelo qual você precisa especificar um sub-recurso da imagem é que a imagem é um objeto opaco.
Ao criar uma imagem, a memória nem sempre estará compactada de forma contígua.
Ao lidar com a CPU, você normalmente pode assumir que uma imagem 2D ou 3D está organizada em um grande buffer 1D.
O hardware da GPU possui diversos requisitos de alinhamento de memória e ajusta a disposição da memória conforme necessário.

Enquanto buffers e memória da CPU são endereçados com um único *offset* linear, imagens são endereçadas em múltiplas dimensões (por exemplo, uma imagem 2D precisa de um *offset* `x` e `y`). Ao copiar dados para dentro ou fora de imagens, cada uma dessas dimensões deve ser especificada para descrever os dados que estão sendo copiados.

O exemplo pequeno a seguir mostra como duas GPUs podem representar o layout de um `VkImage` de formas diferentes:

![Comparação de layout entre buffer e imagem em duas GPUs](images/image_copies_buffer_vs_image.svg)

### Níveis de Mip (*Mip Levels*)

Quando você define `VkImageCreateInfo::mipLevels`, cria uma cadeia de mipmaps (*mipmap chain*).

![Cadeia de níveis de mip de uma imagem](images/image_copies_miplevels.svg)

### Camadas de Array (*Array Layers*)

Imagine que você quisesse 4 `VkImage` com exatamente o mesmo layout; provavelmente você representaria isso como `std::array<VkImage, 4> myImages`.
As camadas de *array* (*array layers*) são uma maneira de representar tudo isso em um único `VkImage`.

![Camadas de array em um único VkImage](images/image_copies_array_layers.svg)

### Máscara de Aspecto (*Aspect Mask*)

Ao lidar com algo como um formato de profundidade e estêncil (*depth-stencil*), a GPU pode precisar manter o aspecto de profundidade (*depth*) e o de estêncil (*stencil*) em layouts diferentes. Usar `VkImageAspectFlags` permite especificar qual parte copiar.

![Aspectos de profundidade e estêncil em uma imagem](images/image_copies_depth_stencil.svg)

## Cálculo de Endereçamento

Ao copiar entre um `VkBuffer`/`VkDeviceMemory` e um `VkImage`, os dados fora da imagem podem não estar compactados de forma contígua (*tightly packed*).

A struct `VkBufferImageCopy` (ou `VkMemoryToImageCopy`) fornece 3 campos para definir onde ler/escrever a memória no buffer:

- `bufferOffset` (onde começar)
- `bufferRowLength` (onde começa `extent.y`)
- `bufferImageHeight` (onde começa `extent.z`)

> **Nota:** Definir todos esses campos como zero significa que tudo está compactado de forma contígua (*tightly packed*) no `VkBuffer`/`VkDeviceMemory`.

A [fórmula de endereçamento da especificação](https://docs.vulkan.org/spec/latest/chapters/copies.html#copies-buffers-images) é bastante padrão; o único detalhe que pode causar confusão é que não há sobreposição de memória entre linhas.
No exemplo a seguir, se você tiver uma imagem `{4, 4, 1}`, o `rowExtent` é `max(bufferRowLength, imageExtent.width)`.

![Exemplo de bufferRowLength em cópias de imagem](images/image_copies_buffer_row_length.svg)

## Array 2D e 3D

Você pode realmente copiar entre um *array* de imagens 2D e uma única imagem 3D.

Considere os dois exemplos de `VkImage` a seguir:

```cpp
// VkImage "A" (array de imagens 2D)
VkImageCreateInfo imageInfoA{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    .imageType = VK_IMAGE_TYPE_2D,
    .extent = {.width = 8, .height = 8, .depth = 1},
    .arrayLayers = 8,
};

// VkImage "B" (imagem 3D)
VkImageCreateInfo imageInfoB{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    .imageType = VK_IMAGE_TYPE_3D,
    .extent = {.width = 8, .height = 8, .depth = 8},
    .arrayLayers = 1,
};
```

Você pode realizar uma cópia como esta:

```cpp
// Copiando a imagem B (3D) para a imagem A (array 2D)
VkImageCopy copy{
    // 3D
    .srcSubresource = {
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
    // Array 2D
    .dstSubresource = {
        .baseArrayLayer = 0,
        .layerCount = 8,
    },
    .extent = {.width = 8, .height = 8, .depth = 8},
};
```

onde `extent.depth` é `8`. A imagem 2D usa uma profundidade efetiva de `1`, e as fatias de profundidade da imagem 3D correspondem às camadas da imagem 2D; portanto, `extent.depth` deve ser igual ao `layerCount` do sub-recurso da imagem 2D.

### Diferença de Níveis de Mip (*MipLevel*)

Você pode estar se perguntando qual é a diferença entre uma imagem 3D e uma imagem 2D com camadas. Uma das principais diferenças são as cadeias de mipmaps que elas geram.

A cada nível de mip, `x`, `y` e `z` são reduzidos pela metade, enquanto o número de camadas (*layer count*) permanece inalterado.

Como exemplo, vamos tentar copiar o `miplevel 1`:

- A extensão (*extent*) da imagem 3D será `{4, 4, 4}`
- A extensão (*extent*) da imagem 2D será `{4, 4}`, mas ela ainda terá todas as `8` camadas

Isso significa que você precisa ter cuidado ao copiar entre as duas:

```cpp
// Copiando o miplevel 1 da imagem B para a imagem A
VkImageCopy copy{
    // 3D
    .srcSubresource = {
        .mipLevel = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
    // Array 2D
    .dstSubresource = {
        .mipLevel = 1,
        .baseArrayLayer = 0,
        .layerCount = 4, // deve ser igual a extent.depth
    },
    .extent = {.width = 4, .height = 4, .depth = 4}, // tamanho do miplevel 1 da imagem 3D
};
```

## Cópias de Imagens Comprimidas (*Compressed Image Copies*)

Lidar com imagens comprimidas pode ser um pouco complicado; o principal ponto inicial é entender a terminologia de `texel` versus `texel block` (bloco de texels).

![Terminologia de texel vs. bloco de texels em formatos comprimidos](images/image_copies_compressed_terminology.svg)

> **Nota:** Para formatos não comprimidos (ex.: `VK_FORMAT_R8G8B8A8_UNORM`), o `texel block` é `{1, 1, 1}`, portanto ele equivale a um `texel` ao utilizá-lo.

O tamanho do bloco, a extensão do bloco e outras informações podem ser encontrados na especificação, em `vk.xml` ou até mesmo em [vk_format_utils.h nas Vulkan-Utility-Libraries](https://github.com/KhronosGroup/Vulkan-Utility-Libraries/blob/main/include/vulkan/utility/vk_format_utils.h).

### Copiando Entre Comprimido e Não Comprimido

Copiar para e a partir de um `VkBuffer`/`VkDeviceMemory` é direto: o `extent` é simplesmente a quantidade de `texels`, sendo igual ao usado na criação da imagem.

![Cópia entre buffer e imagem comprimida](images/image_copies_compressed_buffer.svg)

A parte mais complicada é quando você lida com uma imagem não comprimida que tem uma extensão de bloco `{1, 1, 1}`. Você definirá `VkImageCopy::extent` para corresponder aos `texels` em `srcImage`, e `dstImage` será escalonada [conforme descrito na especificação](https://docs.vulkan.org/spec/latest/chapters/formats.html#formats-size-compatibility).

![Cópia de imagem não comprimida para imagem comprimida](images/image_copies_uncompress_to_compress.svg)

Algumas reações iniciais podem ser: "como você está copiando 8 texels em 2?!"

O principal ponto a perceber é que o "tamanho" de cada bloco de texels nos diagramas acima é de 64 bits. Se você tentar copiar blocos de tamanhos diferentes, receberá uma mensagem de erro de validação.

![Erro de incompatibilidade de tamanho de bloco](images/image_copies_mismatch_block_size.svg)

#### Aplicando Offset em Imagens Comprimidas

`extent`, `srcOffset` e `dstOffset` são todos definidos em termos de `texels`. O diagrama a seguir mostra como copiar um único texel em cada um dos 3 blocos de texels usando um *offset* diferente.

![Uso de dstOffset em imagem comprimida](images/image_copies_dst_offset.svg)

### Bloco de Texels Parcial (*Partial Texel Block*)

Ao usar uma imagem comprimida, é possível acabar com um bloco de texels parcialmente preenchido.

Isso pode ocorrer simplesmente ao definir uma extensão original que não é múltipla da extensão do bloco de texels:

![Imagem comprimida com dimensões não potência de dois](images/image_copies_non_power_of_two.svg)

Isso também pode ocorrer ao criar níveis de mip (*miplevels*):

![Níveis de mip em formato de bloco comprimido](images/image_copies_block_format_mip.svg)

E também pode ocorrer ao criar uma textura comprimida 1D:

![Textura comprimida 1D](images/image_copies_1d_compress.svg)

Em todos esses exemplos, é importante lembrar que você copia em termos de `texels` e não de `texel blocks`.

![Cópia de bloco de texels parcial](images/image_copy_partial_texel_block.svg)

## Multi-Planar

Formatos multi-planares (*multi-planar*) são aqueles com o sufixo `_2PLANE` ou `_3PLANE` (consulte a seção sobre a extensão `VK_KHR_sampler_ycbcr_conversion` para mais detalhes).

Ao copiar para e a partir dessas imagens, você não opera em todos os componentes do formato da imagem de uma só vez; em vez disso, opera de forma independente apenas nos planos de formato explicitamente escolhidos.

Usando `VK_FORMAT_G8_B8R8_2PLANE_420_UNORM` como exemplo, ele contém dois planos. A partir da [Tabela de Compatibilidade de Formatos de Plano](https://docs.vulkan.org/spec/latest/chapters/formats.html#formats-compatible-planes) na especificação (gerada a partir do `vk.xml`), podemos ver que:

- plano 0
  - formato compatível `VK_FORMAT_R8_UNORM`
  - divisor de largura igual a `1`
  - divisor de altura igual a `1`
- plano 1
  - formato compatível `VK_FORMAT_R8G8_UNORM`
  - divisor de largura igual a `2`
  - divisor de altura igual a `2`

Em código, isso fica assim:

```cpp
std::array<VkBufferImageCopy, 2> regions{{
    {
        .imageSubresource = {
            .aspectMask = VK_IMAGE_ASPECT_PLANE_0_BIT,
        },
        .imageExtent = {.width = width, .height = height, .depth = 1},
    },
    {
        .imageSubresource = {
            .aspectMask = VK_IMAGE_ASPECT_PLANE_1_BIT,
        },
        .imageExtent = {.width = width / 2, .height = height / 2, .depth = 1},
    },
}};
```

![Cópia de imagem multi-planar](images/image_copies_multi_planar.svg)

### YCbCr de Plano Único (*Single-Planar YCbCr*)

Existe outro caso extremo ao qual ficar atento! Formatos como `VK_FORMAT_G8B8G8R8_422_UNORM` podem ser complicados, pois tecnicamente não são comprimidos, mas também não são multi-planares (portanto você copia usando `VK_IMAGE_ASPECT_COLOR_BIT`).

A especificação dá uma dica de como lidar com eles em cópias:

> "[VK_FORMAT_G8B8G8R8_422_UNORM] Para fins das restrições sobre extensões de cópia (*copy extents*), este formato é tratado como um formato comprimido com um bloco de texels comprimido de 2×1."
