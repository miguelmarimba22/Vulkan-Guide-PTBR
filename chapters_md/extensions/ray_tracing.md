# Ray Tracing

Um conjunto de cinco extensões inter-relacionadas fornece suporte a *ray tracing* na API Vulkan:

- [VK_KHR_acceleration_structure](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_acceleration_structure.html)
- [VK_KHR_ray_tracing_pipeline](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_ray_tracing_pipeline.html)
- [VK_KHR_ray_query](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_ray_query.html)
- [VK_KHR_pipeline_library](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_pipeline_library.html)
- [VK_KHR_deferred_host_operations](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_deferred_host_operations.html)

Extensões adicionais de SPIR-V e GLSL também expõem a funcionalidade programável necessária para os shaders:

- [SPV_KHR_ray_tracing](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_ray_tracing.html)
- [SPV_KHR_ray_query](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_ray_query.html)
- [GLSL_EXT_ray_tracing](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_ray_tracing.txt)
- [GLSL_EXT_ray_query](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_ray_query.txt)
- [GLSL_EXT_ray_flags_primitive_culling](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GLSL_EXT_ray_flags_primitive_culling.txt)

> **Nota:** Muitas aplicações de *ray tracing* exigem grandes alocações contíguas de memória. Devido ao tamanho limitado do espaço de endereçamento, isso pode ser desafiador em sistemas de 32 bits. Embora as implementações sejam livres para expor extensões de *ray tracing* em sistemas de 32 bits, as aplicações podem enfrentar problemas intermitentes relacionados à memória, como falhas de alocação devido à fragmentação. Além disso, algumas implementações podem optar por não expor extensões de *ray tracing* em drivers de 32 bits.

## VK_KHR_acceleration_structure

As estruturas de aceleração (*acceleration structures*) são uma representação opaca e dependente da implementação de objetos geométricos, utilizadas para *ray tracing*. Ao construir objetos em estruturas de aceleração, o *ray tracing* pode ser executado sobre um layout de dados conhecido e de maneira eficiente. A extensão `VK_KHR_acceleration_structure` introduz funcionalidades para construir e copiar estruturas de aceleração, juntamente com recursos para suportar serialização para/da memória.

As estruturas de aceleração são obrigatórias tanto para *pipelines* de *ray tracing* (`VK_KHR_ray_tracing_pipeline`) quanto para *ray queries* (`VK_KHR_ray_query`).

Para criar uma estrutura de aceleração:

- Preencha uma instância de `VkAccelerationStructureBuildGeometryInfoKHR` com o tipo da estrutura de aceleração, tipos de geometria, contagens e tamanhos máximos. Os dados geométricos ainda não precisam ser preenchidos neste momento.
- Chame `vkGetAccelerationStructureBuildSizesKHR` para obter os requisitos de tamanho de memória necessários para realizar a construção.
- Aloque *buffers* de tamanho suficiente para armazenar a estrutura de aceleração (`VkAccelerationStructureBuildSizesKHR::accelerationStructureSize`) e o *scratch buffer* de construção (`VkAccelerationStructureBuildSizesKHR::buildScratchSize`).
- Chame `vkCreateAccelerationStructureKHR` para criar uma estrutura de aceleração em uma posição específica dentro de um *buffer*.
- Chame `vkCmdBuildAccelerationStructuresKHR` para construir a estrutura de aceleração. A struct `VkAccelerationStructureBuildGeometryInfoKHR` preenchida anteriormente deve ser passada como parâmetro aqui, juntamente com o objeto da estrutura de aceleração de destino, o *scratch buffer* de construção e os ponteiros para os dados geométricos (vértices, índices e transformações).

## VK_KHR_ray_tracing_pipeline

