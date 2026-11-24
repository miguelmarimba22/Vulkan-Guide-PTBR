# Consultando Propriedades, Extensões, Recursos, Limites e Formatos

Uma das principais características do Vulkan é a possibilidade de desenvolver para múltiplas plataformas e dispositivos. Para tornar isso possível, a aplicação é responsável por consultar as informações de cada dispositivo físico e, então, tomar decisões com base nessas informações.

Os itens que podem ser consultados de um dispositivo físico são:

* Propriedades (*Properties*)
* Recursos (*Features*)
* Extensões (*Extensions*)
* Limites (*Limits*)
* Formatos (*Formats*)

## Propriedades (*Properties*)

Existem muitos outros componentes no Vulkan rotulados como propriedades. O termo "propriedades" é um termo abrangente para qualquer dado somente leitura que possa ser consultado.

## Extensões (*Extensions*)

> **Nota:** Consulte o capítulo sobre *Habilitando Extensões* para mais informações. Há também um [Registro (Registry)](https://registry.khronos.org/vulkan/#repo-docs) com todas as extensões disponíveis.

Há muitas situações em que um novo conjunto de funcionalidades é desejado no Vulkan, mas ainda não existe no núcleo da API. As extensões têm a capacidade de adicionar novas funcionalidades. Elas podem definir novas funções Vulkan, enums, structs ou bits de recursos (*feature bits*). Embora todos esses itens estendidos estejam presentes por padrão nos cabeçalhos do Vulkan, é **comportamento indefinido** (*undefined behavior*) utilizar funcionalidades estendidas se as extensões não estiverem habilitadas (consulte o capítulo sobre *Habilitando Extensões*).

## Recursos (*Features*)

> **Nota:** Consulte o capítulo sobre *Habilitando Recursos* para mais informações.

Recursos (*features*) descrevem funcionalidades que não são suportadas em todas as implementações. Os recursos podem ser [consultados](https://docs.vulkan.org/spec/latest/chapters/features.html#vkGetPhysicalDeviceFeatures) e então habilitados ao criar o `VkDevice`. Além da [lista de todos os recursos](https://docs.vulkan.org/spec/latest/chapters/features.html), alguns [recursos são obrigatórios](https://docs.vulkan.org/spec/latest/chapters/features.html#features-requirements) devido a versões mais novas do Vulkan ou ao uso de determinadas extensões.

Uma técnica comum é uma extensão expor uma nova struct que pode ser passada por meio de `pNext` para adicionar mais recursos a serem consultados.

## Limites (*Limits*)

Limites são valores mínimos, máximos e outras características dependentes da implementação das quais uma aplicação pode precisar estar ciente. Além da [lista de todos os limites](https://docs.vulkan.org/spec/latest/chapters/limits.html), alguns limites também possuem [valores mínimos/máximos obrigatórios](https://docs.vulkan.org/spec/latest/chapters/limits.html#limits-minmax) garantidos por qualquer implementação Vulkan.

## Formatos (*Formats*)

O Vulkan fornece diversos `VkFormat` que possuem múltiplos `VkFormatFeatureFlags`, cada um contendo várias máscaras de bits [`VkFormatFeatureFlagBits`](https://registry.khronos.org/vulkan/specs/latest/man/html/VkFormatFeatureFlagBits.html) que podem ser consultadas.

Consulte o capítulo sobre *Formatos* para mais informações.

## Ferramentas

Existem algumas ferramentas para ajudar a obter todas essas informações de forma rápida e em um formato legível por humanos.

O `vulkaninfo` é um utilitário de linha de comando para Windows, Linux e macOS que permite visualizar todos os itens disponíveis listados acima sobre a sua GPU. Consulte a [documentação do Vulkaninfo](https://vulkan.lunarg.com/doc/sdk/latest/windows/vulkaninfo.html) no Vulkan SDK.

O aplicativo [Vulkan Hardware Capability Viewer](https://play.google.com/store/apps/details?id=de.saschawillems.vulkancapsviewer&hl=en_US), desenvolvido por Sascha Willems, é um aplicativo Android para exibir todos os detalhes de dispositivos com suporte ao Vulkan.
