# VK_KHR_shader_subgroup_uniform_control_flow

## Visão Geral

A extensão [VK_KHR_shader_subgroup_uniform_control_flow](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_subgroup_uniform_control_flow.html) fornece garantias mais fortes para a reconvergência de invocações em um *shader*. Se a extensão for suportada, os *shaders* podem ser modificados para incluir um novo atributo que oferece essas garantias mais fortes (consulte [GL_EXT_subgroup_uniform_control_flow](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_subgroup_uniform_control_flow.txt)). Esse atributo só pode ser aplicado a estágios de *shader* que suportam operações de *subgroup* (verifique `VkPhysicalDeviceSubgroupProperties::supportedStages` ou `VkPhysicalDeviceVulkan11Properties::subgroupSupportedStages`).

Essas garantias mais fortes fazem com que as regras de fluxo de controle uniforme (*uniform control flow*) da especificação SPIR-V também se apliquem a *subgroups* individuais. A parte mais importante dessas regras é a exigência de reconvergência em um bloco de junção (*merge block*) se todas as invocações estivessem convergidas ao entrar no bloco de cabeçalho (*header block*). Autores de *shaders* frequentemente dependem disso de forma implícita, mas isso não é realmente garantido pela especificação central (*core*) do Vulkan.

## Exemplo

Considere o seguinte trecho em GLSL de um *compute shader* que tenta reduzir o número de operações atômicas de uma por invocação para uma por *subgroup*:

```glsl
// "free" deve ser inicializado com 0.
layout(set=0, binding=0) buffer BUFFER { uint free; uint data[]; } b;
void main() {
  bool needs_space = false;
  ...
  if (needs_space) {
    // gl_SubgroupSize pode ser maior do que o tamanho real do subgroup,
    // portanto calculamos o tamanho efetivo do subgroup.
    uvec4 mask = subgroupBallot(needs_space);
    uint size = subgroupBallotBitCount(mask);
    uint base = 0;
    if (subgroupElect()) {
      // "free" rastreia o próximo espaço livre para escrita.
      // A primeira invocação do subgroup aloca espaço para
      // cada invocação do subgroup que precisa dele.
      base = atomicAdd(b.free, size);
    }

    // Transmite o índice base para as demais invocações do subgroup.
    base = subgroupBroadcastFirst(base);
    // Calcula o deslocamento (offset) a partir de "base" para cada invocação.
    uint offset = subgroupBallotExclusiveBitCount(mask);

    // Grava os dados no espaço alocado para cada invocação que
    // solicitou espaço.
    b.data[base + offset] = ...;
  }
  ...
}
```

Há um problema nesse código que pode levar a resultados inesperados. O Vulkan só exige que as invocações reconvirjam após a instrução `if` que executa a eleição do *subgroup* se todas as invocações no *workgroup* estiverem convergidas nessa instrução `if`. Se as invocações não reconvergirem, o *broadcast* e os cálculos de deslocamento (*offset*) ficarão incorretos, e nem todas as invocações gravarão seus resultados no índice correto.

A extensão `VK_KHR_shader_subgroup_uniform_control_flow` pode ser utilizada para fazer o *shader* se comportar conforme o esperado na maioria dos casos. Considere a versão reescrita do exemplo a seguir:

```glsl
// "free" deve ser inicializado com 0.
layout(set=0, binding=0) buffer BUFFER { uint free; uint data[]; } b;
// Observe a adição do novo atributo.
void main() [[subgroup_uniform_control_flow]] {
  bool needs_space = false;
  ...
  // Observe a alteração da condição.
  if (subgroupAny(needs_space)) {
    // gl_SubgroupSize pode ser maior do que o tamanho real do subgroup,
    // portanto calculamos o tamanho efetivo do subgroup.
    uvec4 mask = subgroupBallot(needs_space);
    uint size = subgroupBallotBitCount(mask);
    uint base = 0;
    if (subgroupElect()) {
      // "free" rastreia o próximo espaço livre para escrita.
      // A primeira invocação do subgroup aloca espaço para
      // cada invocação do subgroup que precisa dele.
      base = atomicAdd(b.free, size);
    }

    // Transmite o índice base para as demais invocações do subgroup.
    base = subgroupBroadcastFirst(base);
    // Calcula o deslocamento (offset) a partir de "base" para cada invocação.
    uint offset = subgroupBallotExclusiveBitCount(mask);

    if (needs_space) {
      // Grava os dados no espaço alocado para cada invocação que
      // solicitou espaço.
      b.data[base + offset] = ...;
    }
  }
  ...
}
```

As diferenças em relação ao *shader* original são relativamente pequenas. Primeiro, a adição do atributo `subgroup_uniform_control_flow` informa à implementação que garantias mais fortes são necessárias para este *shader*. Segundo, a primeira instrução `if` não testa mais `needs_space` diretamente; em vez disso, todas as invocações no *subgroup* entram no `if` caso qualquer invocação do *subgroup* precise gravar dados. Isso mantém o *subgroup* uniforme para aproveitar as garantias aprimoradas na eleição interna do *subgroup*.

Há uma ressalva final neste exemplo: para que o *shader* opere corretamente em todas as circunstâncias, o *subgroup* precisa estar uniforme (convergido) antes da primeira instrução `if`.

## Extensões Relacionadas

* [GL_EXT_subgroup_uniform_control_flow](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_subgroup_uniform_control_flow.txt) — adiciona um atributo GLSL para pontos de entrada (*entry points*) a fim de notificar as implementações de que garantias mais fortes de convergência são necessárias. Isso se traduz em um novo modo de execução no ponto de entrada SPIR-V.
* [SPV_KHR_subgroup_uniform_control_flow](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_subgroup_uniform_control_flow.html) — adiciona um modo de execução para pontos de entrada para indicar a exigência de garantias mais fortes de reconvergência.
