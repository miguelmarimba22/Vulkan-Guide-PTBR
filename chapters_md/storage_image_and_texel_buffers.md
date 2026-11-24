# Storage Images e Texel Buffers

Este capítulo aborda *storage images* e *texel buffers* no Vulkan, explicando seu propósito, como utilizá-los e as boas práticas recomendadas.

## Storage Images

Uma *storage image* é um tipo de descritor (`VK_DESCRIPTOR_TYPE_STORAGE_IMAGE`) que permite aos shaders ler e escrever em uma imagem sem passar por um *pipeline* gráfico de função fixa (*fixed-function*). Isso é particularmente útil para *compute shaders* e técnicas avançadas de renderização.

### Criando uma Storage Image

Para criar uma *storage image*, você precisa:

1. Criar uma `VkImage` com a flag `VK_IMAGE_USAGE_STORAGE_BIT`.
2. Criar uma `VkImageView` para a imagem.
3. Criar um *descriptor set layout* com um *binding* do tipo `VK_DESCRIPTOR_TYPE_STORAGE_IMAGE`.
4. Atualizar o *descriptor set* com a *image view*.

```cpp
// Cria a imagem com a flag de uso de armazenamento (storage)
const VkImageCreateInfo imageInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .imageType = VK_IMAGE_TYPE_2D,
    .format = VK_FORMAT_R32G32B32A32_SFLOAT, // Escolha um formato que suporte operações de storage
    .extent = { width, height, 1 },
    .mipLevels = 1,
    .arrayLayers = 1,
    .samples = VK_SAMPLE_COUNT_1_BIT,
    .tiling = VK_IMAGE_TILING_OPTIMAL,
    .usage = VK_IMAGE_USAGE_STORAGE_BIT | VK_IMAGE_USAGE_TRANSFER_SRC_BIT,
    .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
    .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED,
};

// Cria a image view
const VkImageViewCreateInfo viewInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .image = storageImage,
    .viewType = VK_IMAGE_VIEW_TYPE_2D,
    .format = VK_FORMAT_R32G32B32A32_SFLOAT,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};
```

### Usando Storage Images em Shaders

Em GLSL, *storage images* são declaradas usando o tipo `image` com um qualificador de formato. As funções `imageLoad` e `imageStore` são usadas para ler e escrever na imagem.

```glsl
// VK_FORMAT_R32G32B32A32_SFLOAT
layout(set = 0, binding = 0, rgba32f) uniform image2D storageImage;

void main() {
    ivec2 texelCoord = ivec2(gl_GlobalInvocationID.xy);

    // Lê da imagem
    vec4 value = imageLoad(storageImage, texelCoord);

    // Modifica o valor
    value = value * 2.0;

    // Escreve de volta na imagem
    imageStore(storageImage, texelCoord, value);
}
```

Em Slang, *storage images* são declaradas de forma semelhante ao HLSL, usando o tipo `RWTexture2D`. O método `Load` e a indexação são usados para ler e escrever na imagem.

```slang
// VK_FORMAT_R32G32B32A32_SFLOAT
[[vk::binding(0, 0)]]
[[vk::image_format("rgba32f")]]
RWTexture2D<float4> storageImage;

[numthreads(8, 8, 1)]
void main(uint3 dispatchThreadID : SV_DispatchThreadID)
{
    int2 texelCoord = int2(dispatchThreadID.xy);

    // Lê da imagem
    float4 value = storageImage.Load(texelCoord);

    // Modifica o valor
    value = value * 2.0;

    // Escreve de volta na imagem
    storageImage[texelCoord] = value;
}
```

O assembly SPIR-V correspondente:

```text
OpDecorate %storageImage DescriptorSet 0
OpDecorate %storageImage Binding 0

%rgba32f      = OpTypeImage %float 2D 0 0 0 2 Rgba32f
%ptr          = OpTypePointer UniformConstant %rgba32f
%storageImage = OpVariable %ptr UniformConstant
```

### Formatos de Imagem para Storage Images

Nem todos os formatos de imagem suportam operações de armazenamento (*storage*). A flag `VK_FORMAT_FEATURE_STORAGE_IMAGE_BIT` em `VkFormatProperties` indica se um formato pode ser usado para *storage images*.

```cpp
VkFormatProperties formatProperties{};
vkGetPhysicalDeviceFormatProperties(physicalDevice, format, &formatProperties);
if ((formatProperties.optimalTilingFeatures & VK_FORMAT_FEATURE_STORAGE_IMAGE_BIT) == 0) {
    // O formato não suporta operações de storage image
}
```

