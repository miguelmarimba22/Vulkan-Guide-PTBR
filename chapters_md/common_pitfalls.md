# Armadilhas Comuns para Novos Desenvolvedores Vulkan

Esta é uma breve lista de suposições, armadilhas e antipadrões na API Vulkan. Ela não é uma lista de "boas práticas", mas sim um apanhado dos erros comuns que desenvolvedores iniciantes em Vulkan podem cometer facilmente.

## Validation Layers

Durante o desenvolvimento, certifique-se de que as *Validation Layers* estejam habilitadas. Elas são uma ferramenta inestimável para detectar erros ao usar a API Vulkan. Verificação de parâmetros, tempo de vida de objetos e violações de *threading* fazem parte das verificações de erro fornecidas. Uma forma de ter certeza de que elas estão habilitadas é verificar se o texto `"Debug Messenger Added"` aparece no fluxo de saída. Mais informações podem ser encontradas na documentação de camadas do [Vulkan SDK](https://vulkan.lunarg.com/doc/sdk/latest/windows/layer_configuration.html).

## Vulkan é uma Caixa de Ferramentas

No Vulkan, a maioria dos problemas pode ser resolvida por múltiplos métodos, cada um com suas próprias vantagens e desvantagens. Raramente existe uma solução "perfeita", e ficar obcecado em encontrar uma costuma ser um esforço infrutífero. Ao enfrentar um problema, tente criar uma solução adequada que atenda às necessidades atuais e não seja excessivamente complicada. Embora a especificação do Vulkan possa ser útil, ela não é a melhor fonte para aprender a usar o Vulkan na prática. Em vez disso, consulte fontes externas, como este guia, guias de boas práticas de fabricantes de hardware, tutoriais e outros artigos para obter informações mais aprofundadas. Por fim, fazer *profiling* de diferentes soluções é uma parte fundamental para descobrir qual abordagem utilizar.

## Gravação de Command Buffers

Muitos tutoriais e documentos antigos de Vulkan recomendavam gravar um *command buffer* uma única vez e reutilizá-lo sempre que possível. Na prática, porém, a reutilização raramente traz o ganho de desempenho anunciado, enquanto impõe um custo de desenvolvimento significativo devido à complexidade de implementação. Embora possa parecer contraintuitivo — já que reutilizar dados computados é uma otimização comum —, gerenciar uma cena com objetos sendo adicionados e removidos, além de técnicas como *frustum culling* que alteram as chamadas de desenho (*draw calls*) a cada quadro, torna a reutilização de *command buffers* um sério desafio de design. Ela exige um esquema de cache para gerenciar os *command buffers* e manter estado para determinar se e quando a regravação se torna necessária. Em vez disso, prefira regravar novos *command buffers* a cada quadro. Se o desempenho for um problema, a gravação pode ser paralelizada em múltiplas *threads*, além de ser possível usar *secondary command buffers* para chamadas de desenho invariáveis, como pós-processamento.

## Múltiplos Pipelines

Um `VkPipeline` gráfico contém a combinação de estados necessários para executar uma chamada de desenho (*draw call*). Renderizar uma cena com diferentes shaders, modos de *blending*, layouts de vértices, etc., exigirá um pipeline para cada combinação possível. Como a criação de pipelines e a troca entre eles entre chamadas de desenho têm um custo associado, é uma boa prática criar e trocar pipelines apenas quando necessário. No entanto, utilizar diversas técnicas e recursos para reduzir ainda mais a criação e a troca além dos casos simples pode ser contraproducente, pois adiciona complexidade sem garantia de benefício. Para grandes motores gráficos (*engines*) isso pode ser necessário, mas, fora disso, dificilmente será um gargalo. Usar o *pipeline cache* pode reduzir ainda mais os custos sem precisar recorrer a esquemas mais complexos.

## Duplicação de Recursos por Imagem da Swapchain

Fazer *pipelining* de quadros (*frames*) é uma maneira comum de melhorar o desempenho. Ao ter múltiplos quadros sendo renderizados ao mesmo tempo, cada um usando sua própria cópia dos recursos necessários, reduz-se a latência ao eliminar a contenção de recursos. Uma implementação simples disso duplicará os recursos necessários para cada imagem na *swapchain*. O problema é que isso leva à suposição de que os recursos de renderização devem ser duplicados uma vez para cada imagem da *swapchain*. Embora isso seja prático para alguns recursos, como os *command buffers* e *semaphores* usados por quadro, a duplicação um-para-um com as imagens da *swapchain* muitas vezes não é necessária. O Vulkan oferece grande flexibilidade, permitindo ao desenvolvedor escolher o nível de duplicação adequado à sua situação. Muitos recursos podem precisar de apenas duas cópias — por exemplo, *uniform buffers* ou dados atualizados uma vez por quadro —, e outros podem não precisar de nenhuma duplicação.

## Múltiplas Queues por Família de Queues

Várias plataformas de hardware possuem mais de uma `VkQueue` por família de *queues* (*queue family*). Isso pode ser útil para submeter trabalho à mesma família de *queues* a partir de *queues* separadas. Embora possa haver vantagens, não é necessariamente melhor criar ou usar as *queues* extras. Para recomendações específicas de desempenho, consulte os guias de boas práticas dos fabricantes de hardware.

## Descriptor Sets

Os *Descriptor Sets* foram projetados para facilitar o agrupamento de dados usados em shaders por padrão de uso e frequência de atualização. A especificação do Vulkan exige que o hardware suporte o uso de pelo menos 4 *Descriptor Sets* simultaneamente, com a maioria dos hardwares suportando pelo menos 8. Portanto, há pouquíssimo motivo para não usar mais de um quando fizer sentido.

## Boas práticas no uso correto da API

Embora as *Validation Layers* consigam detectar muitos tipos de erros, elas não são perfeitas. Abaixo está uma pequena lista de bons hábitos e possíveis fontes de erro ao encontrar comportamentos estranhos:

- Inicialize todas as variáveis e *structs*.
- Use o `sType` correto para cada estrutura.
- Verifique o uso correto da cadeia `pNext`, definindo-a como `nullptr` quando não for necessária.
- Não existem valores padrão (*default values*) no Vulkan.
- Use valores corretos de enums, `VkFlags` e máscaras de bits (*bitmasks*).
- Considere usar um *wrapper* Vulkan com segurança de tipos, como [Vulkan.hpp](https://github.com/KhronosGroup/Vulkan-Hpp) para C++.
- Verifique os valores de retorno das funções, como `VkResult`.
- Chame as funções de limpeza (*cleanup*) onde for apropriado.
