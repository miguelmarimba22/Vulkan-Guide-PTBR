# Sincronização

A sincronização é uma das partes mais poderosas, porém também uma das mais complexas, ao utilizar o Vulkan. O desenvolvedor da aplicação é agora responsável por gerenciar a sincronização usando as diversas [primitivas de sincronização do Vulkan](https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-pipeline-barriers). O uso inadequado da sincronização pode levar a bugs difíceis de encontrar, bem como a baixo desempenho em casos nos quais a GPU fica ociosa desnecessariamente.

Há um [conjunto de exemplos](https://github.com/KhronosGroup/Vulkan-Docs/wiki/Synchronization-Examples) e um artigo no blog [Understanding Vulkan Synchronization](https://www.khronos.org/blog/understanding-vulkan-synchronization) fornecidos pela Khronos sobre como usar algumas das primitivas de sincronização. Também existem apresentações de Tobias Hector de palestras anteriores sobre Vulkan: [slides da parte 1](https://www.khronos.org/assets/uploads/developers/library/2017-vulkan-devu-vancouver/009%20-%20Synchronization%20-%20Keeping%20Your%20Device%20Fed.pdf) ([vídeo](https://www.youtube.com/watch?v=YkJ4hKCPjm0)) e [slides da parte 2](https://www.khronos.org/assets/uploads/developers/library/2018-vulkanised/06-Keeping%20Your%20Device%20Fed%20v4_Vulkanised2018.pdf) ([vídeo](https://www.youtube.com/watch?v=5GDg4OxkSEc)).

A seguir está um diagrama geral ilustrando a diferença entre `VkEvent`, `VkFence` e `VkSemaphore`:

![Visão geral das primitivas de sincronização](images/synchronization_overview.png)

## Validação

A *Khronos Validation Layer* implementou mecanismos de [validação para sincronização](https://vulkan.lunarg.com/doc/sdk/latest/windows/synchronization_usage.html). Ela pode ser facilmente habilitada através do [Vulkan Configurator](https://vulkan.lunarg.com/doc/sdk/latest/windows/vkconfig.html) incluído no [Vulkan SDK](https://vulkan.lunarg.com/sdk/home). Um [whitepaper detalhado](https://www.lunarg.com/wp-content/uploads/2020/09/Final_LunarG_Guide_to_Vulkan-Synchronization_Validation_08_20.pdf) discutindo a validação de sincronização também foi escrito e publicado no [Blog da Khronos](https://www.khronos.org/blog/a-guide-to-vulkan-synchronization-validation).

## Barreiras de Pipeline (*Pipeline Barriers*)

As [Barreiras de Pipeline (*Pipeline Barriers*)](https://docs.vulkan.org/spec/latest/chapters/synchronization.html#synchronization-pipeline-barriers) fornecem controle sobre quais estágios do pipeline precisam aguardar por estágios anteriores quando um *command buffer* é executado.

![Barreiras de pipeline na sincronização](images/synchronization_pipeline_barrieres.png)

Embora as barreiras de pipeline possam ser difíceis de entender inicialmente, existem muitas palestras excelentes da Khronos e outros recursos que se aprofundam no tema:

- [Vulkanised 2018 - Low-level mysteries of pipeline barriers](https://www.khronos.org/assets/uploads/developers/library/2018-vulkanised/05-The%20low-level%20mysteries%20of%20pipeline%20barriers_Vulkanised2018.pdf) ([vídeo](https://www.youtube.com/watch?v=e0ySJ9Qzvrs))
- [Vulkanised 2019 - Live Long and Optimise](https://www.khronos.org/assets/uploads/developers/library/2019-vulkanised/02_Live%20Long%20And%20Optimise-May19.pdf) ([vídeo](https://www.youtube.com/watch?v=ch6161wvME8&t=463s)) — Análise de Pipeline a partir do slide 12
- Postagem de blog [Vulkan barriers explained](https://gpuopen.com/learn/vulkan-barriers-explained/)
- Postagem de blog [Yet another blog post explaining Vulkan synchronization](http://themaister.net/blog/2019/08/14/yet-another-blog-explaining-vulkan-synchronization/)

## VK_KHR_synchronization2

A extensão `VK_KHR_synchronization2` reformula as APIs originais de sincronização do núcleo (*core*) para reduzir a complexidade para os desenvolvedores de aplicações, além de adicionar alguns recursos adicionais que não estavam presentes nas APIs originais.

Consulte o capítulo sobre `VK_KHR_synchronization2` para obter mais informações sobre as diferenças entre as APIs de sincronização e como migrar seu código para utilizar a nova extensão.
