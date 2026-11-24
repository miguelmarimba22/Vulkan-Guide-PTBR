# VK_KHR_descriptor_update_template

> **Nota:** Promovida ao núcleo (*core*) no Vulkan 1.1.
>
> [Apresentação do Montreal Developer Day](https://www.khronos.org/assets/uploads/developers/library/2018-vulkan-devday/11-DescriptorUpdateTemplates.pdf)

Esta extensão foi projetada com base em como algumas aplicações criam e atualizam muitos `VkDescriptorSet`s durante a fase de inicialização. É muito comum que diversas atualizações acabem utilizando o mesmo `VkDescriptorSetLayout` e atualizando os mesmos *bindings*; portanto, os *descriptor update templates* (modelos de atualização de descritores) foram projetados para passar as informações de atualização apenas uma vez.

Os descritores em si não são especificados no `VkDescriptorUpdateTemplate`; em vez disso, são especificados deslocamentos (*offsets*) em relação a um ponteiro para memória do *host* fornecido pela aplicação, que são combinados com um ponteiro passado para `vkUpdateDescriptorSetWithTemplate` ou `vkCmdPushDescriptorSetWithTemplateKHR`. Isso permite que grandes lotes de atualizações sejam executados sem precisar converter as estruturas de dados da aplicação para uma estrutura de dados estritamente definida pelo Vulkan.
