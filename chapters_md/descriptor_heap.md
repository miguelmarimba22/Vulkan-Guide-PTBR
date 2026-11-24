# Descriptor Heap

Este capítulo tem como objetivo ilustrar melhor como funciona o mapeamento de memória da extensão [`VK_EXT_descriptor_heap`](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/proposals/VK_EXT_descriptor_heap.adoc).

O objetivo aqui **não** é mostrar um exemplo real ou um uso recomendado, mas sim ajudar a compreender como a API mapeia dados para o shader, para que depois você possa utilizar essa API da forma que preferir.

## O que é um Descritor

Um "descritor" (*descriptor*) é apenas uma pequena estrutura de dados opaca que descreve como acessar os dados para as [variáveis de recurso](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources) no seu shader.

Essa estrutura de dados é definida internamente pelo driver. Antes de `VK_EXT_descriptor_buffer`/`VK_EXT_descriptor_heap`, isso ficava abstraído, mas agora a aplicação tem controle total para gerenciar essas estruturas de dados de "descritores".

Como exemplo, para alguns drivers, um descritor `VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER` consiste em apenas 16 bytes de dados. Esses 16 bytes do "descritor" podem codificar o endereço virtual, o *stride* e outros metadados necessários para ler o uniform buffer no shader.

Aqui está um exemplo de como um "descritor" pode se parecer:

```cpp
// Representação ilustrativa de 16 bytes de um descritor opaco
0x12345678 0xFFFF0001 0x10101010 0x11223344
```

**Não é importante** de forma alguma para o desenvolvedor o que significam os dados binários de um descritor.

O que **é importante** é entender que, diferentemente do Vulkan 1.0, o driver agora apenas entrega de volta uma estrutura de dados interna, opaca e de tamanho variável.

Em vez de ter um objeto `VkDescriptorSet` controlado pelo driver, a aplicação agora é responsável por garantir que esses dados estejam no local correto da memória para que a GPU os leia.

### Múltiplos Descritores para um Único Recurso

Um descritor nem sempre tem uma relação 1 para 1 com recursos como um `VkBuffer`. Por exemplo, se houver um `VkBuffer` de 1024 bytes, ele pode ser dividido em 3 descritores definindo diferentes deslocamentos (*offsets*) e intervalos (*ranges*) para ele.

![Múltiplos descriptor blobs apontando para diferentes regiões de um único VkBuffer](images/descriptor_heap_descriptor_example.svg)

Nessa imagem, cada `Descriptor Blob` é apenas uma indireção apontando para o local no `VkBuffer` onde o shader acessará a memória.

No Vulkan 1.0, a aplicação nem sequer tinha ciência desses "descriptor blobs", mas com `VK_EXT_descriptor_heap`, a aplicação agora recebe e fica encarregada de gerenciar esses "descriptor blobs" para garantir que estejam no ponto certo da memória para acesso pelo shader.

## Como Obtemos o Bloco Binário do Descritor

Para uniform buffers e storage buffers, você primeiro precisa criar um `VkBuffer`:

* No Vulkan 1.0, você chamaria `vkUpdateDescriptorSets`, onde o driver cuidaria disso para você.
* Com `VK_EXT_descriptor_buffer`, você chama `vkGetBufferDeviceAddress()` para obter o endereço do `VkBuffer` e, em seguida, fornece-o junto com um intervalo (*range*) para `vkGetDescriptorEXT()`.
* Com `VK_EXT_descriptor_heap`, é o mesmo princípio, mas o endereço e o intervalo são fornecidos para `vkWriteResourceDescriptorsEXT()`.

![Fluxo de geração de descriptor blob para buffers](images/descriptor_heap_blob_example_buffer.svg)

Para uma imagem amostrada (*sampled image*), aplica-se a mesma ideia, exceto que não existe mais um objeto `VkImageView` para `VK_EXT_descriptor_heap`. Em vez disso, a estrutura `VkImageViewCreateInfo` é passada diretamente para `vkWriteResourceDescriptorsEXT()`, onde o descritor é gerado ali mesmo.

![Fluxo de geração de descriptor blob para imagens](images/descriptor_heap_blob_example_image.svg)

## O Heap

Com `VK_EXT_descriptor_heap`, existem explicitamente dois heaps:

