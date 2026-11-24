# VK_KHR_sampler_ycbcr_conversion

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.1.

Todos os exemplos abaixo utilizam um formato Y′C<sub>B</sub>C<sub>R</sub> multiplanar `4:2:0` para fins ilustrativos.

## Formatos Multiplanares

Para representar uma imagem Y′C<sub>B</sub>C<sub>R</sub> na qual os dados de Y′ (luminância / *luma*) são armazenados no plano 0, os dados de diferença de crominância azul C<sub>B</sub> ("U") são armazenados no plano 1 e os dados de diferença de crominância vermelha C<sub>R</sub> ("V") são armazenados no plano 2, uma aplicação utilizaria o formato `VK_FORMAT_G8_B8_R8_3PLANE_420_UNORM`.

A especificação do Vulkan descreve separadamente a representação de cada formato multiplanar e seu mapeamento para cada componente de cor. Como o mapeamento e a conversão de cores são separados do formato, o Vulkan utiliza notações de canais de cor "`RGB`" nos formatos, e a conversão descreve então o mapeamento desses canais para a entrada da conversão de cores.

Isso permite, por exemplo, que imagens `VK_FORMAT_B8G8R8_UNORM` representem *texels* Y′C<sub>B</sub>C<sub>R</sub>:

* `G` == `Y`
* `B` == `Cb`
* `R` == `Cr`

Isso pode exigir atenção extra ao mapear os componentes de *swizzle* entre `RGBA` e o formato Y′C<sub>B</sub>C<sub>R</sub>.

## Memória Disjunta (*Disjoint*)

Normalmente, quando uma aplicação cria uma `VkImage`, ela a vincula a apenas um único objeto `VkDeviceMemory`. Se a implementação suportar `VK_FORMAT_FEATURE_DISJOINT_BIT` para um determinado formato, a aplicação poderá vincular múltiplos objetos `VkDeviceMemory` disjuntos a uma única `VkImage`, onde cada `VkDeviceMemory` representa um único plano.

Operações de processamento de imagem em imagens Y′C<sub>B</sub>C<sub>R</sub> frequentemente tratam os canais separadamente — por exemplo, aplicando um filtro de nitidez (*sharpening*) ao canal de luminância ou reduzindo seletivamente o ruído da luminância. Separar os planos permite processá-los individualmente ou reutilizar dados de planos inalterados para diferentes imagens finais.

O uso de imagens disjuntas segue o mesmo padrão da vinculação normal de memória a uma imagem, utilizando algumas novas funções. A seguir, um pseudocódigo que representa o novo fluxo de trabalho:

```cpp
VkImagePlaneMemoryRequirementsInfo imagePlaneMemoryRequirementsInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_PLANE_MEMORY_REQUIREMENTS_INFO,
    .planeAspect = VK_IMAGE_ASPECT_PLANE_0_BIT,
};

VkImageMemoryRequirementsInfo2 imageMemoryRequirementsInfo2{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_REQUIREMENTS_INFO_2,
    .pNext = &imagePlaneMemoryRequirementsInfo,
    .image = myImage,
};

// Obtém os requisitos de memória para cada plano
VkMemoryRequirements2 memoryRequirements2{
    .sType = VK_STRUCTURE_TYPE_MEMORY_REQUIREMENTS_2,
};
vkGetImageMemoryRequirements2(device, &imageMemoryRequirementsInfo2, &memoryRequirements2);

// Aloca a memória do plano 0
VkMemoryAllocateInfo memoryAllocateInfo{
    .sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
    .allocationSize = memoryRequirements2.memoryRequirements.size,
};
vkAllocateMemory(device, &memoryAllocateInfo, nullptr, &disjointMemoryPlane0);

// Aloca da mesma forma para cada plano

// Vincula a memória do plano 0
VkBindImagePlaneMemoryInfo bindImagePlaneMemoryInfo0{
    .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_PLANE_MEMORY_INFO,
    .planeAspect = VK_IMAGE_ASPECT_PLANE_0_BIT,
};

VkBindImageMemoryInfo bindImageMemoryInfo{
    .sType = VK_STRUCTURE_TYPE_BIND_IMAGE_MEMORY_INFO,
    .pNext = &bindImagePlaneMemoryInfo0,
    .image = myImage,
    .memory = disjointMemoryPlane0,
};

// Vincula da mesma forma para cada plano

vkBindImageMemory2(
    device,
    static_cast<uint32_t>(bindImageMemoryInfos.size()),
    bindImageMemoryInfos.data());
```

## Copiando Memória para Cada Plano

Mesmo que a aplicação não esteja usando memória disjunta, ela ainda precisa usar `VK_IMAGE_ASPECT_PLANE_0_BIT` (e os demais planos correspondentes) ao copiar dados para cada plano.

Por exemplo, se uma aplicação planeja executar um `vkCmdCopyBufferToImage` para copiar os dados de um único `VkBuffer` para uma única `VkImage` não disjunta, a lógica para um layout `YUV420p` terá uma estrutura parecida com:

