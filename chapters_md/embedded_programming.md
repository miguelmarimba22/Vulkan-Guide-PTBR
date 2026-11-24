# Programação Embarcada

A programação embarcada envolve uma série de técnicas específicas e restrições únicas em comparação com o desenvolvimento tradicional para desktop. Enquanto ambientes desktop frequentemente oferecem abundância de memória, altos limites térmicos e gerenciadores de janelas sofisticados que abstraem o hardware, sistemas embarcados são definidos por suas restrições rigorosas. Esses dispositivos vão de controladores industriais e quiosques médicos a painéis de instrumentos automotivos, smart TVs e *wearables* avançados. Cada um exige uma abordagem rigorosa de gerenciamento de recursos e uma compreensão profunda da arquitetura de hardware subjacente.

## Arquitetura de Hardware: Energia e Largura de Banda

A principal restrição em sistemas embarcados costuma ser o consumo de energia e, como consequência, o gerenciamento térmico. A maioria das GPUs embarcadas utiliza uma Arquitetura de Memória Unificada (UMA — *Unified Memory Architecture*), na qual a GPU compartilha a mesma RAM física da CPU. Isso difere dos sistemas desktop com Memória de Vídeo dedicada (VRAM) conectada por meio de um barramento PCIe de alta velocidade.

Em um sistema embarcado UMA, cada byte transferido entre a GPU e a RAM consome uma quantidade significativa de energia e compete com a CPU pela largura de banda limitada da memória. Esse barramento compartilhado pode facilmente se tornar um gargalo, especialmente ao renderizar em altas resoluções como 4K em smart TVs.

### Renderização Baseada em Tiles (Tile-Based Rendering — TBR)

Para combater essas restrições de largura de banda, quase todas as GPUs embarcadas (como Broadcom VideoCore, ARM Mali e Imagination PowerVR) utilizam Renderização Baseada em Tiles (TBR — *Tile-Based Rendering*) ou Renderização Diferida Baseada em Tiles (TBDR — *Tile-Based Deferred Rendering*). Ao processar a cena em pequenos blocos (*tiles*) diretamente no chip (*on-chip*), essas GPUs conseguem executar muitas operações — incluindo teste de profundidade, *blending* e até parte do *fragment shading* — inteiramente dentro de uma memória local rápida no chip, gravando apenas os resultados finais de volta na RAM principal.

Essa arquitetura é fundamental para o desempenho em sistemas embarcados, mas é abordada em profundidade em um capítulo dedicado.

Consulte o capítulo sobre Boas Práticas de Renderização Baseada em Tiles (*Tile Based Rendering Best Practices*) para obter mais informações sobre como essas GPUs funcionam.

### Largura de Banda: Gráficos vs. Computação

Uma distinção crítica de desempenho em GPUs embarcadas é a diferença na largura de banda efetiva entre *pipelines* gráficos e de computação (*compute*). Embora GPUs desktop frequentemente tratem ambos como igualmente capazes, arquiteturas embarcadas baseadas em *tiles* (*tilers*) são fortemente otimizadas para o fluxo de função fixa do *pipeline* gráfico, onde o hardware pode aproveitar a arquitetura *Tile-Based* em sua plenitude.