Formatos comuns que tipicamente suportam operações de *storage* incluem:

* `VK_FORMAT_R32G32B32A32_SFLOAT`
* `VK_FORMAT_R32G32B32A32_UINT`
* `VK_FORMAT_R32G32B32A32_SINT`
* `VK_FORMAT_R8G8B8A8_UNORM`
* `VK_FORMAT_R8G8B8A8_UINT`

### Sincronização com Storage Images

Ao usar *storage images*, a sincronização adequada é crucial para evitar condições de corrida (*race conditions*). *Storage images* normalmente utilizam o layout `VK_IMAGE_LAYOUT_GENERAL` tanto para leitura quanto para escrita.

```cpp
VkImageMemoryBarrier barrier{
    .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = 0,
    .dstAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .oldLayout = VK_IMAGE_LAYOUT_UNDEFINED,
    .newLayout = VK_IMAGE_LAYOUT_GENERAL,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .image = storageImage,
    .subresourceRange = {
        .aspectMask = VK_IMAGE_ASPECT_COLOR_BIT,
        .baseMipLevel = 0,
        .levelCount = 1,
        .baseArrayLayer = 0,
        .layerCount = 1,
    },
};

vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    0,
    0, nullptr,
    0, nullptr,
    1, &barrier
);
```

Ao fazer a transição entre escritas e leituras em *compute shaders*:

```cpp
barrier.oldLayout = VK_IMAGE_LAYOUT_GENERAL;
barrier.newLayout = VK_IMAGE_LAYOUT_GENERAL;
barrier.srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT;
barrier.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;

vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    0,
    0, nullptr,
    0, nullptr,
    1, &barrier
);
```

## Texel Buffers

*Texel buffers* são uma forma de acessar dados de um buffer utilizando operações semelhantes às de textura nos shaders. Existem dois tipos de *texel buffers*:

1. **Uniform Texel Buffers** (`VK_DESCRIPTOR_TYPE_UNIFORM_TEXEL_BUFFER`): acesso somente leitura.
2. **Storage Texel Buffers** (`VK_DESCRIPTOR_TYPE_STORAGE_TEXEL_BUFFER`): acesso de leitura e escrita.

### Criando um Texel Buffer

Para criar um *texel buffer*, você precisa:

1. Criar um `VkBuffer` com as flags de uso apropriadas.
2. Criar uma `VkBufferView` para o buffer.
3. Criar um *descriptor set layout* com um *binding* do tipo de *texel buffer* apropriado.
4. Atualizar o *descriptor set* com a *buffer view*.

```cpp
// Cria o buffer
const VkBufferCreateInfo bufferInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .size = size,
    .usage = VK_BUFFER_USAGE_UNIFORM_TEXEL_BUFFER_BIT, // ou VK_BUFFER_USAGE_STORAGE_TEXEL_BUFFER_BIT
    .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
};

// Cria a buffer view
const VkBufferViewCreateInfo viewInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_VIEW_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .buffer = buffer,
    .format = VK_FORMAT_R32G32B32A32_SFLOAT, // Escolha um formato que suporte operações de texel buffer
    .offset = 0,
    .range = size,
};

VkBufferView bufferView = VK_NULL_HANDLE;
vkCreateBufferView(device, &viewInfo, nullptr, &bufferView);
```

### Usando Uniform Texel Buffers em Shaders

Em GLSL, *uniform texel buffers* são declarados usando o tipo `textureBuffer`. A função `texelFetch` é usada para ler do buffer.

```glsl
layout(set = 0, binding = 0) uniform textureBuffer uniformTexelBuffer;

void main() {
    // Lê do texel buffer
    vec4 value = texelFetch(uniformTexelBuffer, int(gl_GlobalInvocationID.x));

    // Usa o valor
    // ...
}
```

Em Slang, *uniform texel buffers* são declarados usando o tipo `Buffer`. O método `Load` é usado para ler do buffer.

```slang
[[vk::binding(0, 0)]]
Buffer<float4> uniformTexelBuffer;

[numthreads(64, 1, 1)]
void main(uint3 dispatchThreadID : SV_DispatchThreadID)
{
    // Lê do texel buffer
    float4 value = uniformTexelBuffer.Load(dispatchThreadID.x);

    // Usa o valor
    // ...
}
```

O assembly SPIR-V correspondente:

