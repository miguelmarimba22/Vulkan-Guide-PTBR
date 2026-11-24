# Cache de Pipeline (*Pipeline Cache*)

O cache de *pipeline* é uma técnica utilizada com objetos [VkPipelineCache](https://docs.vulkan.org/spec/latest/chapters/pipelines.html#VkPipelineCache) para reutilizar *pipelines* que já foram criados anteriormente. A criação de *pipelines* pode ser relativamente custosa — pois envolve, por exemplo, a compilação dos *shaders* no momento da criação. A grande vantagem de um *pipeline cache* é que o estado do *pipeline* pode ser salvo em um arquivo para ser reutilizado entre diferentes execuções de uma aplicação, eliminando algumas das etapas mais custosas da criação. Há uma excelente apresentação da Khronos sobre *pipeline caching* do [SIGGRAPH 2016](https://www.khronos.org/assets/uploads/developers/library/2016-siggraph/3D-BOF-SIGGRAPH_Jul16.pdf) ([vídeo](https://www.youtube.com/watch?v=owuJRPKIUAg&t=1045s)), a partir do slide 140.

![Diagrama ilustrativo do funcionamento do Pipeline Cache](images/pipeline_cache_cache.png)

Embora os *pipeline caches* sejam uma ferramenta importante, é fundamental construir um sistema robusto para gerenciá-los, assunto abordado por Arseny Kapoulkine em seu [artigo de blog](https://zeux.io/2019/07/17/serializing-pipeline-cache/).

Para ilustrar o ganho de desempenho e conferir uma implementação de referência de *pipeline caches*, a Khronos disponibiliza um [exemplo e tutorial](https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/performance/pipeline_cache).
