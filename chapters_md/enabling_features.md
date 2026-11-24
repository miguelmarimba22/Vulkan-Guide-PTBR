# Habilitando Recursos (*Features*)

Esta seção aborda os aspectos práticos para habilitar recursos (*features*) no Vulkan.

## Categorias de Recursos

Todos os recursos no Vulkan podem ser categorizados/encontrados em 3 grupos:

1. Recursos do Núcleo 1.0 (*Core 1.0 Features*)
   * São o conjunto de recursos disponíveis desde o lançamento inicial do Vulkan 1.0. A lista de recursos pode ser encontrada em [`VkPhysicalDeviceFeatures`](https://docs.vulkan.org/spec/latest/chapters/features.html#VkPhysicalDeviceFeatures).
2. Recursos de Versões Futuras do Núcleo (*Future Core Version Features*)
   * A partir do Vulkan 1.1+, novos recursos foram adicionados à versão principal do Vulkan. Para manter o tamanho de `VkPhysicalDeviceFeatures` compatível com versões anteriores, novas structs foram criadas para agrupar esses recursos:
   * [`VkPhysicalDeviceVulkan11Features`](https://docs.vulkan.org/spec/latest/chapters/features.html#VkPhysicalDeviceVulkan11Features)
   * [`VkPhysicalDeviceVulkan12Features`](https://docs.vulkan.org/spec/latest/chapters/features.html#VkPhysicalDeviceVulkan12Features)
   * [`VkPhysicalDeviceVulkan13Features`](https://docs.vulkan.org/spec/latest/chapters/features.html#VkPhysicalDeviceVulkan13Features)
   * [`VkPhysicalDeviceVulkan14Features`](https://docs.vulkan.org/spec/latest/chapters/features.html#VkPhysicalDeviceVulkan14Features)
3. Recursos de Extensões (*Extension Features*)
   * Algumas extensões contêm recursos para habilitar aspectos específicos da extensão. Eles são fáceis de identificar, pois seguem a nomenclatura `VkPhysicalDevice[NomeDaExtensao]Features`.

## Como Habilitar os Recursos

Todos os recursos devem ser habilitados no momento da criação do `VkDevice`, por meio da struct [`VkDeviceCreateInfo`](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#VkDeviceCreateInfo).

> **Nota:** Não se esqueça de consultar primeiro com `vkGetPhysicalDeviceFeatures` ou `vkGetPhysicalDeviceFeatures2`.

Para os recursos do Núcleo 1.0, basta definir `VkDeviceCreateInfo::pEnabledFeatures` com os recursos que você deseja ativar.

```cpp
VkPhysicalDeviceFeatures features{};
vkGetPhysicalDeviceFeatures(physicalDevice, &features);

// Lógica caso o recurso não seja suportado
if (features.robustBufferAccess == VK_FALSE) {
    // ...
}

VkDeviceCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .pEnabledFeatures = &features,
};
```

Para **todos os recursos**, incluindo os do Núcleo 1.0, utilize `VkPhysicalDeviceFeatures2` passando-o em `VkDeviceCreateInfo::pNext`:

```cpp
VkPhysicalDeviceShaderDrawParametersFeatures extFeature{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_SHADER_DRAW_PARAMETERS_FEATURES,
    .pNext = nullptr,
};

VkPhysicalDeviceFeatures2 physicalFeatures2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &extFeature,
};

vkGetPhysicalDeviceFeatures2(physicalDevice, &physicalFeatures2);

// Lógica caso o recurso não seja suportado
if (extFeature.shaderDrawParameters == VK_FALSE) {
    // ...
}

VkDeviceCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &physicalFeatures2,
};
```

O mesmo funciona para os "Recursos de Versões Futuras do Núcleo":

```cpp
VkPhysicalDeviceVulkan11Features features11{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_1_FEATURES,
    .pNext = nullptr,
};

VkPhysicalDeviceFeatures2 physicalFeatures2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &features11,
};

vkGetPhysicalDeviceFeatures2(physicalDevice, &physicalFeatures2);

// Lógica caso o recurso não seja suportado
if (features11.shaderDrawParameters == VK_FALSE) {
    // ...
}

VkDeviceCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &physicalFeatures2,
};
```
