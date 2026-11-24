# Guia de Equivalência de Termos Vulkan (Decoder Ring)

Esta seção fornece um mapeamento entre o termo usado no Vulkan para um conceito e a terminologia utilizada em outras APIs gráficas. A tabela está organizada em ordem alfabética pelo termo em Vulkan. Se você estiver procurando o equivalente em Vulkan de um conceito usado em uma API que já conhece, basta localizar o termo conhecido nesta lista e consultar a especificação do Vulkan (consulte o capítulo sobre a Especificação do Vulkan) pelo termo correspondente em Vulkan.

> **Nota:** Nem tudo será uma correspondência exata 1:1; o objetivo é dar uma boa referência inicial de onde procurar na especificação.

| **Vulkan** | **GL, GLES** | **DirectX** | **Metal** |
| --- | --- | --- | --- |
| buffer device address | | GPU virtual address | |
| buffer view, texel buffer | texture buffer | typed buffer SRV, typed buffer UAV | texture buffer |
| color attachments | color attachments | render target | color attachments ou render target |
| command buffer | parte do context, display list, `NV_command_list` | command list | command buffer |
| command pool | parte do context | command allocator | command queue |
| conditional rendering | conditional rendering | predication | |
| cooperative matrix | | wave matrix | SIMD group matrix |
| depth/stencil attachment | depth attachment e stencil attachment | depth/stencil view | depth attachment e stencil attachment, depth render target e stencil render target |
| descriptor | | descriptor | argument |
| descriptor pool | | descriptor heap | heap |
| descriptor set | | descriptor table | argument buffer |
| descriptor set layout binding, push descriptor | | root parameter | argument na lista de parâmetros do shader |
| device group | implícito (ex.: SLI, CrossFire) | multi-adapter device | peer group |
| device memory | | heap | placement heap |
| event | | split barrier | |
| fence | fence, sync | `ID3D12Fence::SetEventOnCompletion` | completed handler, `-[MTLCommandBuffer waitUntilComplete]` |
| fragment shader | fragment shader | pixel shader | fragment shader ou fragment function |
| fragment shader interlock | [GL_ARB_fragment_shader_interlock](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_fragment_shader_interlock.txt) | rasterizer order view (ROV) | raster order group |
| framebuffer | framebuffer object | coleção de recursos | `MTLRenderPassDescriptor` |
| heap | | `ID3D12Heap` | `MTLHeap` |
| image | texture e renderbuffer | texture | texture |
| image layout | | resource state | |
| image tiling | | image layout, swizzle | |
| image view | texture view | render target view, depth/stencil view, shader resource view, unordered access view | texture view |
| interface matching (`in`/`out`) | varying ([removido no GLSL 4.20](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.20.pdf)) | Matching semantics | Per-vertex input attributes `[[stage_in]]` |
| invocation | invocation | thread, lane | thread, lane |
| layer | | slice | slice |
| logical device | context | device | device |
| memory type | gerenciado automaticamente, [texture storage hint](https://registry.khronos.org/OpenGL/extensions/APPLE/APPLE_texture_range.txt), [buffer storage](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_buffer_storage.txt) | heap type, CPU page property | storage mode, CPU cache mode |
| multiview rendering | multiview rendering | view instancing | vertex amplification |
| physical device | | adapter, node | device |
| pipeline | state e program ou program pipeline | pipeline state | pipeline state |
| pipeline barrier, memory barrier | texture barrier, memory barrier | resource barrier | texture barrier, memory barrier |
| pipeline layout | | root signature | |
| queue | parte do context | command queue | command queue |
| semaphore | fence, sync | fence | fence, event |
| shader module | shader object | `ID3DBlob` resultante de `D3DCompileFromFile` | shader library |
| shading rate attachment | | shading rate image | rasterization rate map |
| sparse block | sparse block | tile | sparse tile |
| sparse image | sparse texture | reserved resource (D3D12), tiled resource (D3D11) | sparse texture |
| storage buffer | shader storage buffer | raw ou structured buffer UAV | buffer no espaço de endereçamento `device` |
| subgroup | subgroup | wave | SIMD-group, quadgroup |
| surface | `HDC`, `GLXDrawable`, `EGLSurface` | window | layer |
| swapchain | parte de `HDC`, `GLXDrawable`, `EGLSurface` | swapchain | layer |
| swapchain image | default framebuffer | | drawable texture |
| task shader | | amplification shader | object shader |
| tessellation control shader | tessellation control shader | hull shader | tessellation compute kernel |
| tessellation evaluation shader | tessellation evaluation shader | domain shader | post-tessellation vertex shader |
| timeline semaphore | | D3D12 fence | event |
| transform feedback | transform feedback | stream-out | |
| uniform buffer | uniform buffer | constant buffer views (CBV) | buffer no espaço de endereçamento `constant` |
| workgroup | workgroup | threadgroup | threadgroup |
