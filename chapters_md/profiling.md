# Profiling (Análise de Desempenho)

Fazer *profiling* no Vulkan é fundamentalmente diferente das APIs gráficas tradicionais. Como o Vulkan é uma API explícita, o driver realiza rastreamento de estado e verificação de erros mínimos em tempo de execução. Essa transparência significa que gargalos de desempenho raramente ficam "escondidos" dentro do driver; em vez disso, são consequências diretas de como a aplicação gerencia recursos, grava comandos e sincroniza o trabalho entre a CPU e a GPU.

Este capítulo apresenta um mergulho profundo em como identificar problemas de desempenho, usar métricas de hardware para encontrar causas raiz e implementar uma estratégia robusta de *profiling*.

## A Mentalidade de Profiling

No Vulkan, você é responsável por toda a linha do tempo de execução. Um erro comum é tratar a GPU como uma "caixa-preta". Para fazer *profiling* de forma eficaz, você precisa entender a relação assíncrona entre a CPU e a GPU:

* **Trabalho de CPU**: Gravação de *command buffers*, atualizações de descritores e criação de *pipelines*.
* **Submissão**: Envio do trabalho para a GPU via `vkQueueSubmit`.
* **Trabalho de GPU**: Execução dos comandos na ordem (e com a sobreposição) permitida pela sua sincronização.

Uma "bolha" (*bubble*) de desempenho ocorre quando um processador fica esperando pelo outro devido à sincronização ineficiente, como o uso excessivo de `vkDeviceWaitIdle` ou barreiras (*barriers*) mal posicionadas.

## Instrumentação e Anotação

Antes de usar qualquer ferramenta de *profiling*, sua aplicação deve estar devidamente instrumentada. Sem nomes e rótulos, um rastreamento (*trace*) de *profiler* é apenas um mar de *handles* anônimos (por exemplo, `VkBuffer 0x559e...`).

### Nomeando Objetos

Use `VK_EXT_debug_utils` para atribuir nomes legíveis por humanos a todos os objetos Vulkan importantes. Isso é essencial para identificar qual *buffer* ou imagem está causando problemas de largura de banda de memória em um *trace*.

```cpp
const VkDebugUtilsObjectNameInfoEXT name_info{
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_OBJECT_NAME_INFO_EXT,
    .pNext = nullptr,
    .objectType = VK_OBJECT_TYPE_IMAGE,
    .objectHandle = reinterpret_cast<uint64_t>(my_texture_image),
    .pObjectName = "Main Depth Buffer",
};

vkSetDebugUtilsObjectNameEXT(device, &name_info);
```

### Rótulos em Command Buffers

Rótulos (*labels*) permitem agrupar chamadas de desenho (*draw calls*) e comandos de despacho (*dispatch*) em regiões lógicas (por exemplo, "Shadow Pass", "Post-Processing"). Esses rótulos aparecem em ferramentas como RenderDoc, NVIDIA Nsight e AMD RGP.

```cpp
const VkDebugUtilsLabelEXT label{
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
    .pNext = nullptr,
    .pLabelName = "Deferred Lighting Pass",
    .color = {1.0f, 0.0f, 0.0f, 1.0f}, // Componente vermelho
};

vkCmdBeginDebugUtilsLabelEXT(command_buffer, &label);
// ... chamadas de desenho (draw calls) ...
vkCmdEndDebugUtilsLabelEXT(command_buffer);
```

### Timestamps de GPU

Embora temporizadores no lado da CPU consigam medir quanto tempo `vkQueueSubmit` leva, eles não conseguem medir quanto tempo a GPU leva para executar o trabalho. Use `VkQueryPool` para capturar *timestamps* precisos de hardware na linha do tempo da GPU.

```cpp
#include <array>
#include <cstdint>

// 1. Cria um query pool para timestamps
const VkQueryPoolCreateInfo query_pool_info{
    .sType = VK_STRUCTURE_TYPE_QUERY_POOL_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .queryType = VK_QUERY_TYPE_TIMESTAMP,
    .queryCount = 2,
    .pipelineStatistics = 0,
};
vkCreateQueryPool(device, &query_pool_info, nullptr, &query_pool);

// 2. Grava os timestamps em um command buffer
vkCmdResetQueryPool(command_buffer, query_pool, 0, 2);
vkCmdWriteTimestamp(command_buffer, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, query_pool, 0);

// ... Trabalho a ser medido (ex.: um render pass específico) ...

vkCmdWriteTimestamp(command_buffer, VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT, query_pool, 1);

// 3. Obtém os resultados (normalmente no próximo quadro para evitar bloqueios)
std::array<uint64_t, 2> results{};
vkGetQueryPoolResults(
    device,
    query_pool,
    0,
    static_cast<uint32_t>(results.size()),
    results.size() * sizeof(uint64_t),
    results.data(),
    sizeof(uint64_t),
    VK_QUERY_RESULT_64_BIT | VK_QUERY_RESULT_WAIT_BIT);

// 4. Converte para milissegundos
// timestampPeriod é obtido de VkPhysicalDeviceLimits
const float elapsed_ms =
    static_cast<float>(results[1] - results[0]) *
    physical_device_properties.limits.timestampPeriod / 1e6f;
```

