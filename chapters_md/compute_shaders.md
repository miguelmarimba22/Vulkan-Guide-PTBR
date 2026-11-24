# Compute Shaders

Este capítulo **não** é um artigo de "como usar compute shaders", pois já existem muitos recursos online sobre GPGPU e computação em GPU.

O objetivo deste capítulo é abordar todos os "Vulkanismos", termos e conceitos associados aos *compute shaders* no Vulkan.

Há também um capítulo de Equivalência de Termos (*Decoder Ring*) criado para ajudar desenvolvedores na transição a partir de outras APIs que utilizam terminologia diferente.

> **Nota:** Se você quiser experimentar um exemplo simples de computação, recomendamos dar uma olhada no [exemplo do vk-bootstrap](https://github.com/charles-lunarg/vk-bootstrap/blob/main/example/simple_compute.cpp).

## Vindo do Vulkan Gráfico

Para quem já está mais familiarizado com gráficos no Vulkan, a computação será uma transição simples. Basicamente tudo é igual, exceto por:

- Chamar `vkCmdDispatch` em vez de `vkCmdDraw`
- Usar `vkCreateComputePipelines` em vez de `vkCreateGraphicsPipelines`
- Garantir que sua `VkQueue` suporte `VK_QUEUE_COMPUTE_BIT` (consulte o capítulo sobre *Queues*)
- Ao vincular (*bind*) descritores e pipelines ao seu *command buffer*, certifique-se de usar `VK_PIPELINE_BIND_POINT_COMPUTE`

## Terminologia SPIR-V

A menor unidade de trabalho executada é chamada de `invocation` (invocação). Ela corresponde a uma *thread* ou *lane* de trabalho.

Múltiplas `invocations` são organizadas em `subgroups` (subgrupos), onde `invocations` dentro de um `subgroup` podem sincronizar e compartilhar dados entre si de forma eficiente (consulte o capítulo sobre *Subgroups* para mais detalhes).

Em seguida, temos os `workgroups` (grupos de trabalho), que representam a menor unidade de trabalho que uma aplicação pode definir. Um `workgroup` é uma coleção de `invocations` que executam o mesmo shader.

> **Nota:** Embora seja um pouco incômodo, a especificação do Vulkan usa `WorkGroup`, enquanto a especificação do SPIR-V grafa como `Workgroup`. Isso não tem nenhum significado especial além de ser uma possível fonte de erro de digitação ao transitar entre as duas especificações.

### Tamanho do Workgroup (*Workgroup Size*)

Definir o tamanho do `workgroup` pode ser feito de 3 maneiras em SPIR-V:

1. Usando o built-in `WorkgroupSize` ([exemplo](https://godbolt.org/z/ees83eT7x))
2. Usando o modo de execução `LocalSize` ([exemplo](https://godbolt.org/z/3zn1Preb8))
3. Usando o modo de execução `LocalSizeId` ([exemplo](https://godbolt.org/z/dP7daqTas))

> **Nota:** Veja exemplos de como fazer isso em [GLSL](https://godbolt.org/z/cP8esohKz), [HLSL](https://godbolt.org/z/6W41K4bbz) e [Slang](https://godbolt.org/z/94erx7eTT).

Alguns pontos importantes a observar:

- A decoração `WorkgroupSize` terá precedência sobre qualquer `LocalSize` ou `LocalSizeId` no mesmo módulo.
- `LocalSizeId` foi adicionado na extensão `VK_KHR_maintenance4` (promovida ao núcleo no Vulkan 1.3) para permitir o uso de constantes de especialização (*specialization constants*) na definição do tamanho.
- Existe um limite `maxComputeWorkGroupSize` para o tamanho máximo de cada dimensão `X`, `Y` e `Z`. A maioria das implementações [suporta cerca de 1024 em cada dimensão](https://vulkan.gpuinfo.org/displaydevicelimit.php?name=maxComputeWorkGroupSize[0]&platform=all).
- Existe um limite `maxComputeWorkGroupInvocations` para o produto máximo de `X * Y * Z`. A maioria das implementações [suporta cerca de 1024](https://vulkan.gpuinfo.org/displaydevicelimit.php?name=maxComputeWorkGroupInvocations&platform=all).

### Workgroups Locais e Globais

Quando `vkCmdDispatch` é chamado, ele define o número de *workgroups* a serem despachados. Isso produz um espaço de *workgroup* global (`global workgroup`) no qual a GPU irá trabalhar. Cada *workgroup* individual é um *workgroup* local (`local workgroup`). Uma `invocation` dentro de um `local workgroup` pode compartilhar dados com outros membros do mesmo `local workgroup` por meio de variáveis compartilhadas (*shared variables*), além de emitir barreiras de memória e de fluxo de controle para sincronizar com outros membros do `local workgroup`.

> **Nota:** Existe um limite `maxComputeWorkGroupCount`: [alguns hardwares](https://vulkan.gpuinfo.org/displaydevicelimit.php?name=maxComputeWorkGroupCount[0]&platform=all) suportam apenas 64k, mas hardwares mais novos podem ser praticamente ilimitados nesse aspecto.

### Despachando o tamanho a partir de um buffer

`vkCmdDispatchIndirect` (e o mais recente `vkCmdDispatchIndirect2KHR`) permitem que o tamanho do despacho seja controlado a partir de um buffer. Isso significa que a própria GPU pode definir o número de *workgroups* a serem despachados.

```cpp
// Ou qualquer outra chamada de draw/dispatch que atualize a memória na GPU
vkCmdDispatch(commandBuffer, groupCountX, groupCountY, groupCountZ);

VkMemoryBarrier memoryBarrier{
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER,
    .pNext = nullptr,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_INDIRECT_COMMAND_READ_BIT,
};

vkCmdPipelineBarrier(
    commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT, // estágio de origem
    VK_PIPELINE_STAGE_DRAW_INDIRECT_BIT,  // estágio de destino
    0,
    1, &memoryBarrier,
    0, nullptr,
    0, nullptr
);

// Lê VkDispatchIndirectCommand no buffer para definir o número de workgroups locais
vkCmdDispatchIndirect(commandBuffer, myBuffer, 0);
```

## Memória Compartilhada (*Shared Memory*)

Dentro de um único `local workgroup`, é possível utilizar "memória compartilhada" (*shared memory*). Em SPIR-V, ela é referenciada com a classe de armazenamento `Workgroup`.

A memória compartilhada é essencialmente o "cache L1 que você pode controlar" no seu *compute shader* e é uma parte fundamental de qualquer shader de alto desempenho.

Existe um limite `maxComputeSharedMemorySize` ([geralmente em torno de 32k bytes](https://vulkan.gpuinfo.org/displaydevicelimit.php?name=maxComputeSharedMemorySize&platform=all)) que precisa ser levado em consideração.

### Condições de Corrida em Memória Compartilhada

É muito fácil introduzir condições de corrida (*race conditions*) ao usar memória compartilhada.

O exemplo clássico ocorre quando múltiplas invocações inicializam algo com o mesmo valor.

```glsl
shared uint my_var;
void main() {
    // Todas as invocações no workgroup tentarão escrever na mesma memória.
    // CONDIÇÃO DE CORRIDA (RACE CONDITION)
    my_var = 0;
}
```

Se você está se perguntando "por quê?", a resposta "tecnicamente correta" é: "porque o [modelo de memória](https://docs.vulkan.org/spec/latest/appendices/memorymodel.html) determina assim".

Quando você faz uma escrita fraca (*weak store*) em um endereço de memória, aquela invocação "possui" esse endereço até que ocorra sincronização. O compilador **pode** usar essa informação e optar por reutilizar esse local como armazenamento temporário para outro valor.

Felizmente, a correção é simples: certifique-se de usar operações atômicas.

```glsl
shared uint my_var;
void main() {
    atomicStore(my_var, 0u, gl_ScopeWorkgroup, 0, 0);
}
```

Outra opção é usar uma `OpControlBarrier` com escopo `Workgroup` ([veja online](https://godbolt.org/z/WcsvjYfPx)).

```glsl
layout(local_size_x = 32) in; // workgroup 32x1x1
shared uint my_var[32]; // um espaço para cada invocação

void main() {
    my_var[gl_LocalInvocationIndex] = 0;
    barrier(); // gera uma OpControlBarrier para você
    uint x = my_var[gl_LocalInvocationIndex ^ 1];
}
```

#### Detectando condições de corrida em memória compartilhada

Felizmente, esse problema pode ser detectado automaticamente usando o recurso [GPU-AV](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/docs/gpu_validation.md) das *Vulkan Validation Layers*!

A partir de março de 2026 (TODO - Adicionar versão do SDK quando lançada em maio), o GPU-AV tentará detectar essas condições de corrida para você. Existem [algumas limitações](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/layers/gpuav/shaders/instrumentation/shared_memory_data_race.comp#L47), mas recomendamos fortemente experimentá-lo se estiver enfrentando problemas estranhos relacionados a acessos à memória compartilhada.

### Layout Explícito de Memória Compartilhada

A extensão `VK_KHR_workgroup_memory_explicit_layout` (consulte a seção sobre recursos de shader nas extensões) foi adicionada para permitir o [layout explícito](https://github.com/KhronosGroup/SPIRV-Guide/blob/main/chapters/explicit_layout.md) de memória compartilhada.

## Encontrando a invocação no seu shader

Existem diversos valores *built-in* do SPIR-V que podem ser usados para identificar a invocação no seu shader.

Os seguintes *built-ins* estão bem definidos no [capítulo de variáveis built-in](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-builtin-variables) da especificação do Vulkan:

- `GlobalInvocationId`
- `LocalInvocationId`
- `LocalInvocationIndex`
- `NumSubgroups`
- `NumWorkgroups`
- `SubgroupId`
- `WorkgroupId`

Para quem deseja um exemplo mais prático, [o seguinte código GLSL](https://godbolt.org/z/qhPrE6o5b) demonstra o uso da maioria desses *built-ins*.
