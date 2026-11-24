# Operações Atômicas (*Atomics*)

O objetivo deste capítulo é ajudar os usuários a compreender os diversos recursos que o Vulkan expõe para operações atômicas.

## Variações de Operações Atômicas

Para entender melhor as diferentes extensões, primeiro é importante conhecer os diversos tipos de operações atômicas expostos:

- Tipo
  - `float`
  - `int`
- Largura (*Width*)
  - `16 bits`
  - `32 bits`
  - `64 bits`
- Operações
  - *loads* (leituras)
  - *stores* (escritas)
  - *exchange* (troca)
  - *add* (adição)
  - *min* (mínimo)
  - *max* (máximo)
  - etc.
- Classe de Armazenamento (*Storage Class*)
  - `StorageBuffer` ou `Uniform` (buffer)
  - `Workgroup` (memória compartilhada)
  - `Image` (imagem ou imagem esparsa)

## Suporte Básico (*Baseline Support*)

Com o Vulkan 1.0 e sem extensões, uma aplicação pode utilizar o tipo `int` de 32 bits para operações atômicas. Ele pode ser usado em todas as operações SPIR-V suportadas (*load*, *store*, *exchange*, etc.). O SPIR-V contém algumas operações atômicas protegidas pela capacidade `Kernel` que atualmente não são permitidas no Vulkan.

### Contadores Atômicos (*Atomic Counters*)

Embora tanto o GLSL quanto o SPIR-V suportem o uso de contadores atômicos, o Vulkan **não** expõe a capacidade SPIR-V `AtomicStorage` necessária para usar a classe de armazenamento `AtomicCounter`. Decidiu-se que uma aplicação pode simplesmente usar `OpAtomicIAdd` e `OpAtomicISub` com o valor `1` para alcançar os mesmos resultados.

### Expandindo o Suporte Atômico

As extensões atuais que expõem suporte adicional para operações atômicas são:

- [VK_KHR_shader_atomic_int64](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_atomic_int64.html)
- [VK_EXT_shader_image_atomic_int64](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_shader_image_atomic_int64.html)
- [VK_EXT_shader_atomic_float](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_shader_atomic_float.html)
- [VK_EXT_shader_atomic_float2](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_shader_atomic_float2.html)

Cada uma delas é explicada em mais detalhes abaixo.

## `VK_KHR_shader_atomic_int64`

> **Nota:** Promovida ao núcleo no Vulkan 1.2. Consulte também [GLSL - GL_EXT_shader_atomic_int64](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shader_atomic_int64.txt).

Essa extensão permite operações atômicas de `int` de 64 bits para **buffers** e **memória compartilhada**. Se a capacidade SPIR-V `Int64Atomics` for declarada, todas as operações SPIR-V suportadas poderão ser usadas com `int` de 64 bits.

Os dois bits de recurso, `shaderBufferInt64Atomics` e `shaderSharedInt64Atomics`, são usados para consultar quais classes de armazenamento são suportadas para operações atômicas de `int` de 64 bits:

- `shaderBufferInt64Atomics` - buffers
- `shaderSharedInt64Atomics` - memória compartilhada

O suporte a `shaderBufferInt64Atomics` é sempre garantido caso a extensão seja exposta.

## `VK_EXT_shader_image_atomic_int64`

> **Nota:** Consulte [SPV_EXT_shader_image_int64](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_image_int64.html) e [GLSL_EXT_shader_image_int64](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_shader_image_int64.txt).

Essa extensão permite operações atômicas de `int` de 64 bits para **imagens** e **imagens esparsas** (*sparse images*). Se as capacidades SPIR-V `Int64Atomics` e `Int64ImageEXT` forem declaradas, todas as operações SPIR-V suportadas poderão ser usadas com `int` de 64 bits em imagens.

### Suporte a Imagens vs. Imagens Esparsas

