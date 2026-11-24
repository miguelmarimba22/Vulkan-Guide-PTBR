# Camadas (*Layers*)

Camadas (*layers*) são componentes opcionais que estendem o sistema Vulkan, empacotados como bibliotecas compartilhadas que são carregadas dinamicamente pelo *loader*. Elas podem interceptar, avaliar e modificar funções Vulkan existentes no caminho entre a aplicação e o hardware.

Por exemplo, por projeto, uma verificação mínima de erros é feita dentro de um driver Vulkan; a [camada de validação (*Vulkan Validation layer*)](https://vulkan.lunarg.com/doc/sdk/latest/windows/khronos_validation_layer.html) pode ser usada para auxiliar os desenvolvedores a isolar usos incorretos e verificar se as aplicações estão utilizando a API corretamente.

As camadas são empacotadas como bibliotecas compartilhadas que são carregadas dinamicamente pelo *loader* e inseridas entre ele e a aplicação.

As camadas podem ser habilitadas de forma explícita ou implícita. Mais detalhes sobre camadas implícitas e explícitas podem ser encontrados na [Interface do Loader e de Camadas](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#implicit-vs-explicit-layers).

## Configurando Camadas

Uma *configuração de camadas* consiste em duas operações:

* Selecionar e ordenar as camadas
* Configurar cada camada individualmente usando suas definições (*settings*)

As camadas podem ser configuradas usando três métodos diferentes para se adequar aos fluxos de trabalho específicos de cada desenvolvedor Vulkan:

* Usando variáveis de ambiente: [variáveis de ambiente do Loader](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderInterfaceArchitecture.md) e [variáveis de ambiente de configuração por camada](https://github.com/KhronosGroup/Vulkan-Utility-Libraries/blob/main/docs/layer_configuration.md#layer-settings-environment-variables)
* Usando arquivos dedicados do sistema Vulkan: [`vk_loader_settings.json`](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderSettingsFile.md) e [`vk_layer_settings.txt`](https://github.com/KhronosGroup/Vulkan-Utility-Libraries/blob/main/docs/layer_configuration.md#configuring-the-layers-using-the-settings-file-vk_layer_settingstxt)
* Usando a API Vulkan, programaticamente dentro da aplicação Vulkan: [`vkCreateInstance`](https://docs.vulkan.org/refpages/latest/refpages/source/vkCreateInstance.html) e [`VK_EXT_layer_settings`](https://github.com/KhronosGroup/Vulkan-Utility-Libraries/blob/main/docs/layer_configuration.md#configuring-the-layer-settings-using-vk_ext_layer_settings)

O [*Vulkan Configurator*](https://vulkan.lunarg.com/doc/sdk/latest/windows/vkconfig.html) simplifica o uso desses três métodos. Por meio da interface gráfica do usuário, podemos criar *configurações de camadas*. A ferramenta cria e localiza automaticamente os arquivos `vk_loader_settings.json` e `vk_layer_settings.txt`. Ela também pode ser usada para gerar scripts de variáveis de ambiente e uma biblioteca de cabeçalho C++ que pode ser incluída diretamente no código da aplicação Vulkan.

O documento [Layer Configuration](https://github.com/KhronosGroup/Vulkan-Utility-Libraries/blob/main/docs/layer_configuration.md) fornece detalhes adicionais sobre a configuração de camadas.

## Política de Compatibilidade Retroativa das Configurações de Camadas

Configurações desconhecidas pela camada serão ignoradas independentemente do método utilizado. É responsabilidade do desenvolvedor da camada garantir a compatibilidade retroativa com versões anteriores da camada.

Isso garante que a lista de configurações de camadas permaneça relativamente estável entre versões e que a responsabilidade de lidar com a compatibilidade retroativa das camadas não recaia sobre os desenvolvedores de aplicações Vulkan, pois isso rapidamente se tornaria incontrolável.

## Descontinuação das Camadas de Dispositivo (*Device Layers*)

Antigamente existiam tanto camadas de instância (*instance layers*) quanto camadas de dispositivo (*device layers*), mas as camadas de dispositivo foram [descontinuadas](https://docs.vulkan.org/spec/latest/appendices/legacy.html#legacy-devicelayers) logo no início da história do Vulkan e devem ser evitadas.

## Criando uma Camada

Qualquer pessoa pode criar uma camada, desde que siga a [interface entre loader e camada](https://github.com/KhronosGroup/Vulkan-Loader/blob/main/docs/LoaderApplicationInterface.md#loader-and-layer-interface), que define como o *loader* e as camadas concordam em se comunicar entre si.

Para garantir consistência e uma integração fluida com o Vulkan Configurator e outras ferramentas do SDK, o componente [Vulkan::LayerSettings](https://github.com/KhronosGroup/Vulkan-Utility-Libraries) deve ser utilizado na implementação da camada.

## Android

A partir do Android P (Android 9 / nível de API 28), se um dispositivo estiver em estado depurável de modo que `getprop ro.debuggable` [retorne 1](https://cs.android.com/android/platform/superproject/+/android-9.0.0_r1:frameworks/native/vulkan/libvulkan/layers_extensions.cpp;l=454), o *loader* procurará em [`/data/local/debug/vulkan`](https://cs.android.com/android/platform/superproject/+/android-9.0.0_r1:frameworks/native/vulkan/libvulkan/layers_extensions.cpp;l=67).

A partir do Android P (Android 9 / nível de API 28), camadas implícitas podem ser [enviadas usando ADB](https://developer.android.com/ndk/guides/graphics/validation-layer#vl-adb) caso a aplicação tenha sido compilada em modo de depuração (*debug*).

Não existe outra forma além das opções acima para utilizar camadas implícitas.