* **Largura de Banda Efetiva e Cache**: *Fragment shaders* se beneficiam da arquitetura *Tile-Based*, o que lhes permite interagir com dados diretamente no *tile buffer* no chip. Essa memória local tem largura de banda significativamente maior e latência muito menor do que a RAM principal. *Compute shaders* normalmente operam sobre um modelo de memória linear e muitas vezes não se beneficiam do mesmo nível de redução de largura de banda proporcionado pelo *tiling*. Como *compute shaders* frequentemente contornam o hardware especializado do *tiler* para teste de profundidade e remoção de superfícies ocultas (*hidden surface removal*), eles podem gerar tráfego de memória significativamente maior para a mesma operação lógica. Consequentemente, mover trabalho de um *compute shader* para um *fragment shader* (por exemplo, usando um *quad* em tela cheia ou um *subpass*) muitas vezes resulta em maior desempenho ao manter dados intermediários dentro do *tile buffer*.
* **Compressão e `USAGE_STORAGE`**: Tecnologias de compressão por hardware, como o *Frame Buffer Compression* da ARM (AFBC), são vitais para reduzir a largura de banda em sistemas UMA. Contudo, esses esquemas de compressão geralmente possuem requisitos rígidos incompatíveis com a natureza de acesso aleatório das *storage images*. Uma armadilha comum é habilitar `VK_IMAGE_USAGE_STORAGE_BIT` em uma imagem que precisa apenas ser amostrada (*sampled*). Em muitas GPUs embarcadas, a presença do bit de *storage* desabilita completamente a compressão para aquela imagem, a fim de garantir que qualquer *workgroup* possa escrever em qualquer *texel* a qualquer momento. Isso força a GPU a realizar transações de memória sem compressão, o que pode aumentar o consumo de energia e saturar o barramento de memória compartilhado. Os desenvolvedores devem auditar cuidadosamente suas flags de uso de imagem e habilitar o uso de *storage* apenas para imagens que realmente exigem escritas de acesso aleatório; para acesso padrão somente leitura, prefira sempre `VK_IMAGE_USAGE_SAMPLED_BIT` ou `VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT` para preservar a compressão.

## Gerenciamento de Memória em UMA

Em um ambiente embarcado, a memória não é apenas limitada; ela costuma ser compartilhada entre a CPU e a GPU em uma Arquitetura de Memória Unificada (UMA). Isso significa que cada byte alocado pela GPU é um byte retirado da RAM de uso geral do sistema.

### Identificando Tipos de Memória

Os desenvolvedores devem consultar `vkGetPhysicalDeviceMemoryProperties` e procurar os *heaps* e tipos de memória específicos disponíveis. Na maioria dos sistemas UMA, você encontrará um único *heap* que possui tanto `VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT` quanto `VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT` definidos em alguns tipos de memória. Isso indica que a CPU pode acessar diretamente a mesma memória que a GPU utiliza, permitindo transferências de dados sem cópia (*zero-copy*).

> **Nota:** Mesmo que a memória seja fisicamente compartilhada, a GPU ainda pode ter um cache dedicado. Esquecer de chamar `vkFlushMappedMemoryRanges` ou `vkInvalidateMappedMemoryRanges` (ou de usar `VK_MEMORY_PROPERTY_HOST_COHERENT_BIT`) causará corrupção de dados, exatamente como ocorreria em desktop.

### Memória Alocada Preguiçosamente e Transient Attachments

Para dados intermediários que existem apenas durante um *render pass*, como *attachments* de G-buffer em um renderizador diferido (*deferred renderer*), o Vulkan fornece a propriedade de memória *lazily-allocated* (alocação preguiçosa). Essa é uma otimização fundamental para arquiteturas baseadas em *tiles* manterem dados transitórios no chip.

Quando uma imagem é criada com `VK_IMAGE_USAGE_TRANSIENT_ATTACHMENT_BIT` e respaldada por memória com `VK_MEMORY_PROPERTY_LAZILY_ALLOCATED_BIT`, a implementação pode nem chegar a alocar RAM física do sistema para essa imagem. Em vez disso, os dados existem apenas no *tile buffer* no chip da GPU durante o *render pass*.

O uso detalhado desses bits será abordado na seção futura sobre *Transient Attachments*.

### Subalocação e Fragmentação

Sistemas embarcados frequentemente possuem um `maxMemoryAllocationCount` muito baixo (às vezes tão baixo quanto 4096). Isso torna a subalocação obrigatória.

