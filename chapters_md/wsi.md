# Integração com o Sistema de Janelas (WSI)

Como a API Vulkan pode ser usada sem exibir resultados na tela, a Integração com o Sistema de Janelas (*Window System Integration* — WSI) é fornecida por meio de [extensões opcionais do Vulkan](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html). A maioria das implementações inclui suporte a WSI. O design do WSI foi criado para abstrair o mecanismo de janelas de cada plataforma da API principal (*core*) do Vulkan.

![Configuração do WSI](images/wsi_setup.png)

## Surface

O objeto `VkSurfaceKHR` é agnóstico à plataforma e foi projetado para que o restante da API Vulkan possa utilizá-lo em todas as operações de WSI. Ele é habilitado usando a extensão `VK_KHR_surface`.

Cada plataforma que oferece suporte a uma *surface* Vulkan tem sua própria forma de criar um objeto `VkSurfaceKHR` a partir de sua respectiva API específica de plataforma:

- Android — [vkCreateAndroidSurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateAndroidSurfaceKHR)
- DirectFB — [vkCreateDirectFBSurfaceEXT](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateDirectFBSurfaceEXT)
- Fuchsia — [vkCreateImagePipeSurfaceFUCHSIA](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateImagePipeSurfaceFUCHSIA)
- iOS — [vkCreateIOSSurfaceMVK](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateIOSSurfaceMVK)
- macOS — [vkCreateMacOSSurfaceMVK](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateMacOSSurfaceMVK)
- Metal — [vkCreateMetalSurfaceEXT](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateMetalSurfaceEXT)
- VI — [vkCreateViSurfaceNN](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateViSurfaceNN)
- Wayland — [vkCreateWaylandSurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateWaylandSurfaceKHR)
- QNX — [vkCreateScreenSurfaceQNX](https://registry.khronos.org/vulkan/specs/latest/man/html/vkCreateScreenSurfaceQNX.html)
- Windows — [vkCreateWin32SurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateWin32SurfaceKHR)
- XCB — [vkCreateXcbSurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateXcbSurfaceKHR)
- Xlib — [vkCreateXlibSurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateXlibSurfaceKHR)
- Direct-to-Display — [vkCreateDisplayPlaneSurfaceKHR](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkCreateDisplayPlaneSurfaceKHR)

Uma vez criada uma `VkSurfaceKHR`, existem diversas [capacidades (*capabilities*)](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkGetPhysicalDeviceSurfaceCapabilitiesKHR), [formatos (*formats*)](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkGetPhysicalDeviceSurfaceFormatsKHR) e [modos de apresentação (*presentation modes*)](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#vkGetPhysicalDeviceSurfacePresentModesKHR) disponíveis para consulta.

## Swapchain

O objeto `VkSwapchainKHR` fornece a capacidade de apresentar resultados de renderização em uma *surface* por meio de um array de objetos `VkImage`. Os diversos [modos de apresentação](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#VkPresentModeKHR) da *swapchain* determinam como o motor de apresentação (*presentation engine*) é implementado.

![Motor de apresentação WSI](images/wsi_engine.png)

O [exemplo e tutorial da Khronos](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/swapchain_images) explicam diferentes considerações a serem feitas ao criar uma *swapchain* e selecionar um modo de apresentação.

## Pré-Rotação (*Pre-Rotation*)

Dispositivos móveis podem ser rotacionados; portanto, a orientação lógica da janela da aplicação e a orientação física da tela podem não coincidir. As aplicações precisam ser capazes de operar em dois modos: `portrait` (retrato) e `landscape` (paisagem). A diferença entre esses dois modos pode ser simplificada como apenas uma mudança na resolução. No entanto, alguns subsistemas de exibição sempre trabalham na orientação "nativa" (ou "física") do painel da tela. Como o dispositivo foi rotacionado, para alcançar o efeito desejado a saída da aplicação também precisa ser rotacionada.

Para que sua aplicação aproveite ao máximo o Vulkan em plataformas móveis, como o Android, implementar pré-rotação é essencial. Há uma [postagem detalhada no blog do Google](https://android-developers.googleblog.com/2020/02/handling-device-orientation-efficiently.html?m=1) que aborda como lidar com a rotação da *surface* especificando a orientação durante a criação da *swapchain*, além de incluir um [exemplo independente](https://github.com/google/vulkan-pre-rotation-demo). O repositório [Vulkan-Samples](https://github.com/KhronosGroup/Vulkan-Samples) também conta com uma [excelente explicação técnica](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/surface_rotation) sobre por que a pré-rotação é um problema, bem como [um exemplo executável](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/surface_rotation) que mostra uma forma de resolvê-la no *shader*. Ao utilizar um dispositivo equipado com GPU Adreno, a Qualcomm sugere fazer uso da extensão [VK_QCOM_render_pass_transform](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_QCOM_render_pass_transform.html) para implementar a pré-rotação.