```text
OpDecorate %uniformTexelBuffer DescriptorSet 0
OpDecorate %uniformTexelBuffer Binding 0

%texelBuffer        = OpTypeImage %float Buffer 0 0 0 1 Unknown
%ptr                = OpTypePointer UniformConstant %texelBuffer
%uniformTexelBuffer = OpVariable %ptr UniformConstant
```

### Usando Storage Texel Buffers em Shaders

Em GLSL, *storage texel buffers* são declarados usando o tipo `imageBuffer` com um qualificador de formato. As funções `imageLoad` e `imageStore` são usadas para ler e escrever no buffer.

```glsl
// VK_FORMAT_R32G32B32A32_SFLOAT
layout(set = 0, binding = 0, rgba32f) uniform imageBuffer storageTexelBuffer;

void main() {
    int index = int(gl_GlobalInvocationID.x);

    // Lê do texel buffer
    vec4 value = imageLoad(storageTexelBuffer, index);

    // Modifica o valor
    value = value * 2.0;

    // Escreve de volta no texel buffer
    imageStore(storageTexelBuffer, index, value);
}
```

Em Slang, *storage texel buffers* são declarados usando o tipo `RWBuffer`. O método `Load` e a indexação de array são usados para ler e escrever no buffer.

```slang
// VK_FORMAT_R32G32B32A32_SFLOAT
[[vk::binding(0, 0)]]
[[vk::image_format("rgba32f")]]
RWBuffer<float4> storageTexelBuffer;

[numthreads(64, 1, 1)]
void main(uint3 dispatchThreadID : SV_DispatchThreadID)
{
    int index = int(dispatchThreadID.x);

    // Lê do texel buffer
    float4 value = storageTexelBuffer.Load(index);

    // Modifica o valor
    value = value * 2.0;

    // Escreve de volta no texel buffer
    storageTexelBuffer[index] = value;
}
```

O assembly SPIR-V correspondente:

```text
OpDecorate %storageTexelBuffer DescriptorSet 0
OpDecorate %storageTexelBuffer Binding 0

%rgba32f            = OpTypeImage %float Buffer 0 0 0 2 Rgba32f
%ptr                = OpTypePointer UniformConstant %rgba32f
%storageTexelBuffer = OpVariable %ptr UniformConstant
```

#### Usando Formato Não-RGBA para Texel Buffer

Um erro comum ao lidar com *texel buffers* é esquecer que você está acessando um único texel por vez. Esse formato de texel pode ter de 1 a 4 componentes (`R8` vs. `RGBA8`). Algumas linguagens de shader, como GLSL, exigem que você escreva todos os 4 componentes, sendo os componentes extras ignorados.

```glsl
// VK_FORMAT_R32_UINT
layout(set = 0, binding = 0, r32ui) uniform uimageBuffer storageTexelBuffer;

void main() {
    // Inválido em GLSL, é necessário usar um uvec4
    uint a = 1;
    imageStore(storageTexelBuffer, 0, a);

    // Erro comum: assumir que isso escreverá todos os 4 valores em 4 texels consecutivos.
    // Apenas "1" é escrito e os outros 3 componentes são descartados, pois o formato contém apenas 1 componente.
    uvec4 b = uvec4(1, 2, 3, 4);
    imageStore(storageTexelBuffer, 0, b);
}
```

### Formatos para Texel Buffers

Nem todos os formatos suportam operações de *texel buffer*. As flags `VK_FORMAT_FEATURE_UNIFORM_TEXEL_BUFFER_BIT` e `VK_FORMAT_FEATURE_STORAGE_TEXEL_BUFFER_BIT` em `VkFormatProperties` indicam se um formato pode ser usado para *uniform texel buffers* e *storage texel buffers*, respectivamente.

```cpp
VkFormatProperties formatProperties{};
vkGetPhysicalDeviceFormatProperties(physicalDevice, format, &formatProperties);
if ((formatProperties.bufferFeatures & VK_FORMAT_FEATURE_UNIFORM_TEXEL_BUFFER_BIT) == 0) {
    // O formato não suporta operações de uniform texel buffer
}
if ((formatProperties.bufferFeatures & VK_FORMAT_FEATURE_STORAGE_TEXEL_BUFFER_BIT) == 0) {
    // O formato não suporta operações de storage texel buffer
}
```

> **Nota:** O código acima utiliza o membro `bufferFeatures` de `VkFormatProperties` para verificar o suporte a *texel buffers*, em contraste com `optimalTilingFeatures` ou `linearTilingFeatures`, que são usados para imagens.

### Sincronização com Texel Buffers

Ao usar *storage texel buffers*, a sincronização adequada é crucial para evitar condições de corrida.

