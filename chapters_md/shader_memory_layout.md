# Layout de Memória de Shaders (*Shader Memory Layout*)

Quando uma implementação acessa memória a partir de uma interface, ela precisa conhecer o **layout de memória** (*memory layout*). Isso inclui informações como **deslocamentos** (*offsets*), **passo** (*stride*) e **alinhamentos** (*alignments*). Embora a especificação do Vulkan tenha uma [seção dedicada a isso](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-layout), ela pode ser difícil de interpretar devido às diversas extensões que adicionam complexidade extra à linguagem da especificação. Este capítulo tem como objetivo ajudar a explicar todos os conceitos de layout de memória utilizados pelo Vulkan com alguns exemplos em uma linguagem de shader de alto nível (GLSL).

## Requisitos de Alinhamento (*Alignment Requirements*)

O Vulkan possui 3 [requisitos de alinhamento](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-alignment-requirements) nos quais os objetos de interface podem ser organizados:

- alinhamento estendido (*extended alignment*, também conhecido como `std140`)
- alinhamento base (*base alignment*, também conhecido como `std430`)
- alinhamento escalar (*scalar alignment*)

A especificação detalha a regra de alinhamento para cada um dos seguintes tipos de membros de bloco:

- escalar (`float`, `int`, `char`, etc.)
- vetor (`float2`, `vec3`, `uvec4`, etc.)
- matriz (*matrix*)
- *array*
- *struct*

## `VK_KHR_uniform_buffer_standard_layout`

> **Nota:** Promovida ao núcleo no Vulkan 1.2.

Essa extensão permite o uso do layout de memória `std430` em UBOs (*Uniform Buffer Objects*). A [Interface de Layout Padrão de Buffer do Vulkan](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-standard-layout) pode ser consultada fora deste guia. Essas alterações de layout de memória aplicam-se apenas a `Uniforms`, uma vez que outros itens de armazenamento, como *Push Constants* e SSBOs, já permitem layouts no estilo `std430`.

Um exemplo de quando o recurso `uniformBufferStandardLayout` é necessário é quando uma aplicação não deseja que o *stride* de um *array* em um UBO fique restrito ao *extended alignment* (`std140`).

