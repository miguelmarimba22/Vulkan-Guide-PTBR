# Plataformas

Embora o Vulkan seja executado em muitas plataformas, cada uma possui pequenas variações na forma como o Vulkan é gerenciado.

![Visão geral das plataformas suportadas pelo Vulkan](images/platforms_overview.png)

## Android

A API Vulkan está [disponível](https://developer.android.com/ndk/guides/graphics/getting-started) em qualquer dispositivo Android a partir do nível de API 24 (Android Nougat); no entanto, nem todos os dispositivos terão um driver Vulkan.

O Android utiliza sua [Hardware Abstraction Layer (HAL)](https://source.android.com/devices/architecture/hal) para localizar o driver Vulkan em um [caminho predefinido](https://source.android.com/devices/graphics/implement-vulkan#driver_emun).

Todos os dispositivos de 64 bits lançados com o nível de API 29 (Android Q) ou superior devem incluir um driver Vulkan 1.1.

## BSD Unix

O Vulkan é suportado em diversas distribuições BSD Unix.

## Fuchsia

O Vulkan é suportado no [sistema operacional Fuchsia](https://fuchsia.dev/fuchsia-src/development/graphics/magma/concepts/vulkan).

## iOS

O Vulkan não é suportado nativamente no iOS, mas ainda pode ser utilizado por meio das ferramentas da Iniciativa de Portabilidade Vulkan (consulte o capítulo sobre a Iniciativa de Portabilidade).

## Linux

O Vulkan é suportado em diversas distribuições Linux.

## macOS

O Vulkan não é suportado nativamente no macOS, mas ainda pode ser utilizado por meio das ferramentas da Iniciativa de Portabilidade Vulkan (consulte o capítulo sobre a Iniciativa de Portabilidade).

## Nintendo Switch

O Nintendo Switch executa um chipset NVIDIA Tegra que possui suporte nativo ao Vulkan.

## QNX

O Vulkan é suportado no sistema operacional QNX.

## Windows

O Vulkan é suportado no Windows 7, Windows 8, Windows 10 e Windows 11.

## Outras plataformas

Alguns sistemas embarcados suportam Vulkan permitindo a apresentação [diretamente no display (*direct-to-display*)](https://docs.vulkan.org/spec/latest/chapters/VK_KHR_surface/wsi.html#display).
