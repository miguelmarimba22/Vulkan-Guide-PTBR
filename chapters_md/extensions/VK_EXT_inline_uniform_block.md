# VK_EXT_inline_uniform_block

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.

Em uma implementação comum, os *descriptors* são apenas uma tabela que aponta indiretamente para os dados vinculados a ela durante a gravação do *command buffer*. O problema é que nem todos os *descriptors* são iguais: por exemplo, um *descriptor* pode ter apenas alguns DWORDs de tamanho.

![Acesso a dados uniformes antes de VK_EXT_inline_uniform_block](images/extensions/VK_EXT_inline_uniform_block_before.png)

Usar `VK_EXT_inline_uniform_block` dá à implementação a oportunidade de reduzir o número de indireções necessárias para acessar valores uniformes quando apenas poucos valores são usados. Diferentemente de *push constants*, esses dados podem ser reutilizados em múltiplos conjuntos disjuntos de chamadas de desenho (*draws*) ou *dispatches*.

![Acesso a dados uniformes com VK_EXT_inline_uniform_block](images/extensions/VK_EXT_inline_uniform_block_after.png)

## Sugestões

- Certifique-se de verificar a struct `VkPhysicalDeviceInlineUniformBlockPropertiesEXT` para conhecer os limites de uso de *inline uniform blocks* da implementação.
- Não exagere no uso de *inlining*; caso contrário, o driver pode precisar reempacotar os dados em um *buffer*, adicionando sobrecarga de CPU e perdendo o benefício de eliminar a indireção — procure limitar-se a não mais do que alguns DWORDs.
