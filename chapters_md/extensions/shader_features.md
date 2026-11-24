# Recursos de Shaders (Shader Features)

Existem diversas razões pelas quais nem todas as partes do SPIR-V foram expostas no Vulkan 1.0. Ao longo do tempo, o *Vulkan Working Group* identificou casos de uso em que faz sentido expor novos recursos do SPIR-V.

Algumas das extensões a seguir foram adicionadas em conjunto com uma extensão SPIR-V. Por exemplo, a extensão `VK_KHR_8bit_storage` foi criada em paralelo com `SPV_KHR_8bit_storage`. O único propósito da extensão Vulkan é permitir que a aplicação consulte o suporte ao recurso SPIR-V na implementação. A extensão SPIR-V existe para definir as alterações feitas na representação intermediária SPIR-V.

Para detalhes sobre como usar extensões SPIR-V, consulte o capítulo dedicado às extensões SPIR-V no Vulkan Guide.

## VK_KHR_spirv_1_4

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.

Esta extensão foi projetada para que implementações do Vulkan 1.1 exponham o conjunto de recursos do SPIR-V 1.4. O Vulkan 1.1 exige apenas SPIR-V 1.3, e foram encontrados casos de uso em que uma implementação poderia não atualizar para o Vulkan 1.2, mas ainda desejava oferecer os recursos do SPIR-V 1.4.

## VK_KHR_8bit_storage e VK_KHR_16bit_storage

> **Nota:**
> - [SPV_KHR_8bit_storage](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_8bit_storage.html)
> - [SPV_KHR_16bit_storage](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_16bit_storage.html)
> - [GLSL - GL_EXT_shader_16bit_storage](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shader_16bit_storage.txt) define ambas

Tanto `VK_KHR_8bit_storage` (promovida no Vulkan 1.2) quanto `VK_KHR_16bit_storage` (promovida no Vulkan 1.1) foram adicionadas para permitir o uso de valores pequenos como entrada ou saída em um objeto de armazenamento SPIR-V. Antes dessas extensões, todos os UBOs, SSBOs e *push constants* precisavam consumir pelo menos 4 bytes por elemento. Com elas, uma aplicação pode usar valores de 8 bits ou 16 bits diretamente de um *buffer*. Isso também é frequentemente combinado com o uso de `VK_KHR_shader_float16_int8`, pois estas extensões lidam apenas com as interfaces de armazenamento.

Abaixo está um exemplo sem e com o uso de `SPV_KHR_8bit_storage` na extensão GLSL:

```glsl
#version 450

// Sem armazenamento de 8 bits, cada variável de bloco precisa ter 32 bits de largura
layout (set = 0, binding = 0) readonly buffer StorageBuffer {
    uint data; // 0x0000AABB
} ssbo;

void main() {
    uint a = ssbo.data & 0x0000FF00;
    uint b = ssbo.data & 0x000000FF;
}
```

Com a extensão:

```glsl
#version 450
#extension GL_EXT_shader_8bit_storage : enable

layout (set = 0, binding = 0) readonly buffer StorageBuffer {
    uint8_t dataA; // 0xAA
    uint8_t dataB; // 0xBB
} ssbo;

void main() {
    uint a = uint(ssbo.dataA);
    uint b = uint(ssbo.dataB);
}
```

## VK_KHR_shader_float16_int8

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.
>
> - [GLSL - GL_EXT_shader_explicit_arithmetic_types](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shader_explicit_arithmetic_types.txt)

Esta extensão permite o uso de tipos inteiros de 8 bits ou tipos de ponto flutuante de 16 bits em operações aritméticas. Ela não permite tipos inteiros de 8 bits ou de ponto flutuante de 16 bits em interfaces de entrada e saída de shaders e, portanto, é comumente combinada com `VK_KHR_8bit_storage` e `VK_KHR_16bit_storage`.

## VK_KHR_shader_float_controls

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.
>
> - [SPV_KHR_float_controls](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_float_controls.html)

Esta extensão permite definir como o arredondamento de números de ponto flutuante é tratado. A struct `VkPhysicalDeviceFloatControlsProperties` mostra a lista completa de recursos que podem ser consultados. Isso é útil ao converter kernels OpenCL para Vulkan.

## VK_KHR_storage_buffer_storage_class

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.1.
>
> - [SPV_KHR_storage_buffer_storage_class](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_storage_buffer_storage_class.html)

Originalmente, o SPIR-V combinava tanto UBO quanto SSBO na classe de armazenamento `Uniform` e os diferenciava apenas por meio de decorações extras. Como alguns hardwares tratam UBO e SSBO como dois objetos de armazenamento distintos, o SPIR-V passou a refletir essa separação. Esta extensão tem o propósito de estender o SPIR-V com a nova classe de armazenamento `StorageBuffer`.

