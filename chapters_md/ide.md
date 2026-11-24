# Ambientes de Desenvolvimento e IDEs

Configurar um ambiente de desenvolvimento adequado pode melhorar significativamente a produtividade ao trabalhar com Vulkan. Este capítulo aborda como configurar IDEs populares para o desenvolvimento com Vulkan, com foco na integração com CMake.

## Visual Studio

O Microsoft Visual Studio oferece suporte robusto para o desenvolvimento com Vulkan no Windows:

### Configuração Básica

1. Instale o [Vulkan SDK](https://vulkan.lunarg.com/), que fornece os cabeçalhos, bibliotecas e ferramentas necessários.
2. No seu projeto do Visual Studio:
   * Adicione o diretório de inclusão (*include*) do Vulkan SDK aos caminhos de inclusão do projeto (`$(VULKAN_SDK)/Include`)
   * Adicione o diretório de bibliotecas do Vulkan SDK aos caminhos de biblioteca do projeto (`$(VULKAN_SDK)/Lib` ou `$(VULKAN_SDK)/Lib32`)
   * Faça o *link* com `vulkan-1.lib`

### Configuração do IntelliSense

Para melhorar o suporte do IntelliSense ao Vulkan:

1. Certifique-se de que seu projeto inclui o diretório de cabeçalhos do Vulkan SDK.
2. Para um melhor autocompletar, adicione o seguinte ao seu cabeçalho pré-compilado (*precompiled header*) ou a um arquivo de cabeçalho comum:

```cpp
#define VK_USE_PLATFORM_WIN32_KHR
#include <vulkan/vulkan.h>
```

### Configuração com CMake

O Visual Studio possui excelente integração com CMake:

1. Abra um projeto CMake no Visual Studio:
   * Arquivo → Abrir → CMake... (*File → Open → CMake...*)
   * Selecione seu arquivo `CMakeLists.txt`

2. Configure o Vulkan no seu `CMakeLists.txt`:

```cmake
# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Adiciona os diretórios de cabeçalhos
include_directories(${Vulkan_INCLUDE_DIRS})

# Cria o executável
add_executable(your_app main.cpp)

# Faz o link com o Vulkan
target_link_libraries(your_app ${Vulkan_LIBRARIES})
```

3. Configure as opções do CMake no Visual Studio:
   * Clique com o botão direito em `CMakeLists.txt` → Configurações do CMake (*CMake Settings*)
   * Adicione quaisquer variáveis ou opções adicionais do CMake

### Depuração e Profiling

O Visual Studio pode ser configurado para trabalhar com ferramentas de depuração e *profiling* do Vulkan:

1. Habilite as *validation layers* do Vulkan definindo a variável de ambiente `VK_LAYER_PATH` nas propriedades de depuração do projeto.
2. Configure a integração com o RenderDoc:
   * Instale o [RenderDoc](https://renderdoc.org/)
   * No Visual Studio, acesse Depurar → Gráficos → Iniciar Depuração Gráfica (*Debug → Graphics → Start Graphics Debugging*)
   * O RenderDoc pode capturar e analisar chamadas da API Vulkan
3. Para fazer *profiling* de aplicações Vulkan:
   * Para GPUs NVIDIA, use o NVIDIA Nsight Graphics (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento), que se integra diretamente ao Visual Studio
   * Para GPUs AMD, use o AMD Radeon GPU Profiler (RGP) por meio do Radeon Developer Panel (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para GPUs Intel, use o Intel Graphics Performance Analyzers (GPA) (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para *profiling* multifabricante, considere o VKtracer ou o GFXReconstruct (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)

Para informações mais detalhadas sobre ferramentas de *profiling*, consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento.

## Visual Studio Code

O VS Code é um editor leve, porém poderoso, que pode ser configurado para o desenvolvimento com Vulkan:

### Configuração Básica

1. Instale o [Vulkan SDK](https://vulkan.lunarg.com/)
2. Instale as seguintes extensões no VS Code:
   * Extensão C/C++ da Microsoft
   * CMake Tools (se estiver usando CMake)
   * Suporte a linguagens de *shader* (GLSL, HLSL)

### Configuração com CMake

O VS Code possui excelente integração com CMake por meio da extensão CMake Tools:

1. Instale a extensão CMake Tools
2. Configure seu `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.10)
project(VulkanProject)

# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Cria o executável
add_executable(your_app main.cpp)

# Faz o link com o Vulkan
target_link_libraries(your_app PUBLIC Vulkan::Vulkan)
```

3. Configure o CMake no VS Code:
   * Crie um arquivo `.vscode/settings.json`:

```json
{
    "cmake.configureOnOpen": true,
    "cmake.buildDirectory": "${workspaceFolder}/build",
    "cmake.generator": "Ninja"
}
```

### Configuração de Tarefas de Compilação (Build Tasks)

Crie um arquivo `.vscode/tasks.json` para configurar as tarefas de compilação:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build",
            "type": "shell",
            "command": "cmake --build build",
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

### Configuração de Inicialização (Launch Configuration)

Crie um arquivo `.vscode/launch.json` para depuração:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Vulkan Application",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/your_app",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [
                {"name": "VK_LAYER_PATH", "value": "path/to/vulkan/sdk/layers"}
            ],
            "externalConsole": false
        }
    ]
}
```

### Integração com Depuração e Profiling

O VS Code pode ser integrado a diversas ferramentas de *profiling* do Vulkan:

1. Integração com RenderDoc:
   * Instale a extensão do RenderDoc para VS Code
   * Configure tarefas de inicialização para iniciar o RenderDoc com sua aplicação
   * Analise quadros capturados diretamente a partir do VS Code

2. Ferramentas externas de *profiling*:
   * Use o RenderDoc para captura e análise de quadros (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para *profiling* multiplataforma, use o VKtracer ou o GFXReconstruct (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para *profiling* específico de fabricante, inicie a ferramenta apropriada pela linha de comando ou use sua extensão para VS Code, caso disponível

Para informações mais detalhadas sobre ferramentas de *profiling*, consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento.

## CLion

O JetBrains CLion oferece excelente suporte para o desenvolvimento com Vulkan, com recursos avançados de análise de código e depuração:

### Configuração Básica

1. Instale o [Vulkan SDK](https://vulkan.lunarg.com/)
2. No CLion:
   * Abra o `CMakeLists.txt` do seu projeto
   * Configure os caminhos de cabeçalhos e bibliotecas do Vulkan na sua configuração do CMake

### Configuração com CMake

O CLion possui suporte nativo ao CMake:

1. Crie um novo projeto CMake ou abra um existente
2. Configure seu `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.10)
project(VulkanProject)

# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Cria o executável
add_executable(your_app main.cpp)

# Faz o link com o Vulkan
target_link_libraries(your_app PUBLIC Vulkan::Vulkan)
```

3. O CLion detectará automaticamente alterações no `CMakeLists.txt` e recarregará o projeto.

4. Para configurações mais avançadas, você pode modificar as opções do CMake:
   * File → Settings → Build, Execution, Deployment → CMake
   * Adicione perfis para diferentes tipos de compilação (Debug, Release, etc.)

### Configuração de Execução/Depuração (Run/Debug)

1. Crie uma configuração de Run/Debug para sua aplicação Vulkan:
   * Acesse Run → Edit Configurations
   * Adicione uma nova configuração para sua aplicação
   * Na seção *Environment Variables*, adicione `VK_LAYER_PATH` apontando para o diretório de *layers* do seu Vulkan SDK

2. Para depuração avançada:
   * Habilite as *validation layers* do Vulkan na sua aplicação
   * Configure a integração com o RenderDoc iniciando sua aplicação por meio do RenderDoc

### Integração com Profiling

O CLion pode ser integrado a diversas ferramentas de *profiling* do Vulkan:

1. Ferramentas externas de *profiling*:
   * Use o RenderDoc para captura e análise de quadros (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para *profiling* multiplataforma, use o VKtracer ou o GFXReconstruct (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)

2. *Profiling* específico de fabricante:
   * Para GPUs NVIDIA, configure o NVIDIA Nsight Graphics como uma ferramenta externa (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para GPUs AMD, use o AMD Radeon GPU Profiler (RGP) por meio do Radeon Developer Panel (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Para GPUs Intel, configure o Intel Graphics Performance Analyzers (GPA) como uma ferramenta externa (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)

3. Configure ferramentas externas no CLion:
   * Acesse File → Settings → Tools → External Tools
   * Adicione suas ferramentas de *profiling* com os argumentos de linha de comando adequados
   * Acesse-as pelo menu Tools → External Tools

Para informações mais detalhadas sobre ferramentas de *profiling*, consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento.

## Xcode

A IDE Xcode da Apple pode ser usada para desenvolvimento Vulkan no macOS, normalmente por meio do MoltenVK, que é uma implementação do Vulkan executada sobre a API Metal da Apple.

### Configuração Básica

1. Instale o [Vulkan SDK para macOS](https://vulkan.lunarg.com/sdk/home#mac), que inclui o MoltenVK
2. No seu projeto Xcode:
   * Adicione o diretório de cabeçalhos do Vulkan SDK aos caminhos de inclusão do projeto
   * Adicione o framework MoltenVK ao seu projeto
   * Faça o *link* com as bibliotecas necessárias

### Configuração com CMake

O Xcode pode ser utilizado com projetos CMake:

1. Gere um projeto Xcode a partir do seu projeto CMake:

```bash
cmake -G Xcode -B build .
```

2. Configure seu `CMakeLists.txt` para macOS e MoltenVK:

```cmake
cmake_minimum_required(VERSION 3.10)
project(VulkanProject)

# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Cria o executável
add_executable(your_app main.cpp)

# Faz o link com o Vulkan
target_link_libraries(your_app PUBLIC Vulkan::Vulkan)

# Para macOS, pode ser necessário adicionar configurações específicas do MoltenVK
if(APPLE)
    # Adiciona o caminho do framework MoltenVK
    set(MOLTENVK_PATH "$ENV{VULKAN_SDK}/MoltenVK/MoltenVK.xcframework")
    target_link_libraries(your_app PUBLIC "-framework Metal" "-framework MetalKit" "-framework Cocoa")

    # Caso esteja usando o MoltenVK como framework
    target_link_libraries(your_app PUBLIC "${MOLTENVK_PATH}")
endif()
```

3. Abra o projeto Xcode gerado:

```bash
open build/YourProject.xcodeproj
```

### Configuração de Depuração

1. Configure a depuração no Xcode:
   * Edite seu esquema (*Product → Scheme → Edit Scheme*)
   * Na seção *Run*, vá para *Arguments*
   * Adicione as variáveis de ambiente para as *validation layers* do Vulkan:
     * `VK_LAYER_PATH` apontando para o diretório de *layers* do Vulkan SDK
     * `VK_ICD_FILENAMES` apontando para o arquivo JSON do ICD do MoltenVK

2. Para depuração avançada:
   * Habilite as *validation layers* do Vulkan na sua aplicação
   * Utilize as ferramentas de depuração integradas do Xcode
   * Considere usar o RenderDoc (embora o suporte no macOS possa ser limitado)

### Integração com Profiling

Fazer *profiling* de aplicações Vulkan no macOS via MoltenVK apresenta algumas limitações, mas existem diversas opções disponíveis:

1. Xcode Instruments:
   * Use a ferramenta Instruments integrada ao Xcode (*Xcode → Product → Profile*)
   * O instrumento *Metal System Trace* ajuda a analisar o desempenho da GPU
   * O *Time Profiler* permite identificar gargalos de CPU na sua aplicação Vulkan

2. *Profiling* específico do MoltenVK:
   * Habilite os recursos de rastreamento de desempenho do MoltenVK
   * Adicione o seguinte às suas variáveis de ambiente:
     * `MVK_CONFIG_TRACE_VULKAN_CALLS=1` para registrar chamadas da API Vulkan
     * `MVK_CONFIG_PERFORMANCE_TRACKING=1` para habilitar o rastreamento de desempenho

3. Ferramentas externas de *profiling*:
   * Para *profiling* multiplataforma, considere o VKtracer, que funciona no macOS (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * O GFXReconstruct pode ser usado para capturar e reproduzir chamadas da API Vulkan (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)

Para informações mais detalhadas sobre ferramentas de *profiling*, consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento.

### Considerações sobre o MoltenVK

Ao usar Vulkan no macOS por meio do MoltenVK, tenha em mente:

1. Nem todos os recursos do Vulkan são suportados pelo MoltenVK, pois ele traduz Vulkan para Metal.
2. Consulte a [documentação do MoltenVK](https://github.com/KhronosGroup/MoltenVK) para verificar recursos suportados e limitações.
3. Use a extensão `VK_MVK_moltenvk` para funcionalidades específicas do MoltenVK.
4. Considere utilizar o subconjunto *Vulkan Portability* para obter melhor compatibilidade multiplataforma.

## Android Studio

O Android Studio é a IDE oficial para desenvolvimento Android e oferece excelente suporte ao desenvolvimento com Vulkan em dispositivos Android:

### Configuração Básica

1. Instale o [Android Studio](https://developer.android.com/studio)
2. Instale o Android NDK (*Native Development Kit*) por meio do SDK Manager:
   * Abra Android Studio → Tools → SDK Manager
   * Selecione a aba "SDK Tools"
   * Marque "NDK (Side by side)" e "CMake"
   * Clique em "Apply" para baixar e instalar

3. Configure seu projeto para Vulkan:
   * Crie um novo projeto Android com suporte a *Native C++* ou adicione C++ a um projeto existente
   * No arquivo `app/build.gradle`, garanta que a versão mínima do SDK ofereça suporte ao Vulkan:

```groovy
android {
    defaultConfig {
        minSdkVersion 24 // Vulkan requer Android 7.0 (API nível 24) ou superior
        // ...
    }
    // ...
}
```

### Configuração do NDK para Vulkan

1. Adicione os cabeçalhos do Vulkan ao seu projeto:
   * Os cabeçalhos do Vulkan já estão incluídos no Android NDK
   * No seu `CMakeLists.txt`, adicione:

```cmake
# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Inclui os cabeçalhos do Vulkan
include_directories(${Vulkan_INCLUDE_DIRS})

# Faz o link com o Vulkan
target_link_libraries(your_native_lib Vulkan::Vulkan)
```

2. Configure o manifesto do Android (`AndroidManifest.xml`) para exigir suporte ao Vulkan:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Declara que o aplicativo utiliza Vulkan -->
    <uses-feature android:name="android.hardware.vulkan.version" android:version="0x400003" android:required="true" />

    <!-- Especifica os recursos do Vulkan exigidos pelo aplicativo -->
    <uses-feature android:name="android.hardware.vulkan.level" android:version="1" android:required="true" />

    <!-- ... -->
</manifest>
```

### Integração com CMake

O Android Studio utiliza CMake para projetos de código nativo:

1. Configure seu `CMakeLists.txt` para Android e Vulkan:

```cmake
cmake_minimum_required(VERSION 3.10)
project(VulkanAndroidProject)

# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Adiciona os arquivos-fonte
add_library(native-lib SHARED
    native-lib.cpp
    vulkan_wrapper.cpp
    # Adicione outros arquivos-fonte
)

# Diretórios de inclusão
target_include_directories(native-lib PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${Vulkan_INCLUDE_DIRS}
)

# Faz o link com as bibliotecas
target_link_libraries(native-lib
    android
    log
    Vulkan::Vulkan
)
```

2. Configure as opções do CMake no seu `app/build.gradle`:

```groovy
android {
    // ...
    defaultConfig {
        // ...
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++20"
                arguments "-DANDROID_STL=c++_shared"
            }
        }
    }

    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.10.2"
        }
    }
}
```

### Depuração e Profiling

O Android Studio oferece diversas ferramentas para depuração e *profiling* de aplicações Vulkan:

1. Depuração nativa:
   * Defina *breakpoints* no seu código C++
   * Use o depurador para executar passo a passo seu código Vulkan
   * Inspecione variáveis e memória

2. Depuração e *profiling* de GPU:
   * Use o Android GPU Inspector (AGI) para *profiling* e depuração de GPU (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * O AGI pode ser iniciado diretamente pelo Android Studio via Tools → Android → Android GPU Inspector
   * Capture chamadas da API Vulkan, analise cargas de trabalho da GPU e identifique gargalos de desempenho

3. Rastreamento de sistema (*System tracing*):
   * Use a ferramenta integrada *System Trace* do Android Studio (Profiler → System Trace)
   * Analise o desempenho de CPU, GPU e sistema

4. Para GPUs Qualcomm Adreno:
   * Use o Qualcomm Snapdragon Profiler para análise detalhada da GPU (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * Fornece informações específicas de Vulkan para GPUs Adreno

Para mais informações sobre ferramentas de *profiling* para Vulkan no Android, consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento.

## Configuração Geral de IDEs para Desenvolvimento Vulkan

Embora as seções anteriores tenham abordado IDEs específicas em detalhes, muitos desenvolvedores podem utilizar outros ambientes ou preferir uma abordagem mais universal. Esta seção fornece diretrizes gerais para configurar qualquer IDE para desenvolvimento Vulkan, com foco no uso do CMake como sistema de compilação multiplataforma.

### Princípios Universais de Configuração

Independentemente de qual IDE você utilize, as etapas a seguir são essenciais para o desenvolvimento com Vulkan:

1. Instale o [Vulkan SDK](https://vulkan.lunarg.com/) para sua plataforma:
   * Certifique-se de que o diretório `bin` do SDK esteja no `PATH` do sistema
   * Anote a localização do SDK para configurar os caminhos de cabeçalhos e bibliotecas

2. Configure os caminhos de inclusão (*include paths*) da IDE para localizar os cabeçalhos do Vulkan:
   * Adicione `$(VULKAN_SDK)/Include` ou equivalente aos caminhos de inclusão
   * Para desenvolvimento específico de plataforma, inclua os cabeçalhos apropriados da plataforma

3. Configure os caminhos de biblioteca para localizar as bibliotecas do Vulkan:
   * Adicione `$(VULKAN_SDK)/Lib` ou equivalente aos caminhos de biblioteca
   * Faça o *link* com a biblioteca Vulkan apropriada (`vulkan-1.lib` no Windows, `libvulkan.so` no Linux, etc.)

4. Instale as ferramentas de desenvolvimento necessárias:
   * Compiladores de *shader* (`glslangValidator`, `DXC`, `slangc`)
   * Ferramentas de *validation layers*
   * Ferramentas de depuração e *profiling* (RenderDoc, ferramentas específicas de GPU)

### CMake como Sistema de Compilação Universal

O CMake fornece uma maneira consistente de configurar projetos Vulkan em diferentes IDEs e plataformas:

1. Crie um `CMakeLists.txt` básico para o seu projeto Vulkan:

```cmake
cmake_minimum_required(VERSION 3.10)
project(VulkanProject)

# Localiza o pacote Vulkan
find_package(Vulkan REQUIRED)

# Cria o executável
add_executable(your_app main.cpp)

# Abordagem moderna do CMake com comandos target_*
target_include_directories(your_app PRIVATE ${Vulkan_INCLUDE_DIRS})
target_link_libraries(your_app PRIVATE Vulkan::Vulkan)

# Configurações específicas por plataforma
if(WIN32)
    target_compile_definitions(your_app PRIVATE VK_USE_PLATFORM_WIN32_KHR)
elseif(APPLE)
    target_compile_definitions(your_app PRIVATE VK_USE_PLATFORM_MACOS_MVK)
    # Faz o link com os frameworks Metal para o MoltenVK
    target_link_libraries(your_app PRIVATE "-framework Metal" "-framework MetalKit" "-framework Cocoa")
elseif(UNIX AND NOT APPLE)
    # Configuração específica para Linux
    target_compile_definitions(your_app PRIVATE VK_USE_PLATFORM_XCB_KHR)
    # Pode ser necessário fazer o link com bibliotecas XCB ou Wayland
endif()
```

2. Configure sua IDE para usar o CMake:
   * A maioria das IDEs modernas possui suporte nativo ou plugins para CMake
   * Para IDEs sem suporte direto ao CMake, você pode gerar arquivos de projeto:
     * Para Visual Studio: `cmake -G "Visual Studio 16 2019" -A x64 -B build .`
     * Para Xcode: `cmake -G Xcode -B build .`
     * Para Makefiles: `cmake -G "Unix Makefiles" -B build .`

3. Compilação de *shaders* no CMake:

```cmake
# Função para compilar shaders GLSL para SPIR-V
function(compile_shader TARGET_NAME SHADER_SOURCE SHADER_OUTPUT)
    add_custom_command(
        OUTPUT ${SHADER_OUTPUT}
        COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_CURRENT_BINARY_DIR}/shaders"
        COMMAND $ENV{VULKAN_SDK}/bin/glslangValidator -V "${SHADER_SOURCE}" -o "${SHADER_OUTPUT}"
        DEPENDS ${SHADER_SOURCE}
        COMMENT "Compilando ${SHADER_SOURCE} para ${SHADER_OUTPUT}"
    )
    add_custom_target(${TARGET_NAME} DEPENDS ${SHADER_OUTPUT})
endfunction()

# Exemplo de uso
compile_shader(
    compile_vertex_shader
    ${CMAKE_CURRENT_SOURCE_DIR}/shaders/shader.vert
    ${CMAKE_CURRENT_BINARY_DIR}/shaders/vert.spv
)
add_dependencies(your_app compile_vertex_shader)
```

### Abordagens Universais de Depuração

Independentemente da IDE, estas técnicas de depuração se aplicam a todas as aplicações Vulkan:

1. Habilite as *validation layers*:
   * Defina variáveis de ambiente na configuração de depuração da IDE:
     * `VK_LAYER_PATH` apontando para o diretório de *layers* do Vulkan SDK
     * `VK_INSTANCE_LAYERS=VK_LAYER_KHRONOS_validation` para habilitar a validação

2. Configure sua aplicação para usar *callbacks* de depuração:

```cpp
// Configura o debug messenger
const VkDebugUtilsMessengerCreateInfoEXT createInfo{
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT,
    .pNext = nullptr,
    .flags = 0,
    .messageSeverity = VK_DEBUG_UTILS_MESSAGE_SEVERITY_VERBOSE_BIT_EXT |
                       VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT |
                       VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT,
    .messageType = VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT |
                   VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT |
                   VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT,
    .pfnUserCallback = debugCallback, // Sua função de callback
    .pUserData = nullptr,
};
```

3. Utilize ferramentas externas de depuração:
   * O RenderDoc funciona com a maioria das IDEs e plataformas
   * Configure sua IDE para iniciar sua aplicação por meio do RenderDoc
   * Para depuração específica de GPU, utilize ferramentas dos fabricantes conforme descrito na seção de Depuração no capítulo de Ferramentas de Desenvolvimento

### Integração de Profiling Multiplataforma

Para fazer *profiling* de aplicações Vulkan em qualquer IDE:

1. Configure sua IDE para iniciar ferramentas externas de *profiling*:
   * Crie configurações personalizadas de execução ou integrações de ferramentas externas
   * Defina atalhos de teclado para tarefas comuns de *profiling*

2. Utilize ferramentas universais de *profiling*:
   * RenderDoc para captura de quadros e *profiling* básico (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * VKtracer para rastreamento de API multifabricante (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)
   * GFXReconstruct para captura e reprodução (consulte a seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento)

3. Para *profiling* detalhado de GPU:
   * Utilize ferramentas específicas de fabricante conforme descrito na seção de *Profiling* no capítulo de Ferramentas de Desenvolvimento
   * Configure sua IDE para definir as variáveis de ambiente necessárias para essas ferramentas

### Checklist de Configuração de IDE

Ao configurar qualquer IDE para desenvolvimento Vulkan, verifique se você atendeu aos seguintes pontos-chave:

1. ✓ O Vulkan SDK está devidamente instalado e configurado
2. ✓ Os caminhos de cabeçalhos e bibliotecas estão configurados corretamente
3. ✓ O sistema de compilação (preferencialmente CMake) está configurado
4. ✓ A compilação de *shaders* está integrada ao processo de compilação
5. ✓ A depuração com *validation layers* está habilitada
6. ✓ As ferramentas de *profiling* estão acessíveis
7. ✓ As considerações específicas da plataforma foram tratadas

Seguindo esses princípios universais, você pode configurar praticamente qualquer IDE para um desenvolvimento Vulkan eficiente, aproveitando o poder do CMake para compatibilidade multiplataforma e processos de compilação consistentes.

## Integração de Depuração de Shaders

Depurar *shaders* em aplicações Vulkan apresenta desafios únicos em comparação com a depuração de código de CPU. Esta seção aborda ferramentas, técnicas e integrações com IDEs para uma depuração eficaz de *shaders*.

### Ferramentas de Depuração de Shaders

Diversas ferramentas estão disponíveis para depurar *shaders* Vulkan:

#### RenderDoc

O [RenderDoc](https://renderdoc.org/) é uma das ferramentas mais poderosas para depuração de *shaders*:

1. Inspeção de *Shaders*:
   * Visualize e edite código de *shader* em tempo de execução
   * Inspecione entradas e saídas de *shaders*
   * Analise recursos do *shader* (texturas, *buffers*, etc.)

2. Depuração de *Shaders*:
   * Execute o *shader* passo a passo, linha por linha
   * Inspecione valores de variáveis em cada etapa
   * Visualize o conteúdo dos registradores do *shader*
   * Visualize acessos a texturas e operações de amostragem (*sampling*)

3. Integração com IDEs:
   * Visual Studio: Use o plugin do RenderDoc ou inicie via Debug → Graphics → Start Graphics Debugging
   * VS Code: Use a extensão do RenderDoc
   * CLion / Android Studio: Configure como ferramenta externa

*Exemplo de `launch.json` no VS Code para integração com o RenderDoc:*

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch with RenderDoc",
            "type": "cppvsdbg",
            "request": "launch",
            "program": "path/to/renderdoc.exe",
            "args": ["--capture-file", "${workspaceFolder}/capture.rdc", "${workspaceFolder}/build/your_app.exe"],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": []
        }
    ]
}
```

#### Validação Assistida por GPU (GPU-Assisted Validation)

As *validation layers* do Vulkan incluem a *GPU-Assisted Validation*, que instrumenta o código do *shader* para detectar erros em tempo de execução:

* Habilitação na sua aplicação:

```cpp
#include <array>
#include <cstdint>

// Habilita a GPU-Assisted Validation
constexpr std::array<VkValidationFeatureEnableEXT, 1> enabledFeatures{
    VK_VALIDATION_FEATURE_ENABLE_GPU_ASSISTED_EXT,
};

const VkValidationFeaturesEXT validationFeatures{
    .sType = VK_STRUCTURE_TYPE_VALIDATION_FEATURES_EXT,
    .pNext = nullptr,
    .enabledValidationFeatureCount = static_cast<uint32_t>(enabledFeatures.size()),
    .pEnabledValidationFeatures = enabledFeatures.data(),
    .disabledValidationFeatureCount = 0,
    .pDisabledValidationFeatures = nullptr,
};

// Adiciona às informações de criação da instância
const VkInstanceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
    .pNext = &validationFeatures,
    // ... demais campos ...
};
```

* Integração com IDEs:
  * Adicione o código acima nos seus *builds* de depuração (*Debug*)
  * Configure as variáveis de ambiente na configuração de depuração da sua IDE:

*Exemplo de configuração de variáveis de ambiente no VS Code:*

```json
{
    "environment": [
        {"name": "VK_LAYER_PATH", "value": "path/to/vulkan/sdk/layers"},
        {"name": "VK_INSTANCE_LAYERS", "value": "VK_LAYER_KHRONOS_validation"}
    ]
}
```

#### Shader `printf`

O recurso *Shader printf* permite imprimir valores diretamente de dentro dos seus *shaders*:

* Implementação em GLSL:

```glsl
#version 450
#extension GL_EXT_debug_printf : enable

void main() {
    vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
    debugPrintfEXT("Fragment color: %f, %f, %f, %f", color.r, color.g, color.b, color.a);
    // Restante do código do shader...
}
```

* Implementação em HLSL:

```hlsl
[[vk::ext_capability(5056)]] // SPV_KHR_non_semantic_info
[[vk::ext_extension("SPV_KHR_non_semantic_info")]]
float4 main() : SV_TARGET
{
    float4 color = float4(1.0, 0.0, 0.0, 1.0);
    printf("Fragment color: %f, %f, %f, %f\n", color.r, color.g, color.b, color.a);
    return color;
}
```

* Habilitação na sua aplicação:

```cpp
#include <array>
#include <cstdint>

// Habilita o Shader printf
constexpr std::array<VkValidationFeatureEnableEXT, 1> enabledFeatures{
    VK_VALIDATION_FEATURE_ENABLE_DEBUG_PRINTF_EXT,
};

const VkValidationFeaturesEXT validationFeatures{
    .sType = VK_STRUCTURE_TYPE_VALIDATION_FEATURES_EXT,
    .pNext = nullptr,
    .enabledValidationFeatureCount = static_cast<uint32_t>(enabledFeatures.size()),
    .pEnabledValidationFeatures = enabledFeatures.data(),
    .disabledValidationFeatureCount = 0,
    .pDisabledValidationFeatures = nullptr,
};

// Adiciona às informações de criação da instância
const VkInstanceCreateInfo createInfo{
    .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
    .pNext = &validationFeatures,
    // ... demais campos ...
};
```

* Usando variáveis de ambiente (caminho rápido):
  * Variáveis de ambiente fornecem uma forma mais rápida de habilitar o *shader printf* sem alterar o código
  * Essas variáveis ajudam a evitar problemas comuns de configuração em que o *shader printf* parece não funcionar
  * Principais variáveis de ambiente:
    * `VK_VALIDATION_FEATURES=DEBUG_PRINTF`: Habilita o *shader printf* enquanto desabilita outras validações
    * `VK_VALIDATION_FEATURES=+DEBUG_PRINTF,-CORE_VALIDATION`: Habilita o *shader printf* e desabilita a validação principal (*core validation*)
    * `VK_LAYER_ENABLES`: Controla quais *validation layers* estão habilitadas
    * `VK_DBG_LAYER_LEVEL`: Controla o nível de log das mensagens de validação
    * `VK_LAYER_PRINTF_ONLY_PRESET`: Predefinição (*preset*) que habilita apenas a funcionalidade de *shader printf*, desabilitando os demais recursos de validação
    * `VK_LAYER_PRINTF_TO_STDOUT`: Redireciona a saída do *shader printf* para `stdout` em vez do *callback* de depuração
  * Exemplo de configuração:

```bash
# Habilita o shader printf e desabilita a validação principal
export VK_VALIDATION_FEATURES=+DEBUG_PRINTF,-CORE_VALIDATION
# Define o nível de log de depuração como info
export VK_DBG_LAYER_LEVEL=info

# Alternativa: usa o preset somente printf (abordagem mais simples)
export VK_LAYER_PRINTF_ONLY_PRESET=1

# Opcional: redireciona a saída do printf para stdout em vez do callback de depuração
export VK_LAYER_PRINTF_TO_STDOUT=1
```

* Integração com IDEs:
  * Configure sua IDE para capturar a saída de depuração
  * No Visual Studio: Debug → Windows → Output
  * No VS Code: Adicione `"console": "integratedTerminal"` ao seu `launch.json`
  * Defina as variáveis de ambiente na configuração de depuração da sua IDE

#### Ferramentas Específicas de Fabricantes

Ferramentas específicas de fabricantes oferecem recursos avançados de depuração de *shaders*:

1. NVIDIA Nsight Graphics:
   * Shader Profiler: Analisa o desempenho dos *shaders*
   * Shader Debugger: Executa o *shader* passo a passo
   * Resource Viewer: Inspeciona texturas e *buffers*
   * Integração disponível com o Visual Studio

2. AMD Radeon GPU Analyzer (RGA):
   * Análise estática de *shaders*
   * Visualização de *disassembly*
   * Estatísticas de uso de registradores
   * Sugestões de desempenho

3. Intel Graphics Debugger:
   * Depuração de *shaders*
   * Rastreamento de API (*API tracing*)
   * Inspeção de recursos
   * Análise de desempenho

### Configurações de Depuração de Shaders Específicas por IDE

#### Visual Studio

1. Configure a integração com o RenderDoc:
   * Instale o plugin do RenderDoc para Visual Studio
   * Use Debug → Graphics → Start Graphics Debugging
   * Capture quadros e analise *shaders*

2. Configure as variáveis de ambiente para *shader printf*:
   * Clique com o botão direito no projeto → Properties → Debugging
   * No campo "Environment", adicione:
     * `VK_VALIDATION_FEATURES=+DEBUG_PRINTF,-CORE_VALIDATION`
     * `VK_DBG_LAYER_LEVEL=info`
     * Ou use a abordagem mais simples: `VK_LAYER_PRINTF_ONLY_PRESET=1`
     * Opcionalmente, adicione `VK_LAYER_PRINTF_TO_STDOUT=1` para redirecionar a saída para `stdout`
   * Essas variáveis de ambiente oferecem um caminho rápido para habilitar o *shader printf* sem alterações no código
   * A saída aparecerá na janela Debug → Windows → Output (ou no console, caso use o redirecionamento para `stdout`)

3. Configure a integração com o NVIDIA Nsight:
   * Instale o NVIDIA Nsight Graphics
   * Use Extensions → NVIDIA → Start Graphics Debugging
   * Use o depurador de *shaders* para avançar linha por linha no código do *shader*

4. Configure a integração com a AMD:
   * Instale o AMD Radeon Developer Panel
   * Configure-o como uma ferramenta externa
   * Capture e analise o desempenho de *shaders*

#### Visual Studio Code

1. Configure a integração com o RenderDoc:
   * Instale a extensão do RenderDoc
   * Adicione uma configuração de inicialização para iniciar sua aplicação com o RenderDoc
   * Analise os quadros capturados

2. Configure o ambiente de depuração de *shaders*:
   * Adicione as variáveis de ambiente das *validation layers* ao `launch.json`
   * Configure a captura de saída no terminal para o *shader printf*
   * Use as variáveis de ambiente de caminho rápido para configurar rapidamente o *shader printf*
   * Você pode usar `VK_LAYER_PRINTF_ONLY_PRESET` para uma abordagem mais simples
   * Use `VK_LAYER_PRINTF_TO_STDOUT` para redirecionar a saída para `stdout`

*`launch.json` do VS Code para depuração de shaders com a abordagem padrão:*

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Vulkan Shaders",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/your_app",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [
                {"name": "VK_LAYER_PATH", "value": "path/to/vulkan/sdk/layers"},
                {"name": "VK_INSTANCE_LAYERS", "value": "VK_LAYER_KHRONOS_validation"},
                {"name": "VK_VALIDATION_FEATURES", "value": "+DEBUG_PRINTF,-CORE_VALIDATION"},
                {"name": "VK_DBG_LAYER_LEVEL", "value": "info"}
            ],
            "console": "integratedTerminal"
        }
    ]
}
```

*`launch.json` do VS Code para depuração de shaders com o preset somente printf:*

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Vulkan Shaders (Printf Only)",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/your_app",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [
                {"name": "VK_LAYER_PATH", "value": "path/to/vulkan/sdk/layers"},
                {"name": "VK_LAYER_PRINTF_ONLY_PRESET", "value": "1"},
                {"name": "VK_LAYER_PRINTF_TO_STDOUT", "value": "1"}
            ],
            "console": "integratedTerminal"
        }
    ]
}
```

#### CLion

1. Configure o RenderDoc como ferramenta externa:
   * Acesse File → Settings → Tools → External Tools
   * Adicione o RenderDoc com os argumentos de linha de comando adequados
   * Crie uma configuração de execução que utilize essa ferramenta externa

2. Configure o ambiente de depuração de *shaders*:
   * Acesse Run → Edit Configurations → Selecione sua configuração
   * Clique em "Environment Variables" e adicione:
     * `VK_VALIDATION_FEATURES=+DEBUG_PRINTF,-CORE_VALIDATION`
     * `VK_DBG_LAYER_LEVEL=info`
     * Ou use a abordagem mais simples: `VK_LAYER_PRINTF_ONLY_PRESET=1`
     * Opcionalmente, adicione `VK_LAYER_PRINTF_TO_STDOUT=1` para redirecionar a saída para `stdout`
   * Essas variáveis de ambiente oferecem um caminho rápido para habilitar o *shader printf* sem alterações no código
   * Habilite a captura de saída no console para o *shader printf* selecionando "Allow parallel run"

#### Xcode

1. Configure a depuração de *shaders* no macOS:
   * O MoltenVK possui suporte limitado à depuração de *shaders*
   * Edite seu esquema (*Product → Scheme → Edit Scheme*)
   * Na seção *Run*, vá para Arguments → Environment Variables e adicione:
     * `VK_VALIDATION_FEATURES=+DEBUG_PRINTF,-CORE_VALIDATION`
     * `VK_DBG_LAYER_LEVEL=info`
     * Ou use a abordagem mais simples: `VK_LAYER_PRINTF_ONLY_PRESET=1`
     * Opcionalmente, adicione `VK_LAYER_PRINTF_TO_STDOUT=1` para redirecionar a saída para `stdout`
   * Essas variáveis de ambiente oferecem um caminho rápido para habilitar o *shader printf* sem alterações no código
   * Configure a captura da saída do *shader printf* habilitando "Show Debug Output" na aba *Options*

2. Abordagens alternativas:
   * Use o RenderDoc em outra plataforma para depurar *shaders*
   * Use as ferramentas de depuração de *shaders* do Metal para aplicações com MoltenVK

#### Android Studio

1. Configure o Android GPU Inspector (AGI):
   * Inicie o AGI em Tools → Android → Android GPU Inspector
   * Capture quadros e analise *shaders*
   * Inspecione recursos e desempenho dos *shaders*

2. Configure a depuração de *shaders* para Android:
   * Adicione a configuração das *validation layers* à sua aplicação
   * Para *shader printf*, adicione o seguinte ao seu `AndroidManifest.xml`:

```xml
<application>
    <!-- Abordagem padrão -->
    <meta-data android:name="debug.vulkan.validation_features"
               android:value="+DEBUG_PRINTF,-CORE_VALIDATION" />
    <meta-data android:name="debug.vulkan.debug_layer_level"
               android:value="info" />

    <!-- Alternativa: usa o preset somente printf (abordagem mais simples) -->
    <meta-data android:name="debug.vulkan.layer_printf_only_preset"
               android:value="1" />

    <!-- Opcional: redireciona a saída do printf para stdout -->
    <meta-data android:name="debug.vulkan.layer_printf_to_stdout"
               android:value="1" />
