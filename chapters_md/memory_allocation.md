# Alocação de Memória

Gerenciar a memória do dispositivo (*device memory*) em Vulkan pode ser novidade para alguns desenvolvedores, sendo importante compreender alguns dos conceitos básicos.

Duas excelentes apresentações da Khronos sobre Gerenciamento de Memória em Vulkan, do [Vulkan Dev Day Montreal](https://www.khronos.org/assets/uploads/developers/library/2018-vulkan-devday/03-Memory.pdf) ([vídeo](https://www.youtube.com/watch?v=rXSdDE7NWmA)) e do [Vulkanised 2018](https://www.khronos.org/assets/uploads/developers/library/2018-vulkanised/03-Steven-Tovey-VulkanMemoryManagement_Vulkanised2018.pdf) ([vídeo](https://www.youtube.com/watch?v=zSG6dPq57P8)), são ótimas formas de aprender alguns dos principais conceitos.

Também vale destacar que gerenciar memória não é uma tarefa fácil e os desenvolvedores podem optar por utilizar bibliotecas como a [Vulkan Memory Allocator](https://github.com/GPUOpen-LibrariesAndSDKs/VulkanMemoryAllocator) para auxiliar nesse processo.

## Subalocação

A subalocação é considerada uma abordagem de primeira classe ao trabalhar com Vulkan. Também é importante saber que existe o limite [maxMemoryAllocationCount](https://docs.vulkan.org/spec/latest/chapters/limits.html#limits-maxMemoryAllocationCount), que impõe um teto para o número de alocações ativas simultaneamente que uma aplicação pode utilizar de uma só vez. Além disso, a alocação e desalocação de memória no nível do sistema operacional/driver tende a ser muito lenta, o que reforça a necessidade de subalocação. Uma aplicação Vulkan deve buscar criar alocações grandes e gerenciá-las por conta própria.

## Transferência

O enum [VkPhysicalDeviceType](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#VkPhysicalDeviceType) anuncia dois tipos principais de GPUs: discretas (dedicadas) e integradas — também conhecidas como UMA (*Unified Memory Architecture*, arquitetura de memória unificada). Compreender a diferença entre as duas é fundamental para o desempenho.

Placas gráficas discretas possuem sua própria memória dedicada no dispositivo. Os dados são transferidos através de um barramento (como o PCIe), o que geralmente representa um gargalo devido à limitação física de velocidade na transferência de dados. Alguns dispositivos físicos anunciam uma *queue* com `VK_QUEUE_TRANSFER_BIT`, permitindo o uso de uma *queue* dedicada para transferência de dados. A prática comum é criar um *staging buffer* para copiar os dados do *host* antes de enviá-los por meio de um *command buffer* para a memória local do dispositivo (*device local memory*).

Sistemas UMA compartilham a memória entre o dispositivo e o *host*, o que é anunciado pela combinação `VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT | VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT`. A desvantagem disso é que a memória do sistema precisa ser compartilhada com a GPU, exigindo cuidado com a pressão de memória. A principal vantagem é que não há necessidade de criar um *staging buffer*, reduzindo consideravelmente a sobrecarga de transferência.

![Diagrama comparando a transferência de memória em GPUs discretas e sistemas UMA](images/memory_allocation_transfer.png)

## Memória Alocada Preguiçosamente (*Lazily Allocated Memory*)

Em arquiteturas baseadas em *tiles* (*tile-based architectures*, praticamente todas as GPUs móveis), o tipo de memória `LAZILY_ALLOCATED_BIT` não é respaldado por memória física real. Ele pode ser usado para *attachments* que podem ser mantidos na memória de *tile*, como o *G-buffer* entre *subpasses*, o *depth buffer* ou imagens com *multisampling*. Isso economiza um custo significativo de largura de banda que seria gasto gravando a imagem de volta na memória principal. Você pode encontrar mais informações nos tutoriais da Khronos sobre [Render Passes](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/render_passes) e [Subpasses](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/subpasses).
