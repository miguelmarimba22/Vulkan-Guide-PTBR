# Vulkan CTS

A *Vulkan Conformance Test Suite* (CTS) é um conjunto de testes usado para verificar a conformidade de uma implementação. Uma implementação em conformidade demonstra que passou com sucesso na CTS e que é uma implementação válida do Vulkan. Uma [lista de produtos em conformidade](https://www.khronos.org/conformance/adopters/conformant-products/vulkan) está disponível publicamente.

Qualquer empresa com uma implementação em conformidade pode usar livremente a especificação pública do Vulkan para criar um produto. Todas as implementações da API Vulkan devem ser testadas quanto à conformidade no [Programa de Adotantes Vulkan do Khronos (*Khronos Vulkan Adopter Program*)](https://www.khronos.org/adopters) antes que o nome ou o logotipo Vulkan possam ser usados em associação a uma implementação da API.

O [código-fonte da Vulkan CTS](https://github.com/KhronosGroup/VK-GL-CTS/tree/master/external/vulkancts) está disponível gratuitamente, e qualquer pessoa pode criar e adicionar um novo teste à Vulkan CTS, desde que siga a [Wiki de Contribuição](https://github.com/KhronosGroup/VK-GL-CTS/wiki/Contributing).

![Visão geral da Vulkan Conformance Test Suite (CTS)](images/vulkan_cts_overview.png)

Uma aplicação pode consultar a versão da CTS na qual uma implementação foi aprovada usando a propriedade [`VkConformanceVersion`](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#VkConformanceVersion) por meio da extensão `VK_KHR_driver_properties` (promovida para *core* no Vulkan 1.2).