</application>
```

   * Essas entradas de `meta-data` fornecem um caminho rápido para habilitar o *shader printf* sem alterações no código
   * Use o `logcat` para capturar a saída do *shader printf* filtrando pela tag `"Vulkan"`

### Boas Práticas de Depuração de Shaders

1. **Comece com as validation layers**: Habilite as *validation layers* para capturar erros básicos de *shader* antes de recorrer a ferramentas de depuração mais avançadas.

2. **Use shader printf estrategicamente**: Adicione instruções `printf` em pontos-chave do código do *shader* para acompanhar o fluxo de execução e os valores das variáveis.

3. **Simplifique os shaders durante a depuração**: Simplifique temporariamente *shaders* complexos para isolar problemas.

4. **Depure com cenas simples**: Utilize cenas de teste simples que isolem o *shader* que está sendo depurado.

5. **Verifique a compilação dos shaders**: Confirme se os *shaders* compilam corretamente antes de depurar em tempo de execução:
   * Use `glslangValidator` para *shaders* GLSL
   * Use `dxc` com a flag `-Zi` para *shaders* HLSL a fim de incluir informações de depuração

6. **Visualize resultados intermediários**: Envie cálculos intermediários para a saída de cor a fim de depurar visualmente algoritmos complexos.

7. **Compare com implementações de referência**: Implemente o mesmo algoritmo na CPU e compare os resultados.

8. **Use visualizações de depuração (*debug views*)**: Crie modos especiais de visualização que exibam atributos específicos do *shader* (normais, coordenadas UV, etc.).

### Considerações de Depuração: GLSL vs. HLSL

1. Depuração em GLSL:
   * Use a extensão `GL_EXT_debug_printf` para a funcionalidade de `printf`
   * O RenderDoc oferece excelente suporte à depuração de *shaders* GLSL
   * Use `glslangValidator` com a flag `-g` para incluir informações de depuração

2. Depuração em HLSL:
   * Use o DirectX Shader Compiler (DXC) com flags de depuração
   * Adicione a flag `-Zi` para incluir informações de depuração
   * Use a flag `-Od` para desabilitar otimizações e facilitar a depuração
   * O `printf` em HLSL exige extensões especiais, conforme mostrado no exemplo anterior

```bash
# Compila HLSL com informações de depuração
dxc.exe -spirv -T ps_6_0 -E main -Zi -Od shader.hlsl -Fo shader.spv
```

Para mais informações sobre ferramentas de depuração, consulte a seção de Depuração no capítulo de Ferramentas de Desenvolvimento.
