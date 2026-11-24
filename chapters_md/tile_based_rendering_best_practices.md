# Boas Práticas para Tile Based Rendering (TBR)

*Tile Based Rendering* (TBR) é uma arquitetura de renderização amplamente utilizada em GPUs móveis e, cada vez mais, em alguns projetos de desktop.
Diferentemente das GPUs tradicionais de "modo imediato" (*immediate mode*) que processam toda a tela como uma única grande tarefa, uma GPU baseada em *tiles* (*tiler*) divide o *framebuffer* em pequenas regiões gerenciáveis da tela chamadas *tiles*.
O objetivo é manter o máximo possível de trabalho *on-chip*, dentro da memória local rápida, antes de finalmente gravar os resultados finalizados na memória principal do sistema.

Para um desenvolvedor Vulkan, essa arquitetura significa que a largura de banda de memória é frequentemente o fator de desempenho mais significativo.
Se você conseguir manter seus dados dentro da memória de *tile*, sua aplicação será mais rápida e consumirá menos energia.
Se você forçar a GPU a fazer viagens constantes de ida e volta (*round-trips*) de dados entre o chip e a VRAM externa, o desempenho será prejudicado.

## Entendendo Arquiteturas Tiler

GPUs móveis operam em ambientes com restrição de energia, o que torna a eficiência de largura de banda crítica.
Como o Vulkan oculta muitos dos detalhes internos de hardware — como o tamanho exato de um *tile* ou como a GPU escalona o trabalho —, a melhor forma de otimizar é fornecer ao driver uma intenção clara.
Ao utilizar as configurações corretas de *render pass* e flags de memória, você dá à implementação as informações necessárias para manter a renderização *on-chip*.

### Como Funcionam os Tilers em Hardware

Embora cada fabricante tenha um projeto ligeiramente diferente, eles geralmente compartilham características comuns.
Primeiro, é importante perceber que o **tamanho do *tile*** é determinado pelo hardware e não é algo que você pode consultar ou controlar no núcleo do Vulkan.
Dependendo do dispositivo e da complexidade dos seus anexos (*attachments*), os *tiles* podem ter qualquer tamanho em pixels.
A GPU escolhe um tamanho que caiba em seu orçamento de memória interna.
Algumas extensões de fabricantes (como `VK_QCOM_tile_shading`) podem expor esses detalhes, mas para uma aplicação multiplataforma, você deve assumir que o tamanho do *tile* é opaco.

Segundo, a **memória *on-chip*** usada para os *tiles* é gerenciada inteiramente pelo driver.
Você não aloca "memória de *tile*" diretamente.
Em vez disso, a quantidade de anexos utilizados, seus formatos e o fato de você habilitar ou não MSAA determinam quantos dados precisam ser armazenados por pixel.
Como a memória *on-chip* total é fixa, usar formatos de pixel com profundidades de bits menores pode frequentemente permitir que o hardware use *tiles* maiores ou evite despejar (*spilling*) dados para a memória externa.
Se os seus anexos exigirem mais bits do que a GPU possui *on-chip* para um determinado tamanho de *tile*, o driver pode precisar usar *tiles* menores, o que reduz a eficiência.

Uma otimização frequentemente negligenciada para *tilers* envolve o **passe de *binning*** (*binning pass*).
Os *tilers* geralmente processam a geometria duas vezes: uma vez para determinar quais triângulos caem em quais *tiles* (*binning*) e uma segunda vez para realmente renderizar os pixels.
Para acelerar o passe de *binning*, considere armazenar as posições dos vértices em um buffer separado de outros atributos, como coordenadas UV ou normais.
Isso permite que a GPU leia apenas os dados necessários para calcular a cobertura dos *tiles*, reduzindo significativamente a largura de banda desnecessária.
Embora os cálculos de shader no passe de *binning* devam ser executados em alta precisão (`fp32`), os dados de posição de vértice na memória precisam apenas de precisão suficiente para manter a acurácia no espaço de coordenadas do modelo.
Usar formatos como `unorm16` para um modelo típico equivalente a 10 metros no mundo real fornece uma precisão de quantização de 0,15 mm, o que é suficiente para a maioria dos casos de uso.

## Estratégias de Otimização para TBR

A maioria dos ganhos de desempenho em um *tiler* vem de responder a uma única pergunta: "Eu realmente preciso mover esses dados para a memória externa?"

### Operações de Load e Store de Anexos (*Attachments*)

