# O que o Vulkan pode fazer

O Vulkan pode ser usado para desenvolver aplicações para diversos casos de uso. Embora uma aplicação Vulkan possa optar por utilizar apenas um subconjunto das funcionalidades descritas abaixo, ele foi projetado para que um desenvolvedor possa utilizar todas elas em uma única API.

> **Nota:** É importante entender que o Vulkan é uma caixa de ferramentas e existem várias maneiras de realizar uma mesma tarefa.

## Gráficos

Gráficos 2D e 3D são o principal propósito para o qual a API Vulkan foi projetada. O Vulkan foi criado para permitir que desenvolvedores desenvolvam aplicações gráficas aceleradas por hardware.

> **Nota:** Todas as implementações Vulkan são obrigadas a suportar gráficos, mas o sistema WSI (*Window System Integration* — consulte o capítulo sobre WSI) não é obrigatório.

## Computação (*Compute*)

Devido à natureza paralela das GPUs, um estilo de programação conhecido como [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) pode ser utilizado para explorar a GPU em tarefas computacionais. O Vulkan suporta variações voltadas para computação de `VkQueue`, `VkPipeline` e outros objetos, permitindo que o Vulkan seja utilizado para computação de propósito geral.

> **Nota:** Todas as implementações Vulkan são obrigadas a suportar computação (*Compute*).

## Ray Tracing

*Ray tracing* é uma técnica alternativa de renderização baseada no conceito de simular o comportamento físico da luz.

O suporte de API independente de fabricante (*cross-vendor*) para *ray tracing* foi adicionado ao Vulkan como um conjunto de extensões na especificação 1.2.162.
Essas extensões são principalmente [`VK_KHR_ray_tracing_pipeline`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_ray_tracing_pipeline.html), [`VK_KHR_ray_query`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_ray_query.html) e [`VK_KHR_acceleration_structure`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_acceleration_structure.html).

> **Nota:** Existe também uma [extensão de fabricante da NVIDIA](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_NV_ray_tracing.html) mais antiga que expõe uma implementação de *ray tracing* no Vulkan. Essa extensão precedeu as extensões *cross-vendor*. Para novos desenvolvimentos, recomenda-se que as aplicações deem preferência às extensões KHR mais recentes.

## Vídeo

Com as [extensões Vulkan Video](https://www.khronos.org/blog/khronos-finalizes-vulkan-video-extensions-for-accelerated-h.264-and-h.265-decode), desenvolvedores podem usar decodificação de vídeo acelerada por hardware em tempo real. Essa funcionalidade é exposta por meio das extensões [`VK_KHR_video_queue`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_video_queue.html), [`VK_KHR_video_decode_queue`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_video_decode_queue.html), [`VK_KHR_video_decode_h264`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_video_decode_h264.html) e [`VK_KHR_video_decode_h265`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_video_decode_h265.html).

O Vulkan Video segue a filosofia do Vulkan de fornecer à aplicação controle flexível e granular sobre o agendamento de processamento de vídeo, sincronização e utilização de memória.

> **Nota:** A codificação de vídeo também está disponível por meio das extensões `VK_KHR_video_encode_queue`, `VK_KHR_video_encode_h264` e `VK_KHR_video_encode_h265`; [feedback](https://github.com/KhronosGroup/Vulkan-Docs/issues/1694) é bem-vindo.

## Aprendizado de Máquina (*Machine Learning*)

Atualmente, o Vulkan Working Group está analisando como tornar o Vulkan uma API de primeira classe para expor os recursos de computação de aprendizado de máquina (*ML*) das GPUs modernas. Mais informações foram anunciadas no [SIGGRAPH 2019](https://www.youtube.com/watch?v=_57aiwJISCI&feature=youtu.be&t=5007).

> **Nota:** Até o momento, não existe uma API pública do Vulkan dedicada a aprendizado de máquina.

## Sistemas Críticos de Segurança (*Safety Critical*)

O Vulkan SC ("Safety Critical") tem como objetivo levar os recursos gráficos e de computação das GPUs modernas para sistemas críticos de segurança nos setores automotivo, aviônico, industrial e médico. Ele foi [lançado publicamente em 1º de março de 2022](https://www.khronos.org/news/press/khronos-releases-vulkan-safety-critical-1.0-specification-to-deliver-safety-critical-graphics-compute) e a especificação está disponível [aqui](https://www.khronos.org/vulkansc/).

> **Nota:** O Vulkan SC é baseado no Vulkan 1.2, mas remove funcionalidades desnecessárias para mercados críticos de segurança, aumenta a robustez da especificação ao eliminar parâmetros ignorados e comportamentos indefinidos (*undefined behaviors*), e habilita detecção, relatório e correção aprimorados de falhas em tempo de execução.