([Testar Online](https://godbolt.org/z/j11d58hcs))

```glsl
layout(std140, binding = 0) uniform ubo140 {
   float array140[8];
};

layout(std430, binding = 1) uniform ubo430 {
   float array430[8];
};
```

O que se traduz em SPIR-V para:

```text
// O alinhamento estendido para arrays é arredondado para cima para um múltiplo de 16
OpDecorate %array140 ArrayStride 16

// O alinhamento base é de 4 bytes (OpTypeFloat 32)
// Válido apenas com o recurso uniformBufferStandardLayout habilitado
OpDecorate %array430 ArrayStride 4
```

Certifique-se de passar `--uniform-buffer-standard-layout` ao executar o SPIR-V Validator.

## `VK_KHR_relaxed_block_layout`

> **Nota:** Promovida ao núcleo no Vulkan 1.1. Nunca foi adicionado um bit de recurso (*feature bit*) para essa extensão, portanto todos os dispositivos Vulkan 1.1+ suportam *relaxed block layout*.

Essa extensão permite que as implementações indiquem que suportam maior variação nas decorações `Offset` de blocos. Isso aparece ao usar o layout de memória `std430`, no qual um `vec3` (que tem 12 bytes) ainda é definido com um alinhamento de 16 bytes. Com o *relaxed block layout*, uma aplicação pode encaixar um `float` em qualquer um dos lados do `vec3` e manter o alinhamento de 16 bytes entre eles.

```glsl
// Offsets SPIR-V SEM relaxed block layout
layout (set = 0, binding = 0) buffer block {
    float b; // Offset: 0
    vec3 a;  // Offset: 16
} ssbo;

// Offsets SPIR-V COM relaxed block layout
layout (set = 0, binding = 0) buffer block {
    float b; // Offset: 0
    vec3 a;  // Offset: 4
} ssbo;
```

`VK_KHR_relaxed_block_layout` também pode ser vista como um subconjunto de `VK_EXT_scalar_block_layout`.

> **Nota:** Certifique-se de passar `--relax-block-layout` ao executar o SPIR-V Validator em um ambiente Vulkan 1.0.

> **Nota:** Atualmente não há uma maneira legal em GLSL de expressar *relaxed block layout*, mas o desenvolvedor pode usar `--hlsl-offsets` com o `glslang` para produzir os *offsets* desejados.

## `VK_EXT_scalar_block_layout`

> **Nota:** Promovida ao núcleo no Vulkan 1.2. Consulte também [GLSL - GL_EXT_scalar_block_layout](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_scalar_block_layout.txt).

Essa extensão permite que a maioria dos tipos de armazenamento seja alinhada em *scalar alignment* (alinhamento escalar). Uma grande diferença é a capacidade de cruzar o limite de 16 bytes.

Em GLSL, isso pode ser usado com a palavra-chave `scalar` e a extensão correspondente:

```glsl
#extension GL_EXT_scalar_block_layout : enable
layout (scalar, binding = 0) buffer block { }
```

> **Nota:** Certifique-se de passar `--scalar-block-layout` ao executar o SPIR-V Validator.

> **Nota:** A classe de armazenamento `Workgroup` não é suportada com `VK_EXT_scalar_block_layout`; o recurso `workgroupMemoryExplicitLayoutScalarBlockLayout` da extensão `VK_KHR_workgroup_memory_explicit_layout` (consulte a seção sobre recursos de shader nas extensões) é necessário para habilitar o suporte escalar.

## Exemplos de Alinhamento (*Alignment Examples*)

A seguir estão alguns exemplos de GLSL para SPIR-V para ajudar a compreender melhor a diferença entre os alinhamentos suportados.

### Exemplo de Alinhamento 1

([Testar Online](https://godbolt.org/z/9rWKEdf1W))

```glsl
layout(binding = 0) buffer block {
    vec2 a[4];
    vec4 b;
};
```

O que se traduz em SPIR-V para:

```text
// alinhamento estendido (std140)
OpDecorate %vec2array ArrayStride 16
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 64

// alinhamento escalar e alinhamento base (std430)
OpDecorate %vec2array ArrayStride 8
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 32
```

### Exemplo de Alinhamento 2

([Testar Online](https://godbolt.org/z/YMr6P749b))

```glsl
layout(binding = 0) buffer block {
    float a;
    vec2 b;
    vec2 c;
};
```

O que se traduz em SPIR-V para:

```text
// alinhamento estendido (std140) e alinhamento base (std430)
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 8
OpMemberDecorate %block 2 Offset 16

// alinhamento escalar
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 4
OpMemberDecorate %block 2 Offset 12
```

### Exemplo de Alinhamento 3

([Testar Online](https://godbolt.org/z/c4Pe4KvG9))

```glsl
layout(binding = 0) buffer block {
    vec3 a;
    vec2 b;
    vec4 c;
};
```

O que se traduz em SPIR-V para:

```text
// alinhamento estendido (std140) e alinhamento base (std430)
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 16
OpMemberDecorate %block 2 Offset 32

// alinhamento escalar
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 12
OpMemberDecorate %block 2 Offset 20
```

### Exemplo de Alinhamento 4

([Testar Online](https://godbolt.org/z/rG17jorf8))

```glsl
layout (binding = 0) buffer block {
    vec3 a;
    vec2 b;
    vec2 c;
    vec3 d;
};
```

O que se traduz em SPIR-V para:

```text
// alinhamento estendido (std140) e alinhamento base (std430)
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 16
OpMemberDecorate %block 2 Offset 24
OpMemberDecorate %block 3 Offset 32

// alinhamento escalar
OpMemberDecorate %block 0 Offset 0
OpMemberDecorate %block 1 Offset 12
OpMemberDecorate %block 2 Offset 20
OpMemberDecorate %block 3 Offset 28
```