* um para samplers;
* um para outros recursos (buffers, imagens, estruturas de aceleração, etc.).

O heap não possui uma relação 1 para 1 com `VkDescriptorSet`; em vez disso, ele deve conter todos os descritores utilizados em um command buffer.

## Alocando o Heap

Depois de termos nossos vários descritores, precisamos de um heap para o qual transferi-los. Isso é feito simplesmente alocando um `VkBuffer` com as flags de uso `VK_BUFFER_USAGE_DESCRIPTOR_HEAP_BIT_EXT` (e `VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT`).

Esse `VkBuffer` agora é o seu descriptor heap; tudo o que resta fazer é mover os blocos binários dos seus descritores para dentro dele.

## Colocando Descritores no Heap

Após chamar `vkWriteResourceDescriptorsEXT()` para obter os dados dos descritores, ainda precisamos levar esses dados para a memória do heap.

Existem 3 maneiras de copiar os descritores para a memória do heap:

1. Se a memória do seu heap for visível pelo host (*host visible*), usando `vkMapMemory()` no heap, os descritores podem ser copiados com um simples `std::memcpy()`.
2. Se a memória do seu heap for visível pelo host, defina `pDescriptors->address` em `vkWriteResourceDescriptorsEXT()` para apontar diretamente para o descriptor heap.
3. Os descritores também podem ser transferidos na GPU. Isso pode ser feito com algo como `vkCmdCopyBuffer()` ou até mesmo escrevendo-os diretamente de dentro de um shader.

> **Nota:** Certifique-se de que, ao escrever no heap na GPU antes de ler descritores desse heap na GPU, você sincronize corretamente usando `VK_ACCESS_2_RESOURCE_HEAP_READ_BIT_EXT` ou `VK_ACCESS_2_SAMPLER_HEAP_READ_BIT_EXT`.

### Tamanho do Descritor

Cada `VkDescriptorType` terá um tamanho diferente para o seu bloco binário de descritor (*descriptor blob*).

Por simplicidade, existem 3 valores em `VkPhysicalDeviceDescriptorHeapPropertiesEXT` para lidar com os casos gerais:

* `samplerDescriptorSize`
* `bufferDescriptorSize`
* `imageDescriptorSize`

Se você quiser empacotar descritores de forma ainda mais compacta na memória, pode usar `vkGetPhysicalDeviceDescriptorSizeEXT` para obter o tamanho exato.

Por exemplo, se um driver precisar de `16` bytes para um Uniform Buffer, mas `32` bytes para um Storage Buffer, então `bufferDescriptorSize` será `32` (o tamanho do pior caso). Chamando `vkGetPhysicalDeviceDescriptorSizeEXT(VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER)`, você obtém o tamanho exato (`16` neste caso) fornecido pelo driver.

## Vinculando ao Command Buffer

Ao gravar o `VkCommandBuffer`, precisamos de um equivalente a `vkCmdBindDescriptorSets()` (ou `vkCmdBindDescriptorBuffersEXT()`).

Existem 2 chamadas basicamente idênticas, uma para cada heap: `vkCmdBindSamplerHeapEXT()` e `vkCmdBindResourceHeapEXT()`.

O campo `heapRange` fornecido indica o intervalo de memória do heap a ser vinculado.

Há também um "intervalo reservado" (*reserved range*). Trata-se de memória que o driver utilizará para descritores internos de que precisa. (É estritamente inválido acessá-la.)

> **Nota:** As propriedades `minResourceHeapReservedRange` e `minSamplerHeapReservedRange` são usadas para determinar quanta memória reservada é necessária.

O trecho a seguir mostra um exemplo (com valores simples) de vinculação de ambos os heaps:

```cpp
const VkBindHeapInfoEXT resource_heap_info{
    .sType = VK_STRUCTURE_TYPE_BIND_HEAP_INFO_EXT,
    .pNext = nullptr,
    .heapRange = {.address = 0x1000, .size = 0x80},
    .reservedRangeOffset = 0x40,
    .reservedRangeSize = 0x20,
};
vkCmdBindResourceHeapEXT(command_buffer, &resource_heap_info);

const VkBindHeapInfoEXT sampler_heap_info{
    .sType = VK_STRUCTURE_TYPE_BIND_HEAP_INFO_EXT,
    .pNext = nullptr,
    .heapRange = {.address = 0x4020, .size = 0x60},
    .reservedRangeOffset = 0x0,
    .reservedRangeSize = 0x20,
};
vkCmdBindSamplerHeapEXT(command_buffer, &sampler_heap_info);
```

