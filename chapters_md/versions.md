# Versões do Vulkan e Guia de Portabilidade

O Vulkan utiliza um sistema de versionamento [major, minor, patch](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-coreversions-versionnumbers). Atualmente, existem 5 versões *minor* lançadas do Vulkan (1.0, 1.1, 1.2, 1.3 e 1.4), todas retrocompatíveis entre si. Uma aplicação pode usar [`vkEnumerateInstanceVersion`](https://docs.vulkan.org/spec/latest/chapters/initialization.html#vkEnumerateInstanceVersion) para verificar qual versão de instância Vulkan é suportada. Também existe um [white paper](https://www.lunarg.com/wp-content/uploads/2019/02/Vulkan-1.1-Compatibility-Statement_01_19.pdf) da LunarG explicando como consultar e verificar a versão suportada.

## Instância e Dispositivo

É importante lembrar que existe uma diferença entre a versão em nível de instância (*instance-level*) e a versão em nível de dispositivo (*device-level*). É possível que o loader e as implementações suportem versões diferentes. A seção [Querying Version Support](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-coreversions-queryingversionsupport) da Especificação Vulkan detalha como consultar as versões suportadas tanto no nível de instância quanto no nível de dispositivo.

## Arquivos de Cabeçalho (*Header*)

Existe apenas um conjunto de cabeçalhos suportado para todas as versões principais (*major*) do Vulkan. Isso significa que não existem "cabeçalhos do Vulkan 1.0", pois todos os cabeçalhos de uma versão *minor* e *patch* são unificados. Isso não deve ser confundido com a capacidade de gerar uma versão 1.0 da Especificação Vulkan (consulte o capítulo sobre a Especificação Vulkan), já que a especificação e o cabeçalho da mesma versão *patch* serão correspondentes. Por exemplo, a Especificação Vulkan 1.0.42 gerada corresponderá ao cabeçalho 1.x.42.

É altamente recomendável que os desenvolvedores procurem manter-se atualizados com os arquivos de cabeçalho mais recentes lançados. O Vulkan SDK é distribuído em várias versões que correspondem à versão de cabeçalho com a qual foram empacotadas.

## SPIR-V

Cada versão *minor* do Vulkan corresponde a uma versão de [SPIR-V que deve ser suportada](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html):

- Vulkan 1.0 suporta SPIR-V 1.0
- Vulkan 1.1 suporta SPIR-V 1.3 e anteriores
- Vulkan 1.2 suporta SPIR-V 1.5 e anteriores
- Vulkan 1.3 suporta SPIR-V 1.6 e anteriores
- Vulkan 1.4 suporta SPIR-V 1.6 e anteriores

Cabe à aplicação garantir que o SPIR-V em `VkShaderModule` esteja em uma versão válida para a versão correspondente do Vulkan.

## Extensões

Entre versões *minor* do Vulkan, [algumas extensões](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.1) são [promovidas](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-promotion) para a [versão *core*](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-coreversions). Ao direcionar a aplicação para uma versão *minor* mais recente do Vulkan, não será necessário habilitar as extensões recém-promovidas na criação da instância e do dispositivo. Contudo, se a aplicação precisar manter retrocompatibilidade, será necessário habilitar essas extensões.

Para um resumo das novidades de cada versão, consulte o capítulo sobre o Resumo de Lançamentos do Vulkan.

## Structs e Enums

Structs e enums dependem do arquivo de cabeçalho utilizado, e não da versão da instância ou do dispositivo consultado. Por exemplo, a struct `VkPhysicalDeviceFeatures2` costumava se chamar `VkPhysicalDeviceFeatures2KHR` antes do lançamento do Vulkan 1.1. Independentemente da versão 1.x do Vulkan utilizada, uma aplicação deve usar `VkPhysicalDeviceFeatures2` em seu código, pois corresponde à versão mais recente do cabeçalho. Para aplicações que já possuíam `VkPhysicalDeviceFeatures2KHR` no código, não há com o que se preocupar, pois o cabeçalho Vulkan também define aliases para quaisquer structs e enums promovidos (`using VkPhysicalDeviceFeatures2KHR = VkPhysicalDeviceFeatures2;` / `typedef VkPhysicalDeviceFeatures2 VkPhysicalDeviceFeatures2KHR;`).

O motivo para utilizar a nomenclatura mais recente é que a própria Especificação Vulkan fará referência apenas a `VkPhysicalDeviceFeatures2`, independentemente da versão da especificação gerada. Usar o nome mais novo facilita pesquisar rapidamente onde a estrutura é utilizada.

## Funções

Como as funções são usadas para interagir com o loader e com as implementações, é necessário um pouco mais de cuidado ao trabalhar entre versões *minor*. Como exemplo, observe `vkGetPhysicalDeviceFeatures2KHR`, que foi promovida para *core* como `vkGetPhysicalDeviceFeatures2` na passagem do Vulkan 1.0 para o Vulkan 1.1. Olhando no cabeçalho Vulkan, ambas estão declaradas:

```cpp
using PFN_vkGetPhysicalDeviceFeatures2 = void (VKAPI_PTR *)(
    VkPhysicalDevice physicalDevice,
    VkPhysicalDeviceFeatures2* pFeatures);
// ...
using PFN_vkGetPhysicalDeviceFeatures2KHR = void (VKAPI_PTR *)(
    VkPhysicalDevice physicalDevice,
    VkPhysicalDeviceFeatures2* pFeatures);
```

A principal diferença é que, ao chamar `vkGetInstanceProcAddr(instance, "vkGetPhysicalDeviceFeatures2")`, uma implementação Vulkan 1.0 pode não conhecer a existência de `vkGetPhysicalDeviceFeatures2`, fazendo com que `vkGetInstanceProcAddr` retorne `nullptr`. Para manter retrocompatibilidade com Vulkan 1.0 nessa situação, a aplicação deve consultar `vkGetPhysicalDeviceFeatures2KHR`, já que uma implementação Vulkan 1.1 provavelmente apontará internamente essa função diretamente para o ponteiro de `vkGetPhysicalDeviceFeatures2`.

> **Nota:** A função `vkGetPhysicalDeviceFeatures2KHR` só existirá em uma implementação Vulkan 1.0 se for suportada como extensão.

## Recursos (*Features*)

Entre versões *minor*, é possível que alguns bits de recursos sejam adicionados, removidos, tornados opcionais ou obrigatórios. Todos os detalhes dos recursos alterados estão descritos na seção [Core Revisions](https://docs.vulkan.org/spec/latest/appendices/versions.html).

A seção [Feature Requirements](https://docs.vulkan.org/spec/latest/chapters/features.html#features-requirements) na Especificação Vulkan pode ser utilizada para consultar a lista de recursos obrigatórios nas implementações ao longo das versões *minor*.

## Limites (*Limits*)

As versões 1.0 até 1.3 do Vulkan compartilham os mesmos requisitos mínimos/máximos de limites. O Vulkan 1.4 introduziu alterações em alguns desses limites, aumentando de forma notável o valor mínimo garantido de `maxPushConstantsSize` de 128 bytes para 256 bytes. Quaisquer alterações nos limites estão listadas na seção [Limit Requirements](https://docs.vulkan.org/spec/latest/chapters/limits.html#limits-minmax) da Especificação Vulkan.

## Detalhamento dos Recursos do Vulkan 1.1

O Vulkan 1.1 foi lançado em 7 de março de 2018 e introduziu diversos recursos significativos:

> **Nota:** [Vulkan Spec: Vulkan 1.1](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.1)

### Subgroups

*Subgroups* fornecem uma maneira para invocações dentro de um *workgroup* se comunicarem entre si sem usar memória compartilhada ou *barriers*. Isso permite algoritmos paralelos mais eficientes e pode melhorar significativamente o desempenho de certas cargas de trabalho.

[Vulkan Spec: Subgroups](https://registry.khronos.org/vulkan/specs/latest/html/vkspec.html) | [Vulkan Samples: Extensions](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions)

Principais capacidades:

- Operações básicas de votação (*all*, *any*, *ballot*)
- Operações de *shuffle* (troca de dados entre invocações)
- Operações aritméticas (*add*, *min*, *max* ao longo do *subgroup*)
- Difusão (*broadcast*) de valores de uma invocação para todas as demais

### Memória Protegida (*Protected Memory*)

A memória protegida fornece um mecanismo para impedir que conteúdo seja lido ou modificado por processos ou aplicações não autorizados. Isso é especialmente importante para conteúdo DRM e aplicações seguras.

[Vulkan Spec: Protected Memory](https://docs.vulkan.org/spec/latest/chapters/memory.html#memory-protected-memory)

Principais capacidades:

- Criar alocações de memória protegida
- Submeter *command buffers* protegidos
- Renderizar para imagens de *swapchain* protegidas

### Grupos de Dispositivos (*Device Groups*)

Grupos de dispositivos permitem que uma aplicação trate múltiplos dispositivos físicos como um único dispositivo lógico, habilitando recursos como:

[Vulkan Spec: Device Groups](https://registry.khronos.org/vulkan/specs/latest/html/vkspec.html) | [Vulkan Samples: Extensions](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions)

- Operações de memória entre dispositivos
- Acesso à memória *peer-to-peer*
- Renderização multi-GPU

### Memória e Sincronização Externas

Esses recursos permitem que o Vulkan compartilhe recursos com outras APIs e sistemas:

[Vulkan Spec: External Memory](https://docs.vulkan.org/spec/latest/chapters/memory.html#memory-external) | [Vulkan Spec: External Synchronization](https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-external)

- Importar/exportar objetos de memória
- Importar/exportar *semaphores* e *fences*
- Coordenar com outras APIs gráficas ou com o sistema operacional

### Outros Recursos Notáveis

- Armazenamento de 16 bits: suporte a tipos inteiros e ponto flutuante de 16 bits em *storage buffers* e *push constants*
- Ponteiros variáveis (*Variable pointers*): permite que ponteiros para *storage buffers* sejam indexados dinamicamente
- Renderização *Multiview*: renderizar para múltiplas camadas de um *framebuffer* em um único passe
- Suporte ao SPIR-V 1.3: novas capacidades para shaders
- Conversão YCbCr: conversão de espaço de cor acelerada por hardware
- Atualizações de manutenção (*Maintenance*): diversas melhorias de usabilidade

## Detalhamento dos Recursos do Vulkan 1.2

O Vulkan 1.2 foi lançado em 15 de janeiro de 2020 e construiu sobre a base do Vulkan 1.1:

> **Nota:** [Vulkan Spec: Vulkan 1.2](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.2)

### Indexação de Descritores (*Descriptor Indexing*)

A indexação de descritores oferece maior flexibilidade na forma como descritores são acessados a partir de shaders:

[Vulkan Spec: Descriptor Indexing](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-updates-after-bind) | [Vulkan Sample: Descriptor Indexing](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions/descriptor_indexing)

- Descritores *update-after-bind* (atualização após vinculação)
- Arrays de descritores com tamanho definido em tempo de execução
- Descritores parcialmente vinculados (*partially bound*)
- Indexação não uniforme (*non-uniform indexing*)

### Timeline Semaphores

*Timeline semaphores* estendem o modelo de *semaphore* binário com uma primitiva de sincronização mais flexível:

[Vulkan Spec: Timeline Semaphores](https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-semaphores-timeline) | [Khronos Blog: Timeline Semaphores](https://www.khronos.org/blog/vulkan-timeline-semaphores)

- Atribuir valores de linha do tempo a operações de sinalização (*signal*) e espera (*wait*)
- Sinalizar e aguardar em múltiplos pontos de uma linha do tempo
- Consultar o valor atual da linha do tempo
- Sinalizar a partir do host sem submissão em *queue*

### Buffer Device Address

*Buffer device address* permite que shaders acessem diretamente a memória de buffers usando endereços de 64 bits:

[Vulkan Spec: Buffer Device Address](https://docs.vulkan.org/spec/latest/chapters/descriptorsets.html#descriptorsets-bufferdeviceaddress) | [Vulkan Sample: Buffer Device Address](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions/buffer_device_address)

- Obter um endereço de GPU de 64 bits para um buffer
- Passar endereços de buffers via *push constants* ou descritores
- Acessar dados de buffers usando ponteiros em shaders
- Viabiliza estruturas de dados como listas encadeadas e árvores em shaders

### Operações Atômicas em Shaders

Operações atômicas aprimoradas em shaders:

[Vulkan Spec: SPIR-V Capabilities](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-capabilities)

- Operações atômicas com inteiros de 64 bits
- Operações atômicas em memória compartilhada

### Outros Recursos Notáveis

- Armazenamento de 8 bits: suporte a tipos inteiros de 8 bits em *storage buffers* e *push constants*
- Controles de ponto flutuante em shaders (*Shader float controls*): controle granular sobre o comportamento de ponto flutuante
- Resolução de profundidade/estêncil (*Depth/stencil resolve*): controle de como anexos de profundidade e estêncil são resolvidos em renderização *multi-sampled*
- Layout de bloco escalar (*Scalar block layout*): layout de memória mais flexível para blocos em shaders
- *Framebuffers* sem imagens (*Imageless framebuffers*): criação de *framebuffers* sem especificar *image views* previamente
- Layout padrão para *uniform buffers* (*Uniform buffer standard layout*): layout de memória padronizado para *uniform buffers*
- *Draw indirect count*: especificar a quantidade de comandos de desenho em uma chamada *draw indirect*

## Detalhamento dos Recursos do Vulkan 1.3

O Vulkan 1.3 foi lançado em 25 de janeiro de 2022:

> **Nota:** [Vulkan Spec: Vulkan 1.3](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.3)

### Dynamic Rendering

O *Dynamic rendering* simplifica o processo de renderização eliminando a necessidade de objetos *render pass*:

[Vulkan Spec: Dynamic Rendering](https://docs.vulkan.org/spec/latest/chapters/renderpass.html#dynamic-render) | [Khronos Blog: Streamlining Render Passes](https://www.khronos.org/blog/streamlining-render-passes) | [Vulkan Sample: Dynamic Rendering](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions/dynamic_rendering)

- Iniciar e encerrar a renderização diretamente
- Especificar anexos (*attachments*) no momento da renderização
- Fluxos de trabalho de renderização mais flexíveis
- Portabilidade mais simples a partir de outras APIs

### Synchronization2

*Synchronization2* fornece uma API mais enxuta e clara para sincronização:

[Vulkan Spec: Synchronization2](https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-pipeline-barriers-2) | [Vulkan Sample: Synchronization2](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions/synchronization_2)

- Uso simplificado de *barriers*
- Especificação mais explícita de dependências de memória
- Melhor desempenho por meio de sincronização mais precisa
- Mais fácil de utilizar corretamente

### Extended Dynamic State

*Extended dynamic state* permite que mais estados de *pipeline* sejam especificados durante a gravação do *command buffer*:

[Vulkan Spec: Extended Dynamic State](https://docs.vulkan.org/features/latest/features/proposals/VK_EXT_extended_dynamic_state3.html) | [Vulkan Samples: Extensions](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/extensions)

- *Vertex input bindings* e atributos
- Topologia de primitivas
- *Viewport* com contagem
- *Scissor* com contagem
- Habilitação de teste de profundidade e habilitação de escrita de profundidade
- Operação de comparação e limites de profundidade
- Habilitações e operações de teste de estêncil
- Máscara de escrita e referência de estêncil
- Constantes de *blend*

### Outros Recursos Notáveis

- *Inline uniform blocks*: pequenos dados uniformes embutidos diretamente em *descriptor sets*
- Controle de cache na criação de pipelines (*Pipeline creation cache control*): maior controle sobre a compilação de pipelines
- Dados privados (*Private data*): anexar dados arbitrários a objetos Vulkan
- *Shader demote to helper invocation*: controle de invocações auxiliares em *fragment shaders*
- Controle de tamanho de *subgroup*: especificar tamanhos de *subgroup* exigidos
- Inicialização com zero de memória de *workgroup* (*Zero-initialize workgroup memory*): inicializa automaticamente variáveis compartilhadas de *workgroup*
- *Format feature flags 2*: relatório mais detalhado de capacidades de formatos
- *Copy commands 2*: operações de cópia mais flexíveis

## Detalhamento dos Recursos do Vulkan 1.4

O Vulkan 1.4 foi lançado em 3 de dezembro de 2024:

> **Nota:** [Vulkan Spec: Vulkan 1.4](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.4)

### Dynamic Rendering Local Read

Estende o *dynamic rendering* para permitir a leitura de anexos durante a renderização:

[Vulkan Spec: Dynamic Rendering Local Read](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_dynamic_rendering_local_read.html#_description)

- Ler anexos de cor durante a renderização
- Implementar técnicas como *deferred shading* com maior eficiência
- Reduzir largura de banda de memória evitando buffers intermediários
- Simplificar algoritmos de renderização que precisam ler resultados anteriores

### Rasterização de Linhas (*Line Rasterization*)

Fornece maior controle sobre a renderização de linhas:

[Vulkan Spec: Line Rasterization](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_line_rasterization.html#_description)

- Especificar o modo de rasterização de linha (Bresenham, retangular, etc.)
- Controlar largura de linha e padrões pontilhados (*stipple*)
- Melhorar a qualidade e consistência da renderização de linhas entre implementações
- Melhor correspondência com o comportamento de outras APIs gráficas

### Melhorias no Gerenciamento de Memória

Diversos recursos que aprimoram o gerenciamento de memória:

[Vulkan Spec: Map Memory 2](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_map_memory2.html#_description) | [Vulkan Spec: Load/Store Op None](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_load_store_op_none.html#_description) | [Vulkan Spec: Maintenance 5](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance5.html#_description)

- *Map Memory 2*: mapeamento de memória mais flexível
- *Load/Store Op None*: evitar operações desnecessárias de carga/armazenamento
- *Maintenance 5 e 6*: diversas melhorias de usabilidade
- *Global Priority*: especificar prioridades de *queue* para agendamento em nível de sistema

### Aprimoramentos em Shaders

Novas capacidades para shaders:

[Vulkan Spec: Shader Subgroup Rotate](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_subgroup_rotate.html#_description) | [Vulkan Spec: Shader Expect/Assume](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_expect_assume.html#_description) | [Vulkan Spec: Shader Float Controls 2](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_float_controls2.html#_description)

- *Shader Subgroup Rotate*: rotacionar valores dentro de um *subgroup*
- *Shader Expect/Assume*: fornecer dicas ao compilador para otimização
- *Shader Float Controls 2*: maior controle sobre o comportamento de ponto flutuante
- *Vertex Attribute Divisor*: atributos de vértice com taxa por instância (*instance-rate*)

### Outros Recursos Notáveis

- *Push Descriptor*: atualizar descritores diretamente em *command buffers* ([Spec](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_push_descriptor.html#_description))
- *Index Type UINT8*: suporte a índices de 8 bits ([Spec](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_index_type_uint8.html#_description))
- *Host Image Copy*: copiar dados de imagem diretamente a partir da memória do host ([Spec](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_host_image_copy.html#_description))
- *Pipeline Protected Access*: acesso mais flexível à memória protegida ([Spec](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_protected_access.html#_description))
- *Pipeline Robustness*: tratamento aprimorado de acessos fora dos limites ([Spec](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_robustness.html#_description))

## Portando do Vulkan 1.0 para Qualquer Versão

Esta seção fornece um guia consolidado para portar aplicações do Vulkan 1.0 para qualquer versão mais recente (1.1, 1.2, 1.3 ou 1.4).

> **Nota:** [Vulkan Spec: Compatibility](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility) | [Vulkan Spec: Extension Promotion](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-promotion)

### Lista de Verificação Geral para Portabilidade

1. **Atualizar SDK e cabeçalhos**
   - Certifique-se de estar usando o Vulkan SDK correspondente à sua versão-alvo ou mais recente.
   - Atualize os arquivos de cabeçalho para a versão mais recente.

2. **Criação da instância**
   - Atualize `VkApplicationInfo::apiVersion` para a versão-alvo (por exemplo, `VK_API_VERSION_1_4`).
   - Use `vkEnumerateInstanceVersion` para verificar o suporte à sua versão-alvo.

3. **Seleção de dispositivo**
   - Verifique o suporte à sua versão-alvo nos dispositivos físicos.
   - Selecione dispositivos que suportem os recursos necessários para a versão-alvo.

4. **Adoção de recursos**
   - Substitua o uso de extensões pela funcionalidade *core* onde aplicável.
   - Atualize os nomes das estruturas (ex.: `VkPhysicalDeviceFeatures2KHR` → `VkPhysicalDeviceFeatures2`).
   - Atualize os nomes das funções (ex.: `vkGetPhysicalDeviceFeatures2KHR` → `vkGetPhysicalDeviceFeatures2`).
   - Habilite recursos específicos de cada versão por meio das estruturas apropriadas:
     - Vulkan 1.1: `VkPhysicalDeviceVulkan11Features`
     - Vulkan 1.2: `VkPhysicalDeviceVulkan12Features`
     - Vulkan 1.3: `VkPhysicalDeviceVulkan13Features`
     - Vulkan 1.4: `VkPhysicalDeviceVulkan14Features`

5. **Atualizações de SPIR-V**
   - Atualize os shaders para usar a versão SPIR-V apropriada à versão-alvo do Vulkan:
     - Vulkan 1.1: SPIR-V 1.3 e todas as versões anteriores de SPIR-V
     - Vulkan 1.2: SPIR-V 1.5 e todas as versões anteriores de SPIR-V
     - Vulkan 1.3: SPIR-V 1.6 e todas as versões anteriores de SPIR-V
     - Vulkan 1.4: SPIR-V 1.6 e todas as versões anteriores de SPIR-V
   - Recompile os shaders com um compilador atualizado.

6. **Testes**
   - Teste tanto na versão original quanto na versão-alvo caso a retrocompatibilidade seja necessária.
   - Verifique se todos os recursos funcionam conforme esperado.

### Considerações Específicas por Versão

#### Específico do Vulkan 1.1

- Use `vkEnumerateInstanceVersion` para verificar suporte ao 1.1 (essa função foi introduzida na 1.1).
- Considere adotar *subgroups* para processamento paralelo aprimorado.
- Aproveite a memória protegida se necessário para conteúdo seguro.
- Utilize *device groups* para cenários multi-GPU.
- Implemente memória e sincronização externas para interoperabilidade.

#### Específico do Vulkan 1.2

- Considere adotar *descriptor indexing* para acesso mais flexível a descritores.
- Use *timeline semaphores* para simplificar a sincronização.
- Aproveite *buffer device address* para acesso a buffers baseado em ponteiros.
- Implemente operações atômicas em shaders para cargas de computação avançadas.
- Use o *uniform buffer standard layout* para layouts de memória mais previsíveis.

#### Específico do Vulkan 1.3

- Considere substituir *render passes* por *dynamic rendering* para simplificar a renderização.
- Migre para a API *Synchronization2* para sincronização mais limpa.
- Aproveite *extended dynamic state* para reduzir a quantidade de *pipelines*.
- Use *inline uniform blocks* para pequenos dados uniformes.
- Implemente *zero-initialize workgroup memory* para *compute shaders* mais seguros.

#### Específico do Vulkan 1.4

- Aproveite o *dynamic rendering local read* para acessar dados de pixels diretamente durante a renderização (fornece uma interface para leituras locais de pixel).
- Atualize o código de renderização de linhas para usar os recursos aprimorados de rasterização de linhas.
- Use *map memory 2* para mapeamento de memória mais flexível.
- Implemente *shader subgroup rotate* e outros aprimoramentos de shaders.
- Considere *push descriptors* para atualizações de descritores onde apropriado (nota: alguns fabricantes podem não recomendar seu uso devido a considerações de desempenho).

### Considerações de Retrocompatibilidade

Ao direcionar uma aplicação para múltiplas versões do Vulkan, siga estas diretrizes:

- **Detecção de recursos**: Sempre verifique o suporte a recursos específicos em vez de presumir disponibilidade com base apenas na versão.
- **Fallback de extensões**: Para cada recurso *core* utilizado, verifique se ele está disponível como extensão em versões mais antigas.
- **Nomes de structs e funções**: Use os nomes sem sufixo KHR/EXT dos cabeçalhos mais recentes, mas fique atento a questões de compatibilidade.
- **Habilitação de extensões**: Em versões mais antigas, habilite explicitamente extensões que posteriormente foram promovidas para *core*.
- **Testes**: Teste extensivamente em todas as versões-alvo para garantir compatibilidade.

**Exemplo de tratamento simultâneo de extensão e funcionalidade *core*:**

```cpp
// Verifica se dynamic rendering está disponível (como extensão ou core)
bool hasDynamicRendering = false;
if (deviceVersion >= VK_API_VERSION_1_3) {
    // No Vulkan 1.3+, dynamic rendering é funcionalidade core
    VkPhysicalDeviceVulkan13Features features13{
        .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_3_FEATURES,
        .pNext = nullptr,
    };

    VkPhysicalDeviceFeatures2 features2{
        .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
        .pNext = &features13,
    };

    vkGetPhysicalDeviceFeatures2(physicalDevice, &features2);

    hasDynamicRendering = (features13.dynamicRendering == VK_TRUE);
} else {
    // Verifica a extensão em versões mais antigas
    // [Código de verificação de extensão aqui]
}

// Usa o recurso se estiver disponível
if (hasDynamicRendering) {
    // [Implementação com dynamic rendering]
} else {
    // [Implementação de fallback usando render passes]
}
```

## Solicitando Recursos de Diferentes Versões

> **Nota:** [Vulkan Spec: Features](https://docs.vulkan.org/spec/latest/chapters/features.html) | [Vulkan Spec: Feature Requirements](https://docs.vulkan.org/spec/latest/chapters/features.html#features-requirements)

### Recursos da Versão Core

Para solicitar recursos de uma versão *core* específica do Vulkan:

- **Especifique a versão do Vulkan na criação da instância**:

```cpp
VkApplicationInfo appInfo{
    .sType = VK_STRUCTURE_TYPE_APPLICATION_INFO,
    .pNext = nullptr,
    .apiVersion = VK_API_VERSION_1_4, // Solicita Vulkan 1.4
};
```

- **Consulte o suporte aos recursos**:

```cpp
// Para recursos do Vulkan 1.1
VkPhysicalDeviceVulkan11Features features11{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_1_FEATURES,
    .pNext = nullptr,
};

// Para recursos do Vulkan 1.2
VkPhysicalDeviceVulkan12Features features12{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_2_FEATURES,
    .pNext = &features11,
};

// Para recursos do Vulkan 1.3
VkPhysicalDeviceVulkan13Features features13{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_3_FEATURES,
    .pNext = &features12,
};

// Para recursos do Vulkan 1.4 (encadeando todas as estruturas)
VkPhysicalDeviceVulkan14Features features14{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_4_FEATURES,
    .pNext = &features13,
};

VkPhysicalDeviceFeatures2 features2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &features14,
};

vkGetPhysicalDeviceFeatures2(physicalDevice, &features2);
```

- **Habilite os recursos durante a criação do dispositivo**:

```cpp
// Reutiliza as mesmas estruturas, agora com os recursos desejados habilitados
VkDeviceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &features14, // Aponta para o início da cadeia pNext
    // ... outros parâmetros de criação do dispositivo ...
};

vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
```

### Recursos de Extensões

Para recursos disponíveis como extensões em versões anteriores do Vulkan:

[Vulkan Spec: Extensions](https://docs.vulkan.org/spec/latest/chapters/extensions.html) | [Vulkan Spec: Extension Discovery](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extensions-discovery)

1. **Verifique o suporte à extensão**:

```cpp
#include <algorithm>
#include <cstdint>
#include <string_view>
#include <vector>

uint32_t extensionCount = 0;
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, nullptr);
std::vector<VkExtensionProperties> extensions(extensionCount);
vkEnumerateDeviceExtensionProperties(physicalDevice, nullptr, &extensionCount, extensions.data());

constexpr std::string_view targetExtension = "VK_KHR_dynamic_rendering";
const bool hasExtension = std::ranges::any_of(
    extensions,
    [targetExtension](const VkExtensionProperties& ext) {
        return std::string_view{ext.extensionName} == targetExtension;
    });
```

- **Habilite a extensão**:

```cpp
#include <array>

constexpr std::array<const char*, 1> enabledExtensions = {
    "VK_KHR_dynamic_rendering",
};

VkDeviceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = nullptr,
    .enabledExtensionCount = static_cast<uint32_t>(enabledExtensions.size()),
    .ppEnabledExtensionNames = enabledExtensions.data(),
    // ... outros parâmetros de criação do dispositivo ...
};
```

- **Consulte e habilite recursos específicos da extensão, se necessário**:

```cpp
// Exemplo para VK_EXT_descriptor_indexing
VkPhysicalDeviceDescriptorIndexingFeaturesEXT indexingFeatures{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_DESCRIPTOR_INDEXING_FEATURES_EXT,
    .pNext = nullptr,
};

VkPhysicalDeviceFeatures2 features2{
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &indexingFeatures,
};

vkGetPhysicalDeviceFeatures2(physicalDevice, &features2);

// Em seguida, habilite durante a criação do dispositivo
VkDeviceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &indexingFeatures,
    // ... outros parâmetros de criação do dispositivo ...
};
```

### Boas Práticas

[Vulkan Spec: Versioning and Compatibility](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-compatibility-versioning) | [Vulkan Samples: Performance Best Practices](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance)

1. **Fallbacks graciosos**: Sempre verifique o suporte a recursos e tenha caminhos alternativos (*fallbacks*) para recursos não suportados.

2. **Versão mínima exigida**: Documente claramente a versão mínima do Vulkan que sua aplicação exige.

3. **Detecção de recursos em vez de detecção de versão**: Sempre que possível, verifique recursos específicos em vez de presumir que existem apenas com base na versão do Vulkan.

4. **Priorização de funcionalidades *core***: Dê preferência a funcionalidades *core* em vez de extensões ao direcionar versões mais recentes do Vulkan.

5. **Testes**: Teste em diversas implementações para garantir compatibilidade.
