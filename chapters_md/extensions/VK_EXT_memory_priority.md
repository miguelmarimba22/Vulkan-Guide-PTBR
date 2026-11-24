# VK_EXT_memory_priority

O gerenciamento de memória é uma parte importante do Vulkan. A extensão `VK_EXT_memory_priority` foi projetada para permitir que uma aplicação evite que alocações importantes sejam movidas para uma memória mais lenta.

Esta extensão pode ser explicada com um exemplo de duas aplicações (a aplicação principal e outro processo na máquina *host*). Ao longo do tempo, ambas as aplicações tentam consumir a memória limitada do *heap* do dispositivo.

![Visão geral da disputa de memória de dispositivo entre aplicações](images/extensions/VK_EXT_memory_priority_overview.png)

Nessa situação, a alocação da aplicação principal ainda está presente, porém possivelmente em uma memória mais lenta (a implementação pode tê-la movido para uma memória *host-visible* até que seja necessária novamente).

A decisão de **qual** memória será movida é definida pela implementação. Imagine agora que este seja o uso de memória da aplicação principal:

![Uso de memória da aplicação principal com diferentes prioridades](images/extensions/VK_EXT_memory_priority_app.png)

Como podemos ver, havia certos blocos de memória que a aplicação considerava mais importantes para tentar manter sempre em memória rápida.

A extensão `VK_EXT_memory_priority` torna isso muito fácil. Ao alocar memória, a aplicação só precisa encadear `VkMemoryPriorityAllocateInfoEXT` em `VkMemoryAllocateInfo::pNext`. A partir daí, o campo `VkMemoryPriorityAllocateInfoEXT::priority` pode ser definido com um valor entre `0.0` e `1.0` (sendo `0.5` o padrão). Isso permite que a aplicação ajude a implementação a fazer uma escolha melhor caso a situação acima ocorra.

## Sugestões

- Certifique-se de que a extensão é suportada.
- Lembre-se de que isso é apenas uma **dica** (*hint*) para a implementação, e a aplicação ainda deve tentar gerenciar seu orçamento de memória adequadamente antes de recorrer a isso.
- Sempre meça gargalos de memória em vez de fazer suposições, sempre que possível.
- Qualquer memória que receba escritas tem grande chance de precisar de alta prioridade:
  - *Render targets* (por exemplo, *attachments* de saída de um *framebuffer*) geralmente são importantes para definir com prioridade alta.
- Encare memória de alta prioridade como aquela que possui "alta frequência de acesso" e "baixa tolerância à latência":
  - Por exemplo, *vertex buffers* — que permanecem estáveis ao longo de vários quadros, têm cada valor acessado apenas uma vez e normalmente toleram bem latência de acesso — costumam ser bons candidatos para prioridades mais baixas.
