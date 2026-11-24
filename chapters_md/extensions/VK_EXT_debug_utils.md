# VK_EXT_debug_utils

A extensão `VK_EXT_debug_utils` fornece aos desenvolvedores um conjunto poderoso de ferramentas para depurar aplicações Vulkan. Essa extensão permite anexar informações de depuração a objetos Vulkan, configurar mensageiros de depuração (*debug messengers*) para receber mensagens de validação e inserir marcadores e rótulos de depuração para ajudar a identificar operações específicas em ferramentas de depuração.

## Visão Geral

Depurar aplicações de GPU pode ser desafiador devido à natureza assíncrona da execução na GPU. A extensão `VK_EXT_debug_utils` ajuda a preencher essa lacuna fornecendo mecanismos para:

* Nomear objetos Vulkan com rótulos de depuração
* Inserir marcadores de depuração em *command buffers*
* Adicionar regiões de depuração a *command buffers*
* Receber mensagens de depuração por meio de *callbacks*

Esses recursos são particularmente úteis ao trabalhar com ferramentas externas de depuração, como RenderDoc, NVIDIA Nsight ou AMD Radeon GPU Profiler, pois elas conseguem exibir essas anotações de depuração para ajudar os desenvolvedores a identificar partes específicas do *pipeline* de renderização.

## Debug Messenger

O *debug messenger* é o componente central para receber mensagens de validação e depuração da implementação Vulkan. Ele permite que as aplicações sejam notificadas sobre mensagens das *validation layers*, avisos de desempenho e outras informações de depuração.

### Criando um Debug Messenger

