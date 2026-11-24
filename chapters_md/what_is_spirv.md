# O que é SPIR-V

> **Nota:** Leia o [SPIRV-Guide](https://github.com/KhronosGroup/SPIRV-Guide) para informações mais detalhadas sobre SPIR-V.

[SPIR-V](https://registry.khronos.org/SPIR-V/) é uma representação intermediária binária para estágios de shaders gráficos e *kernels* de computação. Com o Vulkan, uma aplicação ainda pode escrever seus shaders em uma linguagem de sombreamento de alto nível, como GLSL ou HLSL (consulte o capítulo sobre HLSL), mas um binário SPIR-V é necessário ao utilizar [`vkCreateShaderModule`](https://docs.vulkan.org/spec/latest/chapters/shaders.html#vkCreateShaderModule). O Khronos disponibiliza um excelente [white paper](https://registry.khronos.org/SPIR-V/papers/WhitePaper.pdf) sobre o SPIR-V, suas vantagens e uma descrição de alto nível da representação. Também existem duas ótimas apresentações do Khronos do Vulkan DevDay 2016 [aqui](https://www.khronos.org/assets/uploads/developers/library/2016-vulkan-devday-uk/3-Intro-to-spir-v-shaders.pdf) e [aqui](https://www.khronos.org/assets/uploads/developers/library/2016-vulkan-devday-uk/4-Using-spir-v-with-spirv-cross.pdf) ([vídeo de ambas](https://www.youtube.com/watch?v=XRpVwdduzgU)).

## Interface e Capacidades do SPIR-V

O Vulkan possui uma seção inteira dedicada a definir como o [Vulkan faz interface com shaders SPIR-V](https://docs.vulkan.org/spec/latest/chapters/interfaces.html). A maioria das regras de uso válido relacionadas à interface com SPIR-V ocorre durante a criação do *pipeline*, quando os shaders são compilados em conjunto.

O SPIR-V possui muitas capacidades, pois atende a outros alvos além do Vulkan. Para ver as capacidades suportadas exigidas pelo Vulkan, consulte o [Apêndice SPIR-V](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-capabilities). Algumas extensões e recursos no Vulkan existem justamente para verificar se determinadas capacidades do SPIR-V são suportadas ou não.

## Compiladores

### glslang

O [glslang](https://github.com/KhronosGroup/glslang) é o *front-end* de referência do Khronos para GLSL, HLSL e ESSL, além de gerador de referência de SPIR-V. Ele inclui a ferramenta independente `glslangValidator`, que pode ser usada para gerar SPIR-V a partir de GLSL, HLSL e ESSL.

### Shaderc

Uma coleção de ferramentas, bibliotecas e testes para compilação de shaders Vulkan mantida pelo Google. Ele contém o `glslc`, que encapsula as funcionalidades principais do [glslang](https://github.com/KhronosGroup/glslang) e do [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools). O Shaderc também contém o `spvc`, que encapsula as funcionalidades principais do [SPIRV-Cross](https://github.com/KhronosGroup/SPIRV-Cross) e do [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools).

O Shaderc compila as ferramentas tanto como utilitário independente de linha de comando ([glslc](https://github.com/google/shaderc/tree/main/glslc)) quanto como uma biblioteca para vinculação ([libshaderc](https://github.com/google/shaderc/tree/main/libshaderc)).

### DXC

O [DirectXShaderCompiler](https://github.com/microsoft/DirectXShaderCompiler) também suporta a [tradução de HLSL para SPIR-V](https://github.com/Microsoft/DirectXShaderCompiler/wiki/SPIR%E2%80%90V-CodeGen).

![Fluxo do DirectX Shader Compiler (DXC) gerando SPIR-V](images/what_is_spirv_dxc.png)

### Clspv

O [Clspv](https://github.com/google/clspv) é um compilador protótipo para um subconjunto de OpenCL C para SPIR-V, destinado ao uso como *compute shaders* em Vulkan.

## Ferramentas e Ecossistema

Existe um ecossistema rico de ferramentas para aproveitar o SPIR-V. O [Vulkan SDK fornece uma visão geral](https://vulkan.lunarg.com/doc/sdk/latest/windows/spirv_toolchain.html) de todas as ferramentas SPIR-V compiladas e empacotadas para desenvolvedores.

### SPIRV-Tools

O projeto [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools) do Khronos fornece APIs em C e C++ e uma interface de linha de comando para trabalhar com módulos SPIR-V. Mais informações no [SPIRV-Guide](https://github.com/KhronosGroup/SPIRV-Guide/blob/master/chapters/khronos_tooling.md#spir-v-tools).

### SPIRV-Cross

O projeto [SPIRV-Cross](https://github.com/KhronosGroup/SPIRV-Cross) do Khronos é uma ferramenta prática e biblioteca para realizar reflexão (*reflection*) em SPIR-V e descompilar SPIR-V de volta para uma linguagem de sombreamento de alto nível desejada. Para mais detalhes, [Hans Kristian](https://github.com/Themaister), o principal desenvolvedor do SPIRV-Cross, fez duas excelentes apresentações sobre o que é necessário para construir uma ferramenta como o SPIRV-Cross no [Vulkanised 2018](https://www.khronos.org/assets/uploads/developers/library/2018-vulkanised/04-SPIRVCross_Vulkanised2018.pdf) ([vídeo](https://www.youtube.com/watch?v=T5Va6hSGx44)) e no [Vulkanised 2019](https://www.khronos.org/assets/uploads/developers/library/2019-vulkanised/04-SPIRV-Cross-May19.pdf) ([vídeo](https://www.youtube.com/watch?v=lv-fh_oFJUc)).

![Visão geral do fluxo de trabalho do SPIRV-Cross](images/what_is_spirv_spriv_cross.png)

### SPIRV-LLVM

O projeto [SPIRV-LLVM](https://github.com/KhronosGroup/SPIRV-LLVM) do Khronos é um framework LLVM com suporte a SPIR-V. Seu objetivo é conter um conversor bidirecional entre LLVM e SPIR-V, servindo também como base para compiladores *front-end* baseados em LLVM que miram SPIR-V.