* **Alocadores Personalizados**: Utilize as estratégias do capítulo sobre Alocação de Memória para alocar blocos grandes (por exemplo, 64 MB ou 256 MB) e subalocar *buffers* e imagens dentro deles.
* **Alinhamento de Memória**: Os requisitos de alinhamento para certos recursos (como `minStorageBufferOffsetAlignment`) podem ser muito maiores em GPUs embarcadas do que em contrapartes desktop. Sempre verifique os limites em `VkPhysicalDeviceProperties`.
* **Memória Fragmentada**: Em sistemas com longos tempos de operação contínua (*uptime*), como controladores industriais, a fragmentação de memória pode causar falhas de alocação mesmo quando parece haver memória "livre" disponível. Reutilizar alocações ou utilizar um alocador robusto como o Vulkan Memory Allocator (VMA) é altamente recomendado.

## O Fluxo Direto para Display ([VK_KHR_display](https://docs.vulkan.org/refpages/latest/refpages/source/VK_KHR_display.html))

Muitos sistemas embarcados, especialmente nos contextos automotivo e industrial, não executam um gerenciador de janelas como Wayland, X11 ou Windows. Em vez disso, a aplicação precisa renderizar diretamente para o hardware físico do display ou por meio de um compositor especializado como o QNX Screen. O Vulkan oferece essa capacidade por meio da extensão `VK_KHR_display` ou de extensões específicas de plataforma como `VK_QNX_screen_surface`.

O fluxo de trabalho para `VK_KHR_display` envolve uma negociação direta com o hardware do display:

1. **Enumerar Displays**: Chame `vkGetPhysicalDeviceDisplayPropertiesKHR` para encontrar as telas físicas disponíveis (`VkDisplayKHR`).
2. **Selecionar um Modo**: Para um determinado display, consulte os modos suportados (resolução e taxa de atualização) usando `vkGetDisplayModePropertiesKHR`.
3. **Identificar Planos (*Planes*)**: Displays de hardware frequentemente possuem múltiplos "planos" para composição (por exemplo, um plano de fundo para vídeo e um plano frontal para UI). São sobreposições em nível de hardware que podem ser combinadas sem interação da GPU, economizando energia. Use `vkGetPhysicalDeviceDisplayPlanePropertiesKHR` para encontrá-los.
4. **Encontrar um Plano Adequado**: Verifique quais planos podem ser usados com o display escolhido usando `vkGetDisplayPlaneSupportedDisplaysKHR`.
5. **Criar a Superfície (*Surface*)**: Use `vkCreateDisplayPlaneSurfaceKHR` com o modo e o plano selecionados para criar uma `VkSurfaceKHR`.

Usar planos de hardware é uma otimização essencial em painéis automotivos, nos quais um fundo estático ou um fluxo de vídeo pode ser colocado em um plano inferior enquanto os mostradores (*gauges*) são renderizados em um plano superior, potencialmente com taxas de atualização e transparência diferentes.

> **Nota:** Para quem deseja desenvolver localmente, alternar para um novo terminal TTY (`Ctrl + Alt + F3`) na maioria das distribuições Linux permite usar `VK_KHR_display`. Você também pode testá-lo com o `vkcube` executando `vkcube --wsi display`.

## Mergulhos Específicos por Plataforma

O desenvolvimento Vulkan embarcado varia significativamente dependendo da plataforma-alvo. Abaixo estão detalhes técnicos para alvos embarcados comuns fora do ecossistema móvel tradicional.

### Raspberry Pi: VideoCore VI e VII

O Raspberry Pi 4 (VideoCore VI) e o Pi 5 (VideoCore VII) são os computadores de placa única (*single-board computers*) mais populares para desenvolvimento Vulkan. O driver principal é o driver `v3dv` do Mesa.

* **Listas de Controle (*Control Lists* — CL)**: A GPU VideoCore não utiliza *command buffers* padrão da mesma forma que uma GPU desktop. Em vez disso, o driver gera "Control Lists" que a unidade V3D do hardware executa.
* **Alocador de Memória Contígua (CMA — *Contiguous Memory Allocator*)**: No Linux, a GPU exige memória fisicamente contígua, gerenciada pelo pool CMA do kernel. Se sua aplicação travar ou falhar ao alocar memória mesmo com bastante RAM disponível, pode ser necessário aumentar o tamanho do CMA em `/boot/config.txt`.
  * Exemplo: `dtoverlay=vc4-kms-v3d,cma-512` aloca 512 MB para a GPU.
