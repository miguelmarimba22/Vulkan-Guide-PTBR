# Topologia de Primitivas (*Primitive Topology*)

Ao utilizar um *pipeline* gráfico, existem 2 tipos de *shaders*: [shaders de pré-rasterização](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-graphics-subsets-pre-rasterization) e *fragment shaders*.

## Estágios de Pré-rasterização

A seguir estão os diversos estágios de *shader* que podem ser utilizados na pré-rasterização:

![Diagrama dos estágios de shader de pré-rasterização](images/primitive_topology_stages.svg)

O ponto principal a reter aqui é que o último estágio de pré-rasterização pode ser qualquer um dos seguintes:

* `VK_SHADER_STAGE_VERTEX_BIT`
* `VK_SHADER_STAGE_MESH_BIT_EXT`
* `VK_SHADER_STAGE_GEOMETRY_BIT`
* `VK_SHADER_STAGE_TESSELLATION_EVALUATION_BIT` (deve estar sempre acompanhado de um estágio de controle de tesselação — *tessellation control stage*)

## Tipos de Primitivas

Um dos objetivos da pré-rasterização é preparar todas as `primitivas` para a rasterização. A `primitiva` é a menor unidade organizada de vértices que forma uma figura geométrica básica processada pelo rasterizador. A `topologia` dessas primitivas pode ser definida por meio dos valores de [VkPrimitiveTopology](https://docs.vulkan.org/spec/latest/chapters/drawing.html#VkPrimitiveTopology).

A imagem a seguir apresenta um exemplo básico de como 6 vértices podem ser conectados em diferentes valores de `VkPrimitiveTopology`:

![Exemplo visual de 6 vértices conectados em diferentes valores de VkPrimitiveTopology](images/primitive_topology_example.svg)

## Diferentes Topologias Efetivas

É possível que múltiplas [Classes de Topologia](https://docs.vulkan.org/spec/latest/chapters/drawing.html#drawing-primitive-topology-class) (*Topology Classes*) sejam utilizadas ao longo de um *pipeline* gráfico. É importante saber em que ponto do *pipeline* você está ao discutir "topologia".

### Montagem de Entrada de Vértices (*Vertex Input Assembly*)

`VkPipelineInputAssemblyStateCreateInfo::topology` (ou definido dinamicamente com `vkCmdSetPrimitiveTopology`) determina o que é fornecido como entrada para o *vertex shader*.

Ao utilizar *mesh shaders*, esse valor é ignorado.

> **Nota:** Se você quiser usar `VK_DYNAMIC_STATE_PRIMITIVE_TOPOLOGY` no seu *pipeline*, certifique-se de verificar a propriedade `dynamicPrimitiveTopologyUnrestricted`. Alguns hardwares permitem ajustar dinamicamente a topologia de primitivas de entrada apenas dentro da mesma [Classe de Topologia](https://docs.vulkan.org/spec/latest/chapters/drawing.html#drawing-primitive-topology-class).

### Modo de Execução do Shader (*Shader Execution Mode*)

Alguns estágios possuem um `Execution Mode` (termo do SPIR-V) definido diretamente no próprio código do *shader*. Isso permite que os autores de *shaders* determinem qual topologia o *shader* irá produzir na saída.

É possível combinar múltiplos estágios, como tesselação e geometria juntos. Nesse caso, a topologia efetiva é definida apenas pelo `Execution Mode` especificado no último estágio de *shader* de pré-rasterização do *pipeline*.

#### Modo de Execução de saída de Mesh

O estágio de *mesh* definirá `OutputPoints`, `OutputLinesEXT` ou `OutputTrianglesEXT`.

[Testar online](https://godbolt.org/z/jhhsoTfnT)

```glsl
#extension GL_EXT_mesh_shader : require

// Apenas 1 dos 3 é permitido
layout(points) out;
layout(lines) out;
layout(triangles) out;
```

#### Modo de Execução de saída de Tesselação

O estágio de avaliação de tesselação (*tessellation evaluation*) definirá `Triangles`, `Quads` ou `Isolines`.

[Testar online](https://godbolt.org/z/PbPT4WWrr)

```glsl
// Apenas 1 dos 3 é permitido
layout(quads) in;
layout(isolines) in;
layout(triangles) in;
```

#### Modo de Execução de saída de Geometria

Um estágio de geometria (*geometry shader*) definirá `OutputPoints`, `OutputLineStrip` ou `OutputTriangleStrip`.

[Testar online](https://godbolt.org/z/K9nn98oGv)

```glsl
// Apenas 1 dos 3 é permitido
layout(points) out;
layout(line_strip) out;
layout(triangle_strip) out;
```

### Modo de Polígono (*Polygon Mode*)

Depois de criar suas primitivas, você pode definir o [VkPolygonMode](https://docs.vulkan.org/spec/latest/chapters/primsrast.html#VkPolygonMode). Isso controla como a primitiva será "preenchida".

![Ilustração dos modos de preenchimento de polígono em VkPolygonMode](images/primitive_topology_polygon_mode.svg)

Se você tiver um *vertex shader* com entrada `VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST` e durante a rasterização utilizar `VK_POLYGON_MODE_LINE`, a topologia efetiva nesse momento passa a pertencer à [Classe de Topologia](https://docs.vulkan.org/spec/latest/chapters/drawing.html#drawing-primitive-topology-class) de Linha (*Line*). Isso significa que parâmetros como `lineWidth` serão aplicados ao desenhar o polígono com `VK_POLYGON_MODE_LINE`.

## rasterizerDiscardEnable

`VkPipelineRasterizationStateCreateInfo::rasterizerDiscardEnable` (ou definido dinamicamente com `vkCmdSetRasterizerDiscardEnable`) controla se as primitivas são descartadas imediatamente antes do estágio de rasterização. Isso é importante porque, quando definido como `VK_TRUE`, o hardware de rasterização não é executado. Há muitos erros de *Valid Usage* que deixam de ocorrer quando esse valor é `VK_TRUE`, pois parte do hardware de topologia não é utilizada e pode ser ignorada.

> **Nota:** Habilitar esse estado destina-se a casos de uso muito específicos. Antes dos *compute shaders*, era uma técnica comum para gravar a saída de um *geometry shader* em um buffer. Atualmente, pode ser usada para depurar ou fazer *profiling* de gargalos que não envolvem rasterização.
