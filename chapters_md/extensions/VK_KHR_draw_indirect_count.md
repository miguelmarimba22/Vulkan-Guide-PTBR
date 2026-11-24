# VK_KHR_draw_indirect_count

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.2.

Cada chamada a `vkCmdDraw` consome um conjunto de parâmetros que descrevem a chamada de desenho (*draw call*). Para agrupar chamadas de desenho em lote, os mesmos parâmetros são armazenados em um `VkBuffer` em blocos de `VkDrawIndirectCommand`. O uso de `vkCmdDrawIndirect` permite invocar um número `drawCount` de desenhos, mas o valor de `drawCount` precisa ser conhecido no momento da gravação do *command buffer*. A nova chamada `vkCmdDrawIndirectCount` permite que o valor de `drawCount` também fique armazenado em um `VkBuffer`. Isso possibilita que o valor de `drawCount` seja dinâmico e decidido apenas quando a chamada de desenho for executada.

> **Nota:** As funções `vkCmdDrawIndirectCount` e `vkCmdDrawIndexedIndirectCount` podem ser utilizadas se a extensão for suportada ou se o bit de recurso `VkPhysicalDeviceVulkan12Features::drawIndirectCount` for `VK_TRUE`.

O diagrama a seguir ilustra a diferença entre `vkCmdDraw`, `vkCmdDrawIndirect` e `vkCmdDrawIndirectCount`.

![Exemplo de comparação entre vkCmdDraw, vkCmdDrawIndirect e vkCmdDrawIndirectCount](images/extensions/VK_KHR_draw_indirect_count_example.png)
