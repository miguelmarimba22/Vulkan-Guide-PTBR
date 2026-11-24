# Reutilização de Semáforos da Swapchain

É muito fácil utilizar incorretamente o *semaphore* de espera (*wait semaphore*) da função `vkQueuePresentKHR`, mas, felizmente, também costuma ser fácil corrigir o problema alocando um *semaphore* de "submissão concluída" por imagem da *swapchain*, em vez de por quadro em execução (*in-flight frame*).

## Declaração do Problema

Este capítulo discute uma forma de reutilizar com segurança os *wait semaphores* de `vkQueuePresentKHR` (aqueles especificados em `VkPresentInfoKHR::pWaitSemaphores`). Neste contexto, *com segurança* significa que a especificação do Vulkan garante que o *semaphore* não está mais em uso e pode ser reutilizado. Desde o Vulkan SDK 1.4.313, a *validation layer* reporta os casos em que o *present wait semaphore* não é usado com segurança.

> **Nota:** Atualmente isso é reportado como `VUID-vkQueueSubmit-pSignalSemaphores-00067`, ou você pode ver a mensagem *"your VkSemaphore is being signaled by VkQueue, but it may still be in use by VkSwapchainKHR"*.

Primeiro, vamos ver se há algo de especial nos *present wait semaphores*. A essência da sincronização no Vulkan — e da sincronização em geral — é o ordenamento. No Vulkan, isso é feito *aguardando* sinais, fazendo *polling*, etc. A entidade pela qual aguardamos precisa sinalizar uma mudança de estado ou fornecer um mecanismo de consulta. Por exemplo, `vkQueueSubmit` permite especificar uma *fence* que será sinalizada quando a carga de trabalho terminar, permitindo que a aplicação aguarde esse sinal no lado da CPU (*host*). `vkQueueSubmit` também pode sinalizar *semaphores* que só podem ser aguardados no lado da GPU (*device*) — ou no *host*, caso sejam usados *timeline semaphores*.

`vkQueuePresentKHR` é diferente da família de funções `vkQueueSubmit` porque não oferece uma maneira de sinalizar um *semaphore* ou uma *fence* (sem extensões adicionais). Isso significa que não há como aguardar diretamente o sinal de apresentação. Também significa que não sabemos se `VkPresentInfoKHR::pWaitSemaphores` ainda estão em uso pela operação de apresentação. Se `vkQueuePresentKHR` pudesse sinalizar, aguardar esse sinal confirmaria que a operação de apresentação na *queue* terminou — incluindo a espera por `VkPresentInfoKHR::pWaitSemaphores`.

Em resumo, não é óbvio quando é seguro reutilizar os *present wait semaphores*.

## Discussão da Solução

A boa notícia é que existe uma forma simples de garantir que a operação de apresentação terminou, embora menos direta do que uma espera explícita. Adquirir o índice da imagem a partir de `vkAcquireNextImageKHR` e depois aguardar pelo seu *semaphore* ou *fence* garante que a operação de apresentação anterior que utilizou o índice de imagem recém-adquirido foi concluída — o que inclui a espera por `VkPresentInfoKHR::pWaitSemaphores`, permitindo reutilizar com segurança os *semaphores* correspondentes.

Você provavelmente consegue perceber que não há nada de especial em reutilizar *present wait semaphores* com segurança. Chame `vkAcquireNextImageKHR` para obter o índice da imagem. Aguarde pelo *semaphore* de `vkAcquireNextImageKHR` em um dos lotes de `vkQueueSubmit` (você também pode aguardar pela *fence*, mas isso introduz um ponto adicional de sincronização no *host*). Após a espera, é seguro reutilizar os *semaphores*.

Por que tantas aplicações erram nisso? O motivo provável é que mesmo um pequeno desvio da forma mais óbvia de sincronizar as coisas (você sinaliza, eu aguardo) adiciona complexidade suficiente para tornar o comportamento menos óbvio. E quando algo não é óbvio (mesmo sendo simples), é fácil deixar passar.

