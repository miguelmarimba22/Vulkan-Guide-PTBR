# Loader

O *loader* é responsável por mapear uma aplicação às camadas (*layers*) do Vulkan e aos drivers de cliente instaláveis (*Installable Client Drivers* — ICD) do Vulkan.

![Visão geral da arquitetura do Vulkan Loader](images/loader_overview.png)

Qualquer pessoa pode criar seu próprio Vulkan Loader, desde que siga a [Interface do Loader](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderInterfaceArchitecture.md). Também é possível compilar o [loader de referência](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/BUILD.md) ou obter uma versão pré-compilada a partir do [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) para plataformas selecionadas.

## Vinculando-se ao Loader

Os [cabeçalhos do Vulkan](https://github.com/KhronosGroup/Vulkan-Headers) fornecem apenas os protótipos das funções Vulkan. Ao compilar uma aplicação Vulkan, você precisa vinculá-la ao *loader*, caso contrário receberá erros de referências indefinidas para as funções Vulkan. Existem duas formas de vincular ao *loader*: [vinculação direta](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#directly-linking-to-the-loader) e [vinculação indireta](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#indirectly-linking-to-the-loader), que não devem ser confundidas com "vinculação estática e dinâmica" (*static and dynamic linking*).

* [Vinculação direta](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#directly-linking-to-the-loader) em tempo de compilação
  * Isso requer ter um Vulkan Loader compilado (seja como biblioteca estática ou dinâmica) que seu sistema de build consiga encontrar.
  * Sistemas de build (Visual Studio, CMake, etc.) possuem documentação sobre como vincular a bibliotecas externas. Experimente pesquisar online por "`(SeuSistemaDeBuild) link to external library`".
* [Vinculação indireta](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#indirectly-linking-to-the-loader) em tempo de execução
  * Usando busca dinâmica de símbolos (por meio de chamadas de sistema como `dlsym` e `dlopen`), uma aplicação pode inicializar sua própria tabela de despacho (*dispatch table*). Isso permite que a aplicação falhe de forma controlada caso o *loader* não seja encontrado. Também oferece o mecanismo mais rápido para a aplicação chamar funções Vulkan.
  * O [Volk](https://github.com/zeux/volk/) é uma implementação de código aberto de um *meta-loader* que ajuda a simplificar esse processo.

## Variações por Plataforma

Cada plataforma pode definir suas próprias regras sobre como impor o uso do Vulkan Loader.

### Android

Dispositivos Android com suporte ao Vulkan já fornecem um [Vulkan Loader](https://source.android.com/devices/graphics/implement-vulkan#vulkan_loader) integrado ao sistema operacional.

Um arquivo [vulkan_wrapper.c/h](https://developer.android.com/ndk/guides/graphics/getting-started#using) é fornecido no Android NDK para vinculação indireta. Isso é necessário, em parte, porque o Vulkan Loader pode variar entre diferentes fabricantes e dispositivos OEM.

### Linux

O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) fornece um *loader* pré-compilado para Linux.

A página [Getting Started](https://vulkan.lunarg.com/doc/sdk/latest/linux/getting_started.html) no Vulkan SDK explica como o *loader* é localizado no Linux.

### macOS

O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) fornece um *loader* pré-compilado para macOS.

A página [Getting Started](https://vulkan.lunarg.com/doc/sdk/latest/mac/getting_started.html) no Vulkan SDK explica como o *loader* é localizado no macOS.

### Windows

O [Vulkan SDK](https://vulkan.lunarg.com/sdk/home) fornece um *loader* pré-compilado para Windows.

A página [Getting Started](https://vulkan.lunarg.com/doc/sdk/latest/windows/getting_started.html) no Vulkan SDK explica como o *loader* é localizado no Windows.