Essa extensão expõe os bits de recurso `shaderImageInt64Atomics` e `sparseImageInt64Atomics`. O recurso `sparseImage*` é um bit de recurso adicional e só pode ser usado se o bit `shaderImage*` também estiver habilitado. Alguns hardwares têm dificuldade em executar operações atômicas em imagens com recursos esparsos (consulte o capítulo sobre *Sparse Resources*); portanto, o recurso atômico é dividido para permitir que **imagens esparsas** sejam expostas como um recurso adicional pela implementação.

## `VK_EXT_shader_atomic_float`

> **Nota:** Consulte [SPV_EXT_shader_atomic_float_add](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_atomic_float_add.html) e [GLSL_EXT_shader_atomic_float](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_shader_atomic_float.txt).

Essa extensão permite operações atômicas de `float` para **buffers**, **memória compartilhada**, **imagens** e **imagens esparsas**. Apenas um subconjunto de operações é suportado para tipos `float` com essa extensão.

A extensão lista diversos bits de recurso. Uma forma de agrupá-los é por `*Float*Atomics` e `*Float*AtomicAdd`:

- Os recursos `*Float*Atomics` permitem o uso de `OpAtomicStore`, `OpAtomicLoad` e `OpAtomicExchange` para tipos `float`.
  - Observe que a operação de troca `OpAtomicCompareExchange` não está incluída, pois a especificação SPIR-V permite apenas tipos `int` para ela.
- Os recursos `*Float*AtomicAdd` permitem o uso de `OpAtomicFAddEXT` com as duas capacidades SPIR-V estendidas `AtomicFloat32AddEXT` e `AtomicFloat64AddEXT`.

A partir daí, o restante das permutações de recursos divide-se no agrupamento de suporte a `float` de 32 bits:

- `shaderBufferFloat32*` - buffers
- `shaderSharedFloat32*` - memória compartilhada
- `shaderImageFloat32*` - imagens
- `sparseImageFloat32*` - imagens esparsas

e suporte a `float` de 64 bits:

- `shaderBufferFloat64*` - buffers
- `shaderSharedFloat64*` - memória compartilhada

> **Nota:** A extensão do OpenGL ES [OES_shader_image_atomic](https://registry.khronos.org/OpenGL/extensions/OES/OES_shader_image_atomic.txt) permitia o uso de operações atômicas em `r32f` para `imageAtomicExchange`. Ao portar código, a aplicação deve verificar o suporte a `shaderImageFloat32Atomics` para fazer o mesmo no Vulkan.

## `VK_EXT_shader_atomic_float2`

> **Nota:** Consulte [SPV_EXT_shader_atomic_float_min_max](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_atomic_float_min_max.html), [SPV_EXT_shader_atomic_float16_add](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_atomic_float16_add.html) e [GLSL_EXT_shader_atomic_float](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_shader_atomic_float.txt).

Essa extensão adiciona 2 conjuntos adicionais de recursos ausentes em `VK_EXT_shader_atomic_float`.

Primeiro, ela adiciona `floats` de 16 bits tanto para **buffers** quanto para **memória compartilhada**, da mesma maneira vista acima para `VK_EXT_shader_atomic_float`:

- `shaderBufferFloat16*` - buffers
- `shaderSharedFloat16*` - memória compartilhada

Segundo, ela adiciona suporte de `float` para operações atômicas de `min` e `max` (`OpAtomicFMinEXT` e `OpAtomicFMaxEXT`).

Para suporte a `float` de 16 bits (com a capacidade `AtomicFloat16MinMaxEXT`):

- `shaderBufferFloat16AtomicMinMax` - buffers
- `shaderSharedFloat16AtomicMinMax` - memória compartilhada

Para suporte a `float` de 32 bits (com a capacidade `AtomicFloat32MinMaxEXT`):

- `shaderBufferFloat32AtomicMinMax` - buffers
- `shaderSharedFloat32AtomicMinMax` - memória compartilhada
- `shaderImageFloat32AtomicMinMax` - imagens
- `sparseImageFloat32AtomicMinMax` - imagens esparsas

Para suporte a `float` de 64 bits (com a capacidade `AtomicFloat64MinMaxEXT`):

- `shaderBufferFloat64AtomicMinMax` - buffers
- `shaderSharedFloat64AtomicMinMax` - memória compartilhada