Sua principal ferramenta para controlar a largura de banda é a configuração dos anexos do *render pass*.
Esteja você usando objetos tradicionais `VkRenderPass` ou a extensão moderna `VK_KHR_dynamic_rendering`, os princípios são os mesmos.
As configurações de `loadOp` e `storeOp` não são apenas etapas de limpeza; elas são instruções diretas para o hardware.

Se você estiver iniciando um novo quadro ou um novo passe, use `VK_ATTACHMENT_LOAD_OP_CLEAR`.
Isso é significativamente mais rápido do que usar comandos explícitos de limpeza como `vkCmdClearAttachments`, pois permite que o hardware inicialize a memória de *tile* diretamente, sem qualquer tráfego de memória externa.
Se você sabe que vai sobrescrever completamente o conteúdo do *tile* — por exemplo, renderizando geometria opaca que cobre toda a tela —, pode usar `VK_ATTACHMENT_LOAD_OP_DONT_CARE`.
Isso informa à GPU que ela não precisa perder tempo carregando os dados do quadro anterior da memória NEM executando uma limpeza.

Da mesma forma, use `VK_ATTACHMENT_STORE_OP_DONT_CARE` para qualquer anexo de que você não precise após o término do passe.
Se você quiser evitar explicitamente a gravação de volta na memória, mas também não quiser descartar logicamente o conteúdo atual (por exemplo, se planeja usar o anexo em um *render pass* subsequente que não seja um *subpass*), pode usar `VK_ATTACHMENT_STORE_OP_NONE` (se disponível via `VK_KHR_load_store_op_none` ou Vulkan 1.3).
Anexos de profundidade (*depth*), anexos de *stencil* e anexos de cor com *multisampling* são os candidatos mais comuns para `DONT_CARE`.
Ao informar à GPU que você não se importa com o estado final dessas imagens, você evita que ela desperdice largura de banda gravando-as de volta na memória principal.

Ao usar **Renderização Dinâmica** (`VK_KHR_dynamic_rendering`), você especifica essas mesmas operações na estrutura `VkRenderingInfo`.
Essa extensão simplifica seu código removendo a necessidade de objetos de *render pass* e *framebuffer*, mas a lógica de hardware permanece idêntica.
Você deve continuar disciplinado quanto às suas operações de *load* e *store* para evitar regressões de desempenho.

Ao usar *render passes* tradicionais, tente estruturá-los de modo que o driver consiga "mesclar" (*merge*) os *subpasses*.
Os *subpasses* podem ser fundamentais para alcançar um bom desempenho com pipelines de renderização tradicionais, mas a mesclagem não é garantida — ela depende da implementação.
Quando os *subpasses* são mesclados, o driver combina múltiplos *subpasses* lógicos em um único passe de hardware, garantindo que dados intermediários (como atributos de G-buffer em um renderizador diferido) permaneçam inteiramente dentro da memória de *tile* e nunca sejam gravados na VRAM externa.
As aplicações podem usar `VK_EXT_subpass_merge_feedback` para verificar se seus *subpasses* estão realmente sendo mesclados.
Pipelines modernos que usam renderização dinâmica podem obter benefícios semelhantes aos de *subpasses* utilizando `VK_KHR_dynamic_rendering_local_read`.
Para incentivar a mesclagem, mantenha as dependências de *subpass* simples e evite introduzir dependências "globais" (como barreiras de pipeline ou atualizações de *descriptor sets*) que possam forçar o driver a dividir o passe.

### Anexos Transientes e Alocação Preguiçosa (*Lazy Allocation*)

Para dados intermediários que vivem apenas durante um único *render pass*, você deve marcar suas imagens com `VK_IMAGE_USAGE_TRANSIENT_ATTACHMENT_BIT`.
Quando combinada com memória que possui `VK_MEMORY_PROPERTY_LAZILY_ALLOCATED_BIT`, algumas GPUs conseguem evitar completamente a alocação de memória física do sistema para esses anexos.
Os dados existem apenas na memória de *tile* *on-chip* e são descartados quando o passe termina.
Isso é particularmente útil para *depth buffers* ou anexos de G-buffer em um renderizador diferido que são consumidos em um *subpass* posterior.

### Eficiência com MSAA

