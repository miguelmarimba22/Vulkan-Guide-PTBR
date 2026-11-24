# Extensões para Camadas de Tradução (Translation Layer Extensions)

Existe uma classe de extensões criada exclusivamente para oferecer maneiras eficientes de camadas de tradução (*translation layers* — consulte o capítulo sobre a Iniciativa de Portabilidade) mapearem outras APIs para o Vulkan.

Isso inclui replicar comportamentos legados que são difíceis para os drivers implementarem de forma eficiente. Essa funcionalidade **não** é considerada voltada para o futuro e **não** se espera que seja promovida para uma extensão `KHR` ou para o núcleo (*core*) do Vulkan.

A menos que seja necessária para tradução de outra API, é **altamente recomendável** que os desenvolvedores utilizem técnicas alternativas na GPU para obter a mesma funcionalidade.

## VK_EXT_custom_border_color

O Vulkan fornece apenas preto transparente, preto opaco e branco opaco em `VkBorderColor` para objetos `VkSampler` na especificação principal. Tanto o OpenGL quanto o D3D possuem a opção de definir a borda do *sampler* como uma cor personalizada.

## VK_EXT_border_color_swizzle

Após a publicação de `VK_EXT_custom_border_color`, descobriu-se que algumas implementações apresentavam comportamento indefinido ao combinar um *sampler* que usa cor de borda personalizada com *image views* cujo mapeamento de componentes (*swizzle*) não é o mapeamento identidade.

## VK_EXT_depth_clip_enable

A funcionalidade de habilitação de recorte de profundidade (*depth clip enable*) é especificada de forma diferente entre o D3D11 e o Vulkan. Em vez de `VkPipelineRasterizationStateCreateInfo::depthClampEnable`, o D3D11 possui [`DepthClipEnable (D3D11_RASTERIZER_DESC)`](https://docs.microsoft.com/en-us/windows/win32/api/d3d11/ns-d3d11-d3d11_rasterizer_desc), que afeta apenas o recorte de *viewport* dos valores de profundidade antes da rasterização e não afeta o *depth clamp* que sempre ocorre no estágio de *output merger* do *pipeline* gráfico do D3D11.

## VK_EXT_depth_clip_control

A funcionalidade de controle de recorte de profundidade permite que a aplicação use o intervalo de profundidade do OpenGL em coordenadas normalizadas de dispositivo (NDC). No OpenGL, esse intervalo é `[-1, 1]`, em contraste com o padrão `[0, 1]` do Vulkan. O suporte a *clip control* era fornecido no OpenGL por meio da extensão [ARB_clip_control](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_clip_control.txt).

Para mais informações, consulte o capítulo sobre Profundidade (*Depth*), na seção sobre portar do OpenGL.

## VK_EXT_provoking_vertex

A convenção padrão do Vulkan para o vértice provocador (*provoking vertex*) é o "primeiro vértice" (*first vertex*), enquanto a convenção padrão do OpenGL é o "último vértice" (*last vertex*).

## VK_EXT_transform_feedback

Tudo o que é necessário para *transform feedback* pode ser realizado por meio de um *compute shader* no Vulkan.

## VK_EXT_image_view_min_lod

Esta extensão fornece uma versão do lado da API para o qualificador SPIR-V `MinLod`. O novo valor é associado à *image view* e destina-se a corresponder ao parâmetro `ResourceMinLODClamp` de SRVs no D3D12. O uso de `MinLod` e funcionalidades semelhantes destina-se principalmente a texturização esparsa (*sparse texturing*), já que níveis de *mip* de maior resolução podem ser carregados e descarregados da memória sob demanda. Existem várias formas de obter um *clamp* semelhante no Vulkan: uma `VkImageView` pode restringir o nível base, mas um `MinLod` também pode restringir a um LOD fracionário e não precisa modificar a dimensão base da textura, o que pode simplificar alguns algoritmos. Objetos `VkSampler` também podem restringir a um LOD fracionário, mas usar muitos *samplers* exclusivos para essa finalidade pode não ser prático.
