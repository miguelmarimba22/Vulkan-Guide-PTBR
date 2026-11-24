# Perfis Vulkan (*Vulkan Profiles*)

*Vulkan Profiles* é um mecanismo que permite aos desenvolvedores direcionar um conjunto específico de recursos, extensões e limites garantidamente suportados por uma faixa de implementações Vulkan. Isso é particularmente útil no desenvolvimento multiplataforma, onde você deseja assegurar que sua aplicação funcione de maneira consistente em diferentes dispositivos.

Para informações detalhadas, consulte a documentação da [Vulkan Profiles API Library](https://vulkan.lunarg.com/doc/sdk/latest/windows/profiles_api_library.html) no site da LunarG.

## O que são Vulkan Profiles?

Um *Vulkan Profile* é um conjunto bem definido de capacidades (recursos, extensões, formatos, famílias de *queues*, etc.) que pode ser usado como linha de base (*baseline*) para o desenvolvimento de aplicações. Os perfis são definidos em formato JSON e podem ser usados para:

- Simplificar o desenvolvimento ao fornecer um conjunto conhecido de capacidades
- Garantir compatibilidade em uma ampla gama de dispositivos
- Reduzir a necessidade de códigos complexos de verificação de capacidades e caminhos de *fallback*
- Fornecer um alvo claro tanto para desenvolvedores quanto para fabricantes de hardware
- Habilitar automaticamente recursos e extensões obrigatórios sem configuração manual

O Khronos Group mantém um conjunto de perfis oficiais, e os fabricantes também podem definir seus próprios perfis para seus hardwares específicos. Além disso, desenvolvedores de aplicações Vulkan podem criar perfis para especificar caminhos de código de suas engines — como faz a Unreal Engine — ou bibliotecas como a Zink podem especificar seus requisitos Vulkan para executar OpenGL, permitindo que fabricantes de hardware priorizem o desenvolvimento de drivers para suportar caminhos de código específicos de engines ou bibliotecas.

### História e Propósito

Os *Vulkan Profiles* foram introduzidos para enfrentar o desafio da fragmentação no ecossistema Vulkan. Com muitos dispositivos diferentes suportando diversas combinações de recursos e extensões, desenvolvedores enfrentavam dificuldades para:

- Determinar quais recursos escolher como alvo para máxima compatibilidade entre dispositivos
- Gerenciar caminhos de *fallback* para dispositivos com capacidades limitadas
- Comunicar requisitos de forma clara aos fabricantes de hardware

Os perfis resolvem esses problemas fornecendo uma convenção para definir e referenciar conjuntos de capacidades Vulkan. Eles funcionam como um contrato entre desenvolvedores de aplicações e fabricantes de hardware, garantindo que dispositivos que declaram suporte a um perfil oferecerão todas as capacidades nele definidas.

### Relação com as Versões do Vulkan

Os *Vulkan Profiles* são complementares às versões do Vulkan. Enquanto as versões do Vulkan (1.0, 1.1, 1.2, etc.) definem a funcionalidade *core* da API, os perfis definem subconjuntos específicos de recursos, extensões e limites que podem abranger diferentes versões do Vulkan.

Por exemplo:

- O perfil *Android Baseline 2022* requer a funcionalidade *core* do Vulkan 1.1
- O perfil *LunarG Desktop Baseline 2022* para plataformas desktop requer Vulkan 1.1 com extensões específicas
- Perfis futuros podem direcionar versões mais recentes do Vulkan à medida que elas se tornem mais amplamente suportadas

Essa abordagem permite que os desenvolvedores mirem em conjuntos específicos de capacidades sem ficarem presos a uma única versão do Vulkan, proporcionando maior flexibilidade no desenvolvimento de aplicações.

## Perfis Mantidos

O Khronos Group mantém vários perfis, definidos no [repositório Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/tree/main/profiles). Os únicos perfis mantidos diretamente pelo Khronos Group são os perfis *Khronos Roadmap*. Os demais são mantidos pelo Google e pela LunarG:

- **LunarG Desktop Baseline 2022** — Um perfil de linha de base para plataformas desktop ([Definições JSON](https://github.com/KhronosGroup/Vulkan-Profiles/tree/main/profiles/LunarG/VP_LUNARG_desktop_baseline_2022))
- **Android Baseline 2022** — Um perfil de linha de base específico para dispositivos Android ([Documentação](https://vulkan.lunarg.com/doc/sdk/latest/windows/profiles_api_library.html), [Definição JSON](https://github.com/KhronosGroup/Vulkan-Profiles/blob/main/profiles/VP_ANDROID_baseline_2022.json))
- **Roadmap 2024** — Um perfil voltado para o futuro que os fabricantes de hardware são incentivados a suportar em implementações futuras ([Documentação](https://vulkan.lunarg.com/doc/sdk/latest/windows/profiles_api_library.html), [Definição JSON](https://docs.vulkan.org/spec/latest/appendices/roadmap.html#roadmap-2024), [Roadmap](https://docs.vulkan.org/spec/latest/appendices/roadmap.html))

Esses perfis são versionados por ano para permitir evolução ao longo do tempo mantendo retrocompatibilidade. Você pode encontrar exemplos de código demonstrando o uso desses perfis no [repositório Vulkan-Samples](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/tooling/profiles).

### Detalhes do Perfil LunarG Desktop Baseline 2022

O perfil *LunarG Desktop Baseline 2022* (`VP_LUNARG_DESKTOP_BASELINE_2022`) foi projetado para plataformas desktop. Ele é descrito como "um perfil gerado pela interseção de uma coleção de relatórios de dispositivos do GPUInfo.org para dar suporte a um grande número de sistemas reais no ecossistema Vulkan. Este perfil tem como objetivo servir de exemplo de uso para desenvolvedores de aplicações Vulkan."

O propósito real dos perfis *LunarG Desktop Baseline* é fornecer exemplos para que desenvolvedores criem perfis para suas próprias aplicações. É importante notar que esses perfis possuem algumas limitações — por exemplo, GPUs Windows ARM / Qualcomm não são suportadas porque ainda não haviam sido lançadas ou tinham acabado de ser lançadas quando os perfis foram gerados.

Se a LunarG vier a criar um *Desktop Baseline 2025* no futuro, ele provavelmente incluiria GPUs Windows ARM / Qualcomm, o que tornaria o *Desktop Baseline 2025* simultaneamente um subconjunto e um superconjunto (provavelmente Vulkan 1.3) do *Desktop Baseline 2024*.

O perfil inclui:

- Funcionalidade *core* do Vulkan 1.1
- Extensões essenciais como:
  - `VK_KHR_maintenance1`, `VK_KHR_maintenance2`, `VK_KHR_maintenance3`
  - `VK_KHR_create_renderpass2`
  - `VK_KHR_image_format_list`
  - `VK_KHR_sampler_mirror_clamp_to_edge`
- Requisitos específicos de recursos, incluindo:
  - `robustBufferAccess`
  - `fullDrawIndexUint32`
  - `imageCubeArray`
  - `independentBlend`
  - E muitos outros recursos *core*

Esse perfil garante que aplicações focadas nele funcionem de forma consistente em uma ampla variedade de GPUs desktop de diferentes fabricantes.

### Detalhes do Perfil Android Baseline 2022

O perfil *Android Baseline 2022* (`VP_ANDROID_BASELINE_2022`) é adaptado especificamente para dispositivos Android e inclui:

- Funcionalidade *core* do Vulkan 1.1
- Extensões específicas do Android, como:
  - `VK_KHR_android_surface`
  - `VK_ANDROID_external_memory_android_hardware_buffer`
- Extensões comuns de renderização:
  - `VK_KHR_swapchain`
  - `VK_KHR_maintenance1`, `VK_KHR_maintenance2`, `VK_KHR_maintenance3`
  - `VK_KHR_dedicated_allocation`
- Limites e recursos otimizados para dispositivos móveis

Esse perfil é particularmente valioso para desenvolvedores de jogos Android que desejam garantir que suas aplicações rodem em uma grande variedade de dispositivos Android sem precisar implementar caminhos de código complexos específicos para cada aparelho.

### Perfil Roadmap 2022

O perfil *Roadmap 2022* (`VP_KHR_ROADMAP_2022`) é um perfil voltado para o futuro que define capacidades que os fabricantes de hardware são incentivados a suportar em implementações futuras. Ele inclui:

- Recursos e extensões mais avançados além dos perfis de linha de base
- Limites mínimos mais altos para diversos recursos
- Suporte a funcionalidades mais recentes do Vulkan

Ao mirar nesse perfil, desenvolvedores podem preparar suas aplicações para capacidades de hardware futuras enquanto ainda mantêm compatibilidade com dispositivos atuais por meio de mecanismos de *fallback*.

### Estratégia de Versionamento de Perfis

Os perfis podem usar um esquema de versionamento baseado no ano (ex.: 2022, 2023) para indicar quando foram definidos. Essa abordagem:

- Fornece um contexto temporal claro para cada perfil
- Permite a criação de novos perfis que refletem a evolução das capacidades de hardware
- Mantém retrocompatibilidade, pois perfis mais antigos só são atualizados para corrigir falhas ou problemas

Quando um novo perfil anual é lançado, ele normalmente inclui todas as capacidades do perfil do ano anterior mais recursos adicionais e possivelmente limites mais elevados, refletindo o avanço do hardware.

## Usando Vulkan Profiles

Existem duas maneiras principais de usar *Vulkan Profiles* para inicializar uma aplicação Vulkan:

### Habilitação Automática de Recursos

Um dos principais benefícios de usar a biblioteca *Vulkan Profiles* é que ela lida automaticamente com a habilitação de todos os recursos, extensões e propriedades obrigatórios definidos em um perfil. Isso elimina a necessidade de fazer manualmente:

- Rastrear e habilitar cada extensão necessária
- Configurar estruturas de recursos para cada recurso utilizado
- Configurar estruturas de propriedades para requisitos específicos

Quando você chama `profile.ConfigureDeviceCreation()`, a biblioteca automaticamente:

1. Preenche as informações de criação do dispositivo com todas as extensões necessárias
2. Configura a cadeia de recursos (*feature chain*) com todos os recursos obrigatórios habilitados
3. Configura quaisquer propriedades necessárias

Isso simplifica consideravelmente a inicialização do dispositivo e reduz a chance de erros causados por esquecer de habilitar recursos ou extensões específicos.

### 1. Usando o cabeçalho Vulkan Profiles

A maneira mais simples de usar *Vulkan Profiles* é por meio do cabeçalho `vulkan_profiles.hpp`, disponível no [Vulkan SDK](https://vulkan.lunarg.com/sdk/home). Esse cabeçalho fornece uma API C++ que simplifica o trabalho com perfis. O cabeçalho está documentado na [documentação da biblioteca Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/tree/main):

```cpp
#include <vulkan/vulkan.hpp>
#include <vulkan/vulkan_profiles.hpp>

// Cria uma instância do perfil Android Baseline 2022
vkp::AndroidBaseline2022Profile profile{};

// Verifica se o perfil é suportado neste dispositivo
VkBool32 supported = VK_FALSE;
profile.CheckSupport(physicalDevice, &supported);
if (supported == VK_TRUE) {
    // O dispositivo suporta o perfil Android Baseline
    // Usa o perfil para configurar a criação do dispositivo
    VkDeviceCreateInfo deviceCreateInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
        .pNext = nullptr,
    };
    profile.ConfigureDeviceCreation(physicalDevice, deviceCreateInfo);

    // Cria o dispositivo com as informações configuradas pelo perfil
    VkDevice device = VK_NULL_HANDLE;
    vkCreateDevice(physicalDevice, &deviceCreateInfo, nullptr, &device);
}
```

### 2. Usando diretamente os arquivos JSON do Vulkan Profiles

Para casos de uso mais avançados, você pode trabalhar diretamente com as definições JSON de perfis. Você pode encontrar código de exemplo que carrega e usa perfis JSON no tutorial do [Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/blob/main/layer/TUTORIAL.md):

```cpp
// Carrega um perfil a partir de um arquivo JSON
VkpProfilesFileLoader loader{};
loader.LoadFromFile("android_baseline_2022.json");

// Obtém o perfil
VkpProfile profile = loader.GetProfile("VP_ANDROID_BASELINE_2022");

// Usa o perfil para verificar suporte e criar um dispositivo
// (de maneira semelhante à abordagem baseada em cabeçalho)
```

### Entendendo a Estrutura JSON de um Perfil

Os *Vulkan Profiles* são definidos em formato JSON com uma estrutura específica. Compreender essa estrutura é importante para desenvolvedores que desejam criar perfis personalizados ou modificar perfis existentes. Abaixo está um exemplo simplificado de uma estrutura JSON de perfil:

```json
{
    "file_format_version": "1.0.0",
    "profiles": {
        "VP_EXAMPLE_PROFILE": {
            "version": 1,
            "api_version": "1.1.0",
            "label": "Example Profile",
            "description": "A simple example profile",
            "capabilities": [
                {
                    "extensions": {
                        "VK_KHR_swapchain": 1,
                        "VK_KHR_maintenance1": 1
                    },
                    "features": {
                        "VkPhysicalDeviceFeatures": {
                            "robustBufferAccess": true,
                            "fullDrawIndexUint32": true
                        }
                    },
                    "properties": {
                        "VkPhysicalDeviceProperties": {
                            "limits": {
                                "maxImageDimension2D": 4096,
                                "maxFramebufferWidth": 4096
                            }
                        }
                    },
                    "formats": {
                        "VK_FORMAT_R8G8B8A8_UNORM": {
                            "VkFormatProperties": {
                                "linearTilingFeatures": [
                                    "VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT"
                                ],
                                "optimalTilingFeatures": [
                                    "VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT",
                                    "VK_FORMAT_FEATURE_COLOR_ATTACHMENT_BIT"
                                ]
                            }
                        }
                    }
                }
            ]
        }
    }
}
```

As partes principais da definição de um perfil incluem:

- **Metadados do Perfil (*Profile Metadata*)**: Nome, versão, versão da API, rótulo (*label*) e descrição
- **Capacidades (*Capabilities*)**: O núcleo do perfil, definindo o que ele suporta:
  - **Extensões**: Extensões obrigatórias e suas versões mínimas
  - **Recursos (*Features*)**: Recursos obrigatórios que devem ser suportados
  - **Propriedades (*Properties*)**: Propriedades e limites obrigatórios
  - **Formatos (*Formats*)**: Suporte obrigatório a formatos com capacidades específicas

### Tipos de Vulkan Profiles

*Vulkan Profiles* podem ser aplicados a uma grande variedade de casos de uso, incluindo:

- **Perfis de Roadmap**: Para expressar diretrizes sobre a direção futura dos dispositivos Vulkan.
- **Perfis de Plataforma**: Para expressar o suporte Vulkan disponível em diferentes plataformas.
- **Perfis de Dispositivo**: Para expressar o suporte Vulkan de um único driver Vulkan em um dispositivo Vulkan.
- **Perfis de Arquitetura**: Para expressar o suporte Vulkan de uma classe de GPUs.
- **Perfis de Engine**: Para expressar os requisitos de certos caminhos de código de renderização de uma engine.
- **Perfis de Bugs de Driver**: Para expressar capacidades que não podem ser usadas por uma aplicação.

Esses diferentes tipos de perfis permitem aos desenvolvedores mirar em configurações de hardware, plataformas ou casos de uso específicos, garantindo compatibilidade e desempenho ideal em um amplo leque de cenários.

### Criando Perfis Personalizados

Desenvolvedores podem criar perfis personalizados para mirar em configurações específicas de hardware ou definir uma linha de base para suas próprias aplicações.

Existem dois casos de uso principais que definem o ponto de partida:

1. Criar um perfil de "Plataforma" — um perfil que representa todos os dispositivos nos quais você deseja que sua aplicação Vulkan seja executada. Nesse caso, o ponto de partida seria usar dados de https://vulkan.gpuinfo.org/ ao mesclar capacidades de dispositivos.
2. Criar um perfil de "Engine" — um perfil que lista todos os requisitos necessários para que sua aplicação Vulkan seja executada. Nesse caso, modificar um perfil existente costuma ser a melhor abordagem.

Ambas as abordagens trabalham juntas para garantir que uma aplicação Vulkan possa ser distribuída com confiabilidade.

Para criar um perfil personalizado:

1. Comece com um perfil existente apropriado como modelo (consulte [profiles](https://github.com/KhronosGroup/Vulkan-Profiles/tree/main/profiles))
2. Modifique as capacidades para corresponder aos seus requisitos
3. Salve o perfil como um arquivo JSON
4. Utilize o perfil na sua aplicação usando a abordagem baseada em cabeçalho ou baseada em JSON

Você pode encontrar exemplos de perfis personalizados nos [exemplos de perfis do Vulkan-Samples](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/tooling/profiles).

Perfis personalizados são particularmente úteis para:

- Equipes internas de desenvolvimento trabalhando em múltiplas aplicações
- Definir requisitos mínimos para categorias específicas de aplicações
- Criar perfis otimizados específicos de hardware

Exemplo de criação e uso de um perfil personalizado:

```cpp
#include <string>

// Define um perfil personalizado (normalmente feito offline e salvo em um arquivo JSON)
const std::string customProfileJson = R"(
{
    "file_format_version": "1.0.0",
    "profiles": {
        "VP_CUSTOM_GAME_PROFILE": {
            "version": 1,
            "api_version": "1.1.0",
            "label": "Custom Game Profile",
            "description": "Profile for our game engine",
            "capabilities": [
                // ... capacidades personalizadas ...
            ]
        }
    }
}
)";

// Carrega o perfil personalizado
VkpProfilesFileLoader loader{};
loader.LoadFromString(customProfileJson);

// Usa o perfil personalizado
VkpProfile profile = loader.GetProfile("VP_CUSTOM_GAME_PROFILE");
// ... usa o perfil como anteriormente ...
```

## Perfil Android Baseline

O *Android Baseline Profile* é especialmente útil para desenvolvedores Android, pois fornece um conjunto garantido de recursos disponíveis em uma ampla gama de dispositivos Android. Esse perfil está documentado na [documentação da Vulkan Profiles API Library](https://vulkan.lunarg.com/doc/sdk/latest/windows/profiles_api_library.html) e em sua [definição JSON](https://github.com/KhronosGroup/Vulkan-Profiles/blob/main/profiles/VP_ANDROID_baseline_2022.json). Ele inclui:

- Funcionalidade *core* do Vulkan 1.1
- Extensões essenciais para o desenvolvimento Android
- Limites e recursos mínimos garantidos

Ao direcionar o *Android Baseline Profile*, desenvolvedores podem:

- Reduzir a necessidade de caminhos de código específicos por dispositivo
- Garantir comportamento consistente em diferentes dispositivos Android
- Simplificar testes e validação

### Exemplo: Direcionando o Android Baseline Profile

```cpp
#include <vulkan/vulkan.hpp>
#include <vulkan/vulkan_profiles.hpp>

void SetupVulkanWithAndroidProfile() {
    // Cria uma instância Vulkan
    vk::InstanceCreateInfo instanceCreateInfo{};
    vk::Instance instance = vk::createInstance(instanceCreateInfo);

    // Obtém um dispositivo físico
    vk::PhysicalDevice physicalDevice = instance.enumeratePhysicalDevices().front();

    // Cria uma instância do perfil Android Baseline 2022
    vkp::AndroidBaseline2022Profile profile{};

    // Verifica se o perfil é suportado
    VkBool32 supported = VK_FALSE;
    profile.CheckSupport(physicalDevice, &supported);

    if (supported == VK_TRUE) {
        // Configura a criação do dispositivo com o perfil
        vk::DeviceCreateInfo deviceCreateInfo{};
        profile.ConfigureDeviceCreation(physicalDevice, deviceCreateInfo);

        // Cria o dispositivo
        vk::Device device = physicalDevice.createDevice(deviceCreateInfo);

        // Agora você pode usar o dispositivo com o conjunto garantido de recursos
        // definido no Android Baseline Profile
    } else {
        // Trata o caso em que o perfil não é suportado
        // Isso pode envolver recorrer a uma abordagem de renderização mais simples
        // ou exibir uma mensagem de erro
    }
}
```

## Integração com Aplicações Existentes

Integrar *Vulkan Profiles* em uma aplicação Vulkan existente envolve várias etapas, descritas na [documentação da biblioteca Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/blob/main/library/TUTORIAL.md):

1. **Identificar Perfis-Alvo**: Determine quais perfis melhor atendem aos requisitos da sua aplicação
2. **Adicionar Suporte a Perfis**: Incorpore o cabeçalho *Vulkan Profiles* ou o carregamento de JSON
3. **Modificar a Criação do Dispositivo**: Atualize o código de criação do dispositivo para utilizar perfis
4. **Adicionar Caminhos de Fallback**: Implemente estratégias de *fallback* para dispositivos que não suportam o perfil-alvo

Para exemplos de integração de perfis com aplicações existentes, consulte os [exemplos de perfis do Vulkan-Samples](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/tooling/profiles) e o [diretório de testes do Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/tree/main/library/test).

Abaixo está um exemplo de integração de perfis em uma aplicação existente:

```cpp
// Código original de criação de dispositivo
void CreateDeviceOriginal(VkPhysicalDevice physicalDevice) {
    // Consulta recursos, extensões, etc.
    VkPhysicalDeviceFeatures features{};
    vkGetPhysicalDeviceFeatures(physicalDevice, &features);

    // Configura manualmente as informações de criação do dispositivo
    VkDeviceCreateInfo createInfo{
        .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
        .pNext = nullptr,
        .pEnabledFeatures = &features,
        // ... configura extensões, queues, etc. ...
    };

    // Cria o dispositivo
    VkDevice device = VK_NULL_HANDLE;
    vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
}

// Código atualizado de criação de dispositivo usando perfis
void CreateDeviceWithProfiles(VkPhysicalDevice physicalDevice) {
    // Tenta usar o perfil LunarG Desktop Baseline 2022
    vkp::LunargDesktopBaseline2022Profile profile{};

    VkBool32 supported = VK_FALSE;
    profile.CheckSupport(physicalDevice, &supported);

    if (supported == VK_TRUE) {
        // Perfil suportado; usa-o para configurar a criação do dispositivo
        VkDeviceCreateInfo createInfo{
            .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
            .pNext = nullptr,
        };

        profile.ConfigureDeviceCreation(physicalDevice, createInfo);

        // Cria o dispositivo com as configurações definidas pelo perfil
        VkDevice device = VK_NULL_HANDLE;
        vkCreateDevice(physicalDevice, &createInfo, nullptr, &device);
    } else {
        // Recorre ao método original se o perfil não for suportado
        CreateDeviceOriginal(physicalDevice);
    }
}
```

## Considerações de Desempenho

Usar *Vulkan Profiles* tem impacto mínimo no desempenho em tempo de execução, mas há alguns pontos a considerar:

1. **Sobrecarga de Inicialização**: Carregar e fazer *parsing* de arquivos JSON de perfis adiciona algum tempo na inicialização.
2. **Uso de Memória**: As estruturas de dados do perfil consomem uma pequena quantidade de memória.
3. **Habilitação de Recursos**: Habilitar recursos que você não utiliza pode causar um leve impacto de desempenho em algumas implementações.

Para otimizar o desempenho ao usar perfis:

- Use a abordagem baseada em cabeçalho para melhor otimização em tempo de compilação
- Crie perfis personalizados que incluam apenas os recursos de que você realmente precisa
- Considere usar perfis diferentes para diferentes níveis (*tiers*) de hardware

## Solução de Problemas e Questões Comuns

Ao trabalhar com *Vulkan Profiles*, desenvolvedores podem encontrar alguns problemas comuns. A [documentação da biblioteca Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles/blob/main/library/TUTORIAL.md) fornece orientações para diagnóstico, e a [documentação das Vulkan Validation Layers](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/docs/khronos_validation_layer.md) pode ajudar a identificar problemas no uso de perfis:

### O Perfil Não é Suportado

Se `CheckSupport()` retornar `VK_FALSE`, isso significa que o dispositivo não suporta todos os requisitos do perfil. Para investigar:

1. Use a função `GetProfileCapabilitiesReport()` do perfil para obter informações detalhadas sobre quais requisitos específicos não foram atendidos
2. Considere usar um perfil menos exigente
3. Implemente um caminho de *fallback* para dispositivos que não suportam o perfil-alvo

Exemplo:

```cpp
#include <format>

VkBool32 supported = VK_FALSE;
profile.CheckSupport(physicalDevice, &supported);

if (supported == VK_FALSE) {
    // Obtém um relatório detalhado sobre o que não é suportado
    VkpProfileCapabilitiesReport report{};
    profile.GetProfileCapabilitiesReport(physicalDevice, report);

    // Registra no log as capacidades não suportadas
    for (const auto& unsupported : report.unsupportedCapabilities) {
        LogWarning(std::format("Não suportado: {}", unsupported));
    }

    // Recorre a outro perfil ou a uma configuração personalizada
}
```

### Problemas de Compatibilidade de Versão

Ao usar perfis em diferentes versões do Vulkan SDK, podem surgir problemas de compatibilidade. Para evitá-los:

- Sempre utilize definições de perfil da mesma versão do SDK dos seus cabeçalhos Vulkan
- Esteja ciente de que as definições de perfis podem evoluir entre lançamentos do SDK
- Considere empacotar os arquivos JSON de perfil junto com sua aplicação para garantir consistência

### Integração com Validation Layers

Os *Vulkan Profiles* funcionam bem com as *validation layers*, mas existem algumas considerações:

- Habilite a camada `VK_LAYER_KHRONOS_validation` durante o desenvolvimento
- Esteja ciente de que alguns avisos de validação podem ser disparados para recursos habilitados pelo perfil que você não está usando explicitamente
- Use *debug callbacks* para filtrar mensagens de validação se necessário

## Benefícios de Usar Vulkan Profiles

O uso de *Vulkan Profiles* oferece diversas vantagens:

1. **Desenvolvimento Simplificado**
   - Reduz a complexidade de verificar recursos e extensões individualmente
   - **Habilita automaticamente todos os recursos e extensões obrigatórios** sem configuração manual
2. **Melhor Compatibilidade**
   - Garante que sua aplicação funcione de maneira consistente em diferentes dispositivos
3. **Preparação para o Futuro (*Future-Proofing*)**
   - Os perfis evoluem de forma controlada, facilitando a adaptação a novos hardwares
4. **Comunicação Clara**
   - Fornece uma linguagem comum para desenvolvedores e fabricantes de hardware discutirem capacidades
5. **Menor Carga de Testes**
   - Menos caminhos de código específicos de dispositivos significam menos testes necessários
6. **Capacidades Padronizadas**
   - Fornece uma linha de base bem definida na qual fabricantes de hardware podem focar
7. **Portabilidade Facilitada**
   - Simplifica o processo de portar aplicações entre diferentes plataformas
8. **Redução de Código Repetitivo (*Boilerplate*)**
   - Elimina a necessidade de escrever código extenso para habilitar recursos e extensões

## Conclusão

Os *Vulkan Profiles* oferecem um mecanismo poderoso para direcionar um conjunto consistente de capacidades Vulkan em diferentes dispositivos. Ao usar perfis — especialmente o *Android Baseline Profile* para desenvolvimento móvel —, desenvolvedores podem simplificar seu código, garantir melhor compatibilidade e reduzir a necessidade de soluções alternativas específicas por dispositivo.

O sistema de perfis continua evoluindo, com novos perfis sendo definidos para atender a capacidades emergentes de hardware e necessidades dos desenvolvedores. Compreendendo como usar perfis com eficiência, criar perfis personalizados e integrá-los às suas aplicações, você pode agilizar significativamente seu processo de desenvolvimento em Vulkan.

Para mais informações, consulte estes recursos:

- [Documentação da Vulkan Profiles API Library](https://vulkan.lunarg.com/doc/sdk/latest/windows/profiles_api_library.html)
- [Repositório Vulkan-Profiles](https://github.com/KhronosGroup/Vulkan-Profiles)
  - Contém definições de perfis, código da biblioteca e ferramentas
- [Exemplos de perfis do Vulkan-Samples](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/tooling/profiles)
  - Código de exemplo demonstrando o uso de perfis
- [PDF do Vulkan Profiles](https://www.lunarg.com/wp-content/uploads/2024/02/The-Vulkan-Profiles-Tools-LunarG-Christophe-Riccio-02-01-2024.pdf)
  - Documentação exaustiva de Christophe Riccio (LunarG) sobre o Vulkan Profiles.