## Gargalos no Lado da CPU

Mesmo com o baixo *overhead* do Vulkan, a CPU ainda pode ser o gargalo.

### Overhead de Gravação de Comandos

A parte mais custosa da carga de trabalho Vulkan na CPU é a gravação de *command buffers*.

* **Command Buffers Secundários**: Use-os para paralelizar a gravação em múltiplas *threads* de CPU.
* **Mudanças de Estado**: Embora `vkCmdBindPipeline` seja mais barato que seu equivalente no OpenGL, ele ainda dispara atualizações internas de estado no driver. Ordene as chamadas de desenho por *pipeline* para minimizar essas trocas.
* **Atualizações de Descritores**: `vkUpdateDescriptorSets` é uma operação pesada na CPU. Se o seu *profiler* mostrar alto tempo de CPU nessa chamada, considere:
  - **Descriptor Indexing** (`VK_EXT_descriptor_indexing`): para vincular todas as texturas uma única vez e indexá-las no *shader*.
  - **Descriptor Buffers** (`VK_EXT_descriptor_buffer`): para gerenciar descritores como memória bruta, eliminando chamadas de atualização custosas na CPU.

### Submissão e Sincronização

Chamar `vkQueueSubmit` frequentemente com pequenas quantidades de trabalho é um grande vilão de desempenho. Cada submissão possui um custo fixo elevado. Agrupe tantos *command buffers* quanto possível em uma única submissão.

Evite `vkDeviceWaitIdle` ou `vkQueueWaitIdle` no seu loop principal. Essas chamadas esvaziam todo o *pipeline* da GPU, forçando a CPU a esperar até que a GPU fique completamente ociosa. Em vez disso, use um buffer circular (*ring buffer*) de *fences* para acompanhar a conclusão dos quadros e manter a GPU alimentada com trabalho para quadros futuros.

```cpp
#include <array>
#include <cstdint>
#include <limits>

// Configuração para double-buffering
constexpr uint32_t MAX_FRAMES_IN_FLIGHT = 2;
uint32_t current_frame = 0;

// Uma fence por quadro em voo (in flight)
std::array<VkFence, MAX_FRAMES_IN_FLIGHT> frame_fences{};

// Cria as fences no estado sinalizado para que o primeiro quadro não bloqueie
const VkFenceCreateInfo fence_info{
    .sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO,
    .pNext = nullptr,
    .flags = VK_FENCE_CREATE_SIGNALED_BIT,
};
for (auto& fence : frame_fences) {
    vkCreateFence(device, &fence_info, nullptr, &fence);
}

// Loop principal
while (running) {
    const uint32_t frame_index = current_frame % MAX_FRAMES_IN_FLIGHT;

    // Aguarda a GPU terminar o trabalho da última vez em que este slot de quadro foi usado
    vkWaitForFences(
        device,
        1,
        &frame_fences[frame_index],
        VK_TRUE,
        std::numeric_limits<uint64_t>::max());
    vkResetFences(device, 1, &frame_fences[frame_index]);

    // ... Grava os command buffers para este quadro ...

    const VkSubmitInfo submit_info{
        .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
        .pNext = nullptr,
        .waitSemaphoreCount = 0,
        .pWaitSemaphores = nullptr,
        .pWaitDstStageMask = nullptr,
        .commandBufferCount = 1,
        .pCommandBuffers = &command_buffers[frame_index],
        .signalSemaphoreCount = 0,
        .pSignalSemaphores = nullptr,
    };

    // A fence será sinalizada quando a GPU terminar de executar esta submissão
    vkQueueSubmit(queue, 1, &submit_info, frame_fences[frame_index]);

    current_frame++;
}
```