![Vinculação do resource heap e do sampler heap com seus intervalos reservados](images/descriptor_heap_binding.svg)

Isso também demonstra como a aplicação tem controle sobre onde fica posicionado o intervalo reservado do driver.

### Revinculando um Novo Heap

Quando você chama `vkCmdBindResourceHeapEXT()` várias vezes em um command buffer, o driver precisa trocar de heap, o que é custoso e deve ser evitado.

O objetivo de `VK_EXT_descriptor_heap` é que, agora que a aplicação sabe onde o heap está vinculado, ela pode copiar a memória para o offset correto dentro do heap.

## Mapeando o Heap para Shaders Existentes

Para permitir que aplicações façam a transição facilmente para `VK_EXT_descriptor_heap`, nenhum shader precisa ser modificado para utilizá-lo.

`VkDescriptorSetLayout` e `VkPipelineLayout` não são mais necessários com `VK_EXT_descriptor_heap`; em vez disso, utiliza-se `VkShaderDescriptorSetAndBindingMappingInfoEXT` para mapear a localização no heap vinculado para a decoração `DescriptorSet`/`Binding` no SPIR-V.

Esse mapeamento é fornecido no momento de `vkCreate*Pipelines()` ou `vkCreateShadersEXT()`.

### `VkDescriptorMappingSourceEXT`

Na primeira vez em que você olha para `VkDescriptorMappingSourceEXT` e todas as suas opções, pode parecer um pouco intimidador. O melhor é categorizá-las mentalmente em 3 tipos:

* **Acesso ao Heap (*Heap Access*)**
  * `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_CONSTANT_OFFSET_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_PUSH_INDEX_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_ARRAY_EXT`
* **Acesso Inline (*Inline Access*)**
  * `VK_DESCRIPTOR_MAPPING_SOURCE_RESOURCE_HEAP_DATA_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_DATA_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_ADDRESS_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_INDIRECT_ADDRESS_EXT`
* **Shader Record (Ray Tracing SBT)**
  * `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_SHADER_RECORD_INDEX_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_SHADER_RECORD_DATA_EXT`
  * `VK_DESCRIPTOR_MAPPING_SOURCE_SHADER_RECORD_ADDRESS_EXT`

### Acesso ao Heap com `VkDescriptorMappingSourceEXT`

Para oferecer um exemplo visual de como esses mapeamentos funcionam, primeiro vamos configurar nosso heap com 8 descritores apontando para 8 possíveis cargas de dados (*payloads*).

Neste exemplo, temos um único uniform buffer armazenando 8 `uvec4`.

Também estamos usando um descritor para referenciar cada um deles separadamente, a fim de deixar óbvio nos exemplos abaixo qual dado está sendo efetivamente lido.

![Heap de exemplo com 8 descritores apontando para 8 payloads uvec4](images/descriptor_heap_sample_heap.svg)

> **Nota:** O fato de tanto o descritor quanto o `uvec4` terem 16 bytes é apenas uma coincidência. Aplicações reais não vinculariam apenas 16 bytes de memória por descritor, pois isso seria um desperdício.

A partir daqui, nosso shader tentará ler de 2 descritores pertencentes a um array:

```glsl
// VkDescriptorSetAndBindingMappingEXT::descriptorSet = 0;
// VkDescriptorSetAndBindingMappingEXT::firstBinding = 0;
// VkDescriptorSetAndBindingMappingEXT::bindingCount = 2;
layout(set = 0, binding = 0) uniform UBO {
    uvec4 payload;
} u_buffers[2];

void main() {
    // Este exemplo serve para descobrir quais valores x e y receberão
    uvec4 x = u_buffers[0].payload;
    uvec4 y = u_buffers[1].payload;
}
```

#### `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_CONSTANT_OFFSET_EXT`

![Mapeamento com offset constante no heap](images/descriptor_heap_constant_offset.svg)

Os resultados são: `x == vec4(2)` e `y == vec4(6)`.

A fórmula é `offset = heapOffset + (shaderIndex * heapArrayStride)`.

