# Habilitando Extensões

Esta seção aborda os aspectos práticos para habilitar extensões no Vulkan.

## Dois Tipos de Extensões

Existem dois grupos de extensões: **extensões de instância** (*instance extensions*) e **extensões de dispositivo** (*device extensions*). De forma simples, as **extensões de instância** estão vinculadas a toda a `VkInstance`, enquanto as **extensões de dispositivo** estão vinculadas apenas a um único objeto `VkDevice`.

Essa informação está documentada na seção "Extension Type" da página de referência de cada extensão. Veja o exemplo abaixo:

![Exemplo da seção Extension Type indicando uma extensão de instância](images/enabling_extensions_instance_extension.png)

## Verificando o Suporte

Uma aplicação pode [consultar o dispositivo físico](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-extensions) primeiro para verificar se a extensão é **suportada**, utilizando `vkEnumerateInstanceExtensionProperties` ou `vkEnumerateDeviceExtensionProperties`.

```cpp
// Exemplo simples
uint32_t count = 0;
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &count, nullptr);
std::vector<VkExtensionProperties> extensions(count);
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &count, extensions.data());

// Verificando suporte para VK_KHR_bind_memory2
const bool isBindMemory2Supported = std::ranges::any_of(
    extensions,
    [](const VkExtensionProperties& ext) {
        return std::string_view{ext.extensionName} == VK_KHR_BIND_MEMORY_2_EXTENSION_NAME;
    }
);
```

## Habilitando a Extensão

Mesmo que a extensão seja **suportada** pela implementação, é **comportamento indefinido** (*undefined behavior*) utilizar a funcionalidade da extensão sem que ela seja **habilitada** no momento da criação da `VkInstance` ou do `VkDevice`.

Abaixo está um exemplo do que é necessário para habilitar uma extensão como `VK_KHR_driver_properties`.

![Exemplo de requisitos da extensão VK_KHR_driver_properties](images/enabling_extensions_driver_properties.png)

```cpp
// VK_KHR_get_physical_device_properties2 é necessária para usar VK_KHR_driver_properties.
// Como é uma extensão de instância, precisa ser habilitada antes, na criação da VkInstance.
std::vector<const char*> instanceExtensions = {
    VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME,
};

VkInstanceCreateInfo instanceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
    .pNext = nullptr,
    .enabledExtensionCount = static_cast<uint32_t>(instanceExtensions.size()),
    .ppEnabledExtensionNames = instanceExtensions.data(),
};
vkCreateInstance(&instanceCreateInfo, nullptr, &myInstance);

// ...

std::vector<const char*> deviceExtensions = {
    VK_KHR_DRIVER_PROPERTIES_EXTENSION_NAME,
};

VkDeviceCreateInfo deviceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .enabledExtensionCount = static_cast<uint32_t>(deviceExtensions.size()),
    .ppEnabledExtensionNames = deviceExtensions.data(),
};
vkCreateDevice(physicalDevice, &deviceCreateInfo, nullptr, &myDevice);
```

## Verificando os Bits de Recursos (*Feature Bits*)

É importante lembrar que as extensões adicionam a existência de funcionalidades à especificação do Vulkan, mas isso não significa que todos os recursos (*features*) de uma extensão estejam disponíveis mesmo quando a extensão é **suportada**. Um exemplo é a extensão `VK_KHR_8bit_storage`, que expõe 3 recursos em `VkPhysicalDevice8BitStorageFeatures`.

![Recursos expostos por VkPhysicalDevice8BitStorageFeatures](images/enabling_extensions_8bit.png)

Isso significa que, após habilitar a extensão, a aplicação ainda precisará consultar e habilitar os recursos necessários da extensão (consulte o capítulo sobre *Habilitando Recursos*).

## Processo de Promoção

Quando versões menores (*minor versions*) do Vulkan são lançadas (consulte o capítulo de *Resumo de Lançamentos do Vulkan*), algumas extensões são [promovidas conforme definido na especificação](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-promotion). O objetivo da promoção é incorporar ao núcleo (*core*) da especificação Vulkan funcionalidades estendidas que o Vulkan Working Group decidiu serem amplamente suportadas. Mais detalhes sobre versões do Vulkan podem ser encontrados no capítulo sobre *Versões do Vulkan*.

Um exemplo é `VK_KHR_get_physical_device_properties2`, que é usada pela maioria das outras extensões. No Vulkan 1.0, a aplicação precisa consultar se `VK_KHR_get_physical_device_properties2` é suportada antes de poder chamar uma função como `vkGetPhysicalDeviceFeatures2KHR`. A partir do Vulkan 1.1, a função `vkGetPhysicalDeviceFeatures2` tem suporte garantido.

Outra forma de observar a promoção é usando novamente `VK_KHR_8bit_storage` como exemplo. Desde o Vulkan 1.0, alguns recursos, como `textureCompressionASTC_LDR`, não têm suporte obrigatório, mas estão disponíveis para consulta sem a necessidade de habilitar nenhuma extensão. A partir do Vulkan 1.2, quando `VK_KHR_8bit_storage` foi promovida ao núcleo, todos os recursos de `VkPhysicalDevice8BitStorageFeatures` passaram a ser encontrados em `VkPhysicalDeviceVulkan12Features`.

### Mudança de Comportamento na Promoção

É importante perceber que existe uma diferença sutil para **algumas** extensões promovidas. [A especificação descreve](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-promotion) como a promoção **pode** envolver pequenas mudanças, como na divulgação ou habilitação de recursos ("*Feature advertisement/enablement*"). Para ilustrar melhor essa sutileza, `VK_KHR_8bit_storage` pode ser usada como estudo de caso.

A [especificação do Vulkan descreve a mudança](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_8bit_storage.html#_promotion_to_vulkan_1_2) de `VK_KHR_8bit_storage` no Vulkan 1.2 afirmando:

> Se a extensão `VK_KHR_8bit_storage` não for suportada, o suporte à capacidade SPIR-V `StorageBuffer8BitAccess` nos módulos de shader é opcional.

Aqui, "não for suportada" refere-se ao fato de que uma implementação pode suportar Vulkan 1.2+, mas, se uma aplicação consultar `vkEnumerateDeviceExtensionProperties`, é possível que `VK_KHR_8bit_storage` não esteja no resultado.

* Se `VK_KHR_8bit_storage` for encontrada em `vkEnumerateDeviceExtensionProperties`, então o recurso `storageBuffer8BitAccess` tem suporte **garantido**.
* Se `VK_KHR_8bit_storage` **não** for encontrada em `vkEnumerateDeviceExtensionProperties`, então o recurso `storageBuffer8BitAccess` **pode** ser suportado e pode ser verificado consultando `VkPhysicalDeviceVulkan12Features::storageBuffer8BitAccess`.

A lista de todas as alterações de recursos em extensões promovidas pode ser encontrada no [apêndice de versões da especificação](https://docs.vulkan.org/spec/latest/appendices/versions.html).