Esse padrão permite que a CPU comece a preparar o `quadro N+1` enquanto a GPU ainda está processando o `quadro N`. Usar `vkDeviceWaitIdle` forçaria a GPU a terminar completamente o `quadro N` antes mesmo de a CPU começar a gravar o `quadro N+1`.

## Gargalos no Lado da GPU

Depois de confirmar que o gargalo está na GPU (*GPU-bound*) — por exemplo, o tempo de quadro é dominado pela execução da GPU em vez do tempo de espera da CPU —, você precisa analisar métricas específicas de hardware.

### Entendendo Métricas de Hardware

A maioria das ferramentas específicas de fabricante fornece métricas que ajudam a identificar qual parte do *pipeline* da GPU está sobrecarregada:

* **Ocupação (*Occupancy*)**: A proporção de *warps* ou *wavefronts* ativos (grupos de *threads*) em relação ao máximo possível no hardware. Baixa ocupação geralmente significa que seus *shaders* estão usando registradores demais, impedindo a GPU de ocultar latências.
* **Paradas (*Stalls*)**: Ocorrem quando as unidades de execução da GPU (ALUs) ficam esperando por dados.
  - **Memory Stall**: Esperando dados chegarem da VRAM ou do cache L2.
  - **Execution Stall**: Esperando a conclusão de uma instrução anterior (por exemplo, uma operação matemática de alta latência).
* **Utilização de Largura de Banda (*Bandwidth Utilization*)**: Alta utilização do controlador de memória indica que a aplicação está limitada por memória (*memory bound*).

### Problemas Comuns de GPU

* **Limitado por Vértices (*Vertex Bound*)**: Excesso de vértices ou busca de vértices (*vertex fetch*) ineficiente. Use `VK_EXT_mesh_shader` para substituir o *pipeline* tradicional de vértices caso a geometria seja o gargalo.
* **Limitado por Fragmentos (*Fragment Bound / Fill Rate*)**: Alto *overdraw* é a causa mais comum.
  - **Early-Z**: Certifique-se de usar `VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT` e ordenação da frente para trás (*front-to-back sorting*).
  - **Análise de Overdraw**: Use a sobreposição de *overdraw* do RenderDoc para encontrar áreas onde o mesmo pixel é sombreado múltiplas vezes.
* **Limitado por Largura de Banda (*Bandwidth Bound*)**: Causado por texturas grandes sem compressão ou excesso de *attachments* de *render target*.
  - Use compressão de texturas (ASTC, BCn).
  - Use `VK_ATTACHMENT_LOAD_OP_CLEAR` em vez de chamadas manuais a `vkCmdClearColorImage` para permitir que o hardware otimize a largura de banda de memória.

## Bolhas de Sincronização (Synchronization Bubbles)

Uma "bolha" (*bubble*) é um período em que a GPU fica ociosa aguardando uma dependência de sincronização que ainda não foi satisfeita.

* **Identificando Bolhas**: Ferramentas como **AMD Radeon GPU Profiler (RGP)** ou **NVIDIA Nsight Systems** mostram a linha do tempo da GPU. Se você vir grandes lacunas entre cargas de trabalho onde nenhuma *queue* está ativa, você tem uma bolha.
* **Causas Raiz**:
  - **Barreiras Restritivas**: Usar `VK_PIPELINE_STAGE_ALL_COMMANDS_BIT` força a GPU a esperar que todo o trabalho anterior termine antes de iniciar a próxima tarefa, mesmo quando não há dependência entre elas.
  - **Sincronização CPU-GPU**: A CPU não está submetendo trabalho rápido o suficiente, ou está aguardando uma *fence* de um quadro anterior cedo demais.

## Escolhendo a Ferramenta Certa

As ferramentas de *profiling* são geralmente categorizadas pelo nível de detalhe que fornecem. Saber qual ferramenta usar para um problema específico é essencial para um ciclo rápido de otimização.

### Rastreamento em Nível de API e Sistema

Essas ferramentas mostram a relação de alto nível entre *threads* de CPU e *queues* de GPU. São essenciais para encontrar bolhas de sincronização e visualizar o "panorama geral" do seu quadro.

