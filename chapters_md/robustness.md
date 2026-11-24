# Robustez (*Robustness*)

## O que Significa Robustez

Quando uma aplicação Vulkan tenta acessar (ler, gravar ou executar uma operação atômica em) uma memória à qual não tem acesso, a implementação precisa reagir de alguma forma. No caso em que não há robustez, trata-se de comportamento indefinido (*undefined behavior*), e a implementação tem até mesmo permissão para encerrar o programa. Se a robustez estiver habilitada para o tipo de memória acessado, então a implementação deve se comportar de uma maneira específica conforme definido pela especificação.

![Fluxo de comportamento de acesso à memória com e sem robustez](images/robustness_flow.png)

## Quando Usar

Alguns casos comuns para o uso de robustez são:

1. Necessidade de evitar acessos maliciosos à memória (ex.: WebGPU).
2. Não poder garantir que seu shader nunca fará acessos fora dos limites (*out-of-bounds*).
3. Replicar comportamentos de acesso fora dos limites observados em outras APIs.

> **Importante:** Ativar a robustez pode incorrer em custo de desempenho em tempo de execução. Os desenvolvedores de aplicações devem considerar cuidadosamente as implicações de habilitar a robustez.

## O que o Vulkan Fornece no Core

Todas as implementações Vulkan são obrigadas a suportar o recurso `robustBufferAccess`. A [especificação descreve o que é considerado fora dos limites (*out-of-bounds*)](https://docs.vulkan.org/spec/latest/chapters/features.html#features-robustBufferAccess) e também como isso deve ser tratado. As implementações recebem certa flexibilidade para `robustBufferAccess`. Um exemplo seria acessar um `vec4(x, y, z, w)` onde o valor `w` está fora dos limites, pois a especificação permite que a implementação decida se `x`, `y` e `z` também são considerados fora dos limites ou não.

O recurso `robustBufferAccess` tem algumas limitações, pois cobre apenas buffers e não imagens. Ele também permite que escritas e operações atômicas fora dos limites modifiquem os dados do buffer que está sendo acessado. Para aplicações que buscam uma forma mais forte de robustez, existe a extensão [`VK_KHR_robustness2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_robustness2.html).

Quando imagens são acessadas fora dos limites, o Vulkan core [fornece a garantia](https://docs.vulkan.org/spec/latest/chapters/textures.html#textures-output-coordinate-validation) de que escritas (*stores*) e operações atômicas não têm efeito sobre a memória acessada.

## `robustBufferAccess`

O código a seguir é um exemplo do uso de `robustBufferAccess` ([Experimente Online](https://godbolt.org/z/d5rqK1aqK)):

```glsl
#version 450
layout(set = 0, binding = 0) buffer SSBO {
    // O VkBuffer tem apenas 64 bytes de tamanho
    // indexar de [0:63] bytes é válido, o restante está fora dos limites (OOB)
    uint data[128];
};

void main() {
    // Estará fora dos limites (OOB) em tempo de execução
    // será descartado com robustBufferAccess
    data[96] = 0;

    // Retornará zero com robustBufferAccess
    uint x = data[127];
}
```

## `VK_EXT_image_robustness`

### `robustImageAccess`

O recurso [`robustImageAccess`](https://docs.vulkan.org/spec/latest/chapters/features.html#features-robustImageAccess) da extensão [`VK_EXT_image_robustness`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_image_robustness.html) habilita a verificação de limites contra as dimensões da image view acessada. Se ocorrer um acesso fora dos limites em qualquer imagem, ele retornará `(0, 0, 0, 0)` ou `(0, 0, 0, 1)`.

O recurso `robustImageAccess` não fornece garantias sobre os valores retornados ao acessar um LOD inválido; isso continua sendo comportamento indefinido.

## `VK_KHR_robustness2`

> **Importante:** `VK_EXT_robustness2` funciona da mesma maneira.

Algumas aplicações, como aquelas portadas de outras APIs como D3D12, exigem garantias mais rígidas do que `robustBufferAccess` e `robustImageAccess` oferecem. A extensão [`VK_KHR_robustness2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_robustness2.html) adiciona isso expondo 3 novos recursos de robustez, descritos nas seções a seguir. Para algumas implementações, essas garantias extras podem gerar custo de desempenho. Recomenda-se que aplicações que não precisem de robustez extra utilizem `robustBufferAccess` e/ou `robustImageAccess` sempre que possível.

### `robustBufferAccess2`

O recurso [`robustBufferAccess2`](https://docs.vulkan.org/spec/latest/chapters/features.html#features-robustBufferAccess2) pode ser visto como um superconjunto de `robustBufferAccess`.

Com esse recurso habilitado, impede-se que quaisquer escritas e operações atômicas fora dos limites modifiquem qualquer memória que respalde buffers. O recurso `robustBufferAccess2` também impõe exatamente os valores que devem ser retornados para os vários tipos de buffers quando acessados fora dos limites, conforme [descrito na especificação](https://docs.vulkan.org/spec/latest/chapters/features.html#features-robustBufferAccess).

É importante consultar `robustUniformBufferAccessSizeAlignment` e `robustStorageBufferAccessSizeAlignment` em [`VkPhysicalDeviceRobustness2PropertiesKHR`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkPhysicalDeviceRobustness2PropertiesKHR.html), pois o alinhamento no qual a verificação de limites dos buffers é aplicada varia entre implementações.

### `robustImageAccess2`

O recurso [`robustImageAccess2`](https://docs.vulkan.org/spec/latest/chapters/features.html#features-robustImageAccess2) pode ser visto como um superconjunto de `robustImageAccess`. Ele expande a verificação de limites contra as dimensões da image view acessada, adicionando requisitos mais estritos sobre quais valores podem ser retornados.

Com `robustImageAccess2`, um acesso fora dos limites a um formato R, RG ou RGB retornará `(0, 0, 0, 1)`. Para um formato RGBA, como `VK_FORMAT_R8G8B8A8_UNORM`, retornará `(0, 0, 0, 0)`.

No caso de acessar um LOD de imagem fora do intervalo suportado, com `robustImageAccess2` habilitado, isso será considerado fora dos limites (*out-of-bounds*).

### `nullDescriptor`

Sem o recurso [`nullDescriptor`](https://docs.vulkan.org/spec/latest/chapters/features.html#features-nullDescriptor) habilitado, ao atualizar um `VkDescriptorSet`, todos os recursos que o respaldam devem ser não nulos, mesmo que o descritor não seja utilizado estaticamente pelo shader. Esse recurso permite que descritores sejam respaldados por recursos ou views nulos. Leituras de um descritor nulo retornam valores zero, e escritas e operações atômicas em um descritor nulo são descartadas.

O recurso `nullDescriptor` também permite acessos a bindings de vertex input nos quais `vkCmdBindVertexBuffers::pBuffers` é nulo.

## `VK_EXT_pipeline_robustness`

Como a robustez pode ter um custo de desempenho em algumas implementações, a extensão [`VK_EXT_pipeline_robustness`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_robustness.html) foi adicionada para permitir que os desenvolvedores solicitem robustez apenas onde for necessário.

No momento da criação de um `VkPipeline`, uma ou mais estruturas `VkPipelineRobustnessCreateInfoEXT` podem ser passadas para especificar o comportamento de robustez desejado para acessos a buffers, imagens e recursos de vertex input, seja para o pipeline como um todo ou por estágio individual do pipeline.

Essa extensão também fornece `VkPhysicalDevicePipelineRobustnessPropertiesEXT`, que consulta a implementação sobre qual comportamento ela oferece por padrão quando nenhum recurso de robustez está habilitado.

## `VK_EXT_descriptor_indexing`

Ao lidar com a funcionalidade *update-after-bind* encontrada em `VK_EXT_descriptor_indexing` (que faz parte do core desde o Vulkan 1.2), é importante estar ciente de [`robustBufferAccessUpdateAfterBind`](https://docs.vulkan.org/spec/latest/chapters/limits.html#limits-robustBufferAccessUpdateAfterBind), que indica se uma implementação consegue suportar simultaneamente `robustBufferAccess` e a capacidade de atualizar o descritor após vinculá-lo.