O *multisampling* é particularmente eficiente em *tilers* porque o *resolve* de um anexo com múltiplas amostras para um anexo de amostra única pode frequentemente ocorrer inteiramente *on-chip*.
Em vez de gravar o enorme buffer com múltiplas amostras na VRAM e depois lê-lo de volta para fazer o *resolve*, a GPU resolve o *tile* imediatamente antes de gravar a cor final 1x na memória.
Para acionar isso, defina o `storeOp` do anexo com múltiplas amostras como `DONT_CARE` e forneça um anexo de *resolve* dentro do mesmo *subpass*.
Observe que não existe uma contagem de amostras universalmente "melhor"; você deve escolher com base nas suas necessidades de qualidade e no hardware de destino.
Evite usar `vkCmdResolveImage` se possível, pois isso força uma custosa viagem de ida e volta à memória principal.

## TBR vs IMR: Uma Comparação Prática

É útil contrastar os *tilers* com os *Immediate Mode Renderers* (IMR), que são comuns em GPUs desktop de alto desempenho.

* **GPUs IMR** normalmente processam triângulos e gravam os fragmentos resultantes na memória quase imediatamente. Elas dependem de memória de alta largura de banda e caches grandes para lidar com o tráfego. O *overdraw* em uma IMR é caro porque cada pixel gravado potencialmente aciona uma gravação na memória.
* **GPUs TBR** adiam essas gravações. Ao fazer o *binning* da geometria e processar por *tile*, elas podem realizar muitas operações — como *blending* e teste de profundidade — inteiramente dentro da memória de *tile*. A gravação na memória só ocorre quando o *tile* é concluído.

Não é necessário escrever caminhos de código separados para GPUs TBR e IMR.
Em geral, entender como um *tiler* funciona ajudará você a escrever código eficiente para ambas as arquiteturas.
Embora evitar o *overdraw* de fragmentos seja ortogonal ao fato de ser um *tiler* (e *tilers* frequentemente sejam menos suscetíveis aos custos de desempenho de *overdraw* devido à Remoção de Superfícies Ocultas em hardware), um bom gerenciamento de anexos e a minimização de trabalho desnecessário beneficiam todas as arquiteturas.

## Extensões Modernas para Eficiência de Tiles

Os *render passes* padrão do Vulkan são poderosos, mas várias extensões modernas fornecem ainda mais controle sobre como os dados são manipulados *on-chip*.

### Renderização Dinâmica e Leituras Locais

Se você migrou para a **Renderização Dinâmica** para simplificar sua aplicação, pode estar preocupado em perder a funcionalidade de "anexo de entrada" (*input attachment*) que mantém os *subpasses* eficientes.
A extensão `VK_KHR_dynamic_rendering_local_read` é a solução.
Ela permite que seus *fragment shaders* leiam dos anexos de cor, profundidade ou *stencil* do pixel atual sem exigir um objeto explícito de *render pass*.

Para usá-la de forma eficaz, habilite o recurso na criação do dispositivo e use `vkCmdSetRenderingAttachmentLocationsKHR` durante a gravação de comandos para mapear suas imagens para índices de entrada.
No seu shader, você pode então usar `subpassInput` (acessado via `subpassLoad`) exatamente como faria em um *subpass* tradicional.
Isso mantém seus dados *on-chip*, evitando a penalidade de largura de banda de gravar dados intermediários de G-buffer na memória principal.

### Shader Tile Image

Embora as leituras locais sejam ótimas para realimentação simples, `VK_EXT_shader_tile_image` fornece uma forma mais direta para *fragment shaders* interagirem com o *tile*.
Essa extensão permite acessar os dados do *tile* como se fossem uma imagem comum, o que é particularmente útil para ***blending* programável**, lógica personalizada de profundidade-*stencil* ou efeitos avançados de transparência.

É uma ferramenta poderosa, mas é estritamente restrita ao **pixel atual**.
Você não pode usar essa extensão para ler pixels vizinhos.
Efeitos comuns de pós-processamento como *bloom*, FXAA ou desfoques (*blurs*) ainda exigem um passe de amostragem separado, pois dependem de uma vizinhança mais ampla de dados que pode cruzar as fronteiras dos *tiles*.

## Ajuste Avançado de Desempenho

Além do básico de gerenciamento de anexos, vários outros fatores influenciam o desempenho da sua aplicação em um *tiler*.

### Pipelining e Barreiras