A extensão `VK_KHR_ray_tracing_pipeline` introduz *pipelines* de *ray tracing*. Essa nova forma de *pipeline* de renderização é independente do *pipeline* tradicional de rasterização. Os *pipelines* de *ray tracing* utilizam um conjunto dedicado de estágios de shader, distintos dos estágios tradicionais de vértice/geometria/fragmento. Eles também utilizam comandos dedicados para submeter trabalho de renderização (`vkCmdTraceRaysKHR` e `vkCmdTraceRaysIndirectKHR`). Esses comandos podem ser considerados análogos aos comandos de desenho nos *pipelines* tradicionais de rasterização (`vkCmdDraw` e `vkCmdDrawIndirect`).

Para traçar raios:

- Vincule um *pipeline* de *ray tracing* usando `vkCmdBindPipeline` com `VK_PIPELINE_BIND_POINT_RAY_TRACING_KHR`.
- Chame `vkCmdTraceRaysKHR` ou `vkCmdTraceRaysIndirectKHR`.

Os *pipelines* de *ray tracing* introduzem vários novos domínios de shader, descritos abaixo:

![Shaders de Ray Tracing](https://www.khronos.org/assets/uploads/blogs/2020-The-ray-tracing-mechanism-achieved-through-the-five-shader-stages-2.jpg)

- **Ray generation shader**: representa o ponto de partida para o *ray tracing*. Os comandos de *ray tracing* (`vkCmdTraceRaysKHR` e `vkCmdTraceRaysIndirectKHR`) lançam uma grade de invocações de shader, semelhante aos *compute shaders*. Um *ray generation shader* constrói raios e inicia o traçado por meio da invocação de `traceRayEXT()`. Além disso, ele processa os resultados retornados pelo *hit group*.
- **Closest hit shaders**: são executados quando o raio intercepta a geometria mais próxima. Uma aplicação pode suportar qualquer número de *closest hit shaders*. Eles são tipicamente usados para realizar cálculos de iluminação e podem traçar raios adicionais recursivamente.
- **Miss shaders**: são executados no lugar de um *closest hit shader* quando um raio não intercepta nenhuma geometria durante a travessia. Um uso comum para um *miss shader* é amostrar um mapa de ambiente (*environment map*).
- **Intersection shaders**: o teste de interseção integrado é um teste raio-triângulo. Os *intersection shaders* permitem o tratamento personalizado de interseções (por exemplo, para geometrias procedurais).
- **Any-hit shaders**: de forma semelhante ao *closest hit shader*, os *any-hit shaders* são executados após uma interseção ser reportada. A diferença é que um *any-hit shader* pode ser invocado para qualquer interseção no intervalo do raio definido por `[tmin, tmax]`, e não apenas para a mais próxima da origem do raio. O *any-hit shader* é usado para filtrar interseções e, portanto, é frequentemente utilizado para implementar *alpha-testing*.

## VK_KHR_ray_query

A extensão `VK_KHR_ray_query` fornece suporte para traçar raios a partir de todos os tipos de shader, incluindo *pipelines* gráficos, de computação (*compute*) e de *ray tracing*.

O *ray query* exige que o código de travessia do raio seja incluído explicitamente dentro do shader. Isso difere dos *pipelines* de *ray tracing*, onde a geração de raios, o teste de interseção e o tratamento de acertos raio-geometria são representados como estágios de shader separados. Consequentemente, embora o *ray query* permita traçar raios a partir de uma gama mais ampla de estágios de shader, ele também restringe o leque de otimizações que uma implementação Vulkan pode aplicar ao escalonamento e ao traçado de raios.

A extensão não introduz novos pontos de entrada na API; ela simplesmente fornece suporte na API para as extensões SPIR-V e GLSL relacionadas (`SPV_KHR_ray_query` e `GLSL_EXT_ray_query`).

A funcionalidade fornecida por `VK_KHR_ray_query` é complementar à fornecida por `VK_KHR_ray_tracing_pipeline`, e as duas extensões podem ser usadas em conjunto.

```glsl
rayQueryEXT rq;

rayQueryInitializeEXT(rq, accStruct, gl_RayFlagsTerminateOnFirstHitEXT, cullMask, origin, tMin, direction, tMax);

// Percorre a estrutura de aceleração e armazena informações sobre a primeira interseção (se houver)
rayQueryProceedEXT(rq);

if (rayQueryGetIntersectionTypeEXT(rq, true) == gl_RayQueryCommittedIntersectionNoneEXT) {
    // Não está na sombra
}
```

## VK_KHR_pipeline_library

A extensão `VK_KHR_pipeline_library` introduz bibliotecas de *pipeline* (*pipeline libraries*). Uma biblioteca de *pipeline* é um *pipeline* especial criado com a *flag* `VK_PIPELINE_CREATE_LIBRARY_BIT_KHR` que não pode ser vinculado nem usado diretamente. Em vez disso, trata-se de *pipelines* que representam uma coleção de shaders, grupos de shaders e estados relacionados que podem ser vinculados (*linked*) a outros *pipelines*.

A extensão `VK_KHR_pipeline_library` não introduz diretamente novas funções na API nem define como criar uma biblioteca de *pipeline*. Em vez disso, essa funcionalidade fica a cargo de outras extensões que fazem uso dos recursos fornecidos por `VK_KHR_pipeline_library`. Atualmente, os exemplos disso são `VK_KHR_ray_tracing_pipeline` e `VK_EXT_graphics_pipeline_library`. `VK_KHR_pipeline_library` foi definida como uma extensão separada para permitir que a mesma funcionalidade seja usada por outras extensões no futuro, sem introduzir dependência das extensões de *ray tracing*.

Para criar uma biblioteca de *pipeline* de *ray tracing*:

- Defina `VK_PIPELINE_CREATE_LIBRARY_BIT_KHR` em `VkRayTracingPipelineCreateInfoKHR::flags` ao chamar `vkCreateRayTracingPipelinesKHR`.

Para vincular (*link*) bibliotecas de *pipeline* de *ray tracing* em um *pipeline* completo:

- Defina `VkRayTracingPipelineCreateInfoKHR::pLibraryInfo` para apontar para uma instância de `VkPipelineLibraryCreateInfoKHR`.
- Preencha `VkPipelineLibraryCreateInfoKHR::pLibraries` com as bibliotecas de *pipeline* a serem usadas como entrada na vinculação e defina `VkPipelineLibraryCreateInfoKHR::libraryCount` com o valor apropriado.

## VK_KHR_deferred_host_operations

A extensão `VK_KHR_deferred_host_operations` introduz um mecanismo para distribuir tarefas custosas de CPU em múltiplas *threads*. Em vez de introduzir um *thread pool* dentro dos drivers Vulkan, `VK_KHR_deferred_host_operations` foi projetada para permitir que a própria aplicação crie e gerencie as *threads*.

Assim como `VK_KHR_pipeline_library`, `VK_KHR_deferred_host_operations` foi definida como uma extensão separada para permitir o uso da mesma funcionalidade em outras extensões futuras sem criar dependência das extensões de *ray tracing*.

Apenas operações especificamente marcadas como suportando adiamento (*deferral*) podem ser adiadas. Atualmente, as únicas operações que suportam adiamento são `vkCreateRayTracingPipelinesKHR`, `vkBuildAccelerationStructuresKHR`, `vkCopyAccelerationStructureKHR`, `vkCopyMemoryToAccelerationStructureKHR`, `vkCopyAccelerationStructureToMemoryKHR`, `vkBuildMicromapsEXT`, `vkCopyMicromapEXT`, `vkCopyMemoryToMicromapEXT`, `vkCopyMicromapToMemoryEXT` e `vkCreateDataGraphPipelinesARM`.

Para solicitar que uma operação seja adiada:

- Crie um objeto `VkDeferredOperationKHR` chamando `vkCreateDeferredOperationKHR`.
- Chame a operação que deseja adiar, passando o `VkDeferredOperationKHR` como parâmetro.
- Verifique o `VkResult` retornado pela operação acima:
  - `VK_OPERATION_DEFERRED_KHR` indica que a operação foi adiada com sucesso.
  - `VK_OPERATION_NOT_DEFERRED_KHR` indica que a operação foi concluída imediatamente com sucesso.
  - Qualquer valor de erro indica que ocorreu um erro.

Para associar uma *thread* a uma operação adiada e contribuir com tempo de CPU para fazê-la progredir:

- Chame `vkDeferredOperationJoinKHR` em cada *thread* que você deseja que participe da operação.
- Verifique o `VkResult` retornado por `vkDeferredOperationJoinKHR`:
  - `VK_SUCCESS` indica que a operação foi concluída.
  - `VK_THREAD_DONE_KHR` indica que não há mais trabalho para atribuir à *thread* chamadora, mas outras *threads* ainda podem ter trabalho adicional para concluir. A *thread* atual não deve tentar se associar novamente chamando `vkDeferredOperationJoinKHR`.
  - `VK_THREAD_IDLE_KHR` indica que *temporariamente* não há trabalho para atribuir à *thread* chamadora, mas trabalho adicional pode ficar disponível no futuro. A *thread* atual pode realizar outro trabalho útil e voltar a chamar `vkDeferredOperationJoinKHR` mais tarde, o que pode ser benéfico.

Após a conclusão de uma operação (isto é, quando `vkDeferredOperationJoinKHR` tiver retornado `VK_SUCCESS`), chame `vkGetDeferredOperationResultKHR` para obter o resultado da operação.

## Sincronização para Ray Tracing

- Para chamadas de traçado (*trace*) ou consulta (*query*) em um shader, use `VK_ACCESS_ACCELERATION_STRUCTURE_READ_BIT_KHR` com o(s) estágio(s) de shader relevante(s) para a estrutura de aceleração.
- Para acessos à tabela de vinculação de shaders (*shader binding table*) no *pipeline* de *ray tracing*, use `VK_PIPELINE_STAGE_RAY_TRACING_SHADER_BIT_KHR` com `VK_ACCESS_SHADER_READ_BIT` ou `VK_ACCESS_2_SHADER_BINDING_TABLE_READ_BIT_KHR`.
- Para construções de estruturas de aceleração, use `VK_PIPELINE_STAGE_ACCELERATION_STRUCTURE_BUILD_BIT_KHR` com os bits de acesso correspondentes ao recurso sendo acessado:
  - A AS (*acceleration structure*) de destino usa `VK_ACCESS_ACCELERATION_STRUCTURE_WRITE_BIT_KHR`.
  - A AS de origem (por exemplo, para atualizações) usa `VK_ACCESS_ACCELERATION_STRUCTURE_READ_BIT_KHR`.
  - *Scratch buffers* precisam tanto de `VK_ACCESS_ACCELERATION_STRUCTURE_WRITE_BIT_KHR` quanto de `VK_ACCESS_ACCELERATION_STRUCTURE_READ_BIT_KHR`.
  - *Buffers* de vértices/índices/instâncias/transformações usam `VK_ACCESS_SHADER_READ_BIT`.
- Para comandos de cópia de estruturas de aceleração, use `VK_PIPELINE_STAGE_2_ACCELERATION_STRUCTURE_COPY_BIT_KHR` ou `VK_PIPELINE_STAGE_ACCELERATION_STRUCTURE_BUILD_BIT_KHR`, novamente com *flags* de acesso dependentes das origens/destinos:
  - A AS de destino usa `VK_ACCESS_ACCELERATION_STRUCTURE_WRITE_BIT_KHR`.
  - A AS de origem usa `VK_ACCESS_ACCELERATION_STRUCTURE_READ_BIT_KHR`.
  - O *buffer* de destino usa `VK_ACCESS_TRANSFER_WRITE_BIT`.
  - O *buffer* de origem usa `VK_ACCESS_TRANSFER_READ_BIT`.
- Para chamadas indiretas de traçado (*indirect trace*), o *buffer* indireto usa `VK_PIPELINE_STAGE_DRAW_INDIRECT_BIT` com `VK_ACCESS_INDIRECT_COMMAND_READ_BIT`.
- Para construções indiretas de estruturas de aceleração, o *buffer* indireto usa `VK_PIPELINE_STAGE_ACCELERATION_STRUCTURE_BUILD_BIT_KHR` com `VK_ACCESS_INDIRECT_COMMAND_READ_BIT`.
- Para construções de *micromaps*, use `VK_PIPELINE_STAGE_2_MICROMAP_BUILD_BIT_EXT` com os bits de acesso correspondentes ao recurso acessado:
  - O *micromap* de destino usa `VK_ACCESS_2_MICROMAP_WRITE_BIT_EXT`.
  - *Scratch buffers* precisam tanto de `VK_ACCESS_2_MICROMAP_WRITE_BIT_EXT` quanto de `VK_ACCESS_2_MICROMAP_READ_BIT_EXT`.
  - *Buffers* de entrada usam `VK_ACCESS_SHADER_READ_BIT`.
- Para comandos de cópia de *micromaps*, use `VK_PIPELINE_STAGE_2_MICROMAP_BUILD_BIT_EXT`, novamente com *flags* de acesso dependentes das origens/destinos:
  - O *micromap* de destino usa `VK_ACCESS_2_MICROMAP_WRITE_BIT_EXT`.
  - O *micromap* de origem usa `VK_ACCESS_2_MICROMAP_READ_BIT_EXT`.
  - O *buffer* de destino usa `VK_ACCESS_TRANSFER_WRITE_BIT`.
  - O *buffer* de origem usa `VK_ACCESS_TRANSFER_READ_BIT`.

> **Nota:** Diferentemente de outras operações de cópia, `VK_PIPELINE_STAGE_TRANSFER_BIT` **não** funciona para cópias de estruturas de aceleração.
>
> O uso de `VK_PIPELINE_STAGE_2_ACCELERATION_STRUCTURE_COPY_BIT_KHR` / `VK_ACCESS_2_SHADER_BINDING_TABLE_READ_BIT_KHR` requer `VK_KHR_ray_tracing_maintenance1`.
>
> O uso de `VK_PIPELINE_STAGE_2_MICROMAP_BUILD_BIT_EXT` / `VK_ACCESS_2_MICROMAP_WRITE_BIT_EXT` / `VK_ACCESS_2_MICROMAP_READ_BIT_EXT` requer `VK_EXT_opacity_micromap`.

## Boas Práticas de Ray Tracing

### Minimize o Número de Objetos de Ray Query Ativos Simultaneamente

Objetos de *ray query* podem ser custosos em termos de armazenamento privado por *thread*, portanto, para melhor desempenho, é recomendável usar o menor número possível. Na maioria dos casos, é possível utilizar um único objeto de *ray query* mesmo ao traçar múltiplos raios, já que um raio encerrado que precisa disparar um novo raio pode reutilizar o mesmo objeto. Múltiplos *ray queries* no mesmo shader só devem ser necessários quando múltiplas travessias precisarem estar ativas simultaneamente, e os shaders devem ser projetados para minimizar o número de travessias ativas.

### Minimize o Tamanho de Ray Payloads, Hit Attributes e Callable Data

Os estágios de shader de *ray tracing* podem comunicar parâmetros e resultados usando estruturas de *ray payload* entre todos os estágios de travessia, estruturas de *hit attribute* a partir dos shaders de controle de travessia e estruturas de *callable data* para *callable shaders*.

Todas essas três estruturas consomem memória gerenciada pelo driver, cuja quantidade total pode escalar com base no tamanho das próprias estruturas, no número de raios ativos simultaneamente e em fatores adicionais, como níveis de recursão.

Os shaders devem buscar manter o tamanho dessas estruturas reduzido.

### Prefira Memória Local do Dispositivo (Device-Local Memory)

Embora estruturas de aceleração possam ser construídas em qualquer *heap* de memória Vulkan, traçar raios em estruturas de aceleração localizadas em memória *device-local* deve oferecer o melhor desempenho e deve ser preferido. O uso de memória *host-local* (ou seja, memória do sistema acessível pela GPU) pode ser necessário em situações em que as aplicações estão limitadas pela quantidade de memória *device-local* disponível, mas é improvável que isso proporcione desempenho equivalente ao traçado de raios em memória *device-local*.