```cpp
const VkBufferMemoryBarrier barrier{
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = buffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE,
};

vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    0,
    0, nullptr,
    1, &barrier,
    0, nullptr
);
```

## Comparação com Outros Tipos de Buffer

### Storage Image vs. Storage Buffer

Embora tanto *storage images* quanto *storage buffers* permitam acesso de leitura e escrita nos shaders, eles possuem casos de uso diferentes:

* **Storage Images**: ideais para dados 2D ou 3D que se beneficiam de operações de textura, como filtragem ou modos de endereçamento.
* **Storage Buffers**: melhores para dados estruturados arbitrários ou quando você precisa acessar dados em um padrão não uniforme.

### Texel Buffer vs. Storage Buffer

*Texel buffers* e *storage buffers* também possuem pontos fortes distintos:

* **Texel Buffers**: fornecem acesso semelhante ao de texturas para dados de buffer, permitindo operações como conversão de formato/filtragem.
* **Storage Buffers**: mais flexíveis para armazenamento e manipulação de dados de propósito geral.

## Considerações para Renderizadores Baseados em Tiles

Muitas GPUs móveis e algumas GPUs de desktop utilizam uma arquitetura de renderização baseada em *tiles* (*tile-based rendering*), o que traz implicações importantes sobre como *storage images* e *texel buffers* devem ser utilizados.

### O que é Renderização Baseada em Tiles?

Na renderização baseada em *tiles* (TBR, *tile-based rendering*) ou renderização diferida baseada em *tiles* (TBDR, *tile-based deferred rendering*), a GPU divide o *framebuffer* em pequenas regiões retangulares chamadas *tiles*. Cada *tile* é processado completamente (todas as chamadas de desenho que afetam aquele *tile*) antes de passar para o próximo. Essa abordagem:

* Reduz a largura de banda de memória mantendo os dados do *tile* em memória rápida *on-chip*.
* Melhora a eficiência energética, o que é particularmente importante para dispositivos móveis.
* Permite a implementação eficiente de determinadas técnicas de renderização.

### Storage Images em Renderizadores Baseados em Tiles

Ao usar *storage images* em renderizadores baseados em *tiles*, considere o seguinte:

1. **Descarregamento da Memória de Tile (*Tile Memory Flushing*)**: escrever em *storage images* pode fazer com que a GPU descarregue a memória do *tile* para a memória principal, reduzindo os benefícios da renderização baseada em *tiles*.
   * Isso pode impactar significativamente o desempenho, especialmente se feito com frequência.
   * Tente agrupar (*batch*) operações em *storage images* para minimizar os *flushes* de memória de *tile*.
2. **Attachments Transientes (*Transient Attachments*)**: alguns renderizadores baseados em *tiles* suportam *attachments* especiais "transientes" que existem apenas na memória do *tile*.
   * Estes não podem ser usados como *storage images*, pois não possuem memória de respaldo (*backing memory*).
   * Se você precisar processar resultados de renderização, considere usar *input attachments* sempre que possível.
3. **Extensões de Pixel Local Storage**: algumas GPUs baseadas em *tiles* oferecem extensões como `VK_EXT_shader_pixel_local_storage`, que fornecem alternativas mais eficientes às *storage images* para certos casos de uso.
   * Essas extensões permitem que shaders acessem dados por pixel que permanecem na memória do *tile*.
   * Verifique e utilize essas extensões quando estiverem disponíveis em hardware baseado em *tiles*.
4. **Coerência no Render Pass**: em renderizadores baseados em *tiles*, dados escritos em *storage images* durante um *render pass* podem não ficar visíveis para chamadas de desenho subsequentes no mesmo *render pass*.
   * Use *memory barriers* apropriadas ou divida o trabalho em múltiplos *render passes*.
   * Esteja ciente de que essas barreiras podem ser mais custosas em renderizadores baseados em *tiles*.

### Texel Buffers em Renderizadores Baseados em Tiles

*Texel buffers* geralmente funcionam de maneira semelhante em renderizadores baseados em *tiles* e em renderizadores de modo imediato (*immediate mode*), mas ainda há algumas considerações:

1. **Coerência de Cache**: renderizadores baseados em *tiles* podem ter comportamentos de cache diferentes para o acesso a *texel buffers*.
   * Garanta a sincronização adequada ao escrever e ler de *texel buffers*.
   * Esteja ciente de que *flushes* de cache podem ser mais custosos em arquiteturas baseadas em *tiles*.
