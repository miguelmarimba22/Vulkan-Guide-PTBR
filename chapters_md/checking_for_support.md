# Verificando o Suporte ao Vulkan

O Vulkan requer tanto um *Vulkan Loader* (consulte o capítulo sobre o Loader) quanto um *Vulkan Driver* (também chamado de *Implementação Vulkan*). O driver é responsável por traduzir as chamadas da API Vulkan em uma implementação válida da especificação. O caso mais comum é um fabricante de hardware de GPU lançar um driver usado para executar o Vulkan em uma GPU física. Vale observar que também é possível ter uma implementação completa do Vulkan baseada em software, embora o impacto no desempenho seja bastante perceptível.

Ao verificar o suporte ao Vulkan, é importante distinguir entre *suporte de plataforma* e *suporte de dispositivo*.

## Suporte de Plataforma

A primeira coisa a verificar é se a sua plataforma (consulte o capítulo sobre Plataformas) realmente suporta Vulkan. Cada plataforma utiliza um mecanismo diferente para gerenciar como o *Vulkan Loader* é implementado. O loader, por sua vez, é responsável por determinar se um driver Vulkan está exposto corretamente.

### Android

Uma maneira simples de obter informações sobre o Vulkan é executar o aplicativo [Vulkan Hardware Capability Viewer](https://play.google.com/store/apps/details?id=de.saschawillems.vulkancapsviewer&hl=en_US), desenvolvido por Sascha Willems. Esse aplicativo não apenas mostra se o Vulkan é suportado, mas também todas as capacidades que o dispositivo oferece.

### BSD Unix

Obtenha o [Vulkan SDK](https://vulkan.lunarg.com/sdk/home#linux). Compile o Vulkan SDK usando o comando `./vulkansdk.sh` e, em seguida, execute o binário [vulkaninfo](https://vulkan.lunarg.com/doc/sdk/latest/linux/vulkaninfo.html) para verificar facilmente o suporte ao Vulkan, bem como todas as capacidades oferecidas pelo dispositivo.

### iOS

Uma maneira simples de obter informações sobre o Vulkan é executar a versão para iOS do [Vulkan Hardware Capability Viewer](https://apps.apple.com/us/app/vulkan-capabilities-viewer/id1552796816), fornecida pela LunarG. Esse aplicativo não apenas mostra se o Vulkan é suportado, mas também todas as capacidades que o dispositivo oferece.

### Linux

Obtenha o [Vulkan SDK](https://vulkan.lunarg.com/sdk/home#linux) e execute o binário [vulkaninfo](https://vulkan.lunarg.com/doc/sdk/latest/linux/vulkaninfo.html) para verificar facilmente o suporte ao Vulkan e todas as capacidades oferecidas pelo dispositivo.

### macOS

Obtenha o [Vulkan SDK](https://vulkan.lunarg.com/sdk/home#mac) e execute o binário [vulkaninfo](https://vulkan.lunarg.com/doc/sdk/latest/mac/vulkaninfo.html) para verificar facilmente o suporte ao Vulkan e todas as capacidades oferecidas pelo dispositivo.

### Windows

Obtenha o [Vulkan SDK](https://vulkan.lunarg.com/sdk/home#windows) e execute o executável [vulkaninfo.exe](https://vulkan.lunarg.com/doc/sdk/latest/windows/vulkaninfo.html) para verificar facilmente o suporte ao Vulkan e todas as capacidades oferecidas pelo dispositivo.

## Suporte de Dispositivo

O fato de a plataforma suportar Vulkan não significa que haja suporte no dispositivo. Para o suporte de dispositivo, é necessário garantir que exista um driver Vulkan disponível que implemente completamente o Vulkan. Existem algumas variações diferentes de um driver Vulkan.

### Implementação em Hardware

Um driver voltado para um hardware físico de GPU é o caso mais comum de uma implementação Vulkan. É importante entender que, embora uma determinada GPU possa ter a capacidade física de executar o Vulkan, ela ainda precisa de um driver para controlá-la. O driver é responsável por mapear as chamadas Vulkan para o hardware da maneira mais eficiente possível.

Drivers, como qualquer software, recebem atualizações, o que significa que podem existir várias versões de drivers para o mesmo dispositivo físico e plataforma. Existe o [Vulkan Database](https://vulkan.gpuinfo.org/), desenvolvido e mantido por Sascha Willems, que é a maior coleção registrada de detalhes de implementações Vulkan.

> **Nota:** O fato de um dispositivo físico ou plataforma não estar no Vulkan Database não significa que ele não exista.

### Null Driver

O termo "null driver" (driver nulo) é dado a qualquer driver que aceita chamadas da API Vulkan, mas não faz nada com elas. Isso é comum para testar interações com o driver sem precisar de uma implementação funcional por trás. Muitos casos de uso, como a criação de testes da CTS para novos recursos (consulte o capítulo sobre Vulkan CTS), [testar as Validation Layers](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/tests/README.md#running-tests-on-test-driver-and-profiles-layer) e outros, dependem do conceito de um null driver.

O Khronos fornece o [Mock ICD](https://github.com/KhronosGroup/Vulkan-Tools/tree/master/icd) como uma implementação de null driver que funciona em diversas plataformas.

### Implementação em Software

É possível criar uma implementação Vulkan que executa exclusivamente na CPU. Isso é útil quando há necessidade de testar código Vulkan de forma independente de hardware, mas, diferentemente do null driver, produzindo um resultado válido.

O [SwiftShader](https://github.com/google/swiftshader) é um exemplo de implementação baseada em CPU.

## Formas de Verificar o Vulkan

### VIA (Vulkan Installation Analyzer)

Incluído no [Vulkan SDK](https://vulkan.lunarg.com/sdk/home), existe um utilitário para verificar a instalação do Vulkan em seu computador. Ele é suportado no Windows, Linux e macOS. O VIA pode:

- Determinar o estado dos componentes Vulkan no seu sistema
- Validar se o *Vulkan Loader* e os drivers estão instalados corretamente
- Capturar o estado do seu sistema em um formato que pode ser usado como anexo ao reportar bugs

Consulte a [documentação do SDK sobre o VIA](https://vulkan.lunarg.com/doc/sdk/latest/windows/via.html) para mais informações.

### Hello Create Instance

Uma maneira simples e multiplataforma de verificar o suporte ao Vulkan é criar uma aplicação Vulkan simples de "Hello World". A função `vkCreateInstance` é usada para criar uma instância Vulkan (`VkInstance`) e também é a maneira mais curta de escrever uma aplicação Vulkan válida.

O Vulkan SDK fornece um exemplo mínimo de [`vkCreateInstance`](https://docs.vulkan.org/tutorial/latest/03_Drawing_a_triangle/00_Setup/01_Instance.html), `01-init_instance.cpp`, que pode ser utilizado.