`shaderIndex`, neste e em todos os casos abaixo, é simplesmente cada índice no nosso array de descritores (`u_buffers[]`), já que estamos no set/binding 0:

```text
u_buffers[0] offset = 0x20 + (0 * 0x40)
u_buffers[1] offset = 0x20 + (1 * 0x40)
```

#### `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_PUSH_INDEX_EXT`

![Mapeamento com índice via push data no heap](images/descriptor_heap_push_index.svg)

Os resultados são: `x == vec4(4)` e `y == vec4(5)`.

A fórmula é `offset = heapOffset + (pushIndex * heapIndexStride) + (shaderIndex * heapArrayStride)`.

O valor `pushOffset = 8` define `pushIndex` como `2`:

```text
u_buffers[0] offset = 0x20 + (2 * 0x10) + (0 * 0x10)
u_buffers[1] offset = 0x20 + (2 * 0x10) + (1 * 0x10)
```

#### `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_EXT`

![Mapeamento com índice indireto no heap](images/descriptor_heap_indirect_index.svg)

Os resultados são: `x == vec4(3)` e `y == vec4(5)`.

A fórmula é `offset = heapOffset + (indirectIndex * heapIndexStride) + (shaderIndex * heapArrayStride)`.

O valor `pushOffset = 16` define `indirectAddress` como `0x4000`, que deve ser um `VkDeviceAddress` válido da memória que sustenta algum `VkBuffer`. O `addressOffset` de `0x40` é aplicado a esse `indirectAddress`, resultando em `0x4040`. Vemos em `0x4040` o valor `uint32_t` igual a `2`, que se torna o `indirectIndex`:

```text
u_buffers[0] offset = 0x10 + (2 * 0x10) + (0 * 0x20)
u_buffers[1] offset = 0x10 + (2 * 0x10) + (1 * 0x20)
```

#### `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_ARRAY_EXT`

![Mapeamento com array de índices indiretos no heap](images/descriptor_heap_indirect_index_array.svg)

Os resultados são: `x == vec4(6)` e `y == vec4(2)`.

A fórmula é `offset = heapOffset + (indirectIndex * heapIndexStride)`.

Assim como no exemplo anterior, `pushOffset = 16` define `indirectAddress` como `0x4000`, somado ao `addressOffset` de `0x40`, obtendo `0x4040`.

A partir de `0x4040`, cada `shaderIndex` salta para o próximo `uint32_t` e obtém o índice a partir do uniform buffer indireto:

```text
u_buffers[0] offset = 0x00 + (6 * 0x10)
u_buffers[1] offset = 0x00 + (2 * 0x10)
```

### Acesso Inline com `VkDescriptorMappingSourceEXT`

Para esses mapeamentos, o funcionamento é semelhante à extensão `VK_EXT_inline_uniform_block` (consulte o capítulo sobre `VK_EXT_inline_uniform_block`), na qual os dados são lidos sem um descritor.

As 2 principais restrições são:

1. Não são permitidos arrays de descritores (pois não há matemática definida de como isso funcionaria).
2. Os tipos de descritores são limitados (imagens e samplers não são permitidos).

Para os exemplos a seguir, o novo código de shader fica assim:

```glsl
// VkDescriptorSetAndBindingMappingEXT::bindingCount = 1;
layout(set = 0, binding = 0) uniform UBO {
    uvec4 payload[2];
} u_buffer;

void main() {
    // Este exemplo serve para descobrir quais valores x e y receberão
    uvec4 x = u_buffer.payload[0];
    uvec4 y = u_buffer.payload[1];
}
```

#### `VK_DESCRIPTOR_MAPPING_SOURCE_RESOURCE_HEAP_DATA_EXT`

![Mapeamento inline direto de dados do resource heap](images/descriptor_heap_resource_heap_data.svg)

Os resultados são: `x == vec4(2)` e `y == vec4(3)`.

O `pushOffset = 12` obtém o deslocamento `0x10`, que é aplicado ao `heapOffset` de `0x80` para formar um deslocamento final de `0x90`.

A partir do deslocamento `0x90`, os offsets restantes dependem de onde o shader acessa dentro de `u_buffer`.

Como `payload[1]` tem um deslocamento de 16 (`0x10`) bytes dentro da struct `u_buffer`, ele está efetivamente lendo `0x90 + 0x10` aqui.

