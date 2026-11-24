# Memória Protegida (*Protected Memory*)

A memória protegida divide a memória do dispositivo em "memória de dispositivo protegida" (*protected device memory*) e "memória de dispositivo desprotegida" (*unprotected device memory*).

Em geral, a maioria dos sistemas operacionais não permite que uma aplicação acesse a memória de GPU de outra aplicação, a menos que ela seja explicitamente compartilhada (por exemplo, por meio de memória externa — consulte o capítulo sobre Recursos Externos). Um exemplo comum de uso de memória protegida é armazenar conteúdo DRM, que um processo pode ter permissão para modificar (por exemplo, para filtragem de imagem ou composição de controles de reprodução e legendas), mas não deve ser capaz de extrair para memória desprotegida. Os dados chegam criptografados e permanecem criptografados até atingirem os pixels no monitor.

A Especificação Vulkan [explica em detalhes](https://docs.vulkan.org/spec/latest/chapters/memory.html#memory-protected-memory) o que a "memória de dispositivo protegida" impõe. A seguir, apresentamos um detalhamento do que é necessário para habilitar corretamente uma submissão protegida usando memória protegida.

## Verificando o suporte

A memória protegida foi adicionada no Vulkan 1.1 e não havia nenhuma extensão anterior para ela. Isso significa que nenhum dispositivo Vulkan 1.0 será capaz de suportar memória protegida. Para verificar o suporte, uma aplicação deve consultar e habilitar (consulte o capítulo sobre Habilitação de Recursos) o campo `VkPhysicalDeviceProtectedMemoryFeatures::protectedMemory`.

## Queues protegidas

Uma *queue* protegida pode ler tanto memória protegida quanto desprotegida, mas só pode escrever em memória protegida. Se uma *queue* puder escrever em memória desprotegida, ela não poderá ler de memória protegida.

> **Nota:** Frequentemente, contadores de desempenho e outros sistemas de medição de tempo são desativados ou tornam-se menos precisos em *queues* protegidas para evitar ataques de canal lateral (*side-channel attacks*).

Usando `vkGetPhysicalDeviceQueueFamilyProperties` para obter os `VkQueueFlags` de cada *queue*, uma aplicação pode encontrar uma família de *queues* que exponha a flag `VK_QUEUE_PROTECTED_BIT`. Isso **não** significa que as *queues* daquela família sejam sempre protegidas, mas sim que elas **podem ser** criadas como *queues* protegidas.

Para informar ao driver que crie a `VkQueue` como protegida, é necessário passar `VK_DEVICE_QUEUE_CREATE_PROTECTED_BIT` em `VkDeviceQueueCreateInfo` durante a chamada a `vkCreateDevice`.

O pseudocódigo a seguir demonstra como uma aplicação pode solicitar a criação de 2 objetos `VkQueue` protegidos a partir da mesma família de *queues*:

```cpp
const std::array<VkDeviceQueueCreateInfo, 1> queueCreateInfos{{
    VkDeviceQueueCreateInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .pNext = nullptr,
        .flags = VK_DEVICE_QUEUE_CREATE_PROTECTED_BIT,
        .queueFamilyIndex = queueFamilyFound,
        .queueCount = 2, // assumindo que há 2 queues na família de queues
        .pQueuePriorities = queuePriorities.data(),
    },
}};

const VkDeviceCreateInfo deviceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .queueCreateInfoCount = static_cast<uint32_t>(queueCreateInfos.size()),
    .pQueueCreateInfos = queueCreateInfos.data(),
};

vkCreateDevice(physicalDevice, &deviceCreateInfo, nullptr, &deviceHandle);
```

Também é possível dividir as *queues* de uma família de modo que algumas sejam protegidas e outras não. O pseudocódigo a seguir mostra como uma aplicação pode solicitar a criação de 1 `VkQueue` protegida e 1 `VkQueue` desprotegida na mesma família de *queues*:

```cpp
const std::array<VkDeviceQueueCreateInfo, 2> queueCreateInfos{{
    VkDeviceQueueCreateInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .pNext = nullptr,
        .flags = VK_DEVICE_QUEUE_CREATE_PROTECTED_BIT,
        .queueFamilyIndex = queueFamilyFound,
        .queueCount = 1,
        .pQueuePriorities = &priority,
    },
    VkDeviceQueueCreateInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .pNext = nullptr,
        .flags = 0, // desprotegida porque a flag de proteção não está definida
        .queueFamilyIndex = queueFamilyFound,
        .queueCount = 1,
        .pQueuePriorities = &priority,
    },
}};

const VkDeviceCreateInfo deviceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .queueCreateInfoCount = static_cast<uint32_t>(queueCreateInfos.size()),
    .pQueueCreateInfos = queueCreateInfos.data(),
};

vkCreateDevice(physicalDevice, &deviceCreateInfo, nullptr, &deviceHandle);
```

Agora, em vez de usar `vkGetDeviceQueue`, a aplicação precisa usar `vkGetDeviceQueue2` para poder passar a flag `VK_DEVICE_QUEUE_CREATE_PROTECTED_BIT` ao obter o handle da `VkQueue`.

```cpp
const VkDeviceQueueInfo2 info{
    .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_INFO_2,
    .pNext = nullptr,
    .flags = VK_DEVICE_QUEUE_CREATE_PROTECTED_BIT,
    .queueFamilyIndex = queueFamilyFound,
    .queueIndex = 0,
};

vkGetDeviceQueue2(deviceHandle, &info, &protectedQueue);
```

## Recursos protegidos

Ao criar uma `VkImage` ou um `VkBuffer`, torná-los protegidos é tão simples quanto definir `VK_IMAGE_CREATE_PROTECTED_BIT` e `VK_BUFFER_CREATE_PROTECTED_BIT`, respectivamente.

Ao vincular memória ao recurso protegido, a `VkDeviceMemory` deve ter sido alocada a partir de um `VkMemoryType` que possua o bit `VK_MEMORY_PROPERTY_PROTECTED_BIT`.

## Swapchain protegida

Ao criar uma *swapchain*, o bit `VK_SWAPCHAIN_CREATE_PROTECTED_BIT_KHR` é utilizado para criar uma *swapchain* protegida.

Todas as `VkImage` obtidas por meio de `vkGetSwapchainImagesKHR` usando uma *swapchain* protegida comportam-se exatamente como se a imagem tivesse sido criada com `VK_IMAGE_CREATE_PROTECTED_BIT`.

Às vezes não se sabe previamente se as *swapchains* podem ser criadas com a flag `VK_SWAPCHAIN_CREATE_PROTECTED_BIT_KHR` definida. A extensão [VK_KHR_surface_protected_capabilities](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_surface_protected_capabilities.html) é exposta nas plataformas onde essa capacidade pode ser desconhecida.

## Command buffer protegido

Usando a `VkQueue` protegida, uma aplicação também pode utilizar `VK_COMMAND_POOL_CREATE_PROTECTED_BIT` ao criar um `VkCommandPool`:

```cpp
const VkCommandPoolCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO,
    .pNext = nullptr,
    .flags = VK_COMMAND_POOL_CREATE_PROTECTED_BIT,
    .queueFamilyIndex = queueFamilyFound, // família da queue protegida
};

vkCreateCommandPool(deviceHandle, &info, nullptr, &protectedCommandPool);
```

Todos os *command buffers* alocados a partir desse *command pool* protegido tornam-se "*command buffers* protegidos":

```cpp
const VkCommandBufferAllocateInfo info{
    .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO,
    .pNext = nullptr,
    .commandPool = protectedCommandPool,
    .level = VK_COMMAND_BUFFER_LEVEL_PRIMARY,
    .commandBufferCount = static_cast<uint32_t>(protectedCommandBuffers.size()),
};

vkAllocateCommandBuffers(deviceHandle, &info, protectedCommandBuffers.data());
```

## Submetendo trabalho protegido

Ao submeter trabalho para ser executado de forma protegida, todos os `VkCommandBuffer` submetidos também devem ser protegidos.

```cpp
const VkProtectedSubmitInfo protectedSubmitInfo{
    .sType = VK_STRUCTURE_TYPE_PROTECTED_SUBMIT_INFO,
    .pNext = nullptr,
    .protectedSubmit = VK_TRUE,
};

const VkSubmitInfo submitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
    .pNext = &protectedSubmitInfo,
    .commandBufferCount = static_cast<uint32_t>(protectedCommandBuffers.size()),
    .pCommandBuffers = protectedCommandBuffers.data(),
};

vkQueueSubmit(protectedQueue, 1, &submitInfo, fence);
```

Ou utilizando a extensão `VK_KHR_synchronization2` (consulte o capítulo sobre `VK_KHR_synchronization2`):

```cpp
const VkSubmitInfo2KHR submitInfo{
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2_KHR,
    .pNext = nullptr,
    .flags = VK_SUBMIT_PROTECTED_BIT_KHR,
};

vkQueueSubmit2KHR(protectedQueue, 1, &submitInfo, fence);
```
