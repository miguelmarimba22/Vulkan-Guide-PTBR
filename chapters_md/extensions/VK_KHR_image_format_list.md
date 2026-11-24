# VK_KHR_image_format_list

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.2.

Em algumas implementações, definir a flag `VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT` na criação de uma `VkImage` pode fazer com que o acesso a essa `VkImage` tenha desempenho inferior ao de uma `VkImage` equivalente criada sem `VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT`, pois a implementação não sabe com quais formatos de `VkImageView` a `VkImage` será pareada. Isso pode forçar a implementação a desativar otimizações específicas de formato (da `VkImageView`), como compressão de imagem sem perdas (*lossless image compression*). Se a estrutura `VkImageFormatListCreateInfo` for usada para listar explicitamente os formatos de `VkImageView` com os quais a `VkImage` pode ser pareada, a implementação poderá habilitar otimizações específicas de formato em mais casos.

Se a aplicação não estiver utilizando `VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT` ao criar imagens, não há necessidade de se preocupar com esta extensão.
