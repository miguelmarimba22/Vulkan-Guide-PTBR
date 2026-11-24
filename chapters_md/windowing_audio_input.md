# Janelas, Áudio e Entrada

Este capítulo fornece exemplos base (*boilerplate*) para integrar bibliotecas como GLFW, SDL2, SFML e APIs nativas de plataforma para criação de janelas e tratamento de entrada em aplicações Vulkan.

## Visão Geral

Embora o Vulkan em si seja uma API de gráficos e computação, a maioria das aplicações precisa interagir com o sistema operacional para criar janelas, lidar com a entrada do usuário e, potencialmente, processar áudio. Este capítulo cobre as bibliotecas e abordagens mais comuns para essas tarefas ao desenvolver aplicações Vulkan.

## Criação de Janelas

### GLFW

[GLFW](https://www.glfw.org/) é uma biblioteca leve e multiplataforma para criar janelas, contextos e *surfaces*, além de receber entrada e eventos. Ela é particularmente popular no desenvolvimento com Vulkan devido à sua API simples e ao suporte nativo ao Vulkan.

#### Configurando o GLFW com Vulkan

```cpp
#define GLFW_INCLUDE_VULKAN
#include <GLFW/glfw3.h>
#include <iostream>

int main() {
    // Inicializa o GLFW
    if (!glfwInit()) {
        std::cerr << "Falha ao inicializar o GLFW\n";
        return -1;
    }

    // O GLFW foi originalmente projetado para criar um contexto OpenGL,
    // portanto precisamos instruí-lo a não criar um
    glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);

    // Cria uma janela
    GLFWwindow* window = glfwCreateWindow(800, 600, "Janela Vulkan", nullptr, nullptr);
    if (!window) {
        std::cerr << "Falha ao criar a janela GLFW\n";
        glfwTerminate();
        return -1;
    }

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância ...

    // Cria a surface Vulkan
    VkSurfaceKHR surface = VK_NULL_HANDLE;
    VkResult result = glfwCreateWindowSurface(instance, window, nullptr, &surface);
    if (result != VK_SUCCESS) {
        std::cerr << "Falha ao criar a surface da janela\n";
        return -1;
    }

    // Loop principal
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();

        // Renderiza com Vulkan (não exibido)
    }

    // Limpeza
    vkDestroySurfaceKHR(instance, surface, nullptr);
    glfwDestroyWindow(window);
    glfwTerminate();

    return 0;
}
```

#### Tratamento de Entrada no GLFW

O GLFW oferece abordagens baseadas tanto em *polling* quanto em *callbacks* para o tratamento de entrada:

```cpp
// Callback para entrada de teclado
void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods) {
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
        glfwSetWindowShouldClose(window, GLFW_TRUE);
    }
}

// Callback para movimentação do mouse
void cursorPositionCallback(GLFWwindow* window, double xpos, double ypos) {
    // Trata a movimentação do mouse
    std::cout << "Posição do mouse: " << xpos << ", " << ypos << '\n';
}

// Callback para botões do mouse
void mouseButtonCallback(GLFWwindow* window, int button, int action, int mods) {
    if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS) {
        // Trata o clique do botão esquerdo do mouse
        std::cout << "Botão esquerdo do mouse pressionado\n";
    }
}

// Na função main, registre os callbacks:
glfwSetKeyCallback(window, keyCallback);
glfwSetCursorPosCallback(window, cursorPositionCallback);
glfwSetMouseButtonCallback(window, mouseButtonCallback);

// Alternativamente, consulte a entrada por polling no loop principal:
if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) {
    // Mover para frente
}
```

### SDL2

[SDL2](https://www.libsdl.org/) (*Simple DirectMedia Layer*) é uma biblioteca de desenvolvimento multiplataforma projetada para fornecer acesso de baixo nível a áudio, teclado, mouse, joystick e hardware gráfico. Ela é mais abrangente que o GLFW, oferecendo suporte a áudio e mais opções de entrada.

#### Configurando o SDL2 com Vulkan

```cpp
#include <SDL2/SDL.h>
#include <SDL2/SDL_vulkan.h>
#include <vulkan/vulkan.h>
#include <cstdint>
#include <iostream>
#include <vector>

int main() {
    // Inicializa o SDL
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) != 0) {
        std::cerr << "Erro em SDL_Init: " << SDL_GetError() << '\n';
        return -1;
    }

    // Cria a janela com suporte a Vulkan
    SDL_Window* window = SDL_CreateWindow(
        "Janela Vulkan SDL2",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        800, 600,
        SDL_WINDOW_VULKAN | SDL_WINDOW_SHOWN
    );

    if (!window) {
        std::cerr << "Erro em SDL_CreateWindow: " << SDL_GetError() << '\n';
        SDL_Quit();
        return -1;
    }

    // Obtém as extensões Vulkan exigidas pelo SDL
    uint32_t extensionCount = 0;
    if (!SDL_Vulkan_GetInstanceExtensions(window, &extensionCount, nullptr)) {
        std::cerr << "Falha ao obter a contagem de extensões Vulkan\n";
        return -1;
    }

    std::vector<const char*> extensions(extensionCount);
    if (!SDL_Vulkan_GetInstanceExtensions(window, &extensionCount, extensions.data())) {
        std::cerr << "Falha ao obter as extensões Vulkan\n";
        return -1;
    }

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância com as extensões ...

    // Cria a surface Vulkan
    VkSurfaceKHR surface = VK_NULL_HANDLE;
    if (!SDL_Vulkan_CreateSurface(window, instance, &surface)) {
        std::cerr << "Falha ao criar a surface Vulkan\n";
        return -1;
    }

    // Loop principal
    bool running = true;
    SDL_Event event{};
    while (running) {
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                running = false;
            }
        }

        // Renderiza com Vulkan (não exibido)
    }

    // Limpeza
    vkDestroySurfaceKHR(instance, surface, nullptr);
    SDL_DestroyWindow(window);
    SDL_Quit();

    return 0;
}
```

#### Tratamento de Entrada no SDL2

O SDL2 utiliza um sistema baseado em eventos para o tratamento de entrada:

```cpp
// No loop principal
SDL_Event event{};
while (SDL_PollEvent(&event)) {
    switch (event.type) {
        case SDL_QUIT:
            running = false;
            break;
        case SDL_KEYDOWN:
            if (event.key.keysym.sym == SDLK_ESCAPE) {
                running = false;
            }
            if (event.key.keysym.sym == SDLK_w) {
                // Mover para frente
            }
            break;
        case SDL_MOUSEMOTION:
            std::cout << "Posição do mouse: " << event.motion.x << ", " << event.motion.y << '\n';
            break;
        case SDL_MOUSEBUTTONDOWN:
            if (event.button.button == SDL_BUTTON_LEFT) {
                std::cout << "Botão esquerdo do mouse pressionado\n";
            }
            break;
    }
}

// Alternativamente, obtenha o estado do teclado
const Uint8* keyboardState = SDL_GetKeyboardState(nullptr);
if (keyboardState[SDL_SCANCODE_W]) {
    // Mover para frente
}
```

#### Integração de Áudio no SDL2

O SDL2 fornece uma API simples de áudio:

```cpp
#include <cmath>
#include <numbers>

// Função de callback de áudio
void audioCallback(void* userdata, Uint8* stream, int len) {
    // Preenche o buffer de stream com dados de áudio
    // Por exemplo, gera uma onda senoidal
    static double phase = 0.0;
    constexpr double frequency = 440.0; // Nota Lá 4 (A4)
    constexpr double amplitude = 0.25;  // Volume
    constexpr double twoPi = 2.0 * std::numbers::pi;

    for (int i = 0; i < len; ++i) {
        stream[i] = static_cast<Uint8>(std::sin(phase) * amplitude * 127.0 + 128.0);
        phase += twoPi * frequency / 44100.0;
        if (phase > twoPi) {
            phase -= twoPi;
        }
    }
}

// Configura o áudio
SDL_AudioSpec want{
    .freq = 44100,
    .format = AUDIO_U8,
    .channels = 1,
    .samples = 4096,
    .callback = audioCallback,
};
SDL_AudioSpec have{};

SDL_AudioDeviceID audioDevice = SDL_OpenAudioDevice(nullptr, 0, &want, &have, 0);
if (audioDevice == 0) {
    std::cerr << "Falha ao abrir o dispositivo de áudio: " << SDL_GetError() << '\n';
    return -1;
}

// Inicia a reprodução de áudio
SDL_PauseAudioDevice(audioDevice, 0);

// Mais tarde, ao finalizar:
SDL_CloseAudioDevice(audioDevice);
```

### SFML

[SFML](https://www.sfml-dev.org/) (*Simple and Fast Multimedia Library*) é uma biblioteca C++ multiplataforma projetada para fornecer uma interface simples para diversos componentes multimídia, como entrada, áudio e gráficos. Em comparação com o GLFW, o SFML oferece um conjunto mais amplo de recursos e suporta mais plataformas, como dispositivos móveis.

#### Configurando o SFML com Vulkan

```cpp
#include <SFML/Window.hpp>
#include <vulkan/vulkan.h>
#include <iostream>
#include <optional>
#include <vector>

int main() {
    // Cria a janela SFML
    sf::WindowBase window{sf::VideoMode({800, 600}), "Janela Vulkan SFML", sf::Style::Default};

    // Obtém as extensões Vulkan exigidas pelo SFML
    std::vector<const char*> extensions = sf::Vulkan::getGraphicsRequiredInstanceExtensions();

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância com as extensões ...

    // Cria a surface Vulkan
    VkSurfaceKHR surface = VK_NULL_HANDLE;
    if (!window.createVulkanSurface(instance, surface)) {
        std::cerr << "Falha ao criar a surface Vulkan\n";
        return -1;
    }

    // Loop principal
    while (window.isOpen()) {
        while (const std::optional event = window.pollEvent()) {
            if (event->is<sf::Event::Closed>()) {
                window.close();
            }
        }

        // Renderiza com Vulkan (não exibido)
    }

    vkDestroySurfaceKHR(instance, surface, nullptr);
    // Nenhuma limpeza explícita do SFML é necessária

    return 0;
}
```

#### Tratamento de Entrada no SFML

```cpp
// No loop principal
while (window.isOpen()) {
    while (const std::optional event = window.pollEvent()) {
        if (event->is<sf::Event::Closed>()) {
            window.close();
        }
        if (const auto* keyPressed = event->getIf<sf::Event::KeyPressed>()) {
            if (keyPressed->code == sf::Keyboard::Key::W) {
                // Mover para frente
            }
        }
        if (const auto* mousePressed = event->getIf<sf::Event::MouseButtonPressed>()) {
            if (mousePressed->button == sf::Mouse::Button::Left) {
                // Selecionar objeto
            }
        }
    }
}

// Alternativamente, consulte o estado da tecla por polling
if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::W)) {
    // Mover para frente
}
```

#### Integração de Áudio no SFML

O SFML oferece uma API simples de áudio e música:

```cpp
// Carrega um buffer de som a partir de um arquivo wav
const sf::SoundBuffer buffer("soundfile.wav");
// Cria uma instância de som a partir do buffer
sf::Sound sound(buffer);
// Reproduz o som
sound.play();
```

```cpp
// Carrega uma faixa de música
sf::Music music("soundtrack.ogg");
// Reproduz a música
music.play();
```

### APIs Nativas de Plataforma

Para aplicações que exigem controle mais direto ou recursos específicos de plataforma, você pode utilizar APIs nativas para criação de janelas e tratamento de entrada.

#### Windows (Win32)

```cpp
#define VK_USE_PLATFORM_WIN32_KHR
#include <vulkan/vulkan.h>
#include <windows.h>
#include <iostream>

// Procedimento de janela (Window Procedure)
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_CLOSE:
            PostQuitMessage(0);
            return 0;
        case WM_KEYDOWN:
            if (wParam == VK_ESCAPE) {
                PostQuitMessage(0);
            }
            return 0;
        case WM_LBUTTONDOWN:
            std::cout << "Botão esquerdo do mouse pressionado\n";
            return 0;
        case WM_MOUSEMOVE:
            std::cout << "Posição do mouse: " << LOWORD(lParam) << ", " << HIWORD(lParam) << '\n';
            return 0;
        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR pCmdLine, int nCmdShow) {
    // Registra a classe da janela
    WNDCLASSEX wc{
        .cbSize = sizeof(WNDCLASSEX),
        .style = CS_HREDRAW | CS_VREDRAW,
        .lpfnWndProc = WindowProc,
        .hInstance = hInstance,
        .hCursor = LoadCursor(nullptr, IDC_ARROW),
        .lpszClassName = "VulkanWindowClass",
    };
    RegisterClassEx(&wc);

    // Cria a janela
    HWND hwnd = CreateWindowEx(
        0,
        "VulkanWindowClass",
        "Janela Vulkan Win32",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        800, 600,
        nullptr,
        nullptr,
        hInstance,
        nullptr
    );

    if (!hwnd) {
        std::cerr << "Falha ao criar a janela\n";
        return -1;
    }

    ShowWindow(hwnd, nCmdShow);

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância ...

    // Cria a surface Vulkan
    VkWin32SurfaceCreateInfoKHR createInfo{
        .sType = VK_STRUCTURE_TYPE_WIN32_SURFACE_CREATE_INFO_KHR,
        .pNext = nullptr,
        .hinstance = hInstance,
        .hwnd = hwnd,
    };

    VkSurfaceKHR surface = VK_NULL_HANDLE;
    VkResult result = vkCreateWin32SurfaceKHR(instance, &createInfo, nullptr, &surface);
    if (result != VK_SUCCESS) {
        std::cerr << "Falha ao criar a surface da janela\n";
        return -1;
    }

    // Loop principal
    MSG msg{};
    bool running = true;
    while (running) {
        while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) {
                running = false;
            }
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }

        // Renderiza com Vulkan (não exibido)
    }

    // Limpeza
    vkDestroySurfaceKHR(instance, surface, nullptr);
    DestroyWindow(hwnd);

    return 0;
}
```

#### Linux (XCB)

```cpp
#define VK_USE_PLATFORM_XCB_KHR
#include <vulkan/vulkan.h>
#include <xcb/xcb.h>
#include <array>
#include <cstdlib>
#include <iostream>
#include <string_view>

int main() {
    // Conecta ao servidor X
    xcb_connection_t* connection = xcb_connect(nullptr, nullptr);
    if (xcb_connection_has_error(connection)) {
        std::cerr << "Falha ao conectar ao servidor X\n";
        return -1;
    }

    // Obtém a tela
    const xcb_setup_t* setup = xcb_get_setup(connection);
    xcb_screen_iterator_t iter = xcb_setup_roots_iterator(setup);
    xcb_screen_t* screen = iter.data;

    // Cria a janela
    xcb_window_t window = xcb_generate_id(connection);
    uint32_t valueMask = XCB_CW_BACK_PIXEL | XCB_CW_EVENT_MASK;
    std::array<uint32_t, 2> valueList = {
        screen->black_pixel,
        XCB_EVENT_MASK_KEY_PRESS | XCB_EVENT_MASK_BUTTON_PRESS | XCB_EVENT_MASK_POINTER_MOTION | XCB_EVENT_MASK_STRUCTURE_NOTIFY
    };

    xcb_create_window(
        connection,
        XCB_COPY_FROM_PARENT,
        window,
        screen->root,
        0, 0,
        800, 600,
        0,
        XCB_WINDOW_CLASS_INPUT_OUTPUT,
        screen->root_visual,
        valueMask,
        valueList.data()
    );

    // Define o título da janela
    constexpr std::string_view title = "Janela Vulkan";
    xcb_change_property(
        connection,
        XCB_PROP_MODE_REPLACE,
        window,
        XCB_ATOM_WM_NAME,
        XCB_ATOM_STRING,
        8,
        static_cast<uint32_t>(title.size()),
        title.data()
    );

    // Mapeia a janela
    xcb_map_window(connection, window);
    xcb_flush(connection);

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância ...

    // Cria a surface Vulkan
    VkXcbSurfaceCreateInfoKHR createInfo{
        .sType = VK_STRUCTURE_TYPE_XCB_SURFACE_CREATE_INFO_KHR,
        .pNext = nullptr,
        .connection = connection,
        .window = window,
    };

    VkSurfaceKHR surface = VK_NULL_HANDLE;
    VkResult result = vkCreateXcbSurfaceKHR(instance, &createInfo, nullptr, &surface);
    if (result != VK_SUCCESS) {
        std::cerr << "Falha ao criar a surface da janela\n";
        return -1;
    }

    // Loop principal
    bool running = true;
    while (running) {
        xcb_generic_event_t* event = nullptr;
        while ((event = xcb_poll_for_event(connection))) {
            switch (event->response_type & 0x7f) {
                case XCB_CLIENT_MESSAGE:
                    running = false;
                    break;
                case XCB_KEY_PRESS: {
                    auto* keyEvent = reinterpret_cast<xcb_key_press_event_t*>(event);
                    // Trata pressionamento de tecla
                    break;
                }
                case XCB_BUTTON_PRESS: {
                    auto* buttonEvent = reinterpret_cast<xcb_button_press_event_t*>(event);
                    // Trata pressionamento de botão do mouse
                    break;
                }
                case XCB_MOTION_NOTIFY: {
                    auto* motionEvent = reinterpret_cast<xcb_motion_notify_event_t*>(event);
                    // Trata movimentação do mouse
                    break;
                }
            }
            std::free(event);
        }

        // Renderiza com Vulkan (não exibido)
    }

    // Limpeza
    vkDestroySurfaceKHR(instance, surface, nullptr);
    xcb_destroy_window(connection, window);
    xcb_disconnect(connection);

    return 0;
}
```

#### Linux (Wayland)

[Wayland](https://wayland.freedesktop.org/) é um protocolo moderno de servidor de exibição para Linux que visa substituir o X Window System. Ele oferece uma arquitetura mais simples, eficiente e segura para aplicações gráficas.

```cpp
#define VK_USE_PLATFORM_WAYLAND_KHR
#include <vulkan/vulkan.h>
#include <wayland-client.h>
#include <iostream>
#include <string_view>

// Listeners do protocolo Wayland
struct WaylandData {
    wl_display* display = nullptr;
    wl_registry* registry = nullptr;
    wl_compositor* compositor = nullptr;
    wl_shell* shell = nullptr;
    wl_surface* surface = nullptr;
    wl_shell_surface* shellSurface = nullptr;
    bool running = false;
};

// Callbacks do listener de registry
static void registry_global(void* data, wl_registry* registry, uint32_t id, const char* interface, uint32_t version) {
    auto* waylandData = static_cast<WaylandData*>(data);
    std::string_view iface{interface};

    if (iface == "wl_compositor") {
        waylandData->compositor = static_cast<wl_compositor*>(
            wl_registry_bind(registry, id, &wl_compositor_interface, 1)
        );
    } else if (iface == "wl_shell") {
        waylandData->shell = static_cast<wl_shell*>(
            wl_registry_bind(registry, id, &wl_shell_interface, 1)
        );
    }
}

static void registry_global_remove(void* data, wl_registry* registry, uint32_t name) {
    // Trata objeto global removido
}

static constexpr wl_registry_listener registry_listener{
    .global = registry_global,
    .global_remove = registry_global_remove,
};

// Callbacks do listener de shell surface
static void shell_surface_ping(void* data, wl_shell_surface* shell_surface, uint32_t serial) {
    wl_shell_surface_pong(shell_surface, serial);
}

static void shell_surface_configure(void* data, wl_shell_surface* shell_surface, uint32_t edges, int32_t width, int32_t height) {
    // Trata redimensionamento
}

static void shell_surface_popup_done(void* data, wl_shell_surface* shell_surface) {
    // Trata encerramento de popup
}

static constexpr wl_shell_surface_listener shell_surface_listener{
    .ping = shell_surface_ping,
    .configure = shell_surface_configure,
    .popup_done = shell_surface_popup_done,
};

int main() {
    WaylandData waylandData{};

    // Conecta ao display Wayland
    waylandData.display = wl_display_connect(nullptr);
    if (!waylandData.display) {
        std::cerr << "Falha ao conectar ao display Wayland\n";
        return -1;
    }

    // Obtém o registry
    waylandData.registry = wl_display_get_registry(waylandData.display);
    wl_registry_add_listener(waylandData.registry, &registry_listener, &waylandData);

    // Aguarda os eventos do registry
    wl_display_roundtrip(waylandData.display);

    // Verifica se os globais necessários foram obtidos
    if (!waylandData.compositor || !waylandData.shell) {
        std::cerr << "Falha ao obter o compositor ou o shell do Wayland\n";
        return -1;
    }

    // Cria a surface
    waylandData.surface = wl_compositor_create_surface(waylandData.compositor);
    if (!waylandData.surface) {
        std::cerr << "Falha ao criar a surface Wayland\n";
        return -1;
    }

    // Cria a shell surface
    waylandData.shellSurface = wl_shell_get_shell_surface(waylandData.shell, waylandData.surface);
    if (!waylandData.shellSurface) {
        std::cerr << "Falha ao criar a shell surface Wayland\n";
        return -1;
    }

    // Configura a shell surface
    wl_shell_surface_add_listener(waylandData.shellSurface, &shell_surface_listener, &waylandData);
    wl_shell_surface_set_toplevel(waylandData.shellSurface);
    wl_shell_surface_set_title(waylandData.shellSurface, "Janela Vulkan Wayland");

    // Cria a instância Vulkan (não exibido)
    VkInstance instance = VK_NULL_HANDLE;
    // ... cria a instância com a extensão VK_KHR_wayland_surface ...

    // Cria a surface Vulkan
    VkWaylandSurfaceCreateInfoKHR createInfo{
        .sType = VK_STRUCTURE_TYPE_WAYLAND_SURFACE_CREATE_INFO_KHR,
        .pNext = nullptr,
        .display = waylandData.display,
        .surface = waylandData.surface,
    };

    VkSurfaceKHR surface = VK_NULL_HANDLE;
    VkResult result = vkCreateWaylandSurfaceKHR(instance, &createInfo, nullptr, &surface);
    if (result != VK_SUCCESS) {
        std::cerr << "Falha ao criar a surface Wayland para Vulkan\n";
        return -1;
    }

    // Loop principal
    waylandData.running = true;
    while (waylandData.running) {
        // Processa eventos Wayland
        wl_display_dispatch_pending(waylandData.display);

        // Renderiza com Vulkan (não exibido)

        // Envia os comandos Wayland pendentes
        wl_display_flush(waylandData.display);
    }

    // Limpeza
    vkDestroySurfaceKHR(instance, surface, nullptr);

    if (waylandData.shellSurface) {
        wl_shell_surface_destroy(waylandData.shellSurface);
    }

    if (waylandData.surface) {
        wl_surface_destroy(waylandData.surface);
    }

    if (waylandData.shell) {
        wl_shell_destroy(waylandData.shell);
    }

    if (waylandData.compositor) {
        wl_compositor_destroy(waylandData.compositor);
    }

    if (waylandData.registry) {
        wl_registry_destroy(waylandData.registry);
    }

    if (waylandData.display) {
        wl_display_disconnect(waylandData.display);
    }

    return 0;
}
```

#### macOS (Cocoa)

[Cocoa](https://developer.apple.com/documentation/appkit) é a API nativa orientada a objetos da Apple para desenvolvimento de aplicações macOS. Para aplicações Vulkan no macOS, normalmente utiliza-se o MoltenVK, que traduz chamadas Vulkan para Metal.

```cpp
#define VK_USE_PLATFORM_MACOS_MVK
#include <vulkan/vulkan.h>
#include <Cocoa/Cocoa.h>
#include <iostream>

// Delegate da aplicação Cocoa
@interface VulkanAppDelegate : NSObject <NSApplicationDelegate>
@end

@implementation VulkanAppDelegate
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}
@end

// Delegate da janela Cocoa
@interface VulkanWindowDelegate : NSObject <NSWindowDelegate>
@end

@implementation VulkanWindowDelegate
- (void)windowWillClose:(NSNotification *)notification {
    [NSApp terminate:nil];
}
@end

// View Cocoa para renderização
@interface VulkanView : NSView
@end

@implementation VulkanView
- (BOOL)acceptsFirstResponder {
    return YES;
}

- (void)keyDown:(NSEvent *)event {
    if ([[event characters] isEqualToString:@"\033"]) { // Tecla Escape
        [NSApp terminate:nil];
    }
}

- (void)mouseDown:(NSEvent *)event {
    NSPoint point = [self convertPoint:[event locationInWindow] fromView:nil];
    std::cout << "Clique do mouse em: " << point.x << ", " << point.y << '\n';
}

- (void)mouseMoved:(NSEvent *)event {
    NSPoint point = [self convertPoint:[event locationInWindow] fromView:nil];
    std::cout << "Mouse movido para: " << point.x << ", " << point.y << '\n';
}
@end

int main(int argc, const char* argv[]) {
    @autoreleasepool {
        // Cria a aplicação
        [NSApplication sharedApplication];
        [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];

        // Cria o delegate da aplicação
        VulkanAppDelegate *appDelegate = [[VulkanAppDelegate alloc] init];
        [NSApp setDelegate:appDelegate];

        // Cria a janela
        NSRect frame = NSMakeRect(0, 0, 800, 600);
        NSWindow *window = [[NSWindow alloc] initWithContentRect:frame
                                                       styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskResizable
                                                         backing:NSBackingStoreBuffered
                                                           defer:NO];
        [window setTitle:@"Janela Vulkan macOS"];
        [window center];

        // Cria o delegate da janela
        VulkanWindowDelegate *windowDelegate = [[VulkanWindowDelegate alloc] init];
        [window setDelegate:windowDelegate];

        // Cria a view
        VulkanView *view = [[VulkanView alloc] initWithFrame:frame];
        [window setContentView:view];
        [window makeFirstResponder:view];

        // Exibe a janela
        [window makeKeyAndOrderFront:nil];
        [NSApp activateIgnoringOtherApps:YES];

        // Cria a instância Vulkan (não exibido)
        VkInstance instance = VK_NULL_HANDLE;
        // ... cria a instância com a extensão VK_MVK_macos_surface ...

        // Cria a surface Vulkan
        VkMacOSSurfaceCreateInfoMVK createInfo{
            .sType = VK_STRUCTURE_TYPE_MACOS_SURFACE_CREATE_INFO_MVK,
            .pNext = nullptr,
            .pView = (__bridge void*)view,
        };

        VkSurfaceKHR surface = VK_NULL_HANDLE;
        VkResult result = vkCreateMacOSSurfaceMVK(instance, &createInfo, nullptr, &surface);
        if (result != VK_SUCCESS) {
            std::cerr << "Falha ao criar a surface macOS para Vulkan\n";
            return -1;
        }

        // Inicia o loop de eventos da aplicação
        [NSApp run];

        // Limpeza (normalmente este código não é alcançado pois o app é encerrado pelo Cocoa)
        vkDestroySurfaceKHR(instance, surface, nullptr);
    }

    return 0;
}
```

#### iOS (UIKit)

[UIKit](https://developer.apple.com/documentation/uikit) é o framework da Apple para construir interfaces de usuário em aplicações iOS. De forma semelhante ao macOS, aplicações Vulkan no iOS geralmente utilizam o MoltenVK.

```cpp
#define VK_USE_PLATFORM_IOS_MVK
#include <vulkan/vulkan.h>
#include <UIKit/UIKit.h>
#include <iostream>

// Subclasse de UIView para renderização Vulkan
@interface VulkanView : UIView
@end

@implementation VulkanView
+ (Class)layerClass {
    return [CAMetalLayer class];
}
@end

// UIViewController para a view Vulkan
@interface VulkanViewController : UIViewController
@property (nonatomic, strong) VulkanView *vulkanView;
@property (nonatomic, assign) VkInstance instance;
@property (nonatomic, assign) VkSurfaceKHR surface;
@end

@implementation VulkanViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // Cria a view Vulkan
    self.vulkanView = [[VulkanView alloc] initWithFrame:self.view.bounds];
    self.vulkanView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self.view addSubview:self.vulkanView];

    // Cria a instância Vulkan (não exibido)
    // ... cria a instância com a extensão VK_MVK_ios_surface ...

    // Cria a surface Vulkan
    VkIOSSurfaceCreateInfoMVK createInfo{
        .sType = VK_STRUCTURE_TYPE_IOS_SURFACE_CREATE_INFO_MVK,
        .pNext = nullptr,
        .pView = (__bridge void*)self.vulkanView,
    };

    VkResult result = vkCreateIOSSurfaceMVK(self.instance, &createInfo, nullptr, &self.surface);
    if (result != VK_SUCCESS) {
        NSLog(@"Falha ao criar a surface iOS para Vulkan");
    }
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    CGPoint point = [touch locationInView:self.vulkanView];
    NSLog(@"Toque iniciado em: %f, %f", point.x, point.y);
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    CGPoint point = [touch locationInView:self.vulkanView];
    NSLog(@"Toque movido para: %f, %f", point.x, point.y);
}

- (void)dealloc {
    if (self.surface != VK_NULL_HANDLE) {
        vkDestroySurfaceKHR(self.instance, self.surface, nullptr);
    }
}
@end

// AppDelegate
@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property (strong, nonatomic) UIWindow *window;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.rootViewController = [[VulkanViewController alloc] init];
    [self.window makeKeyAndVisible];
    return YES;
}

@end

int main(int argc, char* argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
```

#### Android

[Android](https://developer.android.com/) é o sistema operacional móvel do Google. O Vulkan é suportado nativamente no Android 7.0 (nível de API 24) e superiores.

```cpp
#define VK_USE_PLATFORM_ANDROID_KHR
#include <vulkan/vulkan.h>
#include <android/native_window.h>
#include <android_native_app_glue.h>
#include <android/log.h>

#define LOGI(...) ((void)__android_log_print(ANDROID_LOG_INFO, "VulkanApp", __VA_ARGS__))
#define LOGW(...) ((void)__android_log_print(ANDROID_LOG_WARN, "VulkanApp", __VA_ARGS__))
#define LOGE(...) ((void)__android_log_print(ANDROID_LOG_ERROR, "VulkanApp", __VA_ARGS__))

// Estado global da aplicação
struct AppState {
    ANativeWindow* window = nullptr;
    VkInstance instance = VK_NULL_HANDLE;
    VkSurfaceKHR surface = VK_NULL_HANDLE;
    bool running = false;
};

// Processa eventos de entrada do Android
static int32_t handleInput(android_app* app, AInputEvent* event) {
    auto* appState = static_cast<AppState*>(app->userData);

    if (AInputEvent_getType(event) == AINPUT_EVENT_TYPE_MOTION) {
        float x = AMotionEvent_getX(event, 0);
        float y = AMotionEvent_getY(event, 0);

        switch (AMotionEvent_getAction(event) & AMOTION_EVENT_ACTION_MASK) {
            case AMOTION_EVENT_ACTION_DOWN:
                LOGI("Toque pressionado em: %f, %f", x, y);
                return 1;
            case AMOTION_EVENT_ACTION_MOVE:
                LOGI("Toque movido para: %f, %f", x, y);
                return 1;
            case AMOTION_EVENT_ACTION_UP:
                LOGI("Toque liberado em: %f, %f", x, y);
                return 1;
        }
    } else if (AInputEvent_getType(event) == AINPUT_EVENT_TYPE_KEY) {
        int32_t keyCode = AKeyEvent_getKeyCode(event);
        if (keyCode == AKEYCODE_BACK) {
            appState->running = false;
            return 1;
        }
    }

    return 0;
}

// Processa comandos da aplicação Android
static void handleCmd(android_app* app, int32_t cmd) {
    auto* appState = static_cast<AppState*>(app->userData);

    switch (cmd) {
        case APP_CMD_INIT_WINDOW:
            if (app->window != nullptr) {
                appState->window = app->window;

                // Cria a instância Vulkan (não exibido)
                // ... cria a instância com a extensão VK_KHR_android_surface ...

                // Cria a surface Vulkan
                VkAndroidSurfaceCreateInfoKHR createInfo{
                    .sType = VK_STRUCTURE_TYPE_ANDROID_SURFACE_CREATE_INFO_KHR,
                    .pNext = nullptr,
                    .window = appState->window,
                };

                VkResult result = vkCreateAndroidSurfaceKHR(appState->instance, &createInfo, nullptr, &appState->surface);
                if (result != VK_SUCCESS) {
                    LOGE("Falha ao criar a surface Android para Vulkan");
                }
            }
            break;
        case APP_CMD_TERM_WINDOW:
            // Limpa a surface quando a janela é fechada
            if (appState->surface != VK_NULL_HANDLE) {
                vkDestroySurfaceKHR(appState->instance, appState->surface, nullptr);
                appState->surface = VK_NULL_HANDLE;
            }
            appState->window = nullptr;
            break;
        case APP_CMD_GAINED_FOCUS:
            // O aplicativo ganhou foco; inicia a renderização
            break;
        case APP_CMD_LOST_FOCUS:
            // O aplicativo perdeu foco; pausa a renderização
            break;
    }
}

// Ponto de entrada principal para aplicações Android
void android_main(android_app* app) {
    AppState appState{.running = true};

    app->userData = &appState;
    app->onAppCmd = handleCmd;
    app->onInputEvent = handleInput;

    // Loop principal
    while (app->destroyRequested == 0 && appState.running) {
        // Processa eventos
        int events = 0;
        android_poll_source* source = nullptr;

        while (ALooper_pollAll(0, nullptr, &events, reinterpret_cast<void**>(&source)) >= 0) {
            if (source != nullptr) {
                source->process(app, source);
            }
        }

        // Renderiza com Vulkan (não exibido)
    }

    // Limpeza
    if (appState.surface != VK_NULL_HANDLE) {
        vkDestroySurfaceKHR(appState.instance, appState.surface, nullptr);
    }
}
```

## Integração de Áudio

Embora o Vulkan em si não forneça recursos de áudio, diversas bibliotecas podem ser usadas em conjunto com o Vulkan para processamento de áudio.

### OpenAL

[OpenAL](https://www.openal.org/) é uma API multiplataforma de áudio 3D projetada para renderização eficiente de áudio posicional tridimensional multicanal.

```cpp
#include <AL/al.h>
#include <AL/alc.h>
#include <iostream>
#include <span>

bool initOpenAL() {
    // Abre o dispositivo padrão
    ALCdevice* device = alcOpenDevice(nullptr);
    if (!device) {
        std::cerr << "Falha ao abrir o dispositivo OpenAL\n";
        return false;
    }

    // Cria o contexto
    ALCcontext* context = alcCreateContext(device, nullptr);
    if (!context) {
        std::cerr << "Falha ao criar o contexto OpenAL\n";
        alcCloseDevice(device);
        return false;
    }

    // Define o contexto como atual
    if (!alcMakeContextCurrent(context)) {
        std::cerr << "Falha ao tornar o contexto OpenAL atual\n";
        alcDestroyContext(context);
        alcCloseDevice(device);
        return false;
    }

    return true;
}

void cleanupOpenAL() {
    ALCcontext* context = alcGetCurrentContext();
    ALCdevice* device = alcGetContextsDevice(context);

    alcMakeContextCurrent(nullptr);
    alcDestroyContext(context);
    alcCloseDevice(device);
}

// Exemplo de reprodução de um som
void playSound(std::span<const ALubyte> audioData, ALsizei frequency) {
    // Gera o buffer
    ALuint buffer = 0;
    alGenBuffers(1, &buffer);

    // Preenche o buffer com os dados de áudio
    alBufferData(buffer, AL_FORMAT_MONO8, audioData.data(), static_cast<ALsizei>(audioData.size()), frequency);

    // Gera a fonte (source)
    ALuint source = 0;
    alGenSources(1, &source);

    // Anexa o buffer à fonte
    alSourcei(source, AL_BUFFER, static_cast<ALint>(buffer));

    // Reproduz a fonte
    alSourcePlay(source);

    // Aguarda o som terminar (em uma aplicação real, isso seria tratado de outra forma)
    ALint state = 0;
    do {
        alGetSourcei(source, AL_SOURCE_STATE, &state);
    } while (state == AL_PLAYING);

    // Limpeza
    alDeleteSources(1, &source);
    alDeleteBuffers(1, &buffer);
}
```

### FMOD

[FMOD](https://www.fmod.com/) é um motor proprietário de efeitos sonoros utilizado em muitos jogos e aplicações.

```cpp
#include <fmod.hpp>
#include <fmod_errors.h>
#include <cstdlib>
#include <iostream>

void errCheck(FMOD_RESULT result) {
    if (result != FMOD_OK) {
        std::cerr << "Erro FMOD: " << FMOD_ErrorString(result) << '\n';
        std::exit(EXIT_FAILURE);
    }
}

int main() {
    FMOD::System* system = nullptr;
    FMOD::Sound* sound = nullptr;
    FMOD::Channel* channel = nullptr;

    // Cria o sistema FMOD
    errCheck(FMOD::System_Create(&system));

    // Inicializa o FMOD
    errCheck(system->init(32, FMOD_INIT_NORMAL, nullptr));

    // Carrega o som
    errCheck(system->createSound("sound.wav", FMOD_DEFAULT, nullptr, &sound));

    // Reproduz o som
    errCheck(system->playSound(sound, nullptr, false, &channel));

    // Loop principal
    bool running = true;
    while (running) {
        // Atualiza o FMOD
        errCheck(system->update());

        // Verifica se o som ainda está tocando
        bool isPlaying = false;
        if (channel) {
            channel->isPlaying(&isPlaying);
            if (!isPlaying) {
                running = false;
            }
        }

        // Seu código de renderização Vulkan aqui
    }

    // Limpeza
    errCheck(sound->release());
    errCheck(system->close());
    errCheck(system->release());

    return 0;
}
```

### Integração de Áudio em Dispositivos Móveis

Plataformas móveis possuem suas próprias APIs de áudio otimizadas para dispositivos móveis. Essas APIs oferecem recursos projetados especificamente para ambientes móveis, como tratamento de mudanças de foco de áudio, gerenciamento de consumo de bateria e tratamento de interrupções.

#### Áudio no Android

O Android fornece AAudio e OpenSL ES (obsoleto) para áudio de alto desempenho em aplicações como jogos. Com o objetivo de recomendar uma única biblioteca que funcione em 99% dos dispositivos, recomendamos a biblioteca Oboe para o desenvolvimento de áudio no Android.

##### Oboe

[Oboe](https://github.com/google/oboe) é uma biblioteca C++ desenvolvida pelo Google que fornece uma API de áudio de alto desempenho e baixa latência para Android. É a biblioteca recomendada para áudio em aplicações Android, especialmente para jogos e outras aplicações que exigem áudio em tempo real.

A Oboe oferece uma API unificada que seleciona automaticamente o melhor *backend* de áudio disponível:

- No Android 8.0 (API 26) e superiores, utiliza AAudio
- Em versões mais antigas do Android, faz *fallback* para OpenSL ES

Essa abordagem oferece os benefícios do AAudio em dispositivos mais recentes, mantendo a compatibilidade com dispositivos mais antigos.

```cpp
#include <oboe/Oboe.h>
#include <android/log.h>
#include <cmath>
#include <memory>
#include <numbers>

#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "OboeAudioEngine", __VA_ARGS__)

class OboeAudioEngine : public oboe::AudioStreamCallback {
public:
    OboeAudioEngine() = default;
    ~OboeAudioEngine() override { closeStream(); }

    bool setupAudioStream() {
        // Cria um construtor de stream de áudio
        oboe::AudioStreamBuilder builder;

        // Configura o construtor
        builder.setDirection(oboe::Direction::Output)
               ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
               ->setSharingMode(oboe::SharingMode::Exclusive)
               ->setFormat(oboe::AudioFormat::Float)
               ->setChannelCount(oboe::ChannelCount::Stereo)
               ->setCallback(this);

        // Abre o stream
        oboe::Result result = builder.openStream(stream_);
        if (result != oboe::Result::OK) {
            LOGE("Falha ao criar o stream de áudio. Erro: %s", oboe::convertToText(result));
            return false;
        }

        // Obtém a taxa de amostragem do stream (caso a taxa solicitada não esteja disponível)
        sampleRate_ = stream_->getSampleRate();

        return true;
    }

    bool startStream() {
        if (!stream_) {
            return false;
        }

        oboe::Result result = stream_->requestStart();
        if (result != oboe::Result::OK) {
            LOGE("Falha ao iniciar o stream de áudio. Erro: %s", oboe::convertToText(result));
            return false;
        }

        return true;
    }

    void stopStream() {
        if (stream_) {
            stream_->requestStop();
        }
    }

    void closeStream() {
        if (stream_) {
            stream_->close();
            stream_.reset();
        }
    }

    // Implementação de AudioStreamCallback
    oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream* stream,
            void* audioData,
            int32_t numFrames) override {

        auto* buffer = static_cast<float*>(audioData);
        constexpr float twoPi = 2.0f * std::numbers::pi_v<float>;

        // Gera dados de áudio (exemplo simples de onda senoidal)
        for (int32_t i = 0; i < numFrames * 2; i += 2) {
            float sample = 0.5f * std::sin(phase_);

            // Escreve nos canais estéreo
            buffer[i] = sample;       // Canal esquerdo
            buffer[i + 1] = sample;   // Canal direito

            // Atualiza a fase
            phase_ += twoPi * 440.0f / static_cast<float>(sampleRate_); // Tom de 440 Hz
            if (phase_ >= twoPi) {
                phase_ -= twoPi;
            }
        }

        return oboe::DataCallbackResult::Continue;
    }

    // Callback de erro
    void onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) override {
        LOGE("Erro Oboe antes do fechamento: %s", oboe::convertToText(error));
    }

    void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override {
        LOGE("Erro Oboe após o fechamento: %s", oboe::convertToText(error));

        // Reabre o stream caso tenha sido desconectado (por exemplo, ao desconectar fones de ouvido)
        if (error == oboe::Result::ErrorDisconnected) {
            closeStream();
            setupAudioStream();
            startStream();
        }
    }

private:
    std::shared_ptr<oboe::AudioStream> stream_;
    float phase_ = 0.0f;
    int32_t sampleRate_ = 0;
};

// Uso na sua aplicação Android:
// OboeAudioEngine audioEngine;
// audioEngine.setupAudioStream();
// audioEngine.startStream();
//
// // Ao finalizar:
// audioEngine.stopStream();
// audioEngine.closeStream();
```

##### Foco de Áudio no Android (*Android Audio Focus*)

Lidar com o foco de áudio é crucial para uma boa experiência do usuário no Android:

```cpp
// No seu código nativo, você precisará chamar métodos Java via JNI
extern "C" {
    JNIEXPORT void JNICALL
    Java_com_example_vulkanaudio_AudioManager_nativeOnAudioFocusGained(JNIEnv* env, jobject thiz) {
        // Retoma a reprodução de áudio
        // Por exemplo:
        // audioEngine->start();
    }

    JNIEXPORT void JNICALL
    Java_com_example_vulkanaudio_AudioManager_nativeOnAudioFocusLost(JNIEnv* env, jobject thiz) {
        // Pausa a reprodução de áudio
        // Por exemplo:
        // audioEngine->stop();
    }
}
```

Lado Java:

```java
public class AudioManager {
    private AudioManager.OnAudioFocusChangeListener afChangeListener = new AudioManager.OnAudioFocusChangeListener() {
        public void onAudioFocusChange(int focusChange) {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                // Perdeu o foco por tempo indeterminado
                nativeOnAudioFocusLost();
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                // Perdeu o foco por um curto período
                nativeOnAudioFocusLost();
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                // Recuperou o foco
                nativeOnAudioFocusGained();
            }
        }
    };

    public void requestAudioFocus() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        int result = audioManager.requestAudioFocus(afChangeListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN);

        if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            // Inicia a reprodução
            nativeOnAudioFocusGained();
        }
    }

    // Métodos nativos
    private native void nativeOnAudioFocusGained();
    private native void nativeOnAudioFocusLost();
}
```

#### Áudio no iOS

O iOS oferece diversas APIs de áudio, sendo a AVAudioEngine a API de alto nível recomendada e a Core Audio a opção para controle de baixo nível.

##### AVAudioEngine

[AVAudioEngine](https://developer.apple.com/documentation/avfaudio/avaudioengine) é a API de áudio de alto nível recomendada para aplicações iOS.

```cpp
// Este é código Objective-C++ usado na sua aplicação iOS
#import <AVFoundation/AVFoundation.h>
#include <algorithm>
#include <span>

class iOSAudioEngine {
public:
    iOSAudioEngine() = default;

    bool initialize() {
        @autoreleasepool {
            // Cria o motor de áudio
            audioEngine = [[AVAudioEngine alloc] init];
            if (!audioEngine) {
                NSLog(@"Falha ao criar AVAudioEngine");
                return false;
            }

            // Cria um nó reprodutor (player node)
            playerNode = [[AVAudioPlayerNode alloc] init];
            if (!playerNode) {
                NSLog(@"Falha ao criar AVAudioPlayerNode");
                return false;
            }

            // Anexa o nó reprodutor ao motor
            [audioEngine attachNode:playerNode];

            // Conecta o nó reprodutor à saída
            [audioEngine connect:playerNode to:audioEngine.mainMixerNode format:[audioEngine.mainMixerNode outputFormatForBus:0]];

            // Prepara e inicia o motor
            NSError* error = nil;
            if (![audioEngine startAndReturnError:&error]) {
                NSLog(@"Falha ao iniciar AVAudioEngine: %@", error);
                return false;
            }

            return true;
        }
    }

    bool playSound(std::span<const float> audioData, int sampleRate, int channels) {
        @autoreleasepool {
            if (!audioEngine || !playerNode) {
                return false;
            }

            const auto frameCount = static_cast<AVAudioFrameCount>(audioData.size() / static_cast<size_t>(channels));

            // Cria um buffer de áudio
            AVAudioFormat* format = [[AVAudioFormat alloc] initStandardFormatWithSampleRate:sampleRate channels:static_cast<AVAudioChannelCount>(channels)];
            AVAudioPCMBuffer* buffer = [[AVAudioPCMBuffer alloc] initWithPCMFormat:format frameCapacity:frameCount];

            // Preenche o buffer com os dados de áudio
            float* bufferData = buffer.floatChannelData[0];
            std::copy(audioData.begin(), audioData.end(), bufferData);
            buffer.frameLength = frameCount;

            // Agenda o buffer para reprodução
            [playerNode scheduleBuffer:buffer completionHandler:^{
                // Chamado quando o buffer termina de tocar
                NSLog(@"Reprodução do buffer concluída");
            }];

            // Inicia a reprodução se ainda não estiver tocando
            if (!isPlaying) {
                [playerNode play];
                isPlaying = true;
            }

            return true;
        }
    }

    void stop() {
        @autoreleasepool {
            if (playerNode && isPlaying) {
                [playerNode stop];
                isPlaying = false;
            }
        }
    }

    void shutdown() {
        @autoreleasepool {
            if (audioEngine) {
                [audioEngine stop];
                audioEngine = nil;
            }

            playerNode = nil;
            isPlaying = false;
        }
    }

private:
    AVAudioEngine* audioEngine = nil;
    AVAudioPlayerNode* playerNode = nil;
    bool isPlaying = false;
};

// Uso:
// iOSAudioEngine audioEngine;
// audioEngine.initialize();
//
// // Cria dados de áudio
// std::vector<float> audioData = createAudioData();
// audioEngine.playSound(audioData, 44100, 2);
//
// // Ao finalizar:
// audioEngine.stop();
// audioEngine.shutdown();
```

##### Core Audio

[Core Audio](https://developer.apple.com/documentation/coreaudio) fornece recursos de áudio de baixo nível para aplicações iOS.

```cpp
// Este é código Objective-C++ usado na sua aplicação iOS
#import <AudioToolbox/AudioToolbox.h>
#include <cmath>
#include <numbers>

class CoreAudioEngine {
public:
    CoreAudioEngine() = default;

    bool initialize() {
        // Configura a descrição do componente de áudio
        AudioComponentDescription desc{
            .componentType = kAudioUnitType_Output,
            .componentSubType = kAudioUnitSubType_RemoteIO,
            .componentManufacturer = kAudioUnitManufacturer_Apple,
            .componentFlags = 0,
            .componentFlagsMask = 0,
        };

        // Encontra o componente de áudio
        AudioComponent component = AudioComponentFindNext(nullptr, &desc);
        if (!component) {
            NSLog(@"Falha ao encontrar o componente de áudio");
            return false;
        }

        // Cria a unidade de áudio (Audio Unit)
        OSStatus status = AudioComponentInstanceNew(component, &audioUnit);
        if (status != noErr) {
            NSLog(@"Falha ao criar a unidade de áudio: %d", static_cast<int>(status));
            return false;
        }

        // Habilita a saída
        UInt32 enableOutput = 1;
        status = AudioUnitSetProperty(audioUnit,
                                     kAudioOutputUnitProperty_EnableIO,
                                     kAudioUnitScope_Output,
                                     0,
                                     &enableOutput,
                                     sizeof(enableOutput));
        if (status != noErr) {
            NSLog(@"Falha ao habilitar a saída de áudio: %d", static_cast<int>(status));
            return false;
        }

        // Configura o formato de áudio
        AudioStreamBasicDescription audioFormat{
            .mSampleRate = 44100.0,
            .mFormatID = kAudioFormatLinearPCM,
            .mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked | kAudioFormatFlagIsNonInterleaved,
            .mBytesPerPacket = 4,
            .mFramesPerPacket = 1,
            .mBytesPerFrame = 4,
            .mChannelsPerFrame = 2,
            .mBitsPerChannel = 32,
        };

        status = AudioUnitSetProperty(audioUnit,
                                     kAudioUnitProperty_StreamFormat,
                                     kAudioUnitScope_Input,
                                     0,
                                     &audioFormat,
                                     sizeof(audioFormat));
        if (status != noErr) {
            NSLog(@"Falha ao definir o formato de áudio: %d", static_cast<int>(status));
            return false;
        }

        // Configura o callback de renderização
        AURenderCallbackStruct callbackStruct{
            .inputProc = renderCallback,
            .inputProcRefCon = this,
        };

        status = AudioUnitSetProperty(audioUnit,
                                     kAudioUnitProperty_SetRenderCallback,
                                     kAudioUnitScope_Input,
                                     0,
                                     &callbackStruct,
                                     sizeof(callbackStruct));
        if (status != noErr) {
            NSLog(@"Falha ao definir o callback de renderização: %d", static_cast<int>(status));
            return false;
        }

        // Inicializa a unidade de áudio
        status = AudioUnitInitialize(audioUnit);
        if (status != noErr) {
            NSLog(@"Falha ao inicializar a unidade de áudio: %d", static_cast<int>(status));
            return false;
        }

        isInitialized = true;
        return true;
    }

    bool start() {
        if (!isInitialized) {
            return false;
        }

        OSStatus status = AudioOutputUnitStart(audioUnit);
        if (status != noErr) {
            NSLog(@"Falha ao iniciar a unidade de áudio: %d", static_cast<int>(status));
            return false;
        }

        return true;
    }

    void stop() {
        if (isInitialized) {
            AudioOutputUnitStop(audioUnit);
        }
    }

    void shutdown() {
        if (isInitialized) {
            stop();
            AudioUnitUninitialize(audioUnit);
            AudioComponentInstanceDispose(audioUnit);
            audioUnit = nullptr;
            isInitialized = false;
        }
    }

private:
    AudioUnit audioUnit = nullptr;
    bool isInitialized = false;
    float phase = 0.0f;

    // Callback de renderização de áudio
    static OSStatus renderCallback(void* inRefCon,
                                  AudioUnitRenderActionFlags* ioActionFlags,
                                  const AudioTimeStamp* inTimeStamp,
                                  UInt32 inBusNumber,
                                  UInt32 inNumberFrames,
                                  AudioBufferList* ioData) {
        auto* engine = static_cast<CoreAudioEngine*>(inRefCon);
        return engine->render(ioActionFlags, inTimeStamp, inBusNumber, inNumberFrames, ioData);
    }

    OSStatus render(AudioUnitRenderActionFlags* ioActionFlags,
                   const AudioTimeStamp* inTimeStamp,
                   UInt32 inBusNumber,
                   UInt32 inNumberFrames,
                   AudioBufferList* ioData) {
        constexpr float twoPi = 2.0f * std::numbers::pi_v<float>;

        // Gera dados de áudio
        // Por exemplo, gera uma onda senoidal
        for (UInt32 i = 0; i < ioData->mNumberBuffers; ++i) {
            auto* buffer = static_cast<float*>(ioData->mBuffers[i].mData);

            for (UInt32 frame = 0; frame < inNumberFrames; ++frame) {
                float sample = 0.5f * std::sin(phase);
                buffer[frame] = sample;

                // Incrementa a fase para a próxima amostra
                phase += 0.01f;
                if (phase > twoPi) {
                    phase -= twoPi;
                }
            }
        }

        return noErr;
    }
};

// Uso:
// CoreAudioEngine audioEngine;
// audioEngine.initialize();
// audioEngine.start();
//
// // Ao finalizar:
// audioEngine.stop();
// audioEngine.shutdown();
```

##### Sessão de Áudio no iOS (*iOS Audio Session*)

Gerenciar a sessão de áudio é importante para o comportamento adequado do áudio no iOS:

```cpp
// Este é código Objective-C++ usado na sua aplicação iOS
#import <AVFoundation/AVFoundation.h>

class AudioSessionManager {
public:
    bool configureAudioSession() {
        @autoreleasepool {
            NSError* error = nil;

            // Obtém a sessão de áudio compartilhada
            AVAudioSession* session = [AVAudioSession sharedInstance];

            // Define a categoria
            if (![session setCategory:AVAudioSessionCategoryAmbient
                          withOptions:0
                                error:&error]) {
                NSLog(@"Falha ao definir a categoria da sessão de áudio: %@", error);
                return false;
            }

            // Define o modo
            if (![session setMode:AVAudioSessionModeDefault error:&error]) {
                NSLog(@"Falha ao definir o modo da sessão de áudio: %@", error);
                return false;
            }

            // Ativa a sessão de áudio
            if (![session setActive:YES error:&error]) {
                NSLog(@"Falha ao ativar a sessão de áudio: %@", error);
                return false;
            }

            // Registra observador para interrupções
            [[NSNotificationCenter defaultCenter] addObserver:[NSObject new]
                                                     selector:@selector(handleInterruption:)
                                                         name:AVAudioSessionInterruptionNotification
                                                       object:nil];

            return true;
        }
    }

    void handleInterruption(NSNotification* notification) {
        @autoreleasepool {
            NSDictionary* info = notification.userInfo;
            NSInteger type = [[info valueForKey:AVAudioSessionInterruptionTypeKey] integerValue];

            if (type == AVAudioSessionInterruptionTypeBegan) {
                // Sessão de áudio interrompida — pausa o áudio
                NSLog(@"Sessão de áudio interrompida");
                // audioEngine->stop();
            } else if (type == AVAudioSessionInterruptionTypeEnded) {
                NSInteger options = [[info valueForKey:AVAudioSessionInterruptionOptionKey] integerValue];
                if (options == AVAudioSessionInterruptionOptionShouldResume) {
                    // Interrupção encerrada — retoma o áudio
                    NSLog(@"Interrupção da sessão de áudio encerrada");
                    // audioEngine->start();
                }
            }
        }
    }
};

// Uso:
// AudioSessionManager sessionManager;
// sessionManager.configureAudioSession();
```

#### Considerações sobre Áudio em Dispositivos Móveis

Ao desenvolver áudio para plataformas móveis, leve em consideração os seguintes pontos:

##### Consumo de Bateria

O processamento de áudio pode ser intensivo em CPU e drenar a bateria. Considere estas estratégias:

1. **Reduza a Taxa de Amostragem (*Sample Rate*)**: Utilize taxas de amostragem menores quando alta fidelidade não for necessária.
2. **Processe em Blocos Maiores**: Processe o áudio em buffers maiores para reduzir ativações (*wake-ups*) da CPU.
3. **Pause o Áudio**: Pause o processamento de áudio quando a aplicação estiver em segundo plano ou quando o áudio não for necessário.

##### Gerenciamento de Memória

Dispositivos móveis possuem memória limitada:

1. **Faça Streaming de Áudio**: Transmita (*stream*) arquivos de áudio grandes em vez de carregá-los integralmente na memória.
2. **Descarregue Recursos Não Utilizados**: Descarregue *assets* de áudio quando eles não forem mais necessários.
3. **Comprima o Áudio**: Utilize formatos de compressão adequados para dispositivos móveis (AAC para iOS, Opus para Android).

##### Interrupções e Foco de Áudio

Trate interrupções de áudio de forma elegante:

1. **Salve o Estado**: Ao sofrer uma interrupção, salve o estado do áudio para que possa ser retomado posteriormente.
2. **Respeite o Volume do Sistema**: Utilize os controles de volume do sistema em vez de implementar os seus próprios.
3. **Lide com Ligações Telefônicas**: Pause o áudio durante ligações telefônicas e outras interrupções do sistema.

##### Latência

Diferentes dispositivos possuem diferentes características de latência de áudio:

1. **Teste em Dispositivos Reais**: O comportamento do áudio em simuladores pode diferir dos dispositivos reais.
2. **Use Modos de Baixa Latência**: Tanto o Android quanto o iOS oferecem modos de áudio de baixa latência para aplicações em tempo real.
3. **Dimensione os Buffers Adequadamente**: Equilibre latência e estabilidade de áudio escolhendo tamanhos de buffer apropriados.

## Integração com Vulkan

Ao utilizar essas bibliotecas de janelas e entrada com o Vulkan, há algumas considerações fundamentais:

### Criação de Surface

Cada biblioteca de janelas fornece uma maneira de criar um objeto `VkSurfaceKHR`, que atua como a ponte entre o Vulkan e o sistema de janelas:

- GLFW: `glfwCreateWindowSurface`
- SDL2: `SDL_Vulkan_CreateSurface`
- Win32: `vkCreateWin32SurfaceKHR`
- XCB: `vkCreateXcbSurfaceKHR`
- Wayland: `vkCreateWaylandSurfaceKHR`
- macOS: `vkCreateMacOSSurfaceMVK`
- iOS: `vkCreateIOSSurfaceMVK`
- Android: `vkCreateAndroidSurfaceKHR`
- Metal: `vkCreateMetalSurfaceEXT`

### Gerenciamento da Swapchain

A *swapchain* precisa ser recriada quando a janela é redimensionada. Aqui está uma abordagem básica:

```cpp
#include <stdexcept>

void handleWindowResize(VkDevice device, VkSwapchainKHR& swapchain, VkSurfaceKHR surface) {
    // Aguarda o dispositivo ficar ocioso
    vkDeviceWaitIdle(device);

    // Guarda a swapchain antiga para destruí-la após a recriação
    VkSwapchainKHR oldSwapchain = swapchain;

    // Obtém as novas capacidades da surface
    VkSurfaceCapabilitiesKHR capabilities{};
    vkGetPhysicalDeviceSurfaceCapabilitiesKHR(physicalDevice, surface, &capabilities);

    // Cria a nova swapchain
    VkSwapchainCreateInfoKHR createInfo{
        .sType = VK_STRUCTURE_TYPE_SWAPCHAIN_CREATE_INFO_KHR,
        .pNext = nullptr,
        .surface = surface,
        .minImageCount = capabilities.minImageCount + 1,
        .imageFormat = surfaceFormat.format,
        .imageColorSpace = surfaceFormat.colorSpace,
        .imageExtent = capabilities.currentExtent,
        .imageArrayLayers = 1,
        .imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT,
        .imageSharingMode = VK_SHARING_MODE_EXCLUSIVE,
        .preTransform = capabilities.currentTransform,
        .compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR,
        .presentMode = presentMode,
        .clipped = VK_TRUE,
        .oldSwapchain = oldSwapchain,
    };

    VkResult result = vkCreateSwapchainKHR(device, &createInfo, nullptr, &swapchain);
    if (result != VK_SUCCESS) {
        throw std::runtime_error("Falha ao criar a swapchain");
    }

    // Destrói a swapchain antiga caso ela tenha sido substituída
    if (oldSwapchain != VK_NULL_HANDLE) {
        vkDestroySwapchainKHR(device, oldSwapchain, nullptr);
    }

    // Recria imagens da swapchain, image views, framebuffers, etc.
    // ...
}
```

### Entrada para Renderização Vulkan

O tratamento de entrada normalmente altera o estado da aplicação, que por sua vez influencia a renderização no Vulkan:

```cpp
#include <array>

struct AppState {
    std::array<float, 3> cameraPosition = {0.0f, 0.0f, 0.0f};
    std::array<float, 3> cameraRotation = {0.0f, 0.0f, 0.0f};
    // Outras variáveis de estado
};

// Atualiza o estado com base na entrada
void handleInput(AppState& state, float deltaTime) {
    // Exemplo com GLFW
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) {
        state.cameraPosition[2] -= 1.0f * deltaTime;
    }
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) {
        state.cameraPosition[2] += 1.0f * deltaTime;
    }
    // Trata outras teclas e entradas
}

// No loop principal
AppState state{};
float lastFrameTime = 0.0f;

while (!glfwWindowShouldClose(window)) {
    auto currentTime = static_cast<float>(glfwGetTime());
    float deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    glfwPollEvents();
    handleInput(state, deltaTime);

    // Atualiza os uniform buffers com o novo estado
    updateUniformBuffers(state);

    // Renderiza o quadro com Vulkan
    drawFrame();
}
```

## Boas Práticas

### Considerações de Desempenho

1. **Minimize o Redimensionamento de Janelas**: Recriar a *swapchain* é custoso, portanto trate o redimensionamento de janelas de forma eficiente.
2. **Processe Entradas em Lote**: Processe todos os eventos de entrada de uma só vez em vez de tratá-los individualmente.
3. **Use Double Buffering**: Para áudio, utilize *double buffering* para garantir reprodução suave enquanto prepara o próximo segmento de áudio.

### Desenvolvimento Multiplataforma

1. **Abstraia o Código Específico de Plataforma**: Crie uma camada de abstração de plataforma para lidar com as diferenças entre sistemas operacionais.
2. **Use Bibliotecas Multiplataforma**: Bibliotecas como GLFW e SDL2 já lidam com a maior parte dos detalhes específicos de cada plataforma.
3. **Teste em Todas as Plataformas-Alvo**: Plataformas diferentes podem apresentar diferenças sutis de comportamento.

### Tratamento de Erros

Sempre verifique os valores de retorno e trate os erros adequadamente:

```cpp
VkResult result = vkCreateSwapchainKHR(device, &createInfo, nullptr, &swapchain);
if (result != VK_SUCCESS) {
    switch (result) {
        case VK_ERROR_OUT_OF_HOST_MEMORY:
            std::cerr << "Falha ao criar a swapchain: Memória do host esgotada\n";
            break;
        case VK_ERROR_OUT_OF_DEVICE_MEMORY:
            std::cerr << "Falha ao criar a swapchain: Memória do dispositivo esgotada\n";
            break;
        case VK_ERROR_DEVICE_LOST:
            std::cerr << "Falha ao criar a swapchain: Dispositivo perdido\n";
            break;
        case VK_ERROR_SURFACE_LOST_KHR:
            std::cerr << "Falha ao criar a swapchain: Surface perdida\n";
            break;
        case VK_ERROR_NATIVE_WINDOW_IN_USE_KHR:
            std::cerr << "Falha ao criar a swapchain: Janela nativa em uso\n";
            break;
        default:
            std::cerr << "Falha ao criar a swapchain: Erro desconhecido\n";
            break;
    }
    // Trata o erro adequadamente
}
```

## Recursos

### Bibliotecas

- [GLFW](https://www.glfw.org/)
- [SDL2](https://www.libsdl.org/)
- [OpenAL](https://www.openal.org/)
- [FMOD](https://www.fmod.com/)

### Exemplos e Tutoriais

- [Khronos Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples)
- [Exemplos Vulkan de Sascha Willems](https://github.com/SaschaWillems/Vulkan)
- [Vulkan Tutorial](https://docs.vulkan.org/tutorial/latest/00_Introduction.html)

### Documentação

- [Documentação do GLFW](https://www.glfw.org/docs/latest/)
- [Wiki do SDL2](https://wiki.libsdl.org/SDL2/FrontPage)
- [Documentação do OpenAL](https://www.openal.org/documentation/)
- [Documentação do FMOD](https://www.fmod.com/resources/documentation-api)
- [Repositório GitHub da Oboe](https://github.com/google/oboe)
- [Documentação da Oboe](https://github.com/google/oboe/wiki)
- [Documentação do AVAudioEngine para iOS](https://developer.apple.com/documentation/avfaudio/avaudioengine)
- [Documentação do Core Audio para iOS](https://developer.apple.com/documentation/coreaudio)