```cpp
std::array<VkBufferImageCopy, 3> bufferCopyRegions{};

bufferCopyRegions[0] = {
    .imageSubresource = {
        .aspectMask = VK_IMAGE_ASPECT_PLANE_0_BIT,
        // ...
    },
    .imageOffset = {0, 0, 0},
    .imageExtent = {myImage.width, myImage.height, 1},
};

// ...

// O componente Cb tem metade da altura e da largura
bufferCopyRegions[1] = {
    .imageSubresource = {
        .aspectMask = VK_IMAGE_ASPECT_PLANE_1_BIT,
        // ...
    },
    .imageOffset = {0, 0, 0},
    .imageExtent = {myImage.width / 2, myImage.height / 2, 1},
};

// ...

// O componente Cr tem metade da altura e da largura
bufferCopyRegions[2] = {
    .imageSubresource = {
        .aspectMask = VK_IMAGE_ASPECT_PLANE_2_BIT,
        // ...
    },
    .imageOffset = {0, 0, 0},
    .imageExtent = {myImage.width / 2, myImage.height / 2, 1},
};

vkCmdCopyBufferToImage(/* ... */);
```

Vale destacar aqui que `imageOffset` é zero porque sua base é o plano específico, e não a `VkImage` inteira. Portanto, ao usar `imageOffset`, certifique-se de começar a partir da base do plano correspondente, e não sempre do plano 0.

## VkSamplerYcbcrConversion

O objeto `VkSamplerYcbcrConversion` descreve todos os aspectos detalhados da conversão Y′C<sub>B</sub>C<sub>R</sub> (que estão fora do escopo de explicação deste guia) documentados na [Especificação de Formato de Dados da Khronos (*Khronos Data Format Specification*)](https://registry.khronos.org/DataFormat/specs/1.3/dataformat.1.3.html#_introduction_to_color_conversions). Os valores configurados aqui dependem dos dados Y′C<sub>B</sub>C<sub>R</sub> de entrada obtidos e de como realizar a conversão para o espaço de cores RGB.

A seguir, um pseudocódigo para dar uma ideia de como utilizá-lo do ponto de vista da API:

```cpp
// Cria o objeto de conversão que descreve como a implementação deve realizar a conversão Y'CbCr
VkSamplerYcbcrConversion samplerYcbcrConversion = VK_NULL_HANDLE;
VkSamplerYcbcrConversionCreateInfo samplerYcbcrConversionCreateInfo{
    .sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_CREATE_INFO,
    // ...
};
vkCreateSamplerYcbcrConversion(device, &samplerYcbcrConversionCreateInfo, nullptr, &samplerYcbcrConversion);

VkSamplerYcbcrConversionInfo samplerYcbcrConversionInfo{
    .sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_INFO,
    .conversion = samplerYcbcrConversion,
};

// Cria uma ImageView com a conversão
VkImageViewCreateInfo imageViewInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO,
    .pNext = &samplerYcbcrConversionInfo,
    // ...
};
vkCreateImageView(device, &imageViewInfo, nullptr, &myImageView);

// Cria um sampler com a conversão
VkSamplerCreateInfo samplerInfo{
    .sType = VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO,
    .pNext = &samplerYcbcrConversionInfo,
    // ...
};
vkCreateSampler(device, &samplerInfo, nullptr, &mySampler);
```

## combinedImageSamplerDescriptorCount

Um valor importante a monitorar é `combinedImageSamplerDescriptorCount`, que descreve quantos descritores uma implementação utiliza para cada formato multiplanar. Isso significa que, para `VK_FORMAT_G8_B8_R8_3PLANE_420_UNORM`, uma implementação pode usar 1, 2 ou 3 descritores para cada *combined image sampler* utilizado.

Todos os descritores em um *binding* utilizam o mesmo valor máximo de `combinedImageSamplerDescriptorCount` para permitir que as implementações usem um passo (*stride*) uniforme na indexação dinâmica dos descritores nesse *binding*.

Por exemplo, considere um *binding* de *descriptor set layout* com dois descritores e *samplers* imutáveis para formatos multiplanares que possuem valores de `VkSamplerYcbcrConversionImageFormatProperties::combinedImageSamplerDescriptorCount` iguais a `2` e `3`, respectivamente. Há dois descritores no *binding* e o valor máximo de `combinedImageSamplerDescriptorCount` é `3`; portanto, *descriptor sets* com esse layout consomem `6` descritores do *descriptor pool*. Para criar um *descriptor pool* que permita alocar `4` *descriptor sets* com esse layout, `descriptorCount` deve ser de pelo menos `24`.

Se a extensão `VK_KHR_maintenance6` estiver habilitada, é possível usar o valor `VkPhysicalDeviceMaintenance6Properties::maxCombinedImageSamplerDescriptorCount` para conhecer o valor máximo. Na prática, esse valor será `3`, mas pode ser `4` em alguns dispositivos que precisem lidar com formatos externos com componentes Alfa.

A seguir, um pseudocódigo de como consultar `combinedImageSamplerDescriptorCount`:

```cpp
VkSamplerYcbcrConversionImageFormatProperties samplerYcbcrConversionImageFormatProperties{
    .sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_IMAGE_FORMAT_PROPERTIES,
};

VkImageFormatProperties2 imageFormatProperties2{
    .sType = VK_STRUCTURE_TYPE_IMAGE_FORMAT_PROPERTIES_2,
    .pNext = &samplerYcbcrConversionImageFormatProperties,
};

VkPhysicalDeviceImageFormatInfo2 imageFormatInfo{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_IMAGE_FORMAT_INFO_2,
    .format = formatToQuery,
    // ...
};
vkGetPhysicalDeviceImageFormatProperties2(physicalDevice, &imageFormatInfo, &imageFormatProperties2);

std::cout << std::format(
    "combinedImageSamplerDescriptorCount = {}\n",
    samplerYcbcrConversionImageFormatProperties.combinedImageSamplerDescriptorCount);
```
