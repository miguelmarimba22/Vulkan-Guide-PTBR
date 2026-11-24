# Guia Completo de Vulkan em Português (C++20)

Tradução independente e integral para **Português do Brasil (PT-BR)** do [KhronosGroup/Vulkan-Guide](https://github.com/KhronosGroup/Vulkan-Guide), com todos os exemplos de código C/C++ adaptados para **C++20 idiomático** e compilado em um livro PDF pronto para leitura e impressão.

> **Aviso de Transparência e Independência:**  
> Esta é uma obra derivada independente, **não oficial e não afiliada nem endossada pela The Khronos Group Inc.**  
> A tradução para Português e a adaptação dos trechos de código para C++20 foram realizadas com auxílio de Inteligência Artificial. Contribuições, revisões técnicas e correções via *Issues* e *Pull Requests* são muito bem-vindas!

---

## Download do PDF

- **[Guia_Vulkan_CPP20_PTBR.pdf](./Guia_Vulkan_CPP20_PTBR.pdf)** — Edição completa em formato A4 (411 páginas, capa, sumário clicável, bookmarks, syntax highlighting, tabelas e diagramas).

---

## Conteúdo

O guia reúne um **Prefácio de Fundamentos de Vulkan com C++20** seguido por **todos os 84 capítulos** do repositório original na mesma estrutura oficial:

1. **Prefácio — Fundamentos de Vulkan com C++20**  
   *Designated initializers*, `std::span`, enumeração segura com `std::vector`, `std::optional`/`std::string_view`/`std::format`, padrões RAII / `Vulkan-Hpp` e CMake com C++20.
2. **Parte I — Visão Geral e Logística (16 capítulos)**  
   O que é Vulkan, especificação, plataformas, suporte, versões, perfis, resumo de lançamentos, SPIR-V, iniciativa de portabilidade, CTS, ferramentas, IDEs, validação, profiling e *decoder ring*.
3. **Parte II — Usando Vulkan na Prática (51 capítulos)**  
   Programação embarcada, recursos descontinuados, *tile-based rendering*, loader, layers, extensões/features/formatos, filas, WSI, janelas/áudio/entrada, `pNext`/`sType`, sincronização (`VK_KHR_synchronization2` e exemplos completos), alocação de memória, recursos esparsos, memória protegida, *buffer device address*, *pipeline cache*, *threading*, profundidade, topologia, mapeamento de dados para shaders, descritores (*arrays*, *dynamic offset*, *descriptor buffer*, *descriptor heap*), *push constants*, *robustness*, *shader abort*, estado dinâmico, *compute shaders*, *subgroups*, layout de memória, operações atômicas, cópias de imagem, armadilhas comuns, HLSL, Slang e comparação de linguagens de shader.
4. **Parte III — Quando e Por Que Usar Extensões (17 capítulos)**  
   *Cleanup extensions*, *device groups*, memória/sincronização externas, *ray tracing*, *shader features*, camadas de tradução, `VK_EXT_descriptor_indexing`, `VK_EXT_inline_uniform_block`, `VK_EXT_memory_priority`, `VK_KHR_descriptor_update_template`, `VK_KHR_draw_indirect_count`, `VK_KHR_image_format_list`, `VK_KHR_imageless_framebuffer`, `VK_KHR_sampler_ycbcr_conversion`, `VK_KHR_shader_subgroup_uniform_control_flow`, `VK_EXT_debug_utils` e `VK_KHR_extended_flags`.

---

## Como Recompilar o PDF Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18+)
- [Typst](https://typst.app/) (v0.13+)
- Git (para baixar as figuras originais do `KhronosGroup/Vulkan-Guide`)

### Passos
```bash
# 1. Clone o repositório oficial da Khronos dentro desta pasta (para obter as imagens/diagramas)
git clone --depth 1 https://github.com/KhronosGroup/Vulkan-Guide.git

# 2. Gere o arquivo Typst a partir dos capítulos em chapters_md/
node build_typst.mjs

# 3. Compile o PDF final
typst compile vulkan_guide_ptbr.typ Guia_Vulkan_CPP20_PTBR.pdf
```

---

## Licença e Atribuição

Este projeto é distribuído sob a licença **Creative Commons Attribution 4.0 International (CC-BY-4.0)** — veja o arquivo [LICENSE](./LICENSE).

- **Obra original:** [KhronosGroup/Vulkan-Guide](https://github.com/KhronosGroup/Vulkan-Guide) — Copyright © The Khronos Group Inc., licenciado sob [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
- **Modificações realizadas:** tradução integral para Português do Brasil (PT-BR), adaptação dos exemplos C/C++ para C++20 idiomático, adição de prefácio C++20 e diagramação em PDF via Typst (com auxílio de IA).
- **Marcas Registradas:** Vulkan® é uma marca registrada da The Khronos Group Inc. Este projeto não possui afiliação ou endosso da Khronos Group.