Em um *tiler*, a GPU normalmente processa o passe de *binning* para todo o *render pass* antes de iniciar o passe de fragmentos para o primeiro *tile*.
Para manter o hardware ocupado, você deseja que esses dois estágios se sobreponham o máximo possível — a GPU deve estar fazendo o *binning* do próximo quadro enquanto ainda está sombreando o quadro atual.

O uso incorreto de barreiras de pipeline pode quebrar essa sobreposição.
Evite usar barreiras amplas como `VK_PIPELINE_STAGE_ALL_GRAPHICS_BIT` para `VK_PIPELINE_STAGE_ALL_GRAPHICS_BIT`, pois elas frequentemente criam paradas (*stalls*) desnecessárias.
É melhor separar `VK_PIPELINE_STAGE_VERTEX_SHADER_BIT` e `VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT`, marcando os recursos de acordo com os estágios que realmente os utilizam.
Se você usar uma barreira ampla demais — como `VK_PIPELINE_STAGE_ALL_COMMANDS_BIT` — poderá forçar a GPU a concluir todo o trabalho pendente de fragmentos antes mesmo de poder iniciar o passe de *binning* do próximo conjunto de desenhos.
Em vez disso, use os estágios e máscaras de acesso mais específicos possíveis.
Por exemplo, se um *compute shader* produz dados para um *vertex buffer*, a barreira deve sincronizar apenas o estágio de computação com o estágio de entrada de vértices.
Isso permite que o motor de geometria do *tiler* comece a trabalhar assim que os dados estiverem prontos, mesmo que as unidades de fragmento ainda estejam ocupadas com uma tarefa anterior.

### Teste de Profundidade e Remoção de Superfícies Ocultas (HSR)

Muitos *tilers* podem ajudar a reduzir o impacto do *overdraw* por meio de Remoção de Superfícies Ocultas (*Hidden Surface Removal* — HSR) em hardware ou *forward pixel killing*, embora o nível de suporte varie entre implementações e o *overdraw* ainda tenha um custo.
Para ajudar essas otimizações de hardware a funcionarem de maneira eficaz (quando suportadas):

* Use um `VkCompareOp` consistente (normalmente `LESS` ou `LESS_OR_EQUAL`) ao longo de todo o *render pass*. Mudanças frequentes na função de comparação de profundidade podem desabilitar o descarte de profundidade em hardware (*hardware depth culling*).
* Habilite a escrita de profundidade (`depthWriteEnable`) sempre que possível. Se estiver desabilitada, a GPU não consegue atualizar seus blocos internos de descarte de profundidade, resultando em mais *overdraw* para desenhos subsequentes.
* Evite habilitar "Alpha to Coverage" simultaneamente com o teste de profundidade, a menos que seja necessário, pois isso pode consumir recursos extras de hardware e reduzir a eficiência de execução em alguns *tilers*.
* Evite usar `discard` ou escrever em `gl_FragDepth` em seus shaders, a menos que seja absolutamente necessário, pois essas operações podem forçar a GPU a desabilitar o teste de profundidade antecipado (*early-Z*) e aguardar o término do *fragment shader* antes de determinar a visibilidade.

Projetos modernos, como a Arm Immortalis-G925, evoluem ainda mais esses conceitos com recursos como um **pré-passe de fragmentos em hardware** (*hardware fragment pre-pass*) que pode lidar automaticamente com a redução de *overdraw*.
Embora a ordenação manual de frente para trás (*front-to-back*) tenha sido por muito tempo uma recomendação fundamental para ajudar o hardware, essas arquiteturas mais novas frequentemente conseguem lidar com a otimização sem intervenção do lado da aplicação.

### Precisão e Otimização de Texturas

Usar `mediump` (16 bits) em vez de `highp` (32 bits) nos seus shaders é uma otimização clássica para dispositivos móveis.
Embora isso seja tecnicamente ortogonal ao processo de *tiling*, é altamente recomendado para GPUs móveis porque reduz significativamente a largura de banda de memória e a pressão sobre registradores.
Muitos desenvolvedores preferem usar tipos explícitos, como `float16`, quando suportados pelo hardware e pelas extensões.
Observe que algumas GPUs desktop modernas também se beneficiam da taxa de transferência e do armazenamento em `float16`.

