# VK_KHR_extended_flags

A extensão `VK_KHR_extended_flags` é a consequência prática de uma API em constante crescimento que esbarra na realidade de que há apenas um número finito de bits disponíveis em um inteiro para máscaras de bits (*bitmasks*), enquanto novas extensões continuam exigindo novas flags.

Esta não é uma extensão chamativa, mas ela fornece o mecanismo fundamental que permite a outras extensões introduzirem novas flags.

## Ideia Central

Normalmente, ao criar uma `VkImage`, o código se parece com:

```cpp
VkImageCreateInfo create_info{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .flags = VK_IMAGE_CREATE_SPARSE_BINDING_BIT, // 0x00000001 (32 bits)
    // ...
    .usage = VK_IMAGE_USAGE_TRANSFER_DST_BIT,    // 0x00000002 (32 bits)
};
vkCreateImage(device, &create_info, nullptr, &image_handle);
```

Usando `VK_KHR_extended_flags`, agora é possível passar equivalentes de 64 bits dessas flags encadeando novas estruturas no ponteiro `pNext`:

```cpp
VkImageCreateFlags2CreateInfoKHR flags_ci{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_FLAGS_2_CREATE_INFO_KHR,
    .flags = VK_IMAGE_CREATE_2_SPARSE_BINDING_BIT_KHR, // 0x00000001ULL (64 bits)
};

VkImageUsageFlags2CreateInfoKHR usage_ci{
    .sType = VK_STRUCTURE_TYPE_IMAGE_USAGE_FLAGS_2_CREATE_INFO_KHR,
    .pNext = &flags_ci,
    .usage = VK_IMAGE_USAGE_2_TRANSFER_DST_BIT_KHR,    // 0x00000002ULL (64 bits)
};

VkImageCreateInfo create_info{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = &usage_ci,
    // ...
};
vkCreateImage(device, &create_info, nullptr, &image_handle);
```

## Quando 64 Bits Não São Suficientes

Inicialmente, `VK_KHR_format_feature_flags2` expandiu os recursos de formato (*format features*) de 32 para 64 bits (`VkFormatFeatureFlags2`). Com o tempo, até mesmo esses 64 bits foram esgotados. Isso levou à criação de `VkFormatFeatureFlags4KHR`, que fornece 64 bits *adicionais* de espaço.

Se você procurar por `VkFormatFeatureFlags3` na especificação, não a encontrará. Essa peculiaridade histórica aconteceu devido à forma como as estruturas de consulta evoluíram:

* **`VkFormatProperties`** usava `VkFormatFeatureFlags` (**máximo de 32 flags**).
* **`VkFormatProperties2`** introduziu o suporte à cadeia `pNext`, mas inicialmente ainda dependia das 32 flags originais.
* **`VkFormatProperties3`** foi introduzida por meio de uma extensão para expor o novo tipo de **64 bits** `VkFormatFeatureFlags2` (passada via cadeia `pNext` de `VkFormatProperties2`).
* **`VkFormatProperties4`** foi introduzida posteriormente para adicionar `VkFormatFeatureFlags4`, concedendo **64 bits extras** de espaço (também passada via `pNext`).

Como `VkFormatProperties3` pulou o uso de um tipo de flag "versão 3" e foi direto para `VkFormatFeatureFlags2`, a numeração das flags avançou para a "Versão 4" para corresponder à estrutura `VkFormatProperties4` à qual pertencem.
