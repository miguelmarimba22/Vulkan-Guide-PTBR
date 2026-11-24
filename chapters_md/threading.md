# Multithreading (*Threading*)

Uma das grandes diferenças entre Vulkan e OpenGL é que o Vulkan não se limita a um sistema de máquina de estados *single-threaded*. Antes de sair implementando *threads* em uma aplicação, é importante entender como o *multithreading* funciona em Vulkan.

A seção [Threading Behavior](https://docs.vulkan.org/spec/latest/chapters/fundamentals.html#fundamentals-threadingbehavior) da Especificação Vulkan explica em detalhes como as aplicações são responsáveis por gerenciar todos os elementos *sincronizados externamente* (*externally synchronized*) do Vulkan. É importante compreender que o *multithreading* em Vulkan oferece escalabilidade apenas no lado do *host*, já que qualquer operação que interaja com o dispositivo ainda precisa ser sincronizada corretamente (consulte o capítulo sobre Sincronização).

As implementações Vulkan não devem introduzir *multithreading* interno; portanto, se uma aplicação deseja obter desempenho em múltiplos núcleos de CPU, ela própria é responsável por gerenciar as *threads*.

## Command Pools

Os [Command Pools](https://docs.vulkan.org/spec/latest/chapters/cmdbuffers.html#commandbuffers-pools) constituem um sistema que permite gravar *command buffers* em múltiplas *threads*. Um único *command pool* deve ser *sincronizado externamente*; ele não deve ser acessado simultaneamente por múltiplas *threads*. Ao utilizar um *command pool* separado em cada *thread* do *host*, a aplicação pode criar múltiplos *command buffers* em paralelo sem a necessidade de bloqueios (*locks*) custosos.

A ideia é que os *command buffers* possam ser gravados em várias *threads*, enquanto uma *thread* relativamente leve fica responsável pelas submissões.

![Diagrama de gravação paralela de command buffers em múltiplas threads](images/threading_command_buffers.png)

O [exemplo e tutorial](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/command_buffer_usage) da Khronos mostram com mais detalhes como gravar *command buffers* em paralelo.

## Descriptor Pools

Os [Descriptor Pools](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#VkDescriptorPool) são utilizados para alocar, liberar, redefinir (*reset*) e atualizar *descriptor sets*. Ao criar múltiplos *descriptor pools*, cada *thread* do *host* na aplicação consegue gerenciar um *descriptor set* em seu próprio *descriptor pool* simultaneamente.