Trate `mediump` como uma dica para o hardware, não como uma garantia.
Algumas GPUs ainda podem executar com precisão completa de 32 bits internamente, enquanto outras exibirão artefatos visíveis.
Testar no maior número possível de dispositivos é a única maneira de ter certeza de que suas escolhas de precisão são seguras, pois um shader que parece perfeito em um dispositivo pode falhar em outro que realmente emprega matemática de 16 bits.
Sempre verifique o desempenho de suas otimizações com `float16`: adicionar `float16` a tudo sem consideração cuidadosa geralmente não é uma boa ideia.
Em alguns casos, isso apenas introduz conversões desnecessárias (`f32 → f16 → f32`) e, embora a maioria dos compiladores de GPUs móveis consiga detectar e otimizar isso, as heurísticas nem sempre são confiáveis.

Outro truque sutil é a **pré-busca de texturas** (*texture prefetch*).
Os *tilers* são muito eficientes na busca de dados de textura quando as coordenadas de textura são "previsíveis" — o que normalmente significa que são passadas diretamente do *vertex shader*.
Idealmente, qualquer manipulação de coordenadas (como escala ou deslocamentos) deve ser feita no *vertex shader*.
Se você executar cálculos complexos nas suas coordenadas dentro do *fragment shader* antes da amostragem, poderá paralisar as unidades de pré-busca do hardware.

Você também pode aproveitar **padrões de reutilização de texturas**.
Muitas GPUs móveis conseguem otimizar cenários em que você amostra múltiplas texturas usando as mesmas coordenadas, ou amostra a mesma textura com deslocamentos (*offsets*) diferentes.
Agrupar essas operações — por exemplo, usando uma coordenada base e um conjunto de deslocamentos constantes — permite que o hardware reduza requisições de memória e diminua o consumo de energia.
Amostradores (*samplers*) avançados em alguns hardwares podem até executar operações como convolução ou filtros de máximo e mínimo diretamente dentro da unidade de amostragem se o shader estiver estruturado corretamente.

## Resumo das Boas Práticas

Se você deseja que sua aplicação Vulkan tenha um bom desempenho em hardware baseado em *tiles*, concentre-se nestes princípios fundamentais:

1. **Comunique sua intenção claramente.** Use `loadOp` e `storeOp` para informar à GPU quando ela pode descartar dados em vez de desperdiçar largura de banda.
2. **Mantenha os dados *on-chip*.** Aproveite anexos transientes, alocação preguiçosa de memória e extensões como `VK_KHR_dynamic_rendering_local_read` para evitar viagens de ida e volta à memória externa.
3. **Otimize o passe de *binning*.** Separe as posições dos vértices de outros atributos para reduzir a quantidade de dados que o motor de geometria precisa ler.
4. **Permita a sobreposição de estágios.** Use barreiras de pipeline específicas (por exemplo, separando `VERTEX_SHADER_BIT` e `FRAGMENT_SHADER_BIT`) para garantir que os passes de *binning* e de fragmentos possam se sobrepor ao máximo.
5. **Aproveite o descarte de profundidade em hardware.** Use operações de comparação de profundidade consistentes e habilite escritas de profundidade sempre que possível para manter ativos a Remoção de Superfícies Ocultas (HSR) e o *early-Z* do hardware.
6. **Seja inteligente com texturas.** Realize cálculos de coordenadas no *vertex shader* para habilitar a pré-busca em hardware e agrupe operações de amostragem semelhantes para aproveitar as unidades de reutilização de textura.
7. **Gerencie a precisão com cuidado.** Use `mediump` ou tipos explícitos de 16 bits para melhorar a largura de banda e a ocupação em GPUs móveis, lembrando que algumas GPUs desktop também podem se beneficiar da matemática de 16 bits. Sempre verifique os resultados visuais em uma variedade de hardwares de destino.

## Recursos Adicionais

Para informações mais aprofundadas, consulte os guias de desempenho dos principais fabricantes de GPU:

* **ARM Mali GPU Best Practices**: [Guia oficial da ARM para tilers](https://developer.arm.com/documentation/101897/latest/)
* **Imagination PowerVR Architecture**: [Aprofundamento na arquitetura tiler](https://docs.imgtec.com/starter-guides/powervr-architecture/html/index.html)
* **HUAWEI Maleoon GPU Best Practices**: [Otimizações amplamente aplicáveis para tilers móveis](https://developer.huawei.com/consumer/en/doc/best-practices/bpta-maleoon-gpu-best-practices)
* **Samsung GPU framebuffer**: [Explica como otimizar o uso do framebuffer para melhor desempenho](https://developer.samsung.com/galaxy-gamedev/resources/articles/gpu-framebuffer.html)