2. **Padrões de Acesso à Memória**: renderizadores baseados em *tiles* podem ser mais sensíveis a padrões de acesso à memória não coerentes.
   * Organize seus dados para maximizar a localidade para o *tile* que está sendo processado.
   * Considere o tamanho do *tile* ao projetar seus algoritmos.

### Otimização de Desempenho para Renderizadores Baseados em Tiles

1. **Minimize Resolves de Framebuffer**: toda vez que você precisa acessar o conteúdo do *framebuffer* como uma *storage image*, o renderizador baseado em *tiles* precisa "resolver" (escrever) a memória do *tile* para a memória principal.
   * Tente concluir todas as operações que modificam uma determinada imagem antes de ler dela.
   * Considere usar *subpasses* e *input attachments* em vez de *storage images* para operações dentro de um *render pass*.
2. **Prefira Render Passes a Compute para Processamento de Imagem**: em renderizadores baseados em *tiles*, operações dentro de um *render pass* costumam ser mais eficientes do que *compute shaders* usando *storage images*.
   * Considere implementar o processamento de imagem como *fragment shaders* em um *render pass*.
   * Use múltiplos *subpasses* para manter resultados intermediários na memória do *tile*.
3. **Tenha Cuidado com Padrões Mistos de Acesso**: misturar leituras e escritas na mesma *storage image* pode ser particularmente custoso em renderizadores baseados em *tiles*.
   * Tente separar as fases de leitura e escrita.
   * Considere técnicas de *double-buffering* para evitar riscos de leitura após escrita (*read-after-write hazards*).

## Requisitos de Compatibilidade de Formatos

Ao usar *storage images* e *texel buffers*, é crucial compreender as regras de compatibilidade de formatos. Incompatibilidades entre os formatos no shader e os formatos dos recursos podem levar a comportamento indefinido (*undefined behavior*) e possíveis avisos das camadas de validação (*validation layers*).

### Diferenças nas Regras de Compatibilidade de Formatos

As regras de compatibilidade de formatos para *storage images* e *texel buffers* são idênticas:

1. **Storage Images**: o formato especificado no shader (*SPIR-V Image Format*) deve **corresponder exatamente** ao formato usado ao criar a `VkImageView` (*Vulkan Format*).
2. **Texel Buffers**: o formato especificado no shader (*SPIR-V Image Format*) deve **corresponder exatamente** ao formato usado ao criar a `VkBufferView` (*Vulkan Format*).

Ambos os tipos de recursos exigem correspondência exata de formato entre o shader e a *view*. As *views* devem sempre corresponder exatamente ao shader.

### Compatibilidade entre Formato de Imagem SPIR-V e Formato Vulkan

A Especificação do Vulkan define uma tabela de [Compatibilidade entre Formatos de Imagem SPIR-V e Formatos Vulkan](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-image-formats) que mostra o mapeamento exato entre formatos de imagem SPIR-V e formatos Vulkan.

#### Requisitos de Formato para Storage Images

Para *storage images*, o formato especificado no shader deve corresponder exatamente ao formato da *image view* de acordo com essa tabela. Não há conversão automática de formato nem *swizzling* de componentes.

```glsl
// Formato SPIR-V Rgba8 (mapeia para VK_FORMAT_R8G8B8A8_UNORM)
layout(set = 0, binding = 0, rgba8) uniform image2D storageImage;

// A VkImageView deve ser criada com VK_FORMAT_R8G8B8A8_UNORM
// Usar VK_FORMAT_B8G8R8A8_UNORM resultaria em comportamento indefinido
```

#### Requisitos de Formato para Texel Buffers

Para *texel buffers*, assim como nas *storage images*, o formato especificado no shader deve corresponder exatamente ao formato da *buffer view* de acordo com a tabela de compatibilidade entre formatos SPIR-V e Vulkan. Não há conversão automática de formato nem *swizzling* de componentes.

```glsl
// Para uniform texel buffers, o formato não é especificado no shader
layout(set = 0, binding = 0) uniform textureBuffer uniformTexelBuffer;

// A VkBufferView deve ser criada com um formato que corresponda exatamente ao que o shader espera
// Por exemplo, se o shader espera dados RGBA, VK_FORMAT_R8G8B8A8_UNORM deve ser usado
```

Para *storage texel buffers*, um formato é especificado no shader e ele deve corresponder exatamente ao formato usado na `VkBufferView`:

