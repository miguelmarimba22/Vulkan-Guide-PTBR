# Processamento de Dados de Entrada de Vértices

Este capítulo é uma visão geral do [capítulo de Processamento de Vértices de Função Fixa na especificação](https://docs.vulkan.org/spec/latest/chapters/fxvertex.html) (*Fixed-Function Vertex Processing*), com o objetivo de fornecer um entendimento de alto nível sobre como uma aplicação pode mapear dados para o *vertex shader* ao utilizar um *pipeline* gráfico.

Também é importante lembrar que o Vulkan é uma ferramenta que pode ser usada de diversas maneiras. Os exemplos a seguir têm fins educacionais para demonstrar como os dados de vértices **podem** ser organizados.

Para mais informações sobre `Location` e `Component`, consulte o capítulo sobre *Interface de Location e Component*.

## Bindings e Locations

Um `binding` está associado a uma posição no *vertex buffer* a partir da qual o *vertex shader* começará a ler dados durante uma chamada `vkCmdDraw*`. Alterar os `bindings` **não** exige nenhuma modificação no código-fonte do *vertex shader* da aplicação.

Como exemplo, o código a seguir corresponde ao diagrama de como os `bindings` funcionam:

```cpp
// Usando o mesmo buffer para ambos os bindings neste exemplo
const std::array<VkBuffer, 2> buffers{ vertex_buffer, vertex_buffer };
constexpr std::array<VkDeviceSize, 2> offsets{ 8, 0 };

vkCmdBindVertexBuffers(
    my_command_buffer,                     // commandBuffer
    0,                                     // firstBinding
    static_cast<uint32_t>(buffers.size()), // bindingCount
    buffers.data(),                        // pBuffers
    offsets.data()                         // pOffsets
);
```

![Diagrama de bindings no vertex buffer](images/vertex_input_data_processing_binding.png)

Os exemplos a seguir mostram várias maneiras de configurar seus valores de `binding` e `location` dependendo da organização dos seus dados de entrada.

### Exemplo A - Dados Empacotados

Para o primeiro exemplo, os dados de atributo por vértice terão o seguinte formato:

```cpp
struct Vertex {
    float x, y, z;
    uint8_t u, v;
};
```

![Dados empacotados de vértice](images/vertex_input_data_processing_example_a.png)

O código de criação do estado de entrada de vértices do *pipeline* ficará aproximadamente assim:

```cpp
constexpr VkVertexInputBindingDescription binding{
    .binding = 0,
    .stride = sizeof(Vertex),
    .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
};

constexpr std::array<VkVertexInputAttributeDescription, 2> attributes{{
    {
        .location = 0,
        .binding = binding.binding,
        .format = VK_FORMAT_R32G32B32_SFLOAT,
        .offset = 0,
    },
    {
        .location = 1,
        .binding = binding.binding,
        .format = VK_FORMAT_R8G8_UNORM,
        .offset = 3 * sizeof(float),
    },
}};

const VkPipelineVertexInputStateCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .vertexBindingDescriptionCount = 1,
    .pVertexBindingDescriptions = &binding,
    .vertexAttributeDescriptionCount = static_cast<uint32_t>(attributes.size()),
    .pVertexAttributeDescriptions = attributes.data(),
};
```

O código GLSL que consumiria esses dados poderia ser escrito assim:

```glsl
layout(location = 0) in vec3 inPos;
layout(location = 1) in uvec2 inUV;
```

### Exemplo B - Padding e Ajuste de Offset

Este exemplo analisa um caso em que os dados de vértice não estão fortemente empacotados e possuem *padding* extra:

```cpp
struct Vertex {
    float x, y, z, pad;
    uint8_t u, v;
};
```

A única alteração necessária é ajustar o `offset` na criação do *pipeline*:

```diff
     {
         .location = 1,
         .binding = binding.binding,
         .format = VK_FORMAT_R8G8_UNORM,
-        .offset = 3 * sizeof(float),
+        .offset = 4 * sizeof(float),
     },
```

Dessa forma, o deslocamento (*offset*) correto será definido para o local de onde `u` e `v` serão lidos.

![Ajuste de offset devido ao padding](images/vertex_input_data_processing_example_b_offset.png)

### Exemplo C - Dados Não Intercalados

Às vezes os dados não estão intercalados (*non-interleaved*). Nesse caso, você pode ter o seguinte:

```cpp
std::vector<float> position_data = { /* ... */ };
std::vector<uint8_t> uv_data = { /* ... */ };
```

![Dados de vértice não intercalados](images/vertex_input_data_processing_example_c.png)

Nesse caso, haverá 2 *bindings*, mas ainda assim 2 *locations*:

```cpp
constexpr std::array<VkVertexInputBindingDescription, 2> bindings{{
    {
        .binding = 0,
        .stride = 3 * sizeof(float),
        .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
    },
    {
        .binding = 1,
        .stride = 2 * sizeof(uint8_t),
        .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
    },
}};

constexpr std::array<VkVertexInputAttributeDescription, 2> attributes{{
    {
        .location = 0,
        .binding = bindings[0].binding,
        .format = VK_FORMAT_R32G32B32_SFLOAT,
        .offset = 0,
    },
    {
        .location = 1,
        .binding = bindings[1].binding,
        .format = VK_FORMAT_R8G8_UNORM,
        .offset = 0,
    },
}};

const VkPipelineVertexInputStateCreateInfo info{
    .sType = VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .vertexBindingDescriptionCount = static_cast<uint32_t>(bindings.size()),
    .pVertexBindingDescriptions = bindings.data(),
    .vertexAttributeDescriptionCount = static_cast<uint32_t>(attributes.size()),
    .pVertexAttributeDescriptions = attributes.data(),
};
```

O código GLSL não muda em relação ao Exemplo A:

```glsl
layout(location = 0) in vec3 inPos;
layout(location = 1) in uvec2 inUV;
```

### Exemplo D - 2 Bindings e 3 Locations

Este exemplo ajuda a ilustrar que `binding` e `location` são independentes um do outro.

Neste exemplo, os dados dos vértices estão distribuídos em dois buffers fornecidos no seguinte formato:

```cpp
struct TypeA {
    float x, y, z; // posição
    uint8_t u, v;  // UV
};

struct TypeB {
    float x, y, z; // normal
};

std::vector<TypeA> a = { /* ... */ };
std::vector<TypeB> b = { /* ... */ };
```

E o shader utilizado possui a seguinte interface:

```glsl
layout(location = 0) in vec3 inPos;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in uvec2 inUV;
```

Isso ainda pode ser mapeado corretamente configurando `VkVertexInputBindingDescription` e `VkVertexInputAttributeDescription` de forma adequada:

![Mapeamento de 2 bindings para 3 locations](images/vertex_input_data_processing_example_d.png)

```cpp
constexpr std::array<VkVertexInputBindingDescription, 2> bindings{{
    {
        .binding = 0,
        .stride = sizeof(TypeA),
        .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
    },
    {
        .binding = 1,
        .stride = sizeof(TypeB),
        .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
    },
}};

constexpr std::array<VkVertexInputAttributeDescription, 3> attributes{{
    {
        .location = 0,
        .binding = bindings[0].binding,
        .format = VK_FORMAT_R32G32B32_SFLOAT,
        .offset = 0,
    },
    {
        .location = 1,
        .binding = bindings[1].binding,
        .format = VK_FORMAT_R32G32B32_SFLOAT,
        .offset = 0,
    },
    {
        .location = 2,
        .binding = bindings[0].binding,
        .format = VK_FORMAT_R8G8_UNORM,
        .offset = 3 * sizeof(float),
    },
}};
```

![Visualização dos dados de vértice no Exemplo D](images/vertex_input_data_processing_example_d_vertex.png)

## Exemplo E - Entendendo o Formato do Atributo de Entrada

O campo `VkVertexInputAttributeDescription::format` pode ser motivo de confusão. O campo `format` apenas descreve o **tamanho** e o **tipo** dos dados que o shader deve ler.

A razão para usar os valores de `VkFormat` é que eles são bem definidos e correspondem aos layouts de entrada do *vertex shader*.

Para este exemplo, os dados de vértice consistem apenas em quatro floats:

```cpp
struct Vertex {
    float a, b, c, d;
};
```

Os dados lidos ficarão sobrepostos devido à forma como `format` e `offset` estão configurados:

```cpp
constexpr VkVertexInputBindingDescription binding{
    .binding = 0,
    .stride = sizeof(Vertex),
    .inputRate = VK_VERTEX_INPUT_RATE_VERTEX,
};

constexpr std::array<VkVertexInputAttributeDescription, 2> attributes{{
    {
        .location = 0,
        .binding = binding.binding,
        .format = VK_FORMAT_R32G32_SFLOAT, // Lê dois floats com sinal de 32 bits ('a' e 'b')
        .offset = 0,
    },
    {
        .location = 1,
        .binding = binding.binding,
        .format = VK_FORMAT_R32G32B32_SFLOAT, // Lê três floats com sinal de 32 bits ('b', 'c' e 'd')
        .offset = 1 * sizeof(float),
    },
}};
```

Ao ler os dados no shader, o valor será o mesmo onde houver sobreposição:

```glsl
layout(location = 0) in vec2 in0;
layout(location = 1) in vec2 in1;

// in0.y == in1.x
```

![Entendendo a sobreposição de formatos de atributos de entrada](images/vertex_input_data_processing_understanding_format.png)

É importante observar que `in1` é um `vec2`, enquanto o atributo de entrada é `VK_FORMAT_R32G32B32_SFLOAT`, o que não corresponde integralmente. De acordo com a especificação:

> Se o vertex shader tiver menos componentes, os componentes extras são descartados.

Portanto, neste caso, o último componente da `location` 1 (`d`) é descartado e não será lido pelo shader.

## Atribuição de Componentes

A [especificação](https://docs.vulkan.org/spec/latest/chapters/fxvertex.html#fxvertex-attrib-location) explica mais detalhadamente a atribuição de `Component`. A seguir, apresentamos uma visão geral do tópico.

### Preenchendo Componentes

Cada `location` em `VkVertexInputAttributeDescription` possui 4 componentes. O exemplo anterior já mostrou que componentes extras do `format` são descartados quando a entrada do shader tem menos componentes:

> `VK_FORMAT_R32G32B32_SFLOAT` possui 3 componentes, enquanto um `vec2` possui apenas 2.

Para o caso oposto, a especificação [possui uma tabela](https://docs.vulkan.org/spec/latest/chapters/textures.html#textures-conversion-to-rgba) mostrando como os componentes ausentes serão expandidos.

Isso significa que o exemplo:

```glsl
layout(location = 0) in vec3 inPos;
layout(location = 1) in uvec2 inUV;
```

![Atributos de entrada antes do preenchimento de componentes](images/vertex_input_data_processing_fill_0.png)

preencheria os exemplos acima da seguinte maneira:

```glsl
layout(location = 0) in vec4 inPos;
layout(location = 1) in uvec4 inUV;
```

![Atributos de entrada após o preenchimento automático de componentes](images/vertex_input_data_processing_fill_1.png)

## Definindo o Stride

Ao longo do tempo, o número de maneiras de definir o *stride* (passo em bytes entre elementos consecutivos) de um *binding* de entrada de vértices cresceu.

Originalmente, ao usar `vkCmdBindVertexBuffers`, o valor do *stride* era definido dentro do *pipeline* por meio de `VkVertexInputBindingDescription::stride`. No momento do desenho, a combinação de `vkCmdBindPipeline` e `vkCmdBindVertexBuffers` fornecia todo o estado necessário.

Mais tarde, `VK_EXT_vertex_input_dynamic_state` foi adicionada. Ela introduziu `VK_DYNAMIC_STATE_VERTEX_INPUT_EXT`, permitindo que as aplicações deixassem de definir os valores de entrada de vértices no *pipeline*. Em vez disso, você chama `vkCmdSetVertexInputEXT` dentro do *command buffer* para definir `VkVertexInputBindingDescription2EXT::stride`, junto com todos os outros valores de entrada de vértices.

Posteriormente, `VK_EXT_extended_dynamic_state` introduziu `VK_DYNAMIC_STATE_VERTEX_INPUT_BINDING_STRIDE`. Isso permite que o *pipeline* ignore a definição de `VkVertexInputBindingDescription::stride`. Em vez disso, o *stride* é definido dinamicamente por meio de `vkCmdBindVertexBuffers2`.

Surgiu então uma questão porque o *stride* podia ser definido tanto por `vkCmdSetVertexInputEXT` quanto por `vkCmdBindVertexBuffers2` antes de um desenho. Ficou determinado que o último valor definido antes da chamada de desenho é o que será utilizado.

Quando `vkCmdBindVertexBuffers3KHR` foi adicionada, ela introduziu `VkBindVertexBuffer3InfoKHR::setStride`. Isso permite que o usuário decida se a função deve atualizar o valor do *stride* ou deixá-lo inalterado antes de um desenho.
