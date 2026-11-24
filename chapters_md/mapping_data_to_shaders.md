# Mapeando Dados para Shaders

> **Nota:** Todo o assembly SPIR-V neste capítulo foi gerado com `glslangValidator`.

Este capítulo aborda como [fazer a interface do Vulkan com SPIR-V](https://docs.vulkan.org/spec/latest/chapters/interfaces.html) para mapear dados. Utilizando os objetos `VkDeviceMemory` alocados por `vkAllocateMemory`, cabe à aplicação mapear corretamente os dados do Vulkan de modo que o shader SPIR-V saiba como consumi-los adequadamente.

No núcleo do Vulkan (*core Vulkan*), existem 5 formas fundamentais de mapear dados da sua aplicação Vulkan para fazer interface com SPIR-V:

* [Atributos de Entrada](#atributos-de-entrada)
* [Descritores](#descritores)
  * [Tipos de Descritores](#tipos-de-descritores)
    * [`VK_DESCRIPTOR_TYPE_STORAGE_IMAGE`](#storage-image)
    * [`VK_DESCRIPTOR_TYPE_SAMPLER` e `VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE`](#sampler-e-sampled-image)
    * [`VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER`](#combined-image-sampler)
    * [`VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER`](#uniform-buffer)
    * [`VK_DESCRIPTOR_TYPE_STORAGE_BUFFER`](#storage-buffer)
    * [`VK_DESCRIPTOR_TYPE_UNIFORM_TEXEL_BUFFER`](#uniform-texel-buffer)
    * [`VK_DESCRIPTOR_TYPE_STORAGE_TEXEL_BUFFER`](#storage-texel-buffer)
    * [`VK_DESCRIPTOR_TYPE_INPUT_ATTACHMENT`](#input-attachment)
* [Push Constants](#push-constants)
* [Specialization Constants](#specialization-constants)
* [Physical Storage Buffer](#physical-storage-buffer)

## Atributos de Entrada

O único estágio de shader no núcleo do Vulkan que possui um atributo de entrada controlado diretamente pelo Vulkan é o estágio de *vertex shader* (`VK_SHADER_STAGE_VERTEX_BIT`). Isso envolve declarar os slots de interface ao criar o `VkPipeline` e, em seguida, vincular o `VkBuffer` com os dados a serem mapeados antes da chamada de desenho (*draw call*). Outros estágios de shader, como o *fragment shader*, possuem atributos de entrada, mas seus valores são determinados a partir das saídas dos estágios anteriores executados antes dele.

Antes de chamar `vkCreateGraphicsPipelines`, uma struct `VkPipelineVertexInputStateCreateInfo` precisa ser preenchida com uma lista de mapeamentos `VkVertexInputAttributeDescription` para o shader.

Um exemplo de *vertex shader* em GLSL ([Testar Online](https://godbolt.org/z/x3b3ceTa6)):

```glsl
#version 450
layout(location = 0) in vec3 inPosition;

void main() {
    gl_Position = vec4(inPosition, 1.0);
}
```

Há apenas um único atributo de entrada na `location` 0. Isso também pode ser visto no assembly SPIR-V gerado:

```text
               OpDecorate %inPosition Location 0

        %ptr = OpTypePointer Input %v3float
 %inPosition = OpVariable %ptr Input
         %20 = OpLoad %v3float %inPosition
```

Neste exemplo, a seguinte configuração pode ser usada para o `VkVertexInputAttributeDescription`:

```cpp
constexpr VkVertexInputAttributeDescription input{
    .location = 0,
    .binding = 0,
    .format = VK_FORMAT_R32G32B32_SFLOAT, // mapeia para vec3
    .offset = 0,
};
```

A única coisa que resta fazer é vincular o *vertex buffer* e o *index buffer* opcional antes da chamada de desenho.

> **Nota:** Utilizar `VK_BUFFER_USAGE_VERTEX_BUFFER_BIT` ao criar o `VkBuffer` é o que o caracteriza como um "vertex buffer".

```cpp
vkBeginCommandBuffer(/* ... */);
// ...
vkCmdBindVertexBuffers(/* ... */);
vkCmdDraw(/* ... */);
// ...
vkCmdBindVertexBuffers(/* ... */);
vkCmdBindIndexBuffer(/* ... */);
vkCmdDrawIndexed(/* ... */);
// ...
vkEndCommandBuffer(/* ... */);
```

> **Nota:** Mais informações podem ser encontradas no capítulo sobre *Processamento de Dados de Entrada de Vértices*.

## Descritores

Um [descritor de recurso](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html) (*resource descriptor*) é a forma principal de mapear dados como *uniform buffers*, *storage buffers*, *samplers*, etc., para qualquer estágio de shader no Vulkan. Uma maneira de conceituar um descritor é pensar nele como um ponteiro para a memória que o shader pode utilizar.

Existem vários [tipos de descritores](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#VkDescriptorType) no Vulkan, cada um com sua própria [descrição detalhada](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-types) do que permite fazer.

Os descritores são agrupados em [descriptor sets](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-sets), que são vinculados ao shader. Mesmo que haja apenas um único descritor no *descriptor set*, o objeto `VkDescriptorSet` inteiro é usado ao vincular ao shader.

### Exemplo

Neste exemplo, existem os seguintes 3 *descriptor sets*:

![Exemplo de 3 descriptor sets](images/mapping_data_to_shaders_descriptor_1.png)

O código GLSL do shader ([Testar Online](https://godbolt.org/z/oMz58a78T)):

```glsl
// Nota - apenas os sets 0 e 2 são usados neste shader

layout(set = 0, binding = 0) uniform sampler2D myTextureSampler;

layout(set = 0, binding = 2) uniform uniformBuffer0 {
    float someData;
} ubo_0;

layout(set = 0, binding = 3) uniform uniformBuffer1 {
    float moreData;
} ubo_1;

layout(set = 2, binding = 0) buffer storageBuffer {
    float myResults;
} ssbo;
```

O assembly SPIR-V correspondente:

```text
OpDecorate %myTextureSampler DescriptorSet 0
OpDecorate %myTextureSampler Binding 0

OpMemberDecorate %uniformBuffer0 0 Offset 0
OpDecorate %uniformBuffer0 Block
OpDecorate %ubo_0 DescriptorSet 0
OpDecorate %ubo_0 Binding 2

OpMemberDecorate %uniformBuffer1 0 Offset 0
OpDecorate %uniformBuffer1 Block
OpDecorate %ubo_1 DescriptorSet 0
OpDecorate %ubo_1 Binding 3

OpMemberDecorate %storageBuffer 0 Offset 0
OpDecorate %storageBuffer BufferBlock
OpDecorate %ssbo DescriptorSet 2
OpDecorate %ssbo Binding 0
```

A vinculação dos descritores é feita durante a gravação do *command buffer*. Os descritores devem estar vinculados no momento da chamada de desenho (*draw*) ou despacho (*dispatch*). O código a seguir é um pseudocódigo para representar melhor esse processo:

```cpp
vkBeginCommandBuffer(/* ... */);
// ...
vkCmdBindPipeline(/* ... */); // Vincula o shader

// Uma forma possível de vincular os dois sets
vkCmdBindDescriptorSets(/* ..., firstSet = */ 0, /* ..., pDescriptorSets = */ &descriptor_set_c /*, ...*/);
vkCmdBindDescriptorSets(/* ..., firstSet = */ 2, /* ..., pDescriptorSets = */ &descriptor_set_b /*, ...*/);

vkCmdDraw(/* ... */); // ou dispatch
// ...
vkEndCommandBuffer(/* ... */);
```

O resultado ficaria da seguinte forma:

![Resultado da vinculação dos descriptor sets ao shader](images/mapping_data_to_shaders_descriptor_2.png)

### Tipos de Descritores

A especificação do Vulkan possui uma tabela de [Correspondência entre Recursos de Shader e Classes de Armazenamento](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-storage-class-correspondence) (*Shader Resource and Storage Class Correspondence*) que descreve como cada tipo de descritor precisa ser mapeado no SPIR-V.

A seguir, mostramos exemplos de como fica o mapeamento em GLSL e SPIR-V para cada um dos [tipos de descritores](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-types).

Para GLSL, mais informações podem ser encontradas na [Especificação GLSL - 12.2.4. Vulkan Only: Samplers, Images, Textures, and Buffers](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.pdf).

#### Storage Image

`VK_DESCRIPTOR_TYPE_STORAGE_IMAGE`

> **Nota:** Mais detalhes podem ser encontrados no capítulo sobre *Storage Images e Texel Buffers*.

[Testar Online](https://godbolt.org/z/7KPe11GPs)

```glsl
// VK_FORMAT_R32_UINT
layout(set = 0, binding = 0, r32ui) uniform uimage2D storageImage;

// exemplo de uso para leitura e escrita em GLSL
const uvec4 texel = imageLoad(storageImage, ivec2(0, 0));
imageStore(storageImage, ivec2(1, 1), texel);
```

```text
OpDecorate %storageImage DescriptorSet 0
OpDecorate %storageImage Binding 0

%r32ui        = OpTypeImage %uint 2D 0 0 0 2 R32ui
%ptr          = OpTypePointer UniformConstant %r32ui
%storageImage = OpVariable %ptr UniformConstant
```

#### Sampler e Sampled Image

`VK_DESCRIPTOR_TYPE_SAMPLER` e `VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE`

[Testar Online](https://godbolt.org/z/zbb3TW19x)

```glsl
layout(set = 0, binding = 0) uniform sampler samplerDescriptor;
layout(set = 0, binding = 1) uniform texture2D sampledImage;

// exemplo de uso de texture() em GLSL
vec4 data = texture(sampler2D(sampledImage, samplerDescriptor), vec2(0.0, 0.0));
```

```text
OpDecorate %sampledImage DescriptorSet 0
OpDecorate %sampledImage Binding 1
OpDecorate %samplerDescriptor DescriptorSet 0
OpDecorate %samplerDescriptor Binding 0

%image        = OpTypeImage %float 2D 0 0 0 1 Unknown
%imagePtr     = OpTypePointer UniformConstant %image
%sampledImage = OpVariable %imagePtr UniformConstant

%sampler           = OpTypeSampler
%samplerPtr        = OpTypePointer UniformConstant %sampler
%samplerDescriptor = OpVariable %samplerPtr UniformConstant

%imageLoad       = OpLoad %image %sampledImage
%samplerLoad     = OpLoad %sampler %samplerDescriptor

%sampleImageType = OpTypeSampledImage %image
%1               = OpSampledImage %sampleImageType %imageLoad %samplerLoad

%textureSampled = OpImageSampleExplicitLod %v4float %1 %coordinate Lod %float_0
```

#### Combined Image Sampler

`VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER`

> **Nota:** Em algumas implementações, **pode** ser mais eficiente fazer amostragem (*sampling*) de uma imagem usando uma combinação de *sampler* e *sampled image* armazenados juntos no *descriptor set* em um descritor combinado.

[Testar Online](https://godbolt.org/z/aTrajsrY3)

```glsl
layout(set = 0, binding = 0) uniform sampler2D combinedImageSampler;

// exemplo de uso de texture() em GLSL
vec4 data = texture(combinedImageSampler, vec2(0.0, 0.0));
```

```text
OpDecorate %combinedImageSampler DescriptorSet 0
OpDecorate %combinedImageSampler Binding 0

%imageType            = OpTypeImage %float 2D 0 0 0 1 Unknown
%sampleImageType      = OpTypeSampledImage %imageType
%ptr                  = OpTypePointer UniformConstant %sampleImageType
%combinedImageSampler = OpVariable %ptr UniformConstant

%load           = OpLoad %sampleImageType %combinedImageSampler
%textureSampled = OpImageSampleExplicitLod %v4float %load %coordinate Lod %float_0
```

#### Uniform Buffer

`VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER`

> **Nota:** *Uniform buffers* também podem ter offsets dinâmicos no momento da vinculação (`VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER_DYNAMIC`); consulte o capítulo sobre *Offset Dinâmico de Descritores*.

[Testar Online](https://godbolt.org/z/qz6dcndxd)

```glsl
layout(set = 0, binding = 0) uniform uniformBuffer {
    float a;
    int b;
} ubo;

// exemplo de leitura de um UBO em GLSL
int x = ubo.b + 1;
vec3 y = vec3(ubo.a);
```

```text
OpMemberDecorate %uniformBuffer 0 Offset 0
OpMemberDecorate %uniformBuffer 1 Offset 4
OpDecorate %uniformBuffer Block
OpDecorate %ubo DescriptorSet 0
OpDecorate %ubo Binding 0

%uniformBuffer = OpTypeStruct %float %int
%ptr           = OpTypePointer Uniform %uniformBuffer
%ubo           = OpVariable %ptr Uniform
```

#### Storage Buffer

`VK_DESCRIPTOR_TYPE_STORAGE_BUFFER`

> **Nota:** *Storage buffers* também podem ter offsets dinâmicos no momento da vinculação (`VK_DESCRIPTOR_TYPE_STORAGE_BUFFER_DYNAMIC`); consulte o capítulo sobre *Offset Dinâmico de Descritores*.

[Testar Online](https://godbolt.org/z/hEfe8PhfY)

```glsl
layout(set = 0, binding = 0) buffer storageBuffer {
    float a;
    int b;
} ssbo;

// exemplo de leitura e escrita de um SSBO em GLSL
ssbo.a = ssbo.a + 1.0;
ssbo.b = ssbo.b + 1;
```

> **Importante:** `BufferBlock` e `Uniform` eram utilizados antes da introdução da extensão `VK_KHR_storage_buffer_storage_class` (consulte a seção sobre recursos de shader).

```text
OpMemberDecorate %storageBuffer 0 Offset 0
OpMemberDecorate %storageBuffer 1 Offset 4
OpDecorate %storageBuffer Block
OpDecorate %ssbo DescriptorSet 0
OpDecorate %ssbo Binding 0

%storageBuffer = OpTypeStruct %float %int
%ptr           = OpTypePointer StorageBuffer %storageBuffer
%ssbo          = OpVariable %ptr StorageBuffer
```

#### Uniform Texel Buffer

`VK_DESCRIPTOR_TYPE_UNIFORM_TEXEL_BUFFER`

> **Nota:** Mais detalhes podem ser encontrados no capítulo sobre *Storage Images e Texel Buffers*.

[Testar Online](https://godbolt.org/z/ob4T9d3E4)

```glsl
layout(set = 0, binding = 0) uniform textureBuffer uniformTexelBuffer;

// exemplo de leitura de um texel buffer em GLSL
vec4 data = texelFetch(uniformTexelBuffer, 0);
```

```text
OpDecorate %uniformTexelBuffer DescriptorSet 0
OpDecorate %uniformTexelBuffer Binding 0

%texelBuffer        = OpTypeImage %float Buffer 0 0 0 1 Unknown
%ptr                = OpTypePointer UniformConstant %texelBuffer
%uniformTexelBuffer = OpVariable %ptr UniformConstant
```

#### Storage Texel Buffer

`VK_DESCRIPTOR_TYPE_STORAGE_TEXEL_BUFFER`

> **Nota:** Mais detalhes podem ser encontrados no capítulo sobre *Storage Images e Texel Buffers*.

[Testar Online](https://godbolt.org/z/zoeMxsKjq)

```glsl
// VK_FORMAT_R8G8B8A8_UINT
layout(set = 0, binding = 0, rgba8ui) uniform uimageBuffer storageTexelBuffer;

// exemplo de leitura e escrita de um texel buffer em GLSL
int offset = int(gl_GlobalInvocationID.x);
vec4 data = imageLoad(storageTexelBuffer, offset);
imageStore(storageTexelBuffer, offset, uvec4(0));
```

```text
OpDecorate %storageTexelBuffer DescriptorSet 0
OpDecorate %storageTexelBuffer Binding 0

%rgba8ui            = OpTypeImage %uint Buffer 0 0 0 2 Rgba8ui
%ptr                = OpTypePointer UniformConstant %rgba8ui
%storageTexelBuffer = OpVariable %ptr UniformConstant
```

#### Input Attachment

`VK_DESCRIPTOR_TYPE_INPUT_ATTACHMENT`

[Testar Online](https://godbolt.org/z/aMncGWajG)

```glsl
layout (input_attachment_index = 0, set = 0, binding = 0) uniform subpassInput inputAttachment;

// exemplo de carregamento dos dados do attachment em GLSL
vec4 data = subpassLoad(inputAttachment);
```

```text
OpDecorate %inputAttachment DescriptorSet 0
OpDecorate %inputAttachment Binding 0
OpDecorate %inputAttachment InputAttachmentIndex 0

%subpass         = OpTypeImage %float SubpassData 0 0 0 2 Unknown
%ptr             = OpTypePointer UniformConstant %subpass
%inputAttachment = OpVariable %ptr UniformConstant
```

## Push Constants

Uma *push constant* é um pequeno banco de valores acessível nos shaders. As *push constants* permitem que a aplicação defina valores usados nos shaders sem precisar criar buffers ou modificar e vincular *descriptor sets* para cada atualização.

Elas são projetadas para pequenas quantidades (alguns *dwords*) de dados de alta frequência a serem atualizados a cada gravação do *command buffer*.

Mais informações podem ser encontradas no capítulo sobre *Push Constants*.

## Specialization Constants

As [specialization constants](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#pipelines-specialization-constants) são um mecanismo que permite especificar um valor constante no SPIR-V no momento da criação do `VkPipeline`. Isso é muito poderoso, pois substitui a ideia de usar macros de pré-processador na linguagem de sombreamento de alto nível (GLSL, HLSL, etc.).

### Exemplo

Se uma aplicação deseja criar dois objetos `VkPipeline` nos quais o valor da cor é diferente para cada um, uma abordagem ingênua seria ter dois shaders:

```glsl
// shader_a.frag
#version 450
layout(location = 0) out vec4 outColor;

void main() {
    outColor = vec4(0.0);
}
```

```glsl
// shader_b.frag
#version 450
layout(location = 0) out vec4 outColor;

void main() {
    outColor = vec4(1.0);
}
```

Usando *specialization constants*, a decisão pode ser tomada ao chamar `vkCreateGraphicsPipelines` para compilar o shader. Isso significa que só é necessário manter um único shader.

[Testar Online](https://godbolt.org/z/xnncjdf3z)

```glsl
#version 450
layout (constant_id = 0) const float myColor = 1.0;
layout(location = 0) out vec4 outColor;

void main() {
    outColor = vec4(myColor);
}
```

Assembly SPIR-V resultante:

```text
           OpDecorate %outColor Location 0
           OpDecorate %myColor SpecId 0

// 0x3f800000 em decimal, que equivale a 1.0 para um float de 32 bits
%myColor = OpSpecConstant %float 1065353216
```

Com *specialization constants*, o valor continua sendo uma constante dentro do shader, mas se outro `VkPipeline` usar o mesmo shader e quiser definir o valor de `myColor` para `0.5f`, é possível fazer isso em tempo de execução:

```cpp
struct SpecializationData {
    float myColor = 1.0f;
};

SpecializationData myData{};

constexpr VkSpecializationMapEntry mapEntry{
    .constantID = 0, // corresponde a constant_id no GLSL e SpecId no SPIR-V
    .offset = 0,
    .size = sizeof(float),
};

const VkSpecializationInfo specializationInfo{
    .mapEntryCount = 1,
    .pMapEntries = &mapEntry,
    .dataSize = sizeof(SpecializationData),
    .pData = &myData,
};

// Configura o estágio de fragmento com as informações de especialização
stages[fragIndex].pSpecializationInfo = &specializationInfo;

const VkGraphicsPipelineCreateInfo pipelineInfo{
    .sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO,
    .pNext = nullptr,
    .stageCount = static_cast<uint32_t>(stages.size()),
    .pStages = stages.data(),
    // ... demais campos do pipeline
};

// Cria o primeiro pipeline com myColor igual a 1.0
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &pipelineInfo, nullptr, &pipelineA);

// Cria o segundo pipeline com o mesmo shader, mas define um valor diferente
myData.myColor = 0.5f;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &pipelineInfo, nullptr, &pipelineB);
```

O shader do segundo `VkPipeline`, quando desmontado (*disassembled*), terá o novo valor constante `0.5f` para `myColor`.

### 3 Tipos de Uso de Specialization Constants

Os casos de uso típicos para *specialization constants* podem ser agrupados em três categorias principais:

* **Ativação e desativação de recursos (*toggling features*)**
  * O suporte a um recurso no Vulkan muitas vezes só é conhecido em tempo de execução. Esse uso de *specialization constants* evita escrever dois shaders separados, embutindo em vez disso uma decisão constante definida em tempo de execução.
* **Melhoria de otimizações do *backend***
  * Aqui, o *backend* refere-se ao compilador da implementação que recebe o SPIR-V resultante e o traduz (*lowers*) para o conjunto de instruções (ISA) que será executado no dispositivo.
  * Valores constantes permitem que ocorram diversas otimizações, como [constant folding](https://en.wikipedia.org/wiki/Constant_folding) e [dead code elimination](https://en.wikipedia.org/wiki/Dead_code_elimination).
* **Alteração de tipos e tamanhos de memória**
  * É possível definir o comprimento de um array ou o tipo de uma variável utilizada por meio de uma *specialization constant*.
  * É importante observar que o compilador precisará alocar registradores dependendo desses tipos e tamanhos. Isso significa que é provável que o *pipeline cache* falhe em reutilizar dados se houver uma diferença significativa na quantidade de registradores alocados.

## Physical Storage Buffer

A extensão [VK_KHR_buffer_device_address](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_buffer_device_address.html#_description), promovida ao Vulkan 1.2, adiciona a capacidade de ter "ponteiros no shader". Utilizando a classe de armazenamento `PhysicalStorageBuffer` no SPIR-V, uma aplicação pode chamar `vkGetBufferDeviceAddress`, que retorna o `VkDeviceAddress` para a memória.

Embora esta seja uma maneira de mapear dados para o shader, ela não é por si só uma forma de interface direta com o shader. Por exemplo, se uma aplicação quiser usar esse recurso com um *uniform buffer*, ela precisará criar um `VkBuffer` com as flags `VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT` e `VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT`. A partir daí, neste exemplo, o Vulkan usaria um descritor para fazer a interface inicial com o shader, mas poderia utilizar o *physical storage buffer* para atualizar ou acessar valores posteriormente.

## Limites

Em todos os exemplos acima, é importante estar ciente de que existem [limites no Vulkan](https://docs.vulkan.org/spec/latest/chapters/limits.html) que expõem quantos dados podem ser vinculados ao mesmo tempo:

* **Atributos de Entrada**
  * `maxVertexInputAttributes`
  * `maxVertexInputAttributeOffset`
* **Descritores**
  * `maxBoundDescriptorSets`
  * Limites por estágio (*Per stage limit*):
    * `maxPerStageDescriptorSamplers`
    * `maxPerStageDescriptorUniformBuffers`
    * `maxPerStageDescriptorStorageBuffers`
    * `maxPerStageDescriptorSampledImages`
    * `maxPerStageDescriptorStorageImages`
    * `maxPerStageDescriptorInputAttachments`
    * `maxPerStageResources`
  * Limites por tipo (*Per type limit*):
    * `maxDescriptorSetSamplers`
    * `maxDescriptorSetUniformBuffers`
    * `maxDescriptorSetUniformBuffersDynamic`
    * `maxDescriptorSetStorageBuffers`
    * `maxDescriptorSetStorageBuffersDynamic`
    * `maxDescriptorSetSampledImages`
    * `maxDescriptorSetStorageImages`
    * `maxDescriptorSetInputAttachments`
  * `VkPhysicalDeviceDescriptorIndexingProperties` ao utilizar a extensão `VK_EXT_descriptor_indexing` (*Descriptor Indexing*)
  * `VkPhysicalDeviceInlineUniformBlockPropertiesEXT` ao utilizar a extensão `VK_EXT_inline_uniform_block` (*Inline Uniform Block*)
* **Push Constants**
  * `maxPushConstantsSize` — garantido pelo menos `128` bytes em todos os dispositivos (`256` bytes em dispositivos Vulkan 1.4)