> **Nota:** Apenas Uniform Buffers são permitidos para este mapeamento, pois ele deve ser somente leitura (*read-only*).

#### `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_DATA_EXT`

Usando o mesmo shader do exemplo anterior, este mapeamento simplesmente remove o heap e carrega diretamente dos *push data*.

![Mapeamento inline direto de push data](images/descriptor_heap_push_data.svg)

Os resultados são: `x == vec4(2)` e `y == vec4(3)`.

> **Nota:** Apenas Uniform Buffers são permitidos para este mapeamento, pois ele deve ser somente leitura (*read-only*).

#### `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_ADDRESS_EXT`

![Mapeamento inline por endereço em push data](images/descriptor_heap_push_address.svg)

Os resultados são: `x == vec4(2)` e `y == vec4(3)`.

Este caso é semelhante ao exemplo anterior, mas utiliza um nível extra de indireção para ler os dados a partir de um buffer em vez de diretamente de dentro dos *push data*.

> **Nota:** Apenas Uniform Buffers, Storage Buffers e Acceleration Structures são permitidos para este mapeamento.

#### `VK_DESCRIPTOR_MAPPING_SOURCE_INDIRECT_ADDRESS_EXT`

![Mapeamento inline por endereço indireto](images/descriptor_heap_indirect_address.svg)

Os resultados são: `x == vec4(2)` e `y == vec4(3)`.

Este caso é semelhante ao exemplo anterior, apenas com mais um nível de indireção.

> **Nota:** Apenas Uniform Buffers, Storage Buffers e Acceleration Structures são permitidos para este mapeamento.

### Shader Record com `VkDescriptorMappingSourceEXT`