* **Pontos de Inflexão de Desempenho (*Performance Tipping Points*)**: O driver `v3dv` é muito eficiente, mas possui "pontos de inflexão" específicos nos quais precisa descarregar o *tile buffer* para a RAM (um *resolve*). Para evitar isso, estruture seus *render passes* para caberem nos limites do *tile buffer* (que variam conforme o número de amostras e o formato dos *attachments*). Não há uma API padrão do Vulkan para consultar diretamente o orçamento exato do *tile buffer*; esses limites são fixos em hardware e internos ao driver. No entanto, você pode inferir as restrições práticas consultando `vkGetPhysicalDeviceProperties` para `maxColorAttachments` e `maxFramebufferWidth`/`maxFramebufferHeight`, além de verificar contagens de amostras suportadas via `vkGetPhysicalDeviceImageFormatProperties`. Como diretriz geral para a VideoCore, mantenha baixo o total de bits por pixel de todos os *color attachments* dentro de um *subpass* (semelhante ao orçamento de 128 bits por pixel documentado para GPUs ARM Mali) e minimize o *multisampling* para evitar exceder a capacidade do *tile buffer* no chip. A [documentação Mesa V3D/V3DV](https://docs.mesa3d.org/drivers/v3d.html) fornece detalhes adicionais específicos de hardware sobre esses limites internos.

### Smart TVs e Set-Top Boxes

Plataformas de TV (Android TV, Tizen, WebOS ou Linux personalizado) são centradas em mídia e frequentemente utilizam SoCs de baixo consumo otimizados para decodificação de vídeo em vez de renderização 3D complexa.

* **Sincronização Áudio/Vídeo (A/V)**: Ao construir um reprodutor de mídia, sincronizar a apresentação do Vulkan com o áudio é crítico para evitar problemas de sincronismo labial (*lip-sync*). Use `VK_GOOGLE_display_timing` para obter informações precisas sobre quando um quadro foi realmente exibido. Extensões mais recentes, como `VK_KHR_present_id` e `VK_KHR_present_wait`, permitem que a aplicação aguarde a exibição de um quadro específico, oferecendo controle mais fino sobre o loop de apresentação.
* **HDR e Espaços de Cor**: TVs são o principal alvo para High Dynamic Range (HDR). O Vulkan suporta isso por meio de `VK_EXT_swapchain_colorspace` (por exemplo, `VK_COLOR_SPACE_EXTENDED_SRGB_LINEAR_EXT` ou `VK_COLOR_SPACE_HDR10_ST2084_EXT`). Use `VK_EXT_hdr_metadata` para enviar metadados estáticos como MaxCLL (*Maximum Content Light Level*) e MaxFALL (*Maximum Frame Average Light Level*) ao display, que a TV usa para ajustar seu *tone-mapping*.
* **Composição por Hardware**: Muitos SoCs de TV permitem que a *swapchain* Vulkan seja apenas uma camada em um compositor de hardware multicamadas. Isso possibilita combinar um vídeo de fundo em 4K (decodificado por um bloco de hardware dedicado) com uma sobreposição de interface Vulkan em 1080p sem que a GPU precise tocar nos pixels do vídeo 4K. Essa capacidade de escalonamento é crucial para o desempenho, pois renderizar uma UI complexa em 4K em um SoC de TV de entrada muitas vezes é impossível a 60 FPS.
* **Gerenciamento de Taxa de Atualização**: TVs geralmente suportam múltiplas taxas de atualização (por exemplo, 23,976 Hz para cinema, 50 Hz para PAL, 60 Hz para NTSC). As aplicações devem consultar `vkGetPhysicalDeviceSurfacePresentModesKHR` e podem precisar recriar a *swapchain* quando o formato de mídia muda para corresponder à taxa de atualização do display, evitando trepidação (*judder*).

### Wearables e Smartwatches

*Wearables* são os dispositivos mais restritos, frequentemente operando com bateria por dias. Cada operação de ALU e cada acesso à memória se traduz diretamente em menor duração da bateria.

* **Operações de Subgrupo (*Subgroup Operations*)**: Use operações de subgrupo (parte do núcleo do Vulkan 1.1) para compartilhar dados entre invocações de *shader*. Por exemplo, se precisar calcular a média de pixels em uma vizinhança, use aritmética de subgrupo em vez de gravar e ler da memória compartilhada (variáveis `shared`). Isso mantém os dados dentro do arquivo de registradores da GPU, economizando muita energia. Note que operações de subgrupo não são exclusivas de embarcados; elas também beneficiam GPUs desktop ao reduzir o tráfego na memória compartilhada e melhorar a ocupação.
* **Precisão Reduzida**: A maioria das GPUs embarcadas tem o dobro de velocidade ao executar aritmética de 16 bits em comparação com 32 bits. Use `VK_KHR_shader_float16_int8` para empregar tipos de meia precisão (*half-precision*). Isso não apenas dobra a vazão (*throughput*), mas também reduz o número de registradores usados pelo *shader*, permitindo que mais *workgroups* executem em paralelo. No entanto, a precisão de 16 bits deve ser testada e analisada com cuidado: o uso indiscriminado pode introduzir *overhead* desnecessário de conversão (`f32 → f16 → f32`), e algumas GPUs podem ignorar silenciosamente a precisão reduzida, o que pode gerar artefatos de precisão que só se manifestam em determinados hardwares. Assim como as operações de subgrupo, essa otimização também pode beneficiar GPUs desktop.
* **Otimização para Telas Circulares**: Como muitos smartwatches usam displays circulares dentro de *buffers* de memória quadrados, os cantos representam aproximadamente 21,5% da área total (a diferença geométrica entre um quadrado e o círculo inscrito nele). Embora o Vulkan renderize em superfícies retangulares, você pode usar retângulos de recorte (*scissor rectangles*) para excluir de forma barata grandes regiões não visíveis, pois o teste de *scissor* ocorre antes do *fragment shading* sem custo de ALU. Para mascaramento circular mais fino além do que *scissors* alinhados aos eixos permitem, pode-se usar `VK_EXT_discard_rectangles` (se suportado) ou um `discard` no *shader* — embora `discard` possa ser custoso em algumas GPUs *tile-based* por interferir nas otimizações de *early-Z*. Na prática, a combinação de um *scissor rect* bem ajustado com um `discard` simples no *shader* para os pixels restantes dos cantos costuma ser a melhor abordagem.

### Automotivo e Vulkan SC

Sistemas automotivos (painéis de instrumentos e sistemas de infoentretenimento) exigem confiabilidade extrema e desempenho determinístico, frequentemente com certificações formais de segurança como a ISO 26262.

* **Vulkan SC (Safety Critical)**: Para sistemas que precisam de certificação de segurança (como painéis digitais exibindo velocidade e alertas), utiliza-se o Vulkan SC. Ele é um subconjunto do Vulkan 1.2 que remove todo comportamento não determinístico, como compilação de *shaders* em tempo de execução e crescimento ilimitado de memória.
  * **Sem Criação de Pipelines em Tempo de Execução**: No Vulkan SC, *pipelines* não podem ser criados durante o loop principal da aplicação. Eles devem ser pré-compilados e carregados na fase de inicialização ou por meio de uma ferramenta offline. Isso garante que não ocorram travamentos repentinos durante a renderização.
  * **Reserva de Recursos**: Todos os objetos (*buffers*, imagens, *descriptor sets* e até a quantidade de *command buffers*) devem ser pré-declarados na criação do dispositivo. Isso é feito passando uma estrutura `VkDeviceObjectReservationCreateInfo` para `vkCreateDevice` por meio da cadeia `pNext`, permitindo que o driver pré-aloque todas as estruturas de gerenciamento necessárias.
* **Integração com QNX Screen**: No QNX Neutrino, o Vulkan se integra ao Screen Graphics Subsystem. Os desenvolvedores usam `VK_QNX_screen_surface` para criar uma superfície a partir de uma janela ou fluxo do Screen, sendo esse o padrão para software automotivo de missão crítica.
* **Previsibilidade Acima de Desempenho de Pico**: No setor automotivo, 60 FPS constantes são melhores do que 120 FPS variáveis. Qualquer engasgo (*stutter*) pode ser percebido como falha do sistema. Use `VkPipelineCache` e garanta que todos os estados de *pipeline* possíveis sejam pré-aquecidos (*warmed up*) antes do término da tela de inicialização do veículo. No Vulkan SC, esse "aquecimento" já é integrado por design na fase de inicialização.

## Confiabilidade e Previsibilidade

Em sistemas embarcados de missão crítica, o foco muda de "quão rápido isso consegue ir?" para "isso consegue manter essa velocidade indefinidamente?".

* **Throttling Térmico**: Dispositivos embarcados frequentemente não possuem resfriamento ativo. Se a GPU ultrapassar os limites térmicos, o hardware reduzirá sua frequência de clock. Uma aplicação robusta deve monitorar a temperatura do dispositivo (se possível por meio de APIs da plataforma) e reduzir graciosamente a taxa de quadros ou a complexidade visual para evitar uma queda brusca por *throttling*.
* **Extensões de Robustez**: Utilize `VK_KHR_robustness2`. Isso garante que, caso um *shader* realize um acesso fora dos limites (*out-of-bounds*) — por exemplo, devido a um erro de lógica ou a uma inversão de bit (*bit-flip*) em ambientes resistentes à radiação —, o acesso seja tratado de forma determinística em vez de causar travamento da GPU ou um "TDR" (*Timeout Detection and Recovery*). Tenha em mente que habilitar robustez introduz *overhead* em tempo de execução, pois o driver precisa inserir lógica de verificação de limites no código do *shader*. Por isso, a robustez geralmente é recomendada apenas para testes, depuração e software de missão crítica, e não para aplicações de uso geral em que o desempenho máximo é prioritário.
* **Predeterminismo de Pipeline**: Em muitos cenários embarcados, a aplicação não deve usar nenhum estado dinâmico que não seja estritamente necessário. Quanto mais estado for fixado no *pipeline* no momento da criação, mais o driver conseguirá otimizar o código de máquina gerado.

## Recursos Externos

* [Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples): Exemplos práticos de otimizações para sistemas embarcados (*subpasses*, alocação preguiçosa, pré-rotação). Vários exemplos do Vulkan Samples funcionam em sistemas embarcados.
* [Vulkan Registry](https://registry.khronos.org/vulkan/): Documentação oficial das diversas extensões mencionadas acima.
* [ARM Graphics Developer](https://developer.arm.com/graphics): Documentação detalhada sobre a arquitetura e otimização de GPUs Mali.
* [ARM: AFBC Textures for Vulkan](https://developer.arm.com/documentation/101897/0304/Buffers-and-textures/AFBC-textures-for-Vulkan): Orientações específicas para evitar flags que desabilitam a compressão.
* [Documentação Mesa V3D/V3DV](https://docs.mesa3d.org/drivers/v3d.html): Detalhes técnicos sobre a implementação do driver Vulkan para Raspberry Pi e a arquitetura VideoCore subjacente.
* [Vulkan SC](https://www.khronos.org/vulkansc/): Página oficial do Vulkan Safety Critical.
* [Especificação do Vulkan: VK_KHR_display](https://registry.khronos.org/vulkan/specs/latest/html/vkspec.html#VK_KHR_display): Aprofundamento na extensão de apresentação direta para display.