Um erro comum é aplicar aos *present wait semaphores* um esquema de *buffering* baseado no número de quadros em execução (*frames in flight*, como *double* ou *triple buffering*). Frequentemente, para sincronizar com os *frames in flight*, a aplicação utiliza uma *fence* de `vkQueueSubmit`. Ao aguardar essa *fence*, sabemos que os *command buffers* correspondentes e outros recursos do quadro não estão mais em uso. Contudo, a especificação do Vulkan **não** garante que aguardar uma *fence* de `vkQueueSubmit` também sincronize operações de apresentação. A reutilização de recursos de apresentação deve se basear em `vkAcquireNextImageKHR` ou em extensões adicionais (mencionadas ao final deste artigo), e não em *fences* de `vkQueueSubmit`.

Veja a seguir um pseudocódigo que demonstra esse problema comum (e sim, ele frequentemente funciona em drivers específicos, mas viola a especificação do Vulkan):

```cpp
// !! AVISO: CÓDIGO INCORRETO !!
constexpr uint32_t kNumberOfFramesInFlight = 2;
std::array<VkSemaphore, kNumberOfFramesInFlight> submitSemaphores{};

while (!quit) {
    // Aguarda a fence do quadro.
    // Isso permite reutilizar recursos do quadro, mas NÃO inclui recursos de apresentação.
    VkFence frameFence = frameFences[frameIndex];
    vkWaitForFences(device, 1, &frameFence, VK_TRUE, UINT64_MAX);
    vkResetFences(device, 1, &frameFence);

    // ...

    // AVISO: este código usa o índice do frame in-flight atual para obter um submit semaphore livre.
    // Normalmente, assume-se que se aguardamos o quadro anterior, então submitSemaphores
    // não estão mais sendo usados pelo vkQueuePresentKHR daquele quadro. Isso não é necessariamente verdade.
    VkSemaphore submitSemaphore = submitSemaphores[frameIndex];

    VkSubmitInfo submitInfo{
        .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
        .signalSemaphoreCount = 1,
        .pSignalSemaphores = &submitSemaphore,
    };
    vkQueueSubmit(queue, 1, &submitInfo, frameFence);

    // AVISO: submitSemaphore ainda pode estar em uso por uma das operações de apresentação anteriores
    VkPresentInfoKHR presentInfo{
        .sType = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR,
        .waitSemaphoreCount = 1,
        .pWaitSemaphores = &submitSemaphore,
    };
    vkQueuePresentKHR(queue, &presentInfo);

    frameIndex = (frameIndex + 1) % kNumberOfFramesInFlight;
}
```

É muito simples corrigir o código acima fazendo:

1. Alocar o array `submitSemaphores` com base no número de imagens da *swapchain* (em vez do número de *frames in flight*).
2. Indexar esse array usando o índice da imagem adquirida da *swapchain* (em vez do índice do *frame in flight* atual).

