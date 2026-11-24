# Memória e Sincronização Externas

Às vezes, nem tudo o que uma aplicação faz relacionado à GPU acontece dentro do Vulkan. Existem diversas situações em que a memória é escrita ou lida fora do escopo do Vulkan. Para suportar esses casos de uso, foi criado um conjunto de funções de memória e sincronização externas.

## Divisão das Extensões

Embora pareça haver muitas extensões `VK_KHR_external_*`, na prática elas apenas separam a lógica de maneira organizada.

## Memória vs. Sincronização

![Divisão entre extensões de memória externa e sincronização externa](images/extensions/external_extensions_2.png)

Existe um conjunto de extensões para lidar apenas com a importação/exportação da memória em si. O outro conjunto de extensões destina-se às primitivas de sincronização (`VkFence` e `VkSemaphore`) usadas para controlar comandos internos do Vulkan. É uma prática comum que, para cada bloco de memória importado/exportado, exista também uma *fence* ou *semaphore* correspondente para gerenciar o acesso à memória.

## Tipos de Handle

![Tipos de handles externos por plataforma](images/extensions/external_extensions_1.png)

Dependendo da plataforma, haverá um *handle* específico usado para a comunicação entre o Vulkan e a plataforma externa. Por exemplo, descritores de arquivo POSIX (`fd`) são usados na maioria das plataformas que não são Windows.

## Capacidades (Capabilities)

As extensões `VK_KHR_external_fence_capabilities`, `VK_KHR_external_semaphore_capabilities` e `VK_KHR_external_memory_capabilities` são simplesmente maneiras de consultar informações sobre qual suporte externo uma implementação fornece.

## Memória Externa

A extensão `VK_KHR_external_memory` tem como objetivo principal fornecer a enumeração `VkExternalMemoryHandleTypeFlagBits`, que descreve o tipo de memória sendo utilizado externamente.

Atualmente, existem 3 formas suportadas de importar/exportar memória:

- `VK_KHR_external_memory_fd` para memória em um descritor de arquivo POSIX (*file descriptor*)
- `VK_KHR_external_memory_win32` para memória em um *handle* do Windows
- `VK_ANDROID_external_memory_android_hardware_buffer` para memória em um `AHardwareBuffer`

Cada um desses métodos possui suas próprias descrições detalhadas sobre limitações, requisitos, propriedade (*ownership*), etc.

### Importando Memória

Para importar memória, existe uma struct `VkImport*Info` fornecida pela respectiva extensão de memória externa. Ela é encadeada em `vkAllocateMemory`, fazendo com que o Vulkan passe a ter um *handle* `VkDeviceMemory` mapeado para a memória importada.

```cpp
// Alguns tipos de memória externa exigem alocação dedicada
const VkMemoryDedicatedAllocateInfo dedicatedInfo{
    .sType = VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO,
    .pNext = nullptr,
    .image = VK_NULL_HANDLE,
    .buffer = buffer,
};

const VkImportMemoryFdInfoKHR importInfo{
    .sType = VK_STRUCTURE_TYPE_IMPORT_MEMORY_FD_INFO_KHR,
    .pNext = &dedicatedInfo,
    .handleType = VK_EXTERNAL_MEMORY_HANDLE_TYPE_OPAQUE_FD_BIT,
    .fd = fd,
};

const VkMemoryAllocateInfo allocateInfo{
    .sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
    .pNext = &importInfo,
    .allocationSize = allocationSize,
    .memoryTypeIndex = memoryTypeIndex,
};

VkDeviceMemory deviceMemory = VK_NULL_HANDLE;
vkAllocateMemory(device, &allocateInfo, nullptr, &deviceMemory);
```

### Exportando Memória

Para exportar memória, existe uma função `vkGetMemory*` fornecida pela respectiva extensão de memória externa. Essa função recebe um *handle* `VkDeviceMemory` e o mapeia para o objeto exposto pela extensão.

```cpp
const VkExportMemoryAllocateInfo exportInfo{
    .sType = VK_STRUCTURE_TYPE_EXPORT_MEMORY_ALLOCATE_INFO,
    .pNext = nullptr,
    .handleTypes = VK_EXTERNAL_MEMORY_HANDLE_TYPE_OPAQUE_FD_BIT,
};

const VkMemoryAllocateInfo allocateInfo{
    .sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
    .pNext = &exportInfo,
    .allocationSize = allocationSize,
    .memoryTypeIndex = memoryTypeIndex,
};

VkDeviceMemory deviceMemory = VK_NULL_HANDLE;
vkAllocateMemory(device, &allocateInfo, nullptr, &deviceMemory);

const VkMemoryGetFdInfoKHR getHandleInfo{
    .sType = VK_STRUCTURE_TYPE_MEMORY_GET_FD_INFO_KHR,
    .pNext = nullptr,
    .memory = deviceMemory,
    .handleType = VK_EXTERNAL_MEMORY_HANDLE_TYPE_OPAQUE_FD_BIT,
};

int fd = -1;
vkGetMemoryFdKHR(device, &getHandleInfo, &fd);
```

## Sincronização

A sincronização externa pode ser usada no Vulkan tanto para `VkFence` quanto para `VkSemaphore`. Quase não há diferença entre os dois no que diz respeito à forma como são importados e exportados.

As extensões `VK_KHR_external_fence` e `VK_KHR_external_semaphore` expõem, respectivamente, uma enumeração `Vk*ImportFlagBits` e uma struct `VkExport*CreateInfo` para descrever o tipo de sincronização que está sendo importado/exportado.

Atualmente, existem 2 formas suportadas de importar/exportar sincronização:

- `VK_KHR_external_fence_fd` / `VK_KHR_external_semaphore_fd`
- `VK_KHR_external_fence_win32` / `VK_KHR_external_semaphore_win32`

Cada extensão explica como gerencia a propriedade (*ownership*) das primitivas de sincronização.

### Importando e Exportando Primitivas de Sincronização

Há uma função `vkImport*` para importação e uma função `vkGet*` para exportação. Ambas recebem o *handle* `VkFence` ou `VkSemaphore` juntamente com o método da extensão para definir o objeto de sincronização externo.

## Fluxo de Trabalho de Exemplo

Abaixo está um diagrama simples que mostra a linha do tempo de eventos entre o Vulkan e outra API que também se comunica com a GPU. Ele representa um caso de uso comum para essas extensões de memória e sincronização externas.

![Fluxo de trabalho de exemplo entre Vulkan e outra API externa](images/extensions/external_example.png)