```glsl
// Formato SPIR-V Rgba8 (mapeia para VK_FORMAT_R8G8B8A8_UNORM)
layout(set = 0, binding = 0, rgba8) uniform imageBuffer storageTexelBuffer;

// A VkBufferView deve ser criada com VK_FORMAT_R8G8B8A8_UNORM
// Usar um formato diferente, mesmo na mesma classe de compatibilidade, resulta em comportamento indefinido
```

### Swizzling de Componentes

Tanto para *storage images* quanto para *texel buffers*, o *swizzling* de componentes funciona da mesma maneira:

1. **Storage Images**: nenhum *swizzling* automático de componentes ocorre. Os componentes são acessados exatamente como estão armazenados na memória. Se você precisar reorganizar (*swizzle*) componentes (por exemplo, converter entre RGBA e BGRA), deverá fazê-lo manualmente no código do shader.
2. **Texel Buffers**: assim como nas *storage images*, nenhum *swizzling* automático de componentes ocorre. Os componentes são acessados exatamente como estão armazenados na memória. Se você precisar reorganizar componentes, deverá fazê-lo manualmente no código do shader.
3. **Image Views**: para *sampled images* (não *storage images*), você pode usar a estrutura `VkComponentMapping` em `VkImageViewCreateInfo` para especificar o *swizzling* de componentes. Isso não se aplica a *storage images* ou *texel buffers*.

### Casos Comuns de Incompatibilidade de Formatos

Vários tipos de incompatibilidades de formatos podem ocorrer, todos resultando em comportamento indefinido:

1. **Incompatibilidade de Tamanho de Componente**: quando o tamanho do componente no formato SPIR-V difere do formato Vulkan.
   * Exemplo: formato SPIR-V `Rgba32f` (componentes float de 32 bits) com `VK_FORMAT_R8G8B8A8_UNORM` (componentes de 8 bits).
   * Exemplo: formato SPIR-V `R32ui` (inteiro sem sinal de 32 bits) com `VK_FORMAT_R8_UINT` (inteiro sem sinal de 8 bits) — isso é inválido, resultando em comportamento indefinido sem *bitcast* implícito.
2. **Incompatibilidade de Quantidade de Componentes**: quando o número de componentes no formato SPIR-V difere do formato Vulkan.
   * **Mais Componentes Escritos**: formato SPIR-V `Rgba8` (4 componentes) com `VK_FORMAT_R8_UNORM` (1 componente).
   * **Menos Componentes Escritos**: formato SPIR-V `R8` (1 componente) com `VK_FORMAT_R8G8B8A8_UNORM` (4 componentes).
3. **Incompatibilidade de Formato Numérico**: quando o formato numérico (normalizado, float, int) no formato SPIR-V difere do formato Vulkan.
   * Exemplo: formato SPIR-V `Rgba8` (`UNORM`) com `VK_FORMAT_R8G8B8A8_SNORM` (`SNORM`).
4. **Incompatibilidade de Tipo Numérico**: quando o tipo numérico (float, int, uint) no formato SPIR-V difere do formato Vulkan.
   * Exemplo: formato SPIR-V `R8` (float) com `VK_FORMAT_R8_SINT` (inteiro com sinal).
   * Exemplo: formato SPIR-V `R8ui` (inteiro sem sinal) com `VK_FORMAT_R8_SINT` (inteiro com sinal).
5. **Incompatibilidade de Ordem de Canais**: quando a ordem dos canais no formato SPIR-V difere do formato Vulkan.
   * Exemplo: formato SPIR-V `Rgba8` (ordem RGBA) com `VK_FORMAT_B8G8R8A8_UNORM` (ordem BGRA).
   * Isso é particularmente problemático para *storage images*, onde não ocorre *swizzling* automático.

### Como Corrigir Incompatibilidades de Formatos

Existem diferentes abordagens para corrigir incompatibilidades de formatos dependendo do tipo de recurso:

#### Para Storage Images

* **Corresponda os Formatos Exatamente**: garanta que o formato da `VkImageView` corresponda exatamente ao *SPIR-V Image Format*, conforme definido na tabela de compatibilidade.
  * Por exemplo, se o seu shader usa `rgba8` (formato SPIR-V `Rgba8`), crie sua `VkImageView` com `VK_FORMAT_R8G8B8A8_UNORM`.
  * Se você precisar trabalhar com um formato diferente (por exemplo, `VK_FORMAT_B8G8R8A8_UNORM`), precisará fazer o *swizzle* manual dos componentes no código do shader:

```glsl
// Swizzling manual para conversão de BGRA para RGBA
vec4 value = imageLoad(storageImage, texelCoord);
vec4 swizzled = value.bgra; // Reorganiza os componentes manualmente
// Usa o valor com swizzle
```