Um `Shader Record` refere-se a uma entrada na [Shader Binding Table (SBT)](https://docs.vulkan.org/spec/latest/chapters/raytracing.html#shader-binding-table).

Os mapeamentos funcionam exatamente da mesma forma; apenas em vez de mapear para um descritor (como buffer/imagem/accelerationStructure), eles mapeiam para um shader record:

* `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_SHADER_RECORD_INDEX_EXT` funciona exatamente como `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_PUSH_INDEX_EXT`.
* `VK_DESCRIPTOR_MAPPING_SOURCE_SHADER_RECORD_DATA_EXT` funciona exatamente como `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_DATA_EXT`.
* `VK_DESCRIPTOR_MAPPING_SOURCE_SHADER_RECORD_ADDRESS_EXT` funciona exatamente como `VK_DESCRIPTOR_MAPPING_SOURCE_PUSH_ADDRESS_EXT`.

### Aliasing de `bindingCount` em `VkDescriptorMappingSourceEXT`

Ao configurar `VkDescriptorSetAndBindingMappingEXT`, existem os campos `firstBinding` e `bindingCount`.

A ideia é que, com um único mapeamento, você possa aplicar os offsets para múltiplos bindings dentro de um descriptor set.

Por exemplo, imagine o seguinte shader:

```glsl
layout(binding = 1) uniform sampler2D a[4];
layout(binding = 3) uniform sampler2D b;
layout(binding = 4) uniform sampler2D c;
```

Se o mapeamento for configurado da seguinte forma:

```cpp
const VkDescriptorSetAndBindingMappingEXT mapping{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_AND_BINDING_MAPPING_EXT,
    .pNext = nullptr,
    .descriptorSet = 0,
    .firstBinding = 1,
    .bindingCount = 4, // Cobre os bindings 1, 2, 3 e 4
    .resourceMask = VK_SPIRV_RESOURCE_TYPE_ALL_EXT,
    .source = VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_CONSTANT_OFFSET_EXT,
    .sourceData = {
        .constantOffset = {
            .heapOffset = 0,
            .heapArrayStride = 0x10,
        },
    },
};
```

Cada binding pode ser visto como um índice dentro do mapeamento. Os respectivos offsets para cada descritor são calculados da seguinte maneira:

* `a[0]` = `0x00`
* `a[1]` = `0x10`
* `a[2]` = `0x20`
* `a[3]` = `0x30`
* `b`    = `0x20`
* `c`    = `0x30`

Observe que tanto `a[2]` quanto `b` compartilham o mesmo offset de descritor aqui. Esse comportamento de sobreposição é totalmente intencional!

## Modelo de Shader Não Tipado (*Untyped*)

O uso acima de `VkShaderDescriptorSetAndBindingMappingInfoEXT` foi projetado para permitir compatibilidade retroativa.

Existe também uma nova forma "não tipada" (*untyped*) de usar `VK_EXT_descriptor_heap`. O termo "untyped" refere-se ao uso da extensão [`VK_KHR_shader_untyped_pointers`](https://github.com/KhronosGroup/SPIRV-Guide/blob/main/chapters/untyped_pointers.md) para ter "ponteiros não tipados" para os descritores.

> "Untyped" não é o termo oficial da especificação. Existe uma nova extensão [`SPV_EXT_descriptor_heap`](https://github.com/KhronosGroup/SPIRV-Guide/blob/main/chapters/descriptor_heap.md) que fornece esses heaps em SPIR-V, mas para acessá-los é necessário usar ponteiros não tipados em SPIR-V. Você poderia usar `SPV_KHR_untyped_pointers` sem `SPV_EXT_descriptor_heap`, mas isso não é muito comum.

Usando este GLSL como exemplo:

```glsl
// Tipado (Typed)
//
// Forma padrão de fornecer a localização de set/binding
layout(set = 0, binding = 0) buffer SSBO {
    vec4 payload;
} s_buffers[];

layout(set = 0, binding = 1) buffer UBO {
    vec4 payload;
} u_buffers[];

// -----

// Não tipado (Untyped)
//
// Ambos são vinculados diretamente ao heap
layout(descriptor_heap) buffer SSBO {
    vec4 payload;
} s_buffers[];

layout(descriptor_heap) uniform UBO {
    vec4 payload;
} u_buffers[];
```

### Mapeando o Heap para Shaders com Ponteiros Não Tipados

No modelo "untyped", o array de descritores é simplesmente vinculado diretamente onde o heap está.

Se o código do shader for:

```glsl
// VkPhysicalDeviceDescriptorHeapPropertiesEXT::bufferDescriptorSize == 16 (0x10)
layout(descriptor_heap) buffer SSBO {
    vec4 payload;
} s_buffers[];

void main() {
    s_buffers[6].payload = vec4(1.0);
}
```

o mapeamento agora se parece com isto:

![Acesso ao descriptor heap no modelo não tipado](images/descriptor_heap_untyped_access.svg)

### Dominando os Strides para Cada Tipo de Descritor

Como mencionado acima na seção sobre o tamanho do descritor, os descritores terão tamanhos diferentes, o que significa que o *stride* do array será diferente para cada array de descritores no shader.

> **Nota:** Para quem vem do DX12/HLSL, todos os arrays de descritores têm o mesmo tamanho; embora isso possa ser um pouco mais conveniente, desperdiça muito mais memória.

```glsl
// VK_DESCRIPTOR_TYPE_SAMPLER
layout(descriptor_heap) uniform sampler Samplers[];

// VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE
layout(descriptor_heap) uniform texture2D Textures[];

// VK_DESCRIPTOR_TYPE_STORAGE_BUFFER
layout(descriptor_heap) buffer ssbo {
    uint data;
} Buffers[];
```

Aqui, se acessarmos `Samplers[3]`, `Textures[3]` ou `Buffers[3]`, o deslocamento a partir do endereço inicial do heap pode ser diferente.

Neste exemplo, se os tamanhos dos descritores forem:

* `bufferDescriptorSize`  = 16
* `samplerDescriptorSize` = 32
* `imageDescriptorSize`   = 64

usaremos esse tamanho como o *array stride* dentro do heap.

![Diferentes strides de descritores para buffers, samplers e imagens no heap](images/descriptor_heap_untyped_stride.svg)

## Alinhamento

Um dos desafios mais difíceis para tornar uma aplicação portável entre diferentes fabricantes é dominar a arte do alinhamento.

### Vinculando o Heap

Se você quiser vincular em algum ponto interno da memória do seu heap, precisará ficar atento a `resourceHeapAlignment` e `samplerHeapAlignment`.

![Alinhamento ao vincular regiões internas do heap](images/descriptor_heap_bind_alignment.svg)

> **Nota:** A especificação permite que esses alinhamentos cheguem a até 64 KB, mas atualmente eles parecem ser no máximo [64](https://vulkan.gpuinfo.org/displayextensionproperty.php?extensionname=VK_EXT_descriptor_heap&extensionproperty=resourceHeapAlignment&platform=all) ou [32](https://vulkan.gpuinfo.org/displayextensionproperty.php?extensionname=VK_EXT_descriptor_heap&extensionproperty=samplerHeapAlignment&platform=all) na maioria dos dispositivos.

### Alinhamento de Descritores

Para cada descritor acessado, `samplerDescriptorAlignment`, `imageDescriptorAlignment` e `bufferDescriptorAlignment` são importantes.

A parte positiva é que a especificação exige que `descriptorAlignment` seja menor ou igual a `*descriptorSize`, portanto você sempre conseguirá empacotar de forma compacta um array de descritores lado a lado.

Existem dois momentos principais em que você pode ter problemas com alinhamento.

O primeiro é quando você define incorretamente o offset para o descritor:

![Erro de alinhamento no offset do descritor](images/descriptor_heap_offset_alignment.svg)

O segundo é quando você faz indexação de descritores que não são empacotados (*strided*):

![Erro de alinhamento no stride de um array de descritores](images/descriptor_heap_stride_alignment.svg)

### Alinhamento de Buffers Indiretos

Alguns mapeamentos utilizam um Uniform Buffer "indireto".

À primeira vista, você pode pensar que esses acessos precisam estar alinhados a `minUniformBufferOffsetAlignment`, mas como eles são acessados como "buffers indiretos" e não como um "descritor", eles seguem regras de alinhamento escalar:

* `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_EXT` / `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_INDIRECT_INDEX_ARRAY_EXT` carregará um offset `uint32_t`. Precisa estar alinhado a 4 bytes.
* `VK_DESCRIPTOR_MAPPING_SOURCE_INDIRECT_ADDRESS_EXT` carregará um `VkDeviceAddress` para o descritor final. Precisa estar alinhado a 8 bytes.

Usando o diagrama a seguir:

![Alinhamento de buffers indiretos e endereços finais](images/descriptor_heap_indirect_alignment.svg)

tanto `0x4000` quanto `0x4008` estão alinhados a 8 bytes, o que é válido. Se fosse `0x4004`, seria inválido.

Os endereços finais (`0x8000` e `0x8040`) precisam estar alinhados a `minUniformBufferOffsetAlignment`, pois essa memória é acessada como um descritor de Uniform Buffer.

## Descritores Nulos (*Null Descriptors*)

O recurso [`nullDescriptor`](https://docs.vulkan.org/spec/latest/chapters/features.html#features-nullDescriptor) é uma forma de robustez (consulte o capítulo sobre Robustez) que permite que descritores sejam simultaneamente nulos e válidos. Se você escrever em um descritor nulo, as escritas são descartadas. Se você ler de um descritor nulo, ele retornará um valor definido (principalmente zero).

> **Nota:** Não existe descritor nulo para samplers.

Para obter um descritor nulo, basta definir `VkResourceDescriptorDataEXT` como nulo ao chamar `vkWriteResourceDescriptorsEXT`:

```cpp
// Exemplo obtendo um descritor nulo para UBO
std::array<std::byte, 256> host_data{};
const VkHostAddressRangeEXT host_range{
    .address = host_data.data(),
    .size = descriptor_heap_props.bufferDescriptorSize, // de VkPhysicalDeviceDescriptorHeapPropertiesEXT
};

const VkResourceDescriptorInfoEXT desc_info{
    .sType = VK_STRUCTURE_TYPE_RESOURCE_DESCRIPTOR_INFO_EXT,
    .pNext = nullptr,
    .type = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
    .data = {.pAddressRange = nullptr},
};

vkWriteResourceDescriptorsEXT(device, 1, &desc_info, &host_range);
```

A partir daí, você pode colocar `host_data` dentro do seu descriptor heap.

> **Nota:** Em alguns hardwares, o descritor nulo consiste apenas em zeros, mas isso **nem sempre** é verdade, e fazer essa suposição pode causar problemas.

## Combined Image Samplers

O tipo `VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER` é um descritor especial e merece uma menção própria caso você planeje usá-lo com `VK_EXT_descriptor_heap`.

O principal problema é que o "descritor único" precisa pertencer tanto ao Resource heap (para a imagem amostrada) quanto ao Sampler heap (para o sampler).

Isso significa que, no modelo de ponteiros não tipados (*untyped*), não é possível usar um combined image sampler de forma alguma. Isso exigiria alguma maneira de definir o *array stride* separadamente tanto para a imagem amostrada quanto para o sampler, algo que se decidiu ativamente não suportar. Portanto, se você quiser migrar para ponteiros não tipados, precisará usar imagens amostradas e samplers separados.

Se estiver usando mapeamentos de bindings, você verá `samplerHeapOffset` e `samplerHeapArrayStride`, que permitem vincular a parte do sampler.

> **Nota:** Pode parecer confuso no início que, ao usar `VK_DESCRIPTOR_TYPE_SAMPLER`, você utiliza `heapOffset` para definir o deslocamento no Sampler heap. Porém, ao usar `VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER`, `heapOffset` refere-se ao Resource heap e `samplerHeapOffset` refere-se ao Sampler heap.

Alguns mapeamentos também possuem `useCombinedImageSamplerIndex`, que é uma maneira de empacotar o mesmo índice tanto para a imagem amostrada quanto para o sampler.

Por exemplo, ao usar `VK_DESCRIPTOR_MAPPING_SOURCE_HEAP_WITH_PUSH_INDEX_EXT`, em vez de fazer:

```cpp
VkDescriptorMappingSourcePushIndexEXT push_index_mapping{
    .heapOffset = 0,
    .pushOffset = 0,
    .heapIndexStride = descriptor_heap_props.imageDescriptorSize,
    .heapArrayStride = descriptor_heap_props.imageDescriptorSize,
    .pEmbeddedSampler = nullptr,
    .useCombinedImageSamplerIndex = VK_FALSE,
    .samplerHeapOffset = 0,
    .samplerPushOffset = 4,
    .samplerHeapIndexStride = descriptor_heap_props.samplerDescriptorSize,
    .samplerHeapArrayStride = descriptor_heap_props.samplerDescriptorSize,
};

constexpr uint32_t image_index = 6;
constexpr uint32_t sampler_index = 7;

const VkPushDataInfoEXT push_image{
    .sType = VK_STRUCTURE_TYPE_PUSH_DATA_INFO_EXT,
    .pNext = nullptr,
    .offset = 0,
    .data = {.address = &image_index, .size = sizeof(image_index)},
};
vkCmdPushDataEXT(command_buffer, &push_image); // offset de imagem igual a 6

const VkPushDataInfoEXT push_sampler{
    .sType = VK_STRUCTURE_TYPE_PUSH_DATA_INFO_EXT,
    .pNext = nullptr,
    .offset = 4,
    .data = {.address = &sampler_index, .size = sizeof(sampler_index)},
};
vkCmdPushDataEXT(command_buffer, &push_sampler); // offset de sampler igual a 7
```

agora você pode empacotar ambos em uma única palavra de 32 bits:

```cpp
VkDescriptorMappingSourcePushIndexEXT push_index_mapping{
    .heapOffset = 0,
    .pushOffset = 0,
    .heapIndexStride = descriptor_heap_props.imageDescriptorSize,
    .heapArrayStride = descriptor_heap_props.imageDescriptorSize,
    .pEmbeddedSampler = nullptr,
    .useCombinedImageSamplerIndex = VK_TRUE,
    .samplerHeapOffset = 0,
    .samplerPushOffset = 0, // Ignorado quando useCombinedImageSamplerIndex == VK_TRUE
    .samplerHeapIndexStride = descriptor_heap_props.samplerDescriptorSize,
    .samplerHeapArrayStride = descriptor_heap_props.samplerDescriptorSize,
};

constexpr uint32_t image_index = 6;
constexpr uint32_t sampler_index = 7;
// Equação definida na especificação
constexpr uint32_t combined_index = (image_index & 0xfffffU) | ((sampler_index & 0xfffU) << 20U);

const VkPushDataInfoEXT push_combined{
    .sType = VK_STRUCTURE_TYPE_PUSH_DATA_INFO_EXT,
    .pNext = nullptr,
    .offset = 0,
    .data = {.address = &combined_index, .size = sizeof(combined_index)},
};
vkCmdPushDataEXT(command_buffer, &push_combined);
```
