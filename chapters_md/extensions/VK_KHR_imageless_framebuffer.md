# VK_KHR_imageless_framebuffer

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.2.

Ao criar um `VkFramebuffer`, normalmente é necessário passar os `VkImageView`s que serão utilizados em `VkFramebufferCreateInfo::pAttachments`. A exigência do `VkImageView` força a aplicação a criar um *framebuffer* para cada imagem da *swapchain*. Com `VK_KHR_imageless_framebuffer`, as informações de `VkImageView` são fornecidas no momento da chamada a `vkCmdBeginRenderPass`. Isso significa que é necessário apenas um único `VkFramebuffer` para todas as imagens da *swapchain*. É importante observar que, quando o tamanho da *swapchain* muda, o `VkFramebuffer` ainda precisará ser recriado para ajustar informações como `height` e `width`.

Para usar um `VkFramebuffer` sem imagens (*imageless*):

* Certifique-se de que a implementação ofereça suporte consultando `VkPhysicalDeviceImagelessFramebufferFeatures::imagelessFramebuffer` ou `VkPhysicalDeviceVulkan12Features::imagelessFramebuffer`.
* Defina `VK_FRAMEBUFFER_CREATE_IMAGELESS_BIT` em `VkFramebufferCreateInfo::flags`.
* Inclua uma estrutura `VkFramebufferAttachmentsCreateInfo` em `VkFramebufferCreateInfo::pNext`.
* Ao iniciar o *render pass*, passe uma estrutura `VkRenderPassAttachmentBeginInfo` em `VkRenderPassBeginInfo::pNext` contendo os anexos (*attachments*) compatíveis.

```cpp
// Preenche as informações sobre o anexo (attachment)
VkFramebufferAttachmentImageInfo attachments_image_info{
    .sType = VK_STRUCTURE_TYPE_FRAMEBUFFER_ATTACHMENT_IMAGE_INFO,
    // ...
};

VkFramebufferAttachmentsCreateInfo attachments_create_info{
    .sType = VK_STRUCTURE_TYPE_FRAMEBUFFER_ATTACHMENTS_CREATE_INFO,
    .attachmentImageInfoCount = 1,
    .pAttachmentImageInfos = &attachments_image_info,
};

// Cria o Framebuffer como imageless (sem imagens associadas previamente)
VkFramebufferCreateInfo framebuffer_info{
    .sType = VK_STRUCTURE_TYPE_FRAMEBUFFER_CREATE_INFO,
    .pNext = &attachments_create_info,
    .flags = VK_FRAMEBUFFER_CREATE_IMAGELESS_BIT,
    // ...
    .pAttachments = nullptr, // pAttachments agora é ignorado aqui
};

vkCreateFramebuffer(device, &framebuffer_info, nullptr, &framebuffer_object);

// ...

// Inicia a gravação de um command buffer
VkRenderPassAttachmentBeginInfo attachment_begin_info{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_ATTACHMENT_BEGIN_INFO,
    // attachment_begin_info.pAttachments contém os objetos VkImageView
};

VkRenderPassBeginInfo begin_info{
    .sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO,
    .pNext = &attachment_begin_info,
    // ...
};

vkCmdBeginRenderPass(command_buffer, &begin_info, VK_SUBPASS_CONTENTS_INLINE);
```