* **Use o Formato `Unknown` no SPIR-V**: se você precisar de flexibilidade nos formatos utilizados, pode usar o formato `Unknown` no SPIR-V, que é compatível com qualquer formato Vulkan.
  * Isso exige habilitar os recursos `shaderStorageImageWriteWithoutFormat` (para escritas) e `shaderStorageImageReadWithoutFormat` (para leituras).
  * Em GLSL, isso significa omitir o qualificador de formato:

```glsl
// Nenhum formato especificado, utiliza Unknown no SPIR-V
layout(set = 0, binding = 0) uniform image2D storageImage;
```

  * Observe que, ao usar o formato `Unknown`, você é responsável por garantir que os dados lidos ou escritos na imagem sejam compatíveis com o formato real da imagem.

#### Para Texel Buffers

1. **Corresponda os Formatos Exatamente**: garanta que o formato da `VkBufferView` corresponda exatamente ao *SPIR-V Image Format* conforme definido na tabela de compatibilidade, assim como nas *storage images*.
   * Por exemplo, se o seu shader usa `rgba8` (formato SPIR-V `Rgba8`), crie sua `VkBufferView` com `VK_FORMAT_R8G8B8A8_UNORM`.
   * Usar um formato diferente, mesmo na mesma classe de compatibilidade, resulta em comportamento indefinido.
2. **Trate o Swizzling de Componentes no Shader**: se precisar trabalhar com formatos que têm ordens de componentes diferentes (por exemplo, RGBA vs. BGRA), trate o *swizzling* explicitamente no código do shader, pois não ocorre *swizzling* automático.

### Considerações Importantes

* Quando ocorre uma incompatibilidade de formato com *storage images* ou *texel buffers*, toda a memória se torna indefinida, não apenas os texels que estão sendo escritos.
* Mesmo formatos que pertencem à mesma classe de compatibilidade (por exemplo, `VK_FORMAT_R8G8B8A8_UNORM` e `VK_FORMAT_B8G8R8A8_UNORM`) devem corresponder exatamente tanto para *storage images* quanto para *texel buffers*.
* Tanto *storage images* quanto *texel buffers* possuem as mesmas regras estritas de compatibilidade de formatos — os formatos especificados no shader devem corresponder exatamente aos formatos usados nas *views*.
* Os avisos das camadas de validação para incompatibilidades de formato têm como objetivo ajudar os desenvolvedores a identificar problemas potenciais, pois essas incompatibilidades podem causar bugs sutis difíceis de diagnosticar imediatamente.
* O *swizzling* de componentes deve ser tratado manualmente tanto para *storage images* quanto para *texel buffers*, já que não existe *swizzling* automático para nenhum dos dois tipos de recurso.

## Boas Práticas

### Considerações de Desempenho

1. **Seleção de Formato**: escolha formatos que sejam suportados nativamente pelo hardware para obter melhor desempenho.
   * Prefira formatos com suporte nativo de hardware (verifique `VkFormatProperties`).
   * Para *storage images*, formatos de 32 bits (`R32_*`) frequentemente têm desempenho superior ao de formatos empacotados (*packed formats*).
   * Considere usar formatos de canal único quando apenas um canal for necessário para reduzir a largura de banda de memória.