> **Nota:** Consulte [Validation Layer Custom Callback](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/docs/error_messages.md#custom-callback) para obter mais detalhes sobre o *callback* de depuração.

```cpp
// Função de callback personalizada para lidar com mensagens de depuração
VKAPI_ATTR VkBool32 VKAPI_CALL debugCallback(
    VkDebugUtilsMessageSeverityFlagBitsEXT messageSeverity,
    VkDebugUtilsMessageTypeFlagsEXT messageType,
    const VkDebugUtilsMessengerCallbackDataEXT* pCallbackData,
    void* pUserData) {

    std::cerr << "Validation layer: " << pCallbackData->pMessage << '\n';

    // Filtra com base na severidade
    if (messageSeverity < VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT) {
        return VK_FALSE; // Ignora mensagens verbosas e informativas
    }

    // Filtra com base no tipo
    if ((messageType & VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT) == 0) {
        return VK_FALSE; // Exibe apenas mensagens de validação
    }

    // Filtra com base no ID da mensagem
    if (pCallbackData->pMessageIdName != nullptr &&
        std::string_view{pCallbackData->pMessageIdName}.find("VUID-vkCmdDraw-magFilter-04553") != std::string_view::npos) {
        return VK_FALSE;
    }

    return VK_FALSE; // Se retornar VK_TRUE, a chamada NÃO será enviada ao driver
}

VkDebugUtilsMessengerCreateInfoEXT createInfo{
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT,
    .messageSeverity =
        VK_DEBUG_UTILS_MESSAGE_SEVERITY_VERBOSE_BIT_EXT |
        VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT |
        VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT,
    .messageType =
        VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT |
        VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT |
        VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT,
    .pfnUserCallback = debugCallback,
    .pUserData = nullptr, // Dados opcionais do usuário
};

VkDebugUtilsMessengerEXT debugMessenger = VK_NULL_HANDLE;
if (vkCreateDebugUtilsMessengerEXT(instance, &createInfo, nullptr, &debugMessenger) != VK_SUCCESS) {
    throw std::runtime_error("Falha ao configurar o debug messenger!");
}

// Não se esqueça de liberar o recurso ao finalizar
void OnDestroy() {
    vkDestroyDebugUtilsMessengerEXT(instance, debugMessenger, nullptr);
}
```

## Nomeação de Objetos

Um dos recursos **mais** úteis da extensão é a capacidade de atribuir nomes a objetos Vulkan. Isso torna muito mais fácil identificar objetos em mensagens de validação e em ferramentas de depuração.

```cpp
VkBuffer buffer = engine.CreateBuffer();

VkDebugUtilsObjectNameInfoEXT nameInfo{
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_OBJECT_NAME_INFO_EXT,
    .objectType = VK_OBJECT_TYPE_BUFFER,
    .objectHandle = reinterpret_cast<uint64_t>(buffer),
    .pObjectName = "Meu Vertex Buffer",
};

vkSetDebugUtilsObjectNameEXT(device, &nameInfo);
```

É simples assim! Ao criar seus *handles* Vulkan, basta adicionar a chamada `vkSetDebugUtilsObjectNameEXT` logo em seguida.

## Marcadores e Regiões de Depuração

Marcadores e regiões de depuração permitem anotar operações em *command buffers*, facilitando a identificação de operações específicas nas ferramentas de depuração.

### Regiões de Depuração

Regiões de depuração permitem agrupar um conjunto de comandos, o que é extremamente valioso para identificar passes ou estágios específicos no seu *pipeline* de renderização.

```cpp
// Inicia uma região de depuração
void CmdBeginDebugRegion(
    VkCommandBuffer commandBuffer,
    const char* regionName,
    const std::array<float, 4>& color) {

    VkDebugUtilsLabelEXT labelInfo{
        .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
        .pLabelName = regionName,
    };
    // Cores opcionais; nem todas as ferramentas fazem uso delas
    std::ranges::copy(color, labelInfo.color);

    vkCmdBeginDebugUtilsLabelEXT(commandBuffer, &labelInfo);
}

// Exemplo de uso
constexpr std::array<float, 4> shadowPassColor{0.0f, 0.0f, 0.0f, 1.0f}; // Cor preta
CmdBeginDebugRegion(commandBuffer, "Shadow Pass", shadowPassColor);
// Grava comandos do shadow pass...
vkCmdEndDebugUtilsLabelEXT(commandBuffer);

constexpr std::array<float, 4> geometryPassColor{0.0f, 1.0f, 0.0f, 1.0f}; // Cor verde
CmdBeginDebugRegion(commandBuffer, "Geometry Pass", geometryPassColor);
// Grava comandos do geometry pass...
vkCmdEndDebugUtilsLabelEXT(commandBuffer);
```

#### Pilha de Regiões de Depuração

As chamadas a `vkCmdBeginDebugUtilsLabelEXT`/`vkCmdEndDebugUtilsLabelEXT` funcionam em formato de pilha (*stack*); as ferramentas encadeiam as várias regiões ao relatar uma mensagem.

```cpp
// Região: []
vkCmdBeginDebugUtilsLabelEXT("AAA");
// Região: ["AAA"]
vkCmdBeginDebugUtilsLabelEXT("BBB");
// Região: ["AAA", "BBB"]
vkCmdEndDebugUtilsLabelEXT();
// Região: ["AAA"]
vkCmdBeginDebugUtilsLabelEXT("CCC");
// Região: ["AAA", "CCC"]
vkCmdEndDebugUtilsLabelEXT();
// Região: ["AAA"]
vkCmdEndDebugUtilsLabelEXT();
// Região: []
```

### Inserindo Marcadores de Depuração

Embora `Begin`/`End` sejam ótimos para delimitar uma região, você pode querer marcar um evento pontual na linha do tempo — é aí que `Insert` se torna útil.

Para ilustrar isso, se você fizer:

```cpp
for (int i = 0; i < 4; ++i) {
    vkCmdBeginDebugUtilsLabelEXT(std::format("Draw {}", i));
    vkCmdDraw(/* ... */);
    vkCmdEndDebugUtilsLabelEXT();
}
```

você obterá 4 pequenas regiões, o que rapidamente pode gerar excesso de seções recolhíveis (*micro folding*) na interface da ferramenta. Em vez disso, se você fizer:

```cpp
for (int i = 0; i < 4; ++i) {
    vkCmdInsertDebugUtilsLabelEXT(std::format("Draw {}", i));
    vkCmdDraw(/* ... */);
}
```

a interface exibirá apenas um único elemento em vez de um intervalo para cada item.

![Comparação visual entre Begin/End e Insert no VK_EXT_debug_utils](images/extensions/VK_EXT_debug_utils_being_end_insert.png)

> **Nota:** Ferramentas como as *Validation Layers* **não** fazem uso de um `Insert`, pois precisam de um intervalo (*range*) ao imprimir a mensagem de erro.

```cpp
// Insere um marcador de depuração em um command buffer
void CmdInsertDebugMarker(
    VkCommandBuffer commandBuffer,
    const char* markerName,
    const std::array<float, 4>& color) {

    VkDebugUtilsLabelEXT markerInfo{
        .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
        .pLabelName = markerName,
    };
    // Cores opcionais; nem todas as ferramentas fazem uso delas
    std::ranges::copy(color, markerInfo.color);

    vkCmdInsertDebugUtilsLabelEXT(commandBuffer, &markerInfo);
}

// Exemplo de uso
constexpr std::array<float, 4> color{1.0f, 0.0f, 0.0f, 1.0f}; // Cor vermelha
CmdInsertDebugMarker(commandBuffer, "Chamada de Desenho Importante", color);
```

## Rótulos de Fila (*Queue Labels*)

De forma semelhante aos marcadores de *command buffer*, você também pode rotular operações de fila (*queue*):

```cpp
// Inicia um rótulo de fila
void QueueBeginDebugRegion(
    VkQueue queue,
    const char* regionName,
    const std::array<float, 4>& color) {

    VkDebugUtilsLabelEXT labelInfo{
        .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
        .pLabelName = regionName,
    };
    // Cores opcionais; nem todas as ferramentas fazem uso delas
    std::ranges::copy(color, labelInfo.color);

    vkQueueBeginDebugUtilsLabelEXT(queue, &labelInfo);
}

// Insere um rótulo de fila
void QueueInsertDebugMarker(
    VkQueue queue,
    const char* markerName,
    const std::array<float, 4>& color) {

    VkDebugUtilsLabelEXT markerInfo{
        .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
        .pLabelName = markerName,
    };
    // Cores opcionais; nem todas as ferramentas fazem uso delas
    std::ranges::copy(color, markerInfo.color);

    vkQueueInsertDebugUtilsLabelEXT(queue, &markerInfo);
}

// Encerra um rótulo de fila
vkQueueEndDebugUtilsLabelEXT(queue);
```

## Boas Práticas

### Quando Usar Debug Utils

* **Desenvolvimento e Depuração**: Sempre habilite `VK_EXT_debug_utils` durante o desenvolvimento para ajudar a identificar e corrigir problemas.
* **Testes de Desempenho**: Desabilite `VK_EXT_debug_utils` ao realizar testes de desempenho (*benchmarking*), pois a extensão pode introduzir sobrecarga (*overhead*).
* **Builds de Release**: Remova ou desabilite `VK_EXT_debug_utils` em compilações de produção (*release*) para evitar sobrecarga desnecessária.

### Convenções de Nomenclatura

Estabeleça convenções de nomenclatura consistentes para seus rótulos de depuração a fim de torná-los mais úteis:

* Use nomenclatura hierárquica para objetos relacionados (ex.: `"Scene/Characters/Hero/Mesh"`)
* Inclua informações de tipo nos nomes (ex.: `"VertexBuffer: Characters"`)
* Para regiões de depuração, nomeie-as de acordo com o passe de renderização ou a operação que representam

### Integração com Ferramentas Externas

Diversas ferramentas externas de depuração oferecem suporte às anotações de `VK_EXT_debug_utils`:

* **Validation Layers**: Exibe nomes e regiões nas mensagens de erro
* **RenderDoc**: Exibe marcadores e regiões de depuração em sua linha do tempo de eventos
* **NVIDIA Nsight**: Mostra rótulos de depuração em seu depurador de quadros (*frame debugger*)
* **AMD Radeon GPU Profiler**: Usa regiões de depuração para organizar cargas de trabalho na GPU

## Usando Ferramentas de Depuração com VK_EXT_debug_utils

A extensão `VK_EXT_debug_utils` torna-se ainda mais poderosa quando usada em conjunto com ferramentas externas de depuração. Esta seção foca no uso do RenderDoc, uma das ferramentas mais populares de depuração gráfica, com aplicações Vulkan.

### Visão Geral do RenderDoc

O RenderDoc é uma ferramenta de depuração gráfica de código aberto que permite aos desenvolvedores capturar e analisar quadros (*frames*) de suas aplicações. Ele oferece suporte ao Vulkan e consegue exibir marcadores de depuração, nomes de objetos e regiões definidos com a extensão `VK_EXT_debug_utils`.

### Configurando o RenderDoc com Vulkan

Para usar o RenderDoc com sua aplicação Vulkan:

1. Baixe e instale o RenderDoc no site oficial: [https://renderdoc.org/](https://renderdoc.org/)
2. Abra o RenderDoc
3. Escolha uma das opções:
   * Inicie sua aplicação pelo RenderDoc clicando em "Launch Application" e selecionando seu executável
   * Injete o RenderDoc em uma aplicação já em execução clicando em "Inject into Process"

> **Nota:** O RenderDoc também pode ser integrado diretamente à sua aplicação por meio de sua API interna (*in-application API*), permitindo acionar capturas programaticamente.

### Capturando Quadros

Com sua aplicação em execução através do RenderDoc:

1. Pressione `F12` (atalho padrão) ou clique no botão "Capture Frame" para capturar o quadro atual
2. O quadro capturado aparecerá no painel "Captures"
3. Dê um duplo clique na captura para abri-la para análise

### Analisando Quadros Capturados

O RenderDoc disponibiliza várias visualizações para analisar um quadro capturado:

#### Event Browser

O *Event Browser* mostra todas as chamadas da API Vulkan no quadro capturado. Se você tiver utilizado marcadores e regiões de depuração com `VK_EXT_debug_utils`, eles aparecerão nessa linha do tempo, facilitando a identificação de partes específicas do *pipeline* de renderização.

Regiões de depuração (criadas com `vkCmdBeginDebugUtilsLabelEXT` e `vkCmdEndDebugUtilsLabelEXT`) aparecem como seções expansíveis/recolhíveis no *Event Browser*, e marcadores de depuração (criados com `vkCmdInsertDebugUtilsLabelEXT`) aparecem como eventos individuais.

#### Pipeline State

A visualização *Pipeline State* mostra o estado atual do *pipeline* gráfico no evento selecionado. Os nomes de objetos definidos com `vkSetDebugUtilsObjectNameEXT` são exibidos aqui, facilitando a identificação dos recursos.

#### Resource Inspector

O *Resource Inspector* permite examinar o conteúdo de *buffers*, texturas e outros recursos. Objetos nomeados são muito mais fáceis de localizar na lista de recursos.

### Fluxos Comuns de Depuração

A seguir estão alguns fluxos de trabalho comuns para depurar aplicações Vulkan com o RenderDoc:

1. **Identificando problemas de renderização**:
   * Capture um quadro
   * Use o *Event Browser* para localizar a chamada de desenho (*draw call*) com problema
   * Examine o *Pipeline State* para verificar *bindings* de *shaders*, entradas de vértices e estados de renderização
   * Use o *Texture Viewer* para inspecionar a saída em cada estágio

2. **Rastreando problemas de recursos**:
   * Use a nomeação de objetos para identificar recursos no *Resource Inspector*
   * Verifique o conteúdo de *buffers* e dados de imagens
   * Confirme se os recursos estão sendo atualizados corretamente

3. **Otimizando desempenho**:
   * Use regiões de depuração para marcar os diferentes passes no seu renderizador
   * Compare o tempo gasto em diferentes regiões
   * Procure mudanças de estado redundantes ou trabalho desnecessário

4. **Depurando problemas em *shaders***:
   * Selecione uma chamada de desenho no *Event Browser*
   * Vá até o *Shader Viewer*
   * Inspecione variáveis de entrada e saída
   * Execute o *shader* passo a passo (*step through*), se necessário

### Boas Práticas para Depuração com RenderDoc

1. **Use nomes significativos para marcadores e regiões de depuração**:
   * Nomeie regiões conforme os passes de renderização (ex.: `"Shadow Pass"`, `"Geometry Pass"`)
   * Use nomenclatura hierárquica para regiões aninhadas
   * Inclua informações relevantes nos nomes dos marcadores (ex.: `"Drawing Character #42"`)

2. **Nomeie objetos importantes**:
   * Dê nomes descritivos a *framebuffers*, *render passes*, *pipelines* e outros recursos-chave
   * Inclua o propósito e o tipo nos nomes (ex.: `"Main Scene Depth Buffer"`)

3. **Estruture seu código de renderização pensando na depuração**:
   * Envolva grupos lógicos de comandos em regiões de depuração
   * Insira marcadores em pontos-chave
   * Considere usar cores diferentes para diferentes tipos de operações

4. **Seja seletivo com as capturas**:
   * Capturar quadros de cenas complexas pode gerar arquivos de captura muito grandes
   * Foque em quadros específicos que demonstrem o problema investigado
   * Use a API interna da aplicação para capturar quadros específicos programaticamente

## Comparação com VK_EXT_debug_report

A extensão `VK_EXT_debug_utils` é a sucessora da antiga extensão `VK_EXT_debug_report`. Ela oferece diversas vantagens:

* Informações mais detalhadas nas mensagens
* Capacidade de nomeação de objetos
* Rotulagem de *command buffers* e filas (*queues*)
* Regiões de depuração para agrupar operações
* Filtragem de mensagens mais granular

Se você ainda estiver utilizando `VK_EXT_debug_report`, recomenda-se migrar para `VK_EXT_debug_utils` para aproveitar esses recursos aprimorados de depuração.

## Migrando de VK_EXT_debug_report para VK_EXT_debug_utils

Esta seção fornece orientações sobre como migrar da antiga extensão `VK_EXT_debug_report` para a nova e mais completa extensão `VK_EXT_debug_utils`.

### Habilitando a Extensão

Primeiro, habilite a extensão `VK_EXT_debug_utils` em vez de `VK_EXT_debug_report`:

```cpp
// Forma antiga com VK_EXT_debug_report
constexpr std::array<const char*, 1> oldExtensions{
    VK_EXT_DEBUG_REPORT_EXTENSION_NAME,
    // ...
};

// Nova forma com VK_EXT_debug_utils
constexpr std::array<const char*, 1> newExtensions{
    VK_EXT_DEBUG_UTILS_EXTENSION_NAME,
    // ...
};
```

### Criando um Callback de Depuração

Substitua `vkCreateDebugReportCallbackEXT`/`vkDestroyDebugReportCallbackEXT` por `vkCreateDebugUtilsMessengerEXT`/`vkDestroyDebugUtilsMessengerEXT`.

### Mapeando a Severidade das Mensagens

As flags de severidade de mensagem foram renomeadas e expandidas. Mapeamento entre as duas extensões:

* `VK_DEBUG_REPORT_INFORMATION_BIT_EXT` → `VK_DEBUG_UTILS_MESSAGE_SEVERITY_INFO_BIT_EXT`
* `VK_DEBUG_REPORT_WARNING_BIT_EXT` → `VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT`
* `VK_DEBUG_REPORT_PERFORMANCE_WARNING_BIT_EXT` → `VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT` com `VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT`
* `VK_DEBUG_REPORT_ERROR_BIT_EXT` → `VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT`
* `VK_DEBUG_REPORT_DEBUG_BIT_EXT` → `VK_DEBUG_UTILS_MESSAGE_SEVERITY_VERBOSE_BIT_EXT`

## Conclusão

A extensão `VK_EXT_debug_utils` representa um avanço significativo nas capacidades de depuração do Vulkan. Ao fornecer um conjunto abrangente de ferramentas para nomeação de objetos, anotação de comandos e retorno de validação, ela resolve desafios críticos no desenvolvimento de aplicações de GPU.

A integração dessa extensão nos fluxos de desenvolvimento traz benefícios concretos:

* Identificação aprimorada de erros por meio de mensagens de validação detalhadas
* Redução do tempo de depuração graças à rotulagem precisa de objetos e operações
* Melhoria na colaboração por meio de anotações de depuração padronizadas
* Integração perfeita com ferramentas de depuração gráfica padrão da indústria

Para aplicações Vulkan de nível de produção, implementar `VK_EXT_debug_utils` deve ser considerado uma prática essencial, e não apenas um aprimoramento opcional. A sobrecarga mínima em tempo de execução durante o desenvolvimento é amplamente compensada pelos ganhos significativos de produtividade na resolução de problemas em *pipelines* gráficos complexos.
