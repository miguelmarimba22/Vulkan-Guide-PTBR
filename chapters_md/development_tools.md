# Ferramentas de Desenvolvimento

O ecossistema Vulkan é composto por muitas ferramentas de desenvolvimento. Esta **não** é uma lista completa, mas sim um bom ponto de partida para muitos desenvolvedores. Continue pesquisando e explorando outras ferramentas, pois o ecossistema de desenvolvimento é muito maior do que caberia razoavelmente em uma única página.

O Khronos mantém o repositório [Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples), uma coleção de códigos e tutoriais que demonstra o uso da API e explica a implementação de boas práticas de desempenho.

A LunarG é patrocinada privadamente para desenvolver e manter componentes do ecossistema Vulkan e atualmente é curadora dos repositórios do Khronos Group [Vulkan Loader](https://github.com/KhronosGroup/Vulkan-Loader) e [Vulkan Validation Layers](https://github.com/KhronosGroup/Vulkan-ValidationLayers). Além disso, a LunarG distribui o [Vulkan SDK](https://vulkan.lunarg.com/) e desenvolve outras ferramentas essenciais, como o [Vulkan Configurator](https://vulkan.lunarg.com/doc/sdk/latest/windows/vkconfig.html) e o [GFXReconstruct](https://vulkan.lunarg.com/doc/sdk/latest/windows/capture_tools.html).

## Camadas Vulkan (*Vulkan Layers*)

Camadas (*layers*) são componentes opcionais que estendem o sistema Vulkan. Elas podem interceptar, avaliar e modificar funções Vulkan existentes no caminho entre a aplicação e o hardware. As camadas são implementadas como bibliotecas que podem ser habilitadas e configuradas usando o [Vulkan Configurator](https://vulkan.lunarg.com/doc/sdk/latest/windows/vkconfig.html).

### Camadas do Khronos

- `VK_LAYER_KHRONOS_validation`, a Camada de Validação do Khronos (*Khronos Validation Layer*).
  Ela é a primeira linha de defesa de todo desenvolvedor ao depurar sua aplicação Vulkan, motivo pelo qual está no topo desta lista. Consulte o capítulo sobre Visão Geral de Validação para mais detalhes.
  A camada de validação inclui múltiplos recursos:
  - [Synchronization Validation](https://vulkan.lunarg.com/doc/sdk/latest/windows/synchronization_usage.html): identifica conflitos de acesso a recursos causados por operações de sincronização ausentes ou incorretas entre ações (*Draw*, *Copy*, *Dispatch*, *Blit*) que leem ou escrevem nas mesmas regiões de memória.
  - [GPU-Assisted Validation](https://vulkan.lunarg.com/doc/sdk/latest/windows/gpu_validation.html): instrumenta o código de shader para realizar verificações em tempo de execução de condições de erro produzidas durante a execução dos shaders.
  - [Shader printf](https://vulkan.lunarg.com/doc/sdk/latest/windows/debug_printf.html): depura código de shader "imprimindo" quaisquer valores de interesse no *debug callback* ou em `stdout`. Variáveis de ambiente fornecem um caminho rápido para habilitar esse recurso sem alterar o código.
  - [Best Practices Warnings](https://vulkan.lunarg.com/doc/sdk/latest/windows/best_practices.html): destaca potenciais problemas de desempenho, padrões de uso questionáveis e erros comuns.

### Camadas do Vulkan SDK

Além das camadas do Khronos, o Vulkan SDK inclui camadas adicionais úteis e independentes de plataforma:

- [`VK_LAYER_LUNARG_api_dump`](https://vulkan.lunarg.com/doc/sdk/latest/windows/api_dump_layer.html), uma camada para registrar chamadas da API Vulkan.
  A camada *API dump* imprime chamadas da API, parâmetros e valores no fluxo de saída configurado.

- [`VK_LAYER_LUNARG_gfxreconstruct`](https://vulkan.lunarg.com/doc/sdk/latest/windows/capture_tools.html), uma camada para capturar quadros criados com Vulkan.
  Essa camada faz parte do GFXReconstruct, um software para capturar e reproduzir chamadas da API Vulkan. Suporte completo ao Android também está disponível em [https://github.com/LunarG/gfxreconstruct](https://github.com/LunarG/gfxreconstruct).

- [`VK_LAYER_LUNARG_device_simulation`](https://vulkan.lunarg.com/doc/sdk/latest/windows/device_simulation_layer.html), uma camada para testar a portabilidade de aplicações Vulkan.
  A camada de simulação de dispositivo pode ser usada para testar se uma aplicação Vulkan executaria em um dispositivo Vulkan com capacidades menores.

- [`VK_LAYER_LUNARG_screenshot`](https://vulkan.lunarg.com/doc/sdk/latest/windows/screenshot_layer.html), uma camada de captura de tela.
  Captura a imagem renderizada de uma aplicação Vulkan em um arquivo de imagem visualizável.

- [`VK_LAYER_LUNARG_monitor`](https://vulkan.lunarg.com/doc/sdk/latest/windows/monitor_layer.html), uma camada de monitoramento de taxa de quadros.
  Exibe o FPS da aplicação Vulkan na barra de título da janela para fornecer uma indicação rápida de desempenho.

### Vulkan Extension Layer

A [`Vulkan Extension Layer`](https://github.com/KhronosGroup/Vulkan-ExtensionLayer/) é uma coleção de camadas que implementam extensões que não estão disponíveis em todos os lugares. Por padrão, essas camadas se desabilitam automaticamente caso o driver subjacente já forneça a extensão.

### Camadas Vulkan de Terceiros

Existem também outras camadas disponíveis publicamente que podem auxiliar no desenvolvimento:

- [`VK_LAYER_IMG_powervr_perf_doc`](https://github.com/powervr-graphics/perfdoc), a camada PowerVR PerfDoc.
  Verifica boas práticas em aplicações Vulkan para dispositivos Imagination Technologies PowerVR.

- [`VK_LAYER_adreno`](https://developer.qualcomm.com/software/adreno-gpu-sdk/tools), a Vulkan Adreno Layer.
  Verifica boas práticas em aplicações Vulkan para dispositivos Qualcomm Adreno.

## Depuração (*Debugging*)

Depurar algo que executa em uma GPU pode ser extremamente difícil; felizmente, existem ferramentas para ajudar:

- [AMD Radeon GPU Analyzer (RGA)](https://gpuopen.com/rga/)
- [AMD Radeon Raytracing Analyzer (RRA)](https://gpuopen.com/radeon-raytracing-analyzer/)
- [Arm Graphics Analyzer](https://developer.arm.com/Tools%20and%20Software/Graphics%20Analyzer)
- [Android GPU Inspector (AGI)](https://developer.android.com/agi) — Sucessor do GAPID
- [NVIDIA Nsight](https://developer.nvidia.com/nsight-graphics)
- [PVRCarbon](https://developer.imaginationtech.com)
- [RenderDoc](https://renderdoc.org/)
- [GFXReconstruct](https://vulkan.lunarg.com/doc/sdk/latest/windows/capture_tools.html)

As ferramentas a seguir ajudam a depurar travamentos (*crashes*):

- [AMD GPU Detective](https://gpuopen.com/radeon-gpu-detective)
- [NVIDIA Nsight Aftermath SDK](https://developer.nvidia.com/nsight-aftermath)

### Depuração de Shaders (*Shader Debugging*)

Depurar shaders requer ferramentas e técnicas especializadas. Para orientações abrangentes sobre depuração de shaders em aplicações Vulkan, incluindo:

- Ferramentas de depuração de shaders e sua integração com IDEs
- *GPU-Assisted Validation* para depuração de shaders
- Técnicas de *Shader printf* tanto para GLSL quanto para HLSL
- Configurações específicas de depuração de shaders por IDE
- Boas práticas para fluxos de trabalho de depuração de shaders

Consulte a seção de Integração de Depuração de Shaders no capítulo sobre Ambientes de Desenvolvimento e IDEs.

## Análise de Desempenho (*Profiling*)

Em qualquer assunto relacionado a GPUs, o ideal é não fazer suposições e sempre medir (*profile*) quando possível. Para um aprofundamento em metodologias de *profiling*, análise de gargalos de CPU/GPU, instrumentação e um levantamento completo de ferramentas de *profiling* de fabricantes e multiplataforma, consulte o capítulo dedicado sobre Profiling.

Para integração de *profiling* específica de IDEs, consulte o capítulo sobre Ambientes de Desenvolvimento e IDEs.