2. **Padrões de Acesso à Memória**: tente garantir padrões de acesso à memória coalescidos (*coalesced*) ao ler ou escrever em *storage images* e *texel buffers*.
   * Agrupe acessos à memória em locais adjacentes para maximizar a eficiência do cache.
   * Em *compute shaders*, alinhe o tamanho dos grupos de trabalho (*workgroup sizes*) com o tamanho de *warp*/*wavefront* do hardware.
   * Considere o layout da memória ao acessar imagens 2D (acesso *row-major* vs. *column-major*).
   * Para *texel buffers*, o acesso sequencial é geralmente mais rápido do que o acesso aleatório.
3. **Sincronização**: utilize a sincronização mínima necessária para evitar penalidades de desempenho.
   * Use as flags de acesso e os estágios de pipeline mais específicos possíveis.
   * Agrupe operações para reduzir o número de barreiras necessárias.
   * Considere usar `VK_PIPELINE_STAGE_ALL_COMMANDS_BIT` apenas quando for absolutamente necessário.
   * Para cargas de trabalho de computação (*compute workloads*), tente projetar algoritmos que minimizem pontos de sincronização.
4. **Reutilização de Recursos**: reutilize *storage images* e *texel buffers* sempre que possível para reduzir o custo de alocação de memória.
   * Considere implementar um *pool* de recursos para objetos criados e destruídos com frequência.
   * Use técnicas de *double* ou *triple buffering* para recursos atualizados a cada quadro.
5. **Balanceamento de Carga**: distribua o trabalho uniformemente entre as invocações de *compute shader*.
   * Escolha tamanhos de *workgroup* apropriados para o seu hardware (tipicamente múltiplos de 32 ou 64).
   * Evite caminhos de execução divergentes dentro de um *workgroup*.
   * Considere o processamento em *tiles* para imagens grandes a fim de melhorar a localidade de cache.

### Armadilhas Comuns

1. **Suporte de Formatos**: nem todos os formatos suportam operações de *storage*. Sempre verifique os recursos do formato.
   * Use `vkGetPhysicalDeviceFormatProperties` para verificar o suporte do formato antes de criar recursos.
   * Alguns formatos podem suportar operações de *storage*, mas com desempenho reduzido.
   * Esteja ciente de que o suporte de formatos pode variar entre diferentes fabricantes de hardware.
2. **Barreiras de Memória**: barreiras de memória ausentes ou incorretas podem levar a condições de corrida e comportamento indefinido.
   * Sempre use barreiras de memória apropriadas entre escritas e leituras subsequentes.
   * Lembre-se de que barreiras são necessárias mesmo quando as operações ocorrem no mesmo shader.
   * Para *compute shaders*, use `memoryBarrierImage()` ou `memoryBarrierBuffer()` em GLSL quando apropriado.
   * Tenha cuidado com múltiplas submissões em filas (*queues*) que acessam os mesmos recursos.
3. **Transições de Layout**: *storage images* normalmente utilizam `VK_IMAGE_LAYOUT_GENERAL`, mas a transição para esse layout continua sendo obrigatória.
   * Sempre faça a transição das imagens para o layout correto antes de usá-las.
   * Esteja ciente de que `VK_IMAGE_LAYOUT_GENERAL` pode ser menos eficiente do que layouts especializados.
   * Considere usar uma *sampled image* em `VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL` se precisar apenas de acesso de leitura (descritores de *storage image* não podem usar esse layout).
4. **Operações Atômicas**: operações atômicas em *storage images* e buffers podem ser custosas.
   * Minimize o uso de operações atômicas sempre que possível.
   * Considere algoritmos alternativos que não exijam operações atômicas.
   * Esteja ciente de que o desempenho de operações atômicas varia significativamente entre fabricantes de hardware.
   * Agrupe operações atômicas para minimizar a contenção de memória.
5. **Limites de Recursos**: esteja atento aos limites do dispositivo para *storage images* e *texel buffers*.
   * Verifique `maxPerStageDescriptorStorageImages` e limites relacionados.
   * Alguns dispositivos podem ter restrições quanto ao número de recursos de *storage* que podem ser escritos.
   * Considere o impacto no *descriptor set layout* ao usar muitos recursos de *storage*.
6. **Camadas de Validação**: utilize as camadas de validação (*validation layers*) durante o desenvolvimento para capturar erros comuns.
   * Habilite a validação de sincronização (*synchronization validation*) para detectar problemas com barreiras.
   * Preste atenção aos avisos sobre suporte de formatos e flags de uso.
   * Teste em múltiplos fabricantes de hardware, se possível, para detectar problemas específicos de implementação.
7. **Compilação de Shaders**: esteja ciente das implicações na compilação dos shaders.
   * Operações complexas com *storage images* e *texel buffers* podem aumentar a pressão de registradores (*register pressure*).
   * Considere dividir shaders complexos em múltiplos passes.
   * Faça o perfilamento (*profiling*) do desempenho dos shaders para identificar gargalos.

## Exemplos de Casos de Uso

### Processamento de Imagem com Storage Images

*Storage images* são ideais para tarefas de processamento de imagem, como filtros, desfoques (*blurs*) e outros efeitos de pós-processamento.

### Sistemas de Partículas com Storage Texel Buffers

*Storage texel buffers* podem ser usados para armazenar e atualizar dados de partículas em um *compute shader*, os quais podem ser lidos posteriormente por um *vertex shader* para renderização.

### Tabelas de Consulta (Lookup Tables) com Uniform Texel Buffers

*Uniform texel buffers* são úteis para implementar tabelas de consulta (*lookup tables*) que precisam ser acessadas com operações semelhantes às de textura.
