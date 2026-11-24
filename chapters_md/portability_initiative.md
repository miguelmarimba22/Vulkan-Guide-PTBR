# Iniciativa de Portabilidade (*Portability Initiative*)

> **Nota:** Atualmente, uma especificação provisória da extensão [`VK_KHR_portability_subset`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_portability_subset.html) está disponível com os cabeçalhos [`vulkan_beta.h`](https://github.com/KhronosGroup/Vulkan-Headers/blob/main/include/vulkan/vulkan_beta.h). Mais informações podem ser encontradas no [comunicado à imprensa](https://www.khronos.org/blog/fighting-fragmentation-vulkan-portability-extension-released-implementations-shipping).

A [Iniciativa de Portabilidade Vulkan (*Vulkan Portability Initiative*)](https://www.vulkan.org/porting#vulkan-portability-initiative) é um esforço dentro do Khronos Group para desenvolver recursos que definam e evoluam o [subconjunto](https://github.com/KhronosGroup/Vulkan-Portability) de capacidades do Vulkan que pode ser disponibilizado universalmente com desempenho em nível nativo em todas as principais plataformas, incluindo aquelas que atualmente não contam com drivers Vulkan nativos. Em resumo, essa iniciativa tem como objetivo tornar o Vulkan viável em plataformas que não suportam a API nativamente (por exemplo, macOS e iOS).

![Visão geral da Iniciativa de Portabilidade Vulkan](images/portability_initiative_overview.png)

## Camada de Tradução (*Translation Layer*)

Implementações em camadas (*layered implementations*) combatem a fragmentação da indústria ao permitir que mais aplicações rodem em mais plataformas, mesmo em um cenário de APIs fragmentado. Por exemplo, a primeira linha no diagrama abaixo mostra como o Vulkan está sendo utilizado como alvo de portabilidade para trazer APIs adicionais às plataformas, possibilitando mais conteúdo sem a necessidade de drivers adicionais em nível de kernel. Implementações de APIs em camadas já foram usadas com sucesso para lançar aplicações em produção em múltiplas plataformas.

As colunas na figura mostram projetos de camadas sendo usados para tornar APIs disponíveis em plataformas adicionais, mesmo quando não existem drivers nativos disponíveis, oferecendo aos desenvolvedores a flexibilidade de implantação necessária para desenvolver com a API gráfica de sua escolha e distribuir em várias plataformas. A primeira coluna do diagrama representa o trabalho da *Vulkan Portability Initiative*, viabilizando implementações em camadas da funcionalidade Vulkan em diversas plataformas.

![Tabela de projetos de camadas de tradução entre APIs gráficas](images/portability_initiative_table.png)

## Ferramentas para macOS e iOS

Blog do Khronos com [informações sobre o suporte a macOS e iOS](https://www.khronos.org/blog/new-release-of-vulkan-sdk).

![Ferramentas de portabilidade Vulkan no macOS e iOS](images/portability_initiative_macos.png)

## gfx-rs

A Mozilla está ajudando a impulsionar o [gfx-rs portability](https://github.com/gfx-rs/portability) para usar o [wgpu-hal](https://github.com/gfx-rs/wgpu/pull/1471) como forma de fazer interface com diversas outras APIs.

![Arquitetura do gfx-rs portability](images/portability_initiative_gfxrs.png)
