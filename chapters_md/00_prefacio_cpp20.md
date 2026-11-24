# Prefácio e Fundamentos de Vulkan com C++20

Este guia é a edição completa em Português do Brasil do **Khronos Vulkan Guide** oficial (`KhronosGroup/Vulkan-Guide`), com todos os exemplos de código modernizados para **C++20 idiomático**. Ele foi projetado tanto como leitura linear para dominar os conceitos arquiteturais da API Vulkan quanto como obra de consulta rápida para engenharia gráfica em produção.

## Por que Vulkan com C++20?

Embora a especificação Vulkan defina uma ABI em C (`<vulkan/vulkan.h>`), o **C++20** transforma drasticamente a ergonomia, a segurança de tipos e a clareza do código Vulkan sem introduzir qualquer custo em tempo de execução (*zero-overhead abstraction*). Os principais recursos do C++20 adotados ao longo deste guia incluem:

### 1. *Designated Initializers* (Inicializadores Designados)

Uma das maiores dores históricas ao programar em Vulkan com C++11/14/17 era inicializar structs extensas com dezenas de campos. O **C++20** trouxe *designated initializers*, permitindo preencher apenas os campos relevantes mantendo todos os demais zerados automaticamente:

```cpp
#include <vulkan/vulkan.h>

VkBufferCreateInfo bufferInfo{
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .pNext = nullptr, // opcional: campos omitidos são inicializados com zero
    .size = 1024 * 64,
    .usage = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
    .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
};
```

> **Importante:** Em C++20, os campos nos *designated initializers* devem respeitar a **ordem de declaração** da struct na especificação Vulkan. Campos omitidos são inicializados com zero (`0` ou `nullptr`), eliminando a necessidade de `memset` ou `= {}` antes de atribuir campo a campo.

### 2. `std::span<const T>` para Arrays e Contagens

A API Vulkan recebe pares `(count, pData)` em praticamente todas as chamadas. Em C++20, `std::span` elimina ponteiros crus soltos e funciona uniformemente com `std::vector`, `std::array` e arrays estáticos:

```cpp
#include <span>
#include <cstdint>
#include <vulkan/vulkan.h>

void enviarBarreira(VkCommandBuffer cmd, std::span<const VkImageMemoryBarrier2> barriers) {
    VkDependencyInfo depInfo{
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
        .imageMemoryBarrierCount = static_cast<uint32_t>(barriers.size()),
        .pImageMemoryBarriers = barriers.data(),
    };
    vkCmdPipelineBarrier2(cmd, &depInfo);
}
```

### 3. Padrão de Consulta em Duas Chamadas com `std::vector`

Enumerações da API Vulkan (instância, dispositivos físicos, extensões, famílias de filas, imagens do *swapchain*) seguem o idioma de duas chamadas. Em C++20, encapsulamos esse padrão com segurança:

```cpp
#include <vector>
#include <stdexcept>
#include <vulkan/vulkan.h>

[[nodiscard]] std::vector<VkPhysicalDevice> listarDispositivosFisicos(VkInstance instance) {
    uint32_t count = 0;
    if (vkEnumeratePhysicalDevices(instance, &count, nullptr) != VK_SUCCESS || count == 0) {
        return {};
    }
    std::vector<VkPhysicalDevice> devices(count);
    vkEnumeratePhysicalDevices(instance, &count, devices.data());
    return devices;
}
```

### 4. `std::optional`, `std::string_view`, `std::format` e `std::bit_cast`

- **`std::optional<uint32_t>`**: ideal para representar índices de famílias de filas ou tipos de memória que podem não existir em determinado hardware.
- **`std::string_view`**: evita alocações de `std::string` ao comparar nomes de extensões, camadas (*layers*) e *entry points* de shaders.
- **`std::format`**: substitui `printf`/`snprintf` com segurança de tipos em logs de validação e diagnósticos.
- **`std::bit_cast`**: realiza reinterpretação segura de bits em *push constants* e empacotamento de dados sem violar *strict aliasing*.

### 5. Gerenciamento de Recursos (RAII) e `Vulkan-Hpp`

A API C do Vulkan exige destruir cada handle explicitamente na ordem inversa à criação. Em projetos C++20, você pode escolher entre duas abordagens igualmente válidas:

1. **API C (`<vulkan/vulkan.h>`) com wrappers RAII leves em C++20**: usada na maior parte dos exemplos deste guia por corresponder 1:1 à especificação oficial da Khronos e aos tutoriais da comunidade.
2. **Vulkan-Hpp (`<vulkan/vulkan.hpp>` e `<vulkan/vulkan_raii.hpp>`)**: os bindings C++ oficiais da Khronos incluídos no Vulkan SDK, que oferecem enums fortemente tipados (`vk::Format::eR8G8B8A8Srgb`), construtores encadeados, suporte nativo a `vk::ArrayProxy` e handles RAII automáticos (`vk::raii::Device`, `vk::raii::Buffer`, `vk::raii::Image`).

### 6. Configuração Mínima de Projeto com CMake e C++20

```cmake
cmake_minimum_required(VERSION 3.24)
project(MeuProjetoVulkan LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Vulkan REQUIRED)

add_executable(app src/main.cpp)
target_link_libraries(app PRIVATE Vulkan::Vulkan)
```

> **Dica:** Para projetos modernos em Vulkan 1.3 e 1.4, ative *Dynamic Rendering* (`VK_KHR_dynamic_rendering`), *Synchronization2* (`VK_KHR_synchronization2`) e *Buffer Device Address* (`VK_KHR_buffer_device_address`) desde o início — todos fazem parte do núcleo do Vulkan 1.3+ e simplificam enormemente a arquitetura do motor gráfico.
