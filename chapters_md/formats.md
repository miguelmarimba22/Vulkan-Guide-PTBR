# Formatos (*Formats*)

Os formatos do Vulkan são usados para descrever como a memória é organizada. Este capítulo tem como objetivo oferecer uma visão geral de alto nível das variações de formatos no Vulkan e algumas informações práticas sobre como utilizá-los. Todos os detalhes já estão bem especificados tanto no [capítulo de formatos da especificação do Vulkan](https://docs.vulkan.org/spec/latest/chapters/formats.html) quanto na [Especificação de Formato de Dados da Khronos (*Khronos Data Format Specification*)](https://registry.khronos.org/DataFormat/specs/1.3/dataformat.1.3.html).

O caso de uso mais comum para um `VkFormat` é na criação de uma `VkImage`. Como os `VkFormat` são bem definidos, eles também são usados para descrever o layout de memória de itens como um `VkBufferView`, atributos de entrada de vértices (consulte o capítulo sobre *Processamento de Dados de Entrada de Vértices*), [mapeamento de formatos de imagem SPIR-V](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-image-formats), criação de [geometria de triângulos em uma estrutura de aceleração de nível inferior (*bottom-level acceleration structure*)](https://registry.khronos.org/vulkan/specs/latest/man/html/VkAccelerationStructureGeometryTrianglesDataKHR.html), entre outros.

## Suporte a Recursos de Formato (*Feature Support*)

É importante entender que "suporte a formato" não é um único valor binário por formato; em vez disso, cada formato possui um conjunto de [`VkFormatFeatureFlagBits`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkFormatFeatureFlagBits.html) onde cada bit descreve quais funcionalidades são suportadas para aquele formato.

Os formatos suportados podem variar entre implementações, mas um [conjunto mínimo de recursos de formato é garantido](https://docs.vulkan.org/spec/latest/chapters/features.html#features-required-format-support). Uma aplicação pode [consultar](https://docs.vulkan.org/spec/latest/chapters/formats.html#formats-properties) as propriedades de formato suportadas.

> **Nota:** Tanto [`VK_KHR_get_physical_device_properties2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_get_physical_device_properties2.html) quanto [`VK_KHR_format_feature_flags2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_format_feature_flags2.html) expõem formas adicionais de consultar os recursos de formato.

### Exemplo de Consulta de Recursos de Formato

Neste exemplo, o código verificará se o formato `VK_FORMAT_R8_UNORM` suporta amostragem a partir de uma `VkImage` criada com `VK_IMAGE_TILING_LINEAR` em `VkImageCreateInfo::tiling`. Para isso, o código consulta as flags `linearTilingFeatures` de `VK_FORMAT_R8_UNORM` para verificar se `VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT` é suportado pela implementação.

```cpp
// Usando o núcleo do Vulkan 1.0
VkFormatProperties formatProperties{};
vkGetPhysicalDeviceFormatProperties(physicalDevice, VK_FORMAT_R8_UNORM, &formatProperties);
if ((formatProperties.linearTilingFeatures & VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT) != 0) {
    // suportado
} else {
    // não suportado
}
```

```cpp
// Usando o núcleo do Vulkan 1.1 ou VK_KHR_get_physical_device_properties2
VkFormatProperties2 formatProperties2{
    .sType = VK_STRUCTURE_TYPE_FORMAT_PROPERTIES_2,
    .pNext = nullptr, // usado para possíveis extensões
};

vkGetPhysicalDeviceFormatProperties2(physicalDevice, VK_FORMAT_R8_UNORM, &formatProperties2);
if ((formatProperties2.formatProperties.linearTilingFeatures & VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT) != 0) {
    // suportado
} else {
    // não suportado
}
```

```cpp
// Usando VK_KHR_format_feature_flags2
VkFormatProperties3KHR formatProperties3{
    .sType = VK_STRUCTURE_TYPE_FORMAT_PROPERTIES_3_KHR,
    .pNext = nullptr,
};

VkFormatProperties2 formatProperties2{
    .sType = VK_STRUCTURE_TYPE_FORMAT_PROPERTIES_2,
    .pNext = &formatProperties3,
};

vkGetPhysicalDeviceFormatProperties2(physicalDevice, VK_FORMAT_R8_UNORM, &formatProperties2);
if ((formatProperties3.linearTilingFeatures & VK_FORMAT_FEATURE_2_SAMPLED_IMAGE_BIT_KHR) != 0) {
    // suportado
} else {
    // não suportado
}
```

## Variações de Formatos

Os formatos existem em muitas variações, e a maioria pode ser agrupada pelo [nome do formato](https://docs.vulkan.org/spec/latest/chapters/formats.html#_identification_of_formats). Ao lidar com imagens, os valores de [`VkImageAspectFlagBits`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkImageAspectFlagBits.html) são usados para representar qual parte dos dados está sendo acessada em operações como limpezas (*clears*) e cópias (*copies*).

### Cor (*Color*)

Formatos com componente `R`, `G`, `B` ou `A`, acessados com `VK_IMAGE_ASPECT_COLOR_BIT`.

### Profundidade e Stencil (*Depth and Stencil*)

Formatos com componente `D` ou `S`. Esses formatos são [considerados opacos](https://docs.vulkan.org/spec/latest/chapters/formats.html#formats-depth-stencil) e possuem regras especiais quando se trata de [copiar de e para](https://docs.vulkan.org/spec/latest/chapters/copies.html#VkBufferImageCopy) imagens de profundidade/*stencil*.

Alguns formatos possuem tanto componente de profundidade quanto de *stencil* e podem ser acessados separadamente com `VK_IMAGE_ASPECT_DEPTH_BIT` e `VK_IMAGE_ASPECT_STENCIL_BIT`.

> **Nota:** [`VK_KHR_separate_depth_stencil_layouts`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_separate_depth_stencil_layouts.html) e [`VK_EXT_separate_stencil_usage`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_separate_stencil_usage.html), ambas promovidas ao Vulkan 1.2, podem ser usadas para obter um controle mais granular entre os componentes de profundidade e *stencil*.

Mais informações sobre formatos de profundidade também podem ser encontradas no capítulo sobre *Profundidade (Depth)*.

### Comprimidos (*Compressed*)

[Formatos de imagem comprimidos](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html) representam múltiplos pixels codificados de forma interdependente dentro de uma região.

**Formatos de Imagem Comprimidos no Vulkan**

| Formato | Como habilitar |
| --- | --- |
| [BC (Block-Compressed)](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html#appendix-compressedtex-bc) | `VkPhysicalDeviceFeatures::textureCompressionBC` |
| [ETC2 e EAC](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html#appendix-compressedtex-etc2) | `VkPhysicalDeviceFeatures::textureCompressionETC2` |
| [ASTC LDR](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html#appendix-compressedtex-astc) | `VkPhysicalDeviceFeatures::textureCompressionASTC_LDR` |
| [ASTC HDR](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html#appendix-compressedtex-astc) | [`VK_EXT_texture_compression_astc_hdr`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_texture_compression_astc_hdr.html) |
| [PVRTC](https://docs.vulkan.org/spec/latest/appendices/compressedtex.html#appendix-compressedtex-pvrtc) | [`VK_IMG_format_pvrtc`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_IMG_format_pvrtc.html) |

### Planares (*Planar*)

[`VK_KHR_sampler_ycbcr_conversion`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_sampler_ycbcr_conversion.html) e [`VK_EXT_ycbcr_2plane_444_formats`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_ycbcr_2plane_444_formats.html) adicionam formatos multiplanares ao Vulkan (consulte o capítulo sobre `VK_KHR_sampler_ycbcr_conversion`). Os planos podem ser acessados separadamente com `VK_IMAGE_ASPECT_PLANE_0_BIT`, `VK_IMAGE_ASPECT_PLANE_1_BIT` e `VK_IMAGE_ASPECT_PLANE_2_BIT`.

### Empacotados (*Packed*)

[Formatos empacotados](https://docs.vulkan.org/spec/latest/chapters/formats.html#formats-packed) existem para fins de alinhamento de endereço. Por exemplo, `VK_FORMAT_A8B8G8R8_UNORM_PACK32` e `VK_FORMAT_R8G8B8A8_UNORM` podem parecer muito semelhantes, mas ao usar a fórmula da [seção de Extração de Entrada de Vértices (*Vertex Input Extraction*) da especificação](https://docs.vulkan.org/spec/latest/chapters/fxvertex.html#fxvertex-input-extraction):

> `attribAddress = bufferBindingAddress + vertexOffset + attribDesc.offset;`

Para `VK_FORMAT_R8G8B8A8_UNORM`, o `attribAddress` precisa ser múltiplo do tamanho do componente (8 bits), enquanto para `VK_FORMAT_A8B8G8R8_UNORM_PACK32` ele precisa ser múltiplo do tamanho empacotado (32 bits).

### Externos (*External*)

Atualmente suportados apenas com a extensão `VK_ANDROID_external_memory_android_hardware_buffer`. Essa extensão permite que aplicações Android importem formatos externos definidos pela implementação para serem usados com `VkSamplerYcbcrConversion` (consulte o capítulo sobre `VK_KHR_sampler_ycbcr_conversion`). Existem muitas restrições sobre o que é permitido com esses formatos externos, todas [documentadas na especificação](https://docs.vulkan.org/spec/latest/chapters/memory.html#memory-external-android-hardware-buffer-external-formats).