Um exemplo disso pode ser visto no seguinte trecho de shader GLSL:

```glsl
layout(set = 0, binding = 0) buffer ssbo {
    int x;
};
```

Se você compilar visando o Vulkan 1.0 (que requer SPIR-V 1.0), usando `glslang --target-env vulkan1.0`, obterá algo semelhante a:

```text
       OpDecorate %ssbo BufferBlock
%ptr = OpTypePointer Uniform %ssbo
%var = OpVariable %ptr Uniform
```

Como `SPV_KHR_storage_buffer_storage_class` foi adicionada ao SPIR-V 1.3, se você compilar visando o Vulkan 1.1 (que requer SPIR-V 1.3), usando `glslang --target-env vulkan1.1`, o compilador fará uso da nova classe `StorageBuffer`:

```text
       OpDecorate %ssbo Block
%ptr = OpTypePointer StorageBuffer %ssbo
%var = OpVariable %ptr StorageBuffer
```

> **Nota:** [Experimente online no Compiler Explorer](https://godbolt.org/z/a8WMEeejs).

## VK_KHR_variable_pointers

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.1.
>
> - [SPV_KHR_variable_pointers](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_variable_pointers.html)

Um `Variable pointer` é definido no SPIR-V como:

> **Nota:** Um ponteiro de tipo lógico resultante de uma das seguintes instruções: `OpSelect`, `OpPhi`, `OpFunctionCall`, `OpPtrAccessChain`, `OpLoad` ou `OpConstantNull`.

Quando esta extensão está habilitada, ponteiros privados à invocação podem ser dinâmicos e não uniformes. Sem esta extensão, um ponteiro variável precisa ser selecionado a partir de ponteiros que apontam para a mesma estrutura ou ser `OpConstantNull`.

Esta extensão possui dois níveis. O primeiro é o bit de recurso `variablePointersStorageBuffer`, que permite às implementações suportar o uso de ponteiros variáveis apenas em SSBOs. O bit de recurso `variablePointers` permite o uso de ponteiros variáveis também fora de SSBOs.

## VK_KHR_vulkan_memory_model

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.
>
> - [Comparando o modelo de memória Vulkan SPIR-V com o de C](https://www.khronos.org/blog/comparing-the-vulkan-spir-v-memory-model-to-cs/)

O [Modelo de Memória do Vulkan (*Vulkan Memory Model*)](https://docs.vulkan.org/spec/latest/appendices/memorymodel.html) define formalmente como sincronizar acessos de memória às mesmas posições de memória executados por múltiplas invocações de shader, e esta extensão expõe um booleano para que as implementações indiquem suporte a ele. Isso é importante porque, com tantas ferramentas e linguagens visando Vulkan/SPIR-V, é essencial garantir que operações de transferência de memória otimizadas por uma aplicação não quebrem entre implementações diferentes.

## VK_EXT_shader_viewport_index_layer

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.2.
>
> - [SPV_EXT_shader_viewport_index_layer](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_viewport_index_layer.html)
> - [GLSL - GL_ARB_shader_viewport_layer_array](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_shader_viewport_layer_array.txt)

Esta extensão adiciona os *built-ins* `ViewportIndex` e `Layer` para exportação a partir de shaders de vértice (*vertex shaders*) ou de tesselação (*tessellation shaders*).

Em GLSL, eles são representados pelos *built-ins* `gl_ViewportIndex` e `gl_Layer`.

Ao usar Vulkan 1.0 ou 1.1, utiliza-se a capacidade SPIR-V `ShaderViewportIndexLayerEXT`. A partir do Vulkan 1.2, a capacidade `ShaderViewportIndexLayerEXT` foi dividida nas novas capacidades `ShaderViewportIndex` e `ShaderLayer`.

## VK_KHR_shader_draw_parameters

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.1.
>
> - [SPV_KHR_shader_draw_parameters](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_shader_draw_parameters.html)
> - [GLSL - GL_ARB_shader_draw_parameters](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_shader_draw_parameters.txt)

Esta extensão adiciona os *built-ins* `BaseInstance`, `BaseVertex` e `DrawIndex` para *vertex shaders*. Isso foi adicionado porque existem casos de uso legítimos tanto para incluir quanto para excluir os parâmetros `BaseVertex` ou `BaseInstance` em `VertexId` e `InstanceId`, respectivamente.

Em GLSL, eles são representados pelos *built-ins* `gl_BaseInstanceARB`, `gl_BaseVertexARB` e `gl_DrawIDARB`.

## VK_EXT_shader_stencil_export

> **Nota:**
> - [SPV_EXT_shader_stencil_export](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_shader_stencil_export.html)
> - [GLSL - GL_ARB_shader_stencil_export](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_shader_stencil_export.txt)

Esta extensão permite que um shader gere o valor de referência de estêncil por invocação. Quando o teste de estêncil está habilitado, isso permite que o teste seja executado contra o valor gerado no shader.

Em GLSL, isso é representado pelo *built-in* `out int gl_FragStencilRefARB`.

## VK_EXT_shader_demote_to_helper_invocation

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.
>
> - [SPV_EXT_demote_to_helper_invocation](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/EXT/SPV_EXT_demote_to_helper_invocation.html)
> - [GLSL - GL_EXT_demote_to_helper_invocation](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_demote_to_helper_invocation.txt)

Esta extensão foi criada para ajudar a corresponder à instrução `discard` do HLSL em SPIR-V, adicionando a palavra-chave `demote`. Ao usar `demote` em uma invocação de *fragment shader*, ela se torna uma invocação auxiliar (*helper invocation*). Quaisquer escritas em memória após essa instrução são suprimidas e o fragmento não escreve saídas no *framebuffer*.

## VK_KHR_shader_clock

> **Nota:**
> - [SPV_KHR_shader_clock](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_shader_clock.html)
> - [GLSL - GL_EXT_shader_realtime_clock](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shader_realtime_clock.txt)

Esta extensão permite que o shader leia o valor de um contador monotonicamente crescente fornecido pela implementação. Isso pode ser usado como um método possível de depuração, rastreando a ordem em que uma invocação executa a instrução. Vale notar que a adição de `OpReadClockKHR` altera o próprio shader que se deseja depurar, o que significa que há um certo limite de precisão ao representar a ordem de execução como se essas instruções não existissem.

## VK_KHR_shader_non_semantic_info

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.
>
> - [SPV_KHR_non_semantic_info](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_non_semantic_info.html)

Esta extensão expõe [SPV_KHR_non_semantic_info](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_non_semantic_info.html), que [adiciona a capacidade](https://github.com/KhronosGroup/SPIRV-Guide/blob/master/chapters/nonsemantic.md) de declarar conjuntos de instruções estendidos que não possuem impacto semântico e podem ser removidos com segurança de um módulo.

## VK_KHR_shader_terminate_invocation

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.
>
> - [SPV_KHR_terminate_invocation](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_terminate_invocation.html)

Esta extensão adiciona a nova instrução `OpTerminateInvocation` para fornecer uma funcionalidade sem ambiguidades em comparação com a instrução `OpKill`.

## VK_KHR_workgroup_memory_explicit_layout

> **Nota:**
> - [SPV_KHR_workgroup_memory_explicit_layout](https://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_workgroup_memory_explicit_layout.html)
> - [GLSL - GL_EXT_shared_memory_block](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shared_memory_block.txt)

Esta extensão fornece uma maneira para o shader definir o layout da memória da classe de armazenamento `Workgroup` (`Workgroup` `Storage Class`). Variáveis `Workgroup` podem ser declaradas em blocos e, então, utilizar as mesmas decorações de layout explícito (por exemplo, `Offset`, `ArrayStride`) que outras classes de armazenamento.

Um caso de uso é realizar grandes cópias vetoriais (por exemplo, `uvec4` por vez) da memória de *buffer* para a memória compartilhada, mesmo que a memória compartilhada seja, na realidade, de um tipo diferente (por exemplo, `fp16` escalar).

Outro caso de uso é que desenvolvedores podem reutilizar memória compartilhada para reduzir o consumo total, usando algo como o seguinte:

```text
pass1 - escreve em shmem usando o tipo A
barrier()
pass2 - lê de shmem usando o tipo A
barrier()
pass3 - escreve em shmem usando o tipo B
barrier()
pass4 - lê de shmem usando o tipo B
```

O suporte a layout explícito e alguma forma de *aliasing* também são necessários para implementar OpenCL em camadas sobre o Vulkan.

## VK_KHR_zero_initialize_workgroup_memory

> **Nota:** Promovida para o núcleo (*core*) no Vulkan 1.3.

Esta extensão permite que `OpVariable` com a classe de armazenamento `Workgroup` utilize o operando `Initializer`.

Por razões de segurança, aplicações que executam conteúdo não confiável (por exemplo, navegadores web) precisam conseguir inicializar com zeros a memória do *workgroup* no início da execução do *workgroup*. Adicionar instruções explícitas para zerar todas as variáveis do *workgroup* seria menos eficiente do que aquilo de que alguns hardwares são capazes, devido a padrões de acesso ineficientes.