Ao corrigir aplicações mais simples como o `vkcube`, aplicar essa correção foi realmente tão direto quanto descrito. Claro que, em configurações complexas de *engines*, a experiência pode ser diferente. [Aqui está um exemplo](https://github.com/kennyalive/vulkan-base/commit/27bcaad9d519cc2f9c5cde4872742d4a5212eee6) de como fica a correção em uma aplicação Vulkan estilo "hello-world".

A seguir está um pseudocódigo mostrando como estruturar um quadro de renderização que reutiliza corretamente os *wait semaphores* de apresentação. Isso funciona em todas as versões do Vulkan.

```cpp
// !! EXEMPLO DE CÓDIGO CORRETO !!
std::vector<VkImage> swapchainImages(swapchainImageCount);

// Recursos indexados pelo índice do frame in-flight atual
constexpr uint32_t kNumberOfFramesInFlight = 2;
std::array<VkFence, kNumberOfFramesInFlight> frameFences{};
std::array<VkSemaphore, kNumberOfFramesInFlight> acquireSemaphores{};
std::array<VkCommandBuffer, kNumberOfFramesInFlight> commandBuffers{};
uint32_t frameIndex = 0; // 0..kNumberOfFramesInFlight-1

// Semaphores aguardados por vkQueuePresentKHR são alocados com base no número de imagens da swapchain
std::vector<VkSemaphore> submitSemaphores(swapchainImageCount);

while (!quit) {
    VkFence frameFence = frameFences[frameIndex];
    vkWaitForFences(device, 1, &frameFence, VK_TRUE, UINT64_MAX);
    vkResetFences(device, 1, &frameFence);

    uint32_t imageIndex = 0;
    VkSemaphore acquireSemaphore = acquireSemaphores[frameIndex];
    vkAcquireNextImageKHR(device, swapchain, UINT64_MAX, acquireSemaphore, VK_NULL_HANDLE, &imageIndex);

    // Indexa o submit semaphore com o índice da imagem adquirida da swapchain.
    // É o único recurso neste exemplo indexado por imageIndex.
    // Todos os outros recursos, incluindo acquireSemaphore, são indexados pelo índice do frame in-flight atual.
    VkSemaphore submitSemaphore = submitSemaphores[imageIndex];

    VkCommandBuffer commandBuffer = commandBuffers[frameIndex];
    vkBeginCommandBuffer(commandBuffer, &beginInfo);
    RecordCommands(commandBuffer);
    vkEndCommandBuffer(commandBuffer);

    VkPipelineStageFlags waitStage = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
    VkSubmitInfo submitInfo{
        .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
        .waitSemaphoreCount = 1,
        .pWaitSemaphores = &acquireSemaphore,
        .pWaitDstStageMask = &waitStage,
        .commandBufferCount = 1,
        .pCommandBuffers = &commandBuffer,
        .signalSemaphoreCount = 1,
        .pSignalSemaphores = &submitSemaphore,
    };
    vkQueueSubmit(queue, 1, &submitInfo, frameFence);

    VkPresentInfoKHR presentInfo{
        .sType = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR,
        .waitSemaphoreCount = 1,
        .pWaitSemaphores = &submitSemaphore,
        .swapchainCount = 1,
        .pSwapchains = &swapchain,
        .pImageIndices = &imageIndex,
    };
    vkQueuePresentKHR(queue, &presentInfo);

    frameIndex = (frameIndex + 1) % kNumberOfFramesInFlight;
}
```

## Extensão `VK_EXT_swapchain_maintenance1`

O propósito do código acima é explicar como lidar com os *wait semaphores* da *swapchain* sem extensões adicionais, embora implementações que suportam a extensão [VK_EXT_swapchain_maintenance1](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_swapchain_maintenance1.html) ofereçam uma solução alternativa. Essa extensão torna `vkQueuePresentKHR` mais semelhante a `vkQueueSubmit`, permitindo especificar uma *fence* que a aplicação pode aguardar.

A extensão `VK_EXT_swapchain_maintenance1` também resolve um problema que não possui uma boa solução no Vulkan sem extensões: liberar recursos da *swapchain* durante o encerramento (*shutdown*). Normalmente, as aplicações chamam `vkDeviceWaitIdle` ou `vkQueueWaitIdle` e assumem que é seguro destruir os *semaphores* da *swapchain* e a própria *swapchain*. O problema é que as funções `WaitIdle` são definidas em termos de *fences* — elas aguardam apenas cargas de trabalho submetidas por funções que aceitam uma *fence*. A função `vkQueuePresentKHR` sem extensões não oferece um parâmetro de *fence*.

Na teoria, isso significa que `vkDeviceWaitIdle` não pode garantir que seja seguro destruir os recursos da *swapchain*. Na prática, as aplicações fazem isso porque não há alternativa melhor. Esse também é o motivo pelo qual a *validation layer* não dispara um erro nesse caso.

A extensão `VK_EXT_swapchain_maintenance1` corrige esse problema. Ao aguardar pela *fence* de apresentação, a aplicação pode liberar com segurança os recursos da *swapchain*. **Quando** `VK_EXT_swapchain_maintenance1` **estiver habilitada**, a *validation layer* reportará um erro se a sequência de encerramento da aplicação depender de `vkDeviceWaitIdle` ou `vkQueueWaitIdle` para liberar recursos da *swapchain* em vez de usar uma *fence* de apresentação.
