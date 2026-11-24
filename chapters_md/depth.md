# Profundidade (*Depth*)

O termo `depth` (profundidade) é utilizado em diversos pontos da Especificação Vulkan (consulte o capítulo sobre a Especificação Vulkan). Este capítulo tem como objetivo apresentar uma visão geral das várias terminologias de "profundidade" utilizadas em Vulkan. É necessário algum conhecimento básico de gráficos 3D para aproveitar ao máximo este capítulo.

> **Nota:** Embora o *stencil* esteja intimamente relacionado à profundidade, este capítulo não tem o objetivo de abordá-lo além dos nomes presentes na API.

* [Pipeline Gráfico](#pipeline-gráfico)
* [Formatos de Profundidade](#formatos-de-profundidade)
* [Depth Buffer como uma VkImage](#depth-buffer-como-uma-vkimage)
  * [Layout](#layout)
  * [Limpeza (*Clearing*)](#limpeza-clearing)
* [Pré-rasterização](#pré-rasterização)
  * [Recorte de Primitivas (*Primitive Clipping*)](#recorte-de-primitivas-primitive-clipping)
    * [Clipping e culling definidos pelo usuário](#clipping-e-culling-definidos-pelo-usuário)
    * [Portando a partir do OpenGL](#portando-a-partir-do-opengl)
  * [Transformação de Viewport](#transformação-de-viewport)
    * [Intervalo de Profundidade (*Depth Range*)](#intervalo-de-profundidade-depth-range)
* [Rasterização](#rasterização)
  * [Depth Bias](#depth-bias)
* [Pós-rasterização](#pós-rasterização)
  * [Fragment Shader](#fragment-shader)
    * [Profundidade conservadora (*Conservative depth*)](#profundidade-conservadora-conservative-depth)
  * [Processamento por amostra e máscara de cobertura](#processamento-por-amostra-e-máscara-de-cobertura)
    * [Resolvendo o depth buffer](#resolvendo-o-depth-buffer)
  * [Limites de Profundidade (*Depth Bounds*)](#limites-de-profundidade-depth-bounds)
  * [Teste de Profundidade (*Depth Test*)](#teste-de-profundidade-depth-test)
    * [Operação de Comparação de Profundidade](#operação-de-comparação-de-profundidade)
    * [Escritas no Depth Buffer](#escritas-no-depth-buffer)
    * [Depth Clamping](#depth-clamping)

## Pipeline Gráfico

O conceito de "profundidade" é utilizado apenas em *pipelines* gráficos em Vulkan (consulte o capítulo sobre O que o Vulkan Pode Fazer) e só entra em efeito quando uma chamada de desenho (*draw call*) é submetida.

Dentro de `VkGraphicsPipelineCreateInfo`, existem diversos valores relacionados a `depth` que podem ser controlados. Alguns estados podem inclusive ser configurados de forma dinâmica (consulte o capítulo sobre Estado Dinâmico).

## Formatos de Profundidade

Existem alguns formatos de profundidade diferentes para os quais uma implementação pode expor suporte em Vulkan.

Para **leitura** de uma imagem de profundidade, apenas `VK_FORMAT_D16_UNORM` e `VK_FORMAT_D32_SFLOAT` têm suporte obrigatório para leitura via amostragem (*sampling*) ou operações de *blit*.

Para **escrita** em uma imagem de profundidade, `VK_FORMAT_D16_UNORM` tem suporte obrigatório. Além disso, pelo menos um formato de (`VK_FORMAT_X8_D24_UNORM_PACK32` **ou** `VK_FORMAT_D32_SFLOAT`) **e** um formato de (`VK_FORMAT_D24_UNORM_S8_UINT` **ou** `VK_FORMAT_D32_SFLOAT_S8_UINT`) também devem ser suportados. Isso exigirá alguma lógica adicional ao decidir qual formato usar caso **tanto** profundidade quanto *stencil* sejam necessários no mesmo formato.

```cpp
// Exemplo de lógica de consulta de formatos
VkFormatProperties properties{};

vkGetPhysicalDeviceFormatProperties(
    physicalDevice, VK_FORMAT_D24_UNORM_S8_UINT, &properties);
const bool d24s8Support =
    (properties.optimalTilingFeatures & VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT) != 0;

vkGetPhysicalDeviceFormatProperties(
    physicalDevice, VK_FORMAT_D32_SFLOAT_S8_UINT, &properties);
const bool d32s8Support =
    (properties.optimalTilingFeatures & VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT) != 0;

assert(d24s8Support || d32s8Support); // sempre haverá suporte a pelo menos um dos dois
```

## Depth Buffer como uma VkImage

O termo "*depth buffer*" é muito usado ao falar de gráficos, mas em Vulkan ele é simplesmente uma `VkImage`/`VkImageView` que um `VkFramebuffer` pode referenciar no momento do desenho. Ao criar um `VkRenderPass`, o campo `pDepthStencilAttachment` aponta para o *attachment* de profundidade no *framebuffer*.

Para usar `pDepthStencilAttachment`, a `VkImage` subjacente precisa ter sido criada com `VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT`.

Ao executar operações como *image barriers* ou limpezas (*clearing*) em que `VkImageAspectFlags` é exigido, utiliza-se `VK_IMAGE_ASPECT_DEPTH_BIT` para referenciar a memória de profundidade.

### Layout

Ao selecionar o `VkImageLayout`, existem alguns layouts que permitem **tanto** leitura quanto escrita na imagem:

* `VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL`
* `VK_IMAGE_LAYOUT_DEPTH_ATTACHMENT_STENCIL_READ_ONLY_OPTIMAL`
* `VK_IMAGE_LAYOUT_DEPTH_ATTACHMENT_OPTIMAL`

bem como layouts que permitem **apenas** leitura da imagem:

* `VK_IMAGE_LAYOUT_DEPTH_STENCIL_READ_ONLY_OPTIMAL`
* `VK_IMAGE_LAYOUT_DEPTH_READ_ONLY_STENCIL_ATTACHMENT_OPTIMAL`
* `VK_IMAGE_LAYOUT_DEPTH_READ_ONLY_OPTIMAL`

Ao realizar a transição de layout, certifique-se de definir as máscaras de acesso de profundidade adequadas necessárias tanto para leitura quanto para escrita na imagem de profundidade.

```cpp
// Exemplo de transição de layout indefinido para um depth attachment de leitura e escrita

// Exemplo em Vulkan Core
constexpr VkAccessFlags srcAccessMask = 0;
constexpr VkAccessFlags dstAccessMask =
    VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT |
    VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT;
constexpr VkPipelineStageFlags sourceStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
constexpr VkPipelineStageFlags destinationStage =
    VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT |
    VK_PIPELINE_STAGE_LATE_FRAGMENT_TESTS_BIT;

// Usando VK_KHR_synchronization2 (ou Vulkan 1.3)
constexpr VkAccessFlags2KHR srcAccessMask2 = VK_ACCESS_2_NONE_KHR;
constexpr VkAccessFlags2KHR dstAccessMask2 =
    VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_READ_BIT_KHR |
    VK_ACCESS_2_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT_KHR;
constexpr VkPipelineStageFlags2KHR sourceStage2 = VK_PIPELINE_STAGE_2_NONE_KHR;
constexpr VkPipelineStageFlags2KHR destinationStage2 =
    VK_PIPELINE_STAGE_2_EARLY_FRAGMENT_TESTS_BIT_KHR |
    VK_PIPELINE_STAGE_2_LATE_FRAGMENT_TESTS_BIT_KHR;
```

> **Nota:** Se você não tiver certeza se deve usar apenas *early* ou *late fragment tests* na sua aplicação, utilize ambos.

### Limpeza (*Clearing*)

É sempre melhor limpar um *depth buffer* no início do *render pass* definindo `loadOp` como `VK_ATTACHMENT_LOAD_OP_CLEAR`, mas imagens de profundidade também podem ser limpas fora de um *render pass* utilizando `vkCmdClearDepthStencilImage`.

Ao limpar, observe que `VkClearValue` é uma `union` e que `VkClearDepthStencilValue depthStencil` deve ser preenchido em vez do valor de limpeza de cor.

## Pré-rasterização

No *pipeline* gráfico, há uma série de [estágios de shader de pré-rasterização](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-graphics-subsets-pre-rasterization) que geram primitivas a serem rasterizadas. Antes de chegar à etapa de rasterização, a posição `vec4` final (`gl_Position`) do último estágio de pré-rasterização passa pelo [Pós-processamento de Vértices de Função Fixa](https://docs.vulkan.org/spec/latest/chapters/vertexpostproc.html) (*Fixed-Function Vertex Post-Processing*).

A imagem a seguir oferece uma visão geral de alto nível dos vários nomes de coordenadas e operações que ocorrem antes da rasterização:

![Fluxo de coordenadas e transformações de profundidade antes da rasterização](images/depth_coordinates_flow.png)

### Recorte de Primitivas (*Primitive Clipping*)

O recorte (*clipping*) sempre ocorre — a menos que se utilize `depthClipEnable` da extensão `VK_EXT_depth_clip_enable` (consulte o capítulo sobre Extensões de Camadas de Tradução) — caso a primitiva esteja fora do *view volume*. Em Vulkan, isso é expresso para a profundidade como:

```text
0 <= Zc <= Wc
```

Quando as coordenadas normalizadas do dispositivo (*Normalized Device Coordinates*, NDC) são calculadas, qualquer valor fora de `[0, 1]` é recortado.

Alguns exemplos onde `Zd` é o resultado de `Zc` / `Wc`:

* `vec4(1.0, 1.0, 2.0, 2.0)` — não recortado (`Zd` == `1.0`)
* `vec4(1.0, 1.0, 0.0, 2.0)` — não recortado (`Zd` == `0.0`)
* `vec4(1.0, 1.0, -1.0, 2.0)` — recortado (`Zd` == `-0.5`)
* `vec4(1.0, 1.0, -1.0, -2.0)` — recortado (`Zd` == `0.5`)

#### Clipping e culling definidos pelo usuário

Usando os *arrays* embutidos `ClipDistance` e `CullDistance`, os [estágios de shader de pré-rasterização](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-graphics-subsets-pre-rasterization) podem configurar [clipping e culling definidos pelo usuário](https://www.khronos.org/opengl/wiki/Vertex_Post-Processing#User-defined_clipping).

No último estágio de *shader* de pré-rasterização, esses valores serão interpolados linearmente ao longo da primitiva, e a porção da primitiva com distâncias interpoladas menores que `0` será considerada fora do volume de recorte. Se `ClipDistance` ou `CullDistance` forem usados em seguida por um *fragment shader*, eles conterão esses valores interpolados linearmente.

> **Nota:** `ClipDistance` e `CullDistance` correspondem a `gl_ClipDistance[]` e `gl_CullDistance[]` em GLSL.

#### Portando a partir do OpenGL

No OpenGL, o *view volume* é expresso como:

```text
-Wc <= Zc <= Wc
```

e qualquer valor fora de `[-1, 1]` é recortado.

A extensão [VK_EXT_depth_clip_control](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_depth_clip_control.html) foi adicionada para permitir a implementação eficiente de camadas de OpenGL sobre Vulkan. Ao definir `VkPipelineViewportDepthClipControlCreateInfoEXT::negativeOneToOne` como `VK_TRUE` na criação do `VkPipeline`, ele passará a utilizar o *view volume* `[-1, 1]` do OpenGL.

Se `VK_EXT_depth_clip_control` não estiver disponível, a [solução alternativa atual](https://github.com/KhronosGroup/Vulkan-Docs/issues/1054#issuecomment-547202276) consiste em realizar a conversão no *shader* de pré-rasterização:

```glsl
// Converte de [-1, 1] para [0, 1]
position.z = (position.z + position.w) * 0.5;
```

### Transformação de Viewport

A transformação de *viewport* converte as coordenadas normalizadas do dispositivo (NDC) em coordenadas de *framebuffer*, com base em um retângulo de *viewport* e um intervalo de profundidade.

A lista de *viewports* utilizados no *pipeline* é expressa por `VkPipelineViewportStateCreateInfo::pViewports`, e `VkPipelineViewportStateCreateInfo::viewportCount` define a quantidade de *viewports* em uso. Se `VkPhysicalDeviceFeatures::multiViewport` não estiver habilitado, deve haver apenas 1 *viewport*.

> **Nota:** O valor do *viewport* pode ser definido dinamicamente (consulte o capítulo sobre Estado Dinâmico) usando `VK_DYNAMIC_STATE_VIEWPORT` ou `VK_DYNAMIC_STATE_VIEWPORT_WITH_COUNT_EXT` da extensão [VK_EXT_extended_dynamic_state](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_extended_dynamic_state.html).

#### Intervalo de Profundidade (*Depth Range*)

Cada *viewport* possui os valores `VkViewport::minDepth` e `VkViewport::maxDepth`, que definem o "intervalo de profundidade" (*depth range*) para aquele *viewport*.

> **Nota:** Apesar dos nomes, `minDepth` pode ser menor, igual ou maior que `maxDepth`.

Os valores de `minDepth` e `maxDepth` são restritos ao intervalo inclusivo entre `0.0` e `1.0`. Caso a extensão [VK_EXT_depth_range_unrestricted](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_depth_range_unrestricted.html) esteja habilitada, essa restrição deixa de existir.

A coordenada de profundidade no *framebuffer* `Zf` é representada por:

```text
Zf = Pz * Zd + Oz
```

* `Zd` = `Zc` / `Wc` (consulte [Recorte de Primitivas](#recorte-de-primitivas-primitive-clipping))
* `Oz` = `minDepth`
* `Pz` = `maxDepth` - `minDepth`

## Rasterização

### Depth Bias

Os valores de profundidade de todos os fragmentos gerados pela rasterização de um polígono podem ser deslocados por um único valor calculado para esse polígono. Se `VkPipelineRasterizationStateCreateInfo::depthBiasEnable` for `VK_FALSE` no momento do desenho, nenhum *depth bias* é aplicado.

Utilizando `depthBiasConstantFactor`, `depthBiasClamp` e `depthBiasSlopeFactor` em `VkPipelineRasterizationStateCreateInfo`, o *depth bias* [pode ser calculado](https://docs.vulkan.org/spec/latest/chapters/primsrast.html#primsrast-depthbias).

> **Nota:** Requer que o recurso `VkPhysicalDeviceFeatures::depthBiasClamp` seja suportado; caso contrário, `VkPipelineRasterizationStateCreateInfo::depthBiasClamp` deve ser `0.0f`.

> **Nota:** Os valores de *depth bias* podem ser definidos dinamicamente (consulte o capítulo sobre Estado Dinâmico) usando `VK_DYNAMIC_STATE_DEPTH_BIAS` ou `VK_DYNAMIC_STATE_DEPTH_BIAS_ENABLE_EXT` da extensão [VK_EXT_extended_dynamic_state2](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_extended_dynamic_state2.html).

## Pós-rasterização

### Fragment Shader

A variável embutida de entrada `FragCoord` representa a coordenada no *framebuffer*. O componente `Z` é o valor de profundidade interpolado da primitiva. Esse valor do componente `Z` será escrito em `FragDepth` caso o *shader* não escreva nele. Se o *shader* escrever dinamicamente em `FragDepth`, o modo de execução (*Execution Mode*) `DepthReplacing` deve ser declarado (isso é feito automaticamente por ferramentas como o `glslang`).

> **Nota:** `FragDepth` e `FragCoord` correspondem a `gl_FragDepth` e `gl_FragCoord` em GLSL.

> **Nota:** Ao usar `OpTypeImage` em SPIR-V, o operando `Depth` é ignorado em Vulkan.

#### Profundidade conservadora (*Conservative depth*)

Os modos de execução `DepthGreater`, `DepthLess` e `DepthUnchanged` permitem uma possível otimização para implementações que [dependem da execução de um teste de profundidade antecipado antes do fragment shader](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_conservative_depth.txt). Isso pode ser feito facilmente em GLSL declarando `gl_FragDepth` com o qualificador de layout apropriado:

```glsl
// assume que pode ser modificado de qualquer forma
layout(depth_any) out float gl_FragDepth;

// assume que pode ser modificado de modo que seu valor apenas aumente
layout(depth_greater) out float gl_FragDepth;

// assume que pode ser modificado de modo que seu valor apenas diminua
layout(depth_less) out float gl_FragDepth;

// assume que não será modificado
layout(depth_unchanged) out float gl_FragDepth;
```

Violar a condição declarada resulta em comportamento indefinido (*undefined behavior*).

### Processamento por amostra e máscara de cobertura

A etapa de pós-rasterização a seguir ocorre como uma operação "por amostra" (*per-sample*). Isso significa que, ao utilizar [multisampling](https://docs.vulkan.org/spec/latest/chapters/fragops.html#fragops-covg) com um *color attachment*, qualquer `VkImage` usada como "*depth buffer*" também precisa ter sido criada com o mesmo valor de `VkSampleCountFlagBits`.

Cada fragmento possui uma [máscara de cobertura](https://docs.vulkan.org/spec/latest/chapters/primsrast.html#primsrast-multisampling-coverage-mask) (*coverage mask*) baseada em quais amostras dentro desse fragmento são determinadas como estando dentro da área da primitiva que o gerou. Se uma operação de fragmento resultar em todos os bits da máscara de cobertura iguais a `0`, o fragmento é descartado.

#### Resolvendo o depth buffer

Em Vulkan, é possível usar a extensão `VK_KHR_depth_stencil_resolve` (promovida ao núcleo do Vulkan na versão 1.2 — consulte o capítulo sobre Extensões de Limpeza/Core) para resolver *attachments* de profundidade/*stencil* com *multisampling* em um *subpass*, de maneira semelhante aos *color attachments*.

### Limites de Profundidade (*Depth Bounds*)

> **Nota:** Requer que o recurso `VkPhysicalDeviceFeatures::depthBounds` seja suportado.

Quando `VkPipelineDepthStencilStateCreateInfo::depthBoundsTestEnable` está habilitado, cada valor `Za` no *depth attachment* é verificado para checar se está dentro do intervalo definido por `VkPipelineDepthStencilStateCreateInfo::minDepthBounds` e `VkPipelineDepthStencilStateCreateInfo::maxDepthBounds`. Se o valor estiver fora desses limites, a [máscara de cobertura](https://docs.vulkan.org/spec/latest/chapters/primsrast.html#primsrast-multisampling-coverage-mask) é zerada.

> **Nota:** Os valores de *depth bounds* podem ser definidos dinamicamente (consulte o capítulo sobre Estado Dinâmico) usando `VK_DYNAMIC_STATE_DEPTH_BOUNDS` ou `VK_DYNAMIC_STATE_DEPTH_BOUNDS_TEST_ENABLE_EXT` da extensão [VK_EXT_extended_dynamic_state](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_extended_dynamic_state.html).

### Teste de Profundidade (*Depth Test*)

O teste de profundidade compara a coordenada de profundidade do *framebuffer* `Zf` com o valor de profundidade `Za` armazenado no *depth attachment*. Se o teste falhar, o fragmento é descartado. Se o teste passar, o *depth attachment* será atualizado com a profundidade de saída do fragmento. O campo `VkPipelineDepthStencilStateCreateInfo::depthTestEnable` é usado para habilitar ou desabilitar esse teste no *pipeline*.

A imagem a seguir apresenta uma visão geral de alto nível do teste de profundidade:

![Diagrama de alto nível do teste de profundidade](images/depth_test.svg)

#### Operação de Comparação de Profundidade

O campo `VkPipelineDepthStencilStateCreateInfo::depthCompareOp` define a função de comparação usada no teste de profundidade.

Um exemplo onde `depthCompareOp` == `VK_COMPARE_OP_LESS` (`Zf` < `Za`):

* `Zf` = 1.0 | `Za` = 2.0 | teste passa
* `Zf` = 1.0 | `Za` = 1.0 | teste falha
* `Zf` = 1.0 | `Za` = 0.0 | teste falha

> **Nota:** Os valores de `depthTestEnable` e `depthCompareOp` podem ser definidos dinamicamente (consulte o capítulo sobre Estado Dinâmico) usando `VK_DYNAMIC_STATE_DEPTH_TEST_ENABLE_EXT` e `VK_DYNAMIC_STATE_DEPTH_COMPARE_OP_EXT` da extensão [VK_EXT_extended_dynamic_state](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_extended_dynamic_state.html).

#### Escritas no Depth Buffer

Mesmo que o teste de profundidade passe, se `VkPipelineDepthStencilStateCreateInfo::depthWriteEnable` estiver definido como `VK_FALSE`, o valor não será gravado no *depth attachment*. O principal motivo para isso é que o próprio teste de profundidade ainda atualiza a [máscara de cobertura](https://docs.vulkan.org/spec/latest/chapters/primsrast.html#primsrast-multisampling-coverage-mask), o que pode ser aproveitado por determinadas técnicas de renderização.

> **Nota:** O valor de `depthWriteEnable` pode ser definido dinamicamente (consulte o capítulo sobre Estado Dinâmico) usando `VK_DYNAMIC_STATE_DEPTH_WRITE_ENABLE_EXT` da extensão [VK_EXT_extended_dynamic_state](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_extended_dynamic_state.html).

#### Depth Clamping

> **Nota:** Requer que o recurso `VkPhysicalDeviceFeatures::depthClamp` seja suportado.

Antes do teste de profundidade, se `VkPipelineRasterizationStateCreateInfo::depthClampEnable` estiver habilitado, antes que o `Zf` da amostra seja comparado a `Za`, `Zf` é limitado (*clamped*) ao intervalo `[min(n, f), max(n, f)]`, onde `n` e `f` são respectivamente os valores `minDepth` e `maxDepth` do intervalo de profundidade do *viewport* utilizado por esse fragmento.
