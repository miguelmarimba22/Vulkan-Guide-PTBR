# Filas (*Queues*)

> **Nota:** Recursos adicionais sobre filas podem ser encontrados nos materiais da [AMD](https://gpuopen.com/learn/concurrent-execution-asynchronous-queues/) e da [NVIDIA](https://www.khronos.org/assets/uploads/developers/library/2016-vulkan-devday-uk/9-Asynchonous-compute.pdf).

Uma aplicação submete trabalho a uma `VkQueue`, normalmente na forma de objetos `VkCommandBuffer` ou vinculações esparsas (*sparse bindings* — consulte o capítulo sobre *Recursos Esparsos*).

Os *command buffers* submetidos a uma `VkQueue` iniciam em ordem, mas têm permissão para prosseguir de forma independente depois disso e concluir fora de ordem.

Os *command buffers* submetidos a filas diferentes não têm ordenação garantida entre si, a menos que você os sincronize explicitamente com um `VkSemaphore`.

Você só pode submeter trabalho a uma `VkQueue` a partir de uma única thread por vez, mas threads diferentes podem submeter trabalho a `VkQueue`s diferentes simultaneamente.

A forma como uma `VkQueue` é mapeada para o hardware subjacente é definida pela implementação. Algumas implementações possuem múltiplas filas em hardware, e submeter trabalho para múltiplas `VkQueue`s prosseguirá de maneira independente e concorrente. Outras implementações realizam o escalonamento em nível de driver de kernel antes de submeter o trabalho ao hardware. Atualmente não há nenhuma forma no Vulkan de expor os detalhes exatos de como cada `VkQueue` é mapeada.

> **Nota:** Nem todas as aplicações exigirão ou se beneficiarão de múltiplas filas. É perfeitamente razoável que uma aplicação tenha uma única fila gráfica "universal" para submeter todo o trabalho à GPU.

## Família de Filas (*Queue Family*)

Existem vários tipos de operações que uma `VkQueue` pode suportar. Uma "Família de Filas" (*Queue Family*) simplesmente descreve um conjunto de `VkQueue`s que possuem propriedades comuns e suportam a mesma funcionalidade, conforme anunciado em `VkQueueFamilyProperties`.

A seguir estão as operações de fila encontradas em [`VkQueueFlagBits`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkQueueFlagBits.html):

* `VK_QUEUE_GRAPHICS_BIT`: usada para `vkCmdDraw*` e comandos de pipeline gráfico.
* `VK_QUEUE_COMPUTE_BIT`: usada para `vkCmdDispatch*`, `vkCmdTraceRays*` e comandos relacionados a pipeline de computação.
* `VK_QUEUE_TRANSFER_BIT`: usada para todos os comandos de transferência.
  * [`VK_PIPELINE_STAGE_TRANSFER_BIT`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkPipelineStageFlagBits.html) na especificação descreve o que constitui "comandos de transferência".
  * Famílias de filas com apenas `VK_QUEUE_TRANSFER_BIT` geralmente servem para usar [DMA](https://en.wikipedia.org/wiki/Direct_memory_access) na transferência assíncrona de dados entre a memória do host e a do dispositivo em GPUs discretas, permitindo que as transferências ocorram concorrentemente com operações gráficas ou de computação independentes.
  * `VK_QUEUE_GRAPHICS_BIT` e `VK_QUEUE_COMPUTE_BIT` sempre aceitam implicitamente comandos de `VK_QUEUE_TRANSFER_BIT`.
* `VK_QUEUE_SPARSE_BINDING_BIT`: usada para vincular recursos esparsos (consulte o capítulo sobre *Recursos Esparsos*) à memória com `vkQueueBindSparse`.
* `VK_QUEUE_PROTECTED_BIT`: usada para memória protegida (consulte o capítulo sobre *Memória Protegida*).
* `VK_QUEUE_VIDEO_DECODE_BIT_KHR` e `VK_QUEUE_VIDEO_ENCODE_BIT_KHR`: usadas com [Vulkan Video](https://www.khronos.org/blog/an-introduction-to-vulkan-video?mc_cid=8052312abe&mc_eid=64241dfcfa).

### Descobrindo Qual Família de Filas é Necessária

Cada operação na especificação do Vulkan possui uma seção "Supported Queue Types" gerada a partir do arquivo [`vk.xml`](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/xml/vk.xml). A seguir estão 3 exemplos diferentes de como isso aparece na especificação:

![Tipos de fila suportados para vkCmdDraw](images/queues_cmd_draw.png)

![Tipos de fila suportados para vkCmdDispatch](images/queues_cmd_dispatch.png)

![Tipos de fila suportados para vkCmdExecuteCommands](images/queues_cmd_executecommands.png)

### Consultando a Família de Filas

A seguir está a lógica mais simples necessária caso uma aplicação precise apenas de uma única `VkQueue` gráfica:

```cpp
uint32_t count = 0;
vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, &count, nullptr);
std::vector<VkQueueFamilyProperties> properties(count);
vkGetPhysicalDeviceQueueFamilyProperties(physicalDevice, &count, properties.data());

// O Vulkan exige que uma implementação exponha pelo menos 1 família de filas com suporte gráfico
std::optional<uint32_t> graphicsQueueFamilyIndex;

for (uint32_t i = 0; i < count; ++i) {
    if ((properties[i].queueFlags & VK_QUEUE_GRAPHICS_BIT) != 0) {
        // Esta família de filas suporta gráficos
        graphicsQueueFamilyIndex = i;
        break;
    }
}
```

## Criando e Obtendo uma Fila

Diferentemente de outros handles como `VkDevice`, `VkBuffer` e `VkDeviceMemory`, **não** existe `vkCreateQueue` nem `vkAllocateQueue`. Em vez disso, o driver é responsável por criar e destruir os handles `VkQueue` durante `vkCreateDevice`/`vkDestroyDevice`.

Os exemplos a seguir usarão uma implementação hipotética que suporta 3 `VkQueue`s distribuídas em 2 Famílias de Filas:

![Implementação hipotética com 2 famílias de filas e 3 filas](images/queues_hypothetical.png)

A seguir está um exemplo de como criar todas as 3 `VkQueue`s junto com o dispositivo lógico:

```cpp
constexpr std::array<float, 1> transferPriorities = {1.0f};
constexpr std::array<float, 2> graphicsPriorities = {1.0f, 1.0f};

const std::array<VkDeviceQueueCreateInfo, 2> queueCreateInfos = {{
    {
        .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .pNext = nullptr,
        .queueFamilyIndex = 0, // Transferência
        .queueCount = static_cast<uint32_t>(transferPriorities.size()),
        .pQueuePriorities = transferPriorities.data(),
    },
    {
        .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .pNext = nullptr,
        .queueFamilyIndex = 1, // Gráficos
        .queueCount = static_cast<uint32_t>(graphicsPriorities.size()),
        .pQueuePriorities = graphicsPriorities.data(),
    },
}};

VkDeviceCreateInfo deviceCreateInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .queueCreateInfoCount = static_cast<uint32_t>(queueCreateInfos.size()),
    .pQueueCreateInfos = queueCreateInfos.data(),
};

vkCreateDevice(physicalDevice, &deviceCreateInfo, nullptr, &device);
```

Após criar o `VkDevice`, a aplicação pode usar `vkGetDeviceQueue` para obter os handles `VkQueue`:

```cpp
VkQueue graphicsQueue0 = VK_NULL_HANDLE;
VkQueue graphicsQueue1 = VK_NULL_HANDLE;
VkQueue transferQueue0 = VK_NULL_HANDLE;

// Podem ser obtidas em qualquer ordem
vkGetDeviceQueue(device, 0, 0, &transferQueue0); // família 0 - fila 0
vkGetDeviceQueue(device, 1, 1, &graphicsQueue1); // família 1 - fila 1
vkGetDeviceQueue(device, 1, 0, &graphicsQueue0); // família 1 - fila 0
```