* **[NVIDIA Nsight Systems](https://developer.nvidia.com/nsight-systems)**: Ferramenta de *profiling* em nível de sistema que oferece uma visão unificada das atividades de CPU e GPU. Excelente para identificar problemas de sincronização CPU-GPU, *overhead* de submissão de comandos e gargalos de sistema.
* **[AMD Radeon GPU Profiler (RGP)](https://gpuopen.com/rgp/)**: Ferramenta de análise de desempenho de baixo nível para GPUs AMD Radeon. Fornece uma linha do tempo detalhada das cargas de trabalho da GPU, permitindo ver exatamente como os *command buffers* são executados e identificar *stalls* em nível de hardware.
* **[Android GPU Inspector (AGI)](https://developer.android.com/agi)**: *Profiler* do Google para a plataforma Android. Fornece rastreamento da API Vulkan e análise de desempenho de GPU, suportando correlação entre rastreamento de sistema e cargas de trabalho de GPU para identificar gargalos de renderização em dispositivos Android.
* **[VKtracer](https://www.vktracer.com)**: Um *profiler* Vulkan leve, multifabricante e multiplataforma. Registra chamadas da API e seus tempos atuando como uma *layer* Vulkan, sendo útil para identificar chamadas custosas de `vkUpdateDescriptorSets` ou `vkQueueSubmit` sem exigir configuração específica de hardware.

### Profilers de Contadores Específicos de Hardware

Oferecem o nível mais profundo de inspeção nos detalhes internos da GPU, como ocupação, acertos de cache (*cache hits*) e o equilíbrio entre ALUs e unidades de textura.

* **[NVIDIA Nsight Graphics](https://developer.nvidia.com/nsight-graphics)**: Um depurador e *profiler* gráfico abrangente para GPUs NVIDIA. Oferece *profiling* detalhado de *shaders*, utilização de unidades de hardware e análise de memória para encontrar a causa raiz de gargalos na GPU.
* **[Arm Streamline Performance Analyzer](https://developer.arm.com/Tools%20and%20Software/Streamline%20Performance%20Analyzer)**: Parte do Arm Mobile Studio, visualiza o desempenho de aplicações móveis em dispositivos baseados em Arm, fornecendo métricas de CPU, GPU e sistema.
* **[Qualcomm Snapdragon Profiler](https://developer.qualcomm.com/software/snapdragon-profiler)**: Voltado para GPUs Adreno em dispositivos Snapdragon, fornecendo métricas detalhadas de GPU, captura de *traces* de API e *profiling* de *shaders* para otimização de Vulkan em dispositivos móveis.
* **[Imagination PVRTune](https://developer.imaginationtech.com/pvrtune/)**: Ferramenta de análise de desempenho de hardware em tempo real para GPUs PowerVR que ajuda a identificar gargalos em arquiteturas móveis (TBR/TBDR).

### Depuradores de Quadro (com medição de tempo)

Embora voltados principalmente para depuração, costumam ser o primeiro passo na análise de desempenho.

* **[RenderDoc](https://renderdoc.org/)**: Um depurador de quadros multiplataforma e de código aberto. Fornece tempos por *draw call* e visualização de *overdraw*. Embora os resultados de tempo não sejam tão precisos quanto contadores de hardware (pois não consideram a sobreposição de estágios do *pipeline*), são inestimáveis para identificar qual passe (*pass*) consome mais tempo.

## Integração em Pipeline (CI/CD)

Automatizar testes de desempenho em CI/CD é a única forma de detectar regressões logo no início do desenvolvimento.

1. **Capturas Reproduzíveis**: Use **[GFXReconstruct](https://github.com/LunarG/gfxreconstruct)** para gravar uma sequência de quadros. Isso garante que cada execução de teste utilize exatamente as mesmas chamadas de API, eliminando a variabilidade de entradas interativas.
2. **Reprodução Headless**: Reproduza a captura no seu ambiente de CI usando `gfxrecon-replay`.
3. **Extração de Métricas**:
   - Use interfaces de linha de comando (por exemplo, `nsys profile` ou `rgp`) para capturar métricas de hardware durante a reprodução.
   - Compare os resultados (por exemplo, tempo médio de quadro, pico de uso de VRAM) com uma linha de base conhecida (*baseline*).
4. **Relatórios**: Se o desempenho cair além de um limite definido (por exemplo, 5%), falhe o *build* e anexe o *trace* para revisão dos desenvolvedores.

## Leitura Complementar

* [Vulkan Samples: Performance Best Practices](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance): Exemplos práticos de todas as otimizações mencionadas aqui.
* [Vulkan Barriers Explained](https://gpuopen.com/learn/vulkan-barriers-explained/): O guia definitivo para evitar bolhas de sincronização.
* [NVIDIA Vulkan Dos and Don'ts](https://developer.nvidia.com/blog/vulkan-dos-donts/): Padrões de projeto de alto nível para desempenho máximo.
