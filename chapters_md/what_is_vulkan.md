# O que é Vulkan?

> **Nota:** Vulkan é uma API de gráficos e computação de nova geração que fornece acesso multiplataforma de alta eficiência a GPUs modernas usadas em uma ampla variedade de dispositivos, desde PCs e consoles até smartphones e plataformas embarcadas.

Vulkan não é uma empresa nem uma linguagem de programação, mas sim uma forma de desenvolvedores programarem hardware de GPU moderno de maneira multiplataforma e independente de fabricante (*cross-vendor*). O Khronos Group é um consórcio conduzido por seus membros que criou e mantém a API Vulkan.

## Vulkan em sua essência

Em sua essência, o Vulkan é uma [Especificação de API](https://registry.khronos.org/vulkan/#apispecs) que implementações de hardware em conformidade seguem. A especificação pública é gerada a partir do arquivo de registro Vulkan [`./xml/vk.xml`](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/xml/vk.xml) na cópia pública oficial do repositório da Especificação Vulkan disponível em [Vulkan-Docs](https://github.com/KhronosGroup/Vulkan-Docs). A documentação do [esquema XML](https://registry.khronos.org/vulkan/specs/latest/registry.html) também está disponível.

O Khronos Group, juntamente com a Especificação Vulkan, publica [arquivos de cabeçalho (*header files*)](https://github.com/KhronosGroup/Vulkan-Headers/tree/main/include/vulkan) em [C99](https://www.open-std.org/jtc1/sc22/wg14/www/standards) gerados a partir do [Registro da API](https://registry.khronos.org/vulkan/#apiregistry), que os desenvolvedores podem usar para interagir com a API Vulkan.

Para aqueles que não trabalham com código C, existem diversos *bindings* disponíveis para outras linguagens.

## Vulkan e OpenGL

Alguns desenvolvedores podem conhecer outro padrão do Khronos Group, o [OpenGL](https://www.khronos.org/opengl/), que também é uma API de gráficos 3D. O Vulkan não é um substituto direto para o OpenGL, mas sim uma API explícita que permite um controle muito mais direto e granular da GPU.

O artigo do repositório [Vulkan Samples](https://github.com/KhronosGroup/Vulkan-Samples) do Khronos sobre ["Como o Vulkan se compara ao OpenGL ES? O que esperar ao desenvolver para Vulkan?"](https://github.com/KhronosGroup/Vulkan-Samples/blob/master/samples/vulkan_basics.adoc) oferece uma comparação mais detalhada entre as duas APIs.

![Comparação entre Vulkan e OpenGL](images/what_is_vulkan_compared_to_gl.png)

O Vulkan transfere mais trabalho e responsabilidade para a aplicação. Nem todo desenvolvedor desejará fazer esse investimento extra, mas aqueles que o fizerem corretamente podem obter ganhos significativos de poder de controle e desempenho.

![Fluxograma de decisão sobre o uso de Vulkan](images/what_is_vulkan_decision.png)

## Usando bibliotecas auxiliares

Embora alguns desenvolvedores possam querer experimentar o uso do Vulkan sem auxílio algum, é comum utilizar bibliotecas mais leves no fluxo de desenvolvimento para abstrair alguns dos aspectos mais repetitivos da API. Aqui estão algumas [bibliotecas](https://www.vulkan.org/tools#702702a4-702702a4) para [ajudar no desenvolvimento](https://github.com/vinjn/awesome-vulkan#libraries).

![Camadas de abstração com bibliotecas auxiliares sobre o Vulkan](images/what_is_vulkan_layer.png)

## Aprendendo a usar Vulkan

O Vulkan é uma ferramenta para desenvolvedores criarem aplicações aceleradas por hardware. O Vulkan Guide busca abordar o material mais logístico e arquitetural, como extensões, versões, especificação, etc. Para mais informações sobre como "usar" o Vulkan para criar algo como o clássico triângulo *Hello World*, confira recursos como os disponíveis na [página "Learn" de Vulkan do Khronos](https://www.vulkan.org/learn). Se quiser ajuda mais prática e trocar conhecimento, sinta-se à vontade para participar do [Khronos Developer Slack](https://khr.io/slack) ou dos [Fóruns da Comunidade Khronos](https://community.khronos.org/)!
