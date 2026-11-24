# Resumo de Lançamentos do Vulkan

Cada versão *minor* do Vulkan [promoveu](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-compatibility-promotion) um conjunto diferente de extensões para o *core*. Isso significa que não é mais necessário habilitar uma extensão para usar sua funcionalidade se a aplicação solicitar pelo menos aquela versão do Vulkan (desde que a versão seja suportada pela implementação).

O resumo a seguir apresenta a lista das extensões adicionadas às respectivas versões *core* e o contexto de cada versão. Esta lista foi extraída da [Especificação Vulkan](https://docs.vulkan.org/spec/latest/appendices/versions.html), referenciando os respectivos tópicos no Vulkan Guide e na especificação.

## Vulkan 1.1

> **Nota:** [Seção da Especificação Vulkan — Vulkan 1.1](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.1)

O Vulkan 1.1 foi lançado em 7 de março de 2018.

Além das extensões listadas abaixo, o Vulkan 1.1 introduziu *subgroups* (consulte o capítulo sobre Subgroups), memória protegida (consulte o capítulo sobre Memória Protegida) e a capacidade de consultar a versão da instância.

- `VK_KHR_16bit_storage` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_bind_memory2` *(consulte o capítulo sobre Extensões de Limpeza / Expansões `pNext`)*
- `VK_KHR_dedicated_allocation` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_KHR_descriptor_update_template` *(consulte o capítulo sobre `VK_KHR_descriptor_update_template`)*
- `VK_KHR_device_group` *(consulte o capítulo sobre Device Groups)*
- `VK_KHR_device_group_creation` *(consulte o capítulo sobre Device Groups)*
- `VK_KHR_external_fence` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_external_fence_capabilities` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_external_memory` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_external_memory_capabilities` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_external_semaphore` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_external_semaphore_capabilities` *(consulte o capítulo sobre Memória e Sincronização Externas)*
- `VK_KHR_get_memory_requirements2` *(consulte o capítulo sobre Extensões de Limpeza / Expansões `pNext`)*
- `VK_KHR_get_physical_device_properties2` *(consulte o capítulo sobre Extensões de Limpeza / Expansões `pNext`)*
- `VK_KHR_maintenance1` *(consulte o capítulo sobre Extensões de Manutenção)*
- `VK_KHR_maintenance2` *(consulte o capítulo sobre Extensões de Manutenção)*
- `VK_KHR_maintenance3` *(consulte o capítulo sobre Extensões de Manutenção)*
- [`VK_KHR_multiview`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_multiview.html#_description)
- `VK_KHR_relaxed_block_layout` *(consulte o capítulo sobre Layout de Memória em Shaders)*
- `VK_KHR_sampler_ycbcr_conversion` *(consulte o capítulo sobre `VK_KHR_sampler_ycbcr_conversion`)*
- `VK_KHR_shader_draw_parameters` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_storage_buffer_storage_class` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_variable_pointers` *(consulte o capítulo sobre Recursos de Shaders)*

## Vulkan 1.2

> **Nota:** [Seção da Especificação Vulkan — Vulkan 1.2](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.2)

O Vulkan 1.2 foi lançado em 15 de janeiro de 2020.

- `VK_KHR_8bit_storage` *(consulte o capítulo sobre Recursos de Shaders)*
- [`VK_KHR_buffer_device_address`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_buffer_device_address.html#_description)
- `VK_KHR_create_renderpass2` *(consulte o capítulo sobre Extensões de Limpeza / Expansões `pNext`)*
- [`VK_KHR_depth_stencil_resolve`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_depth_stencil_resolve.html#_description)
- `VK_KHR_draw_indirect_count` *(consulte o capítulo sobre `VK_KHR_draw_indirect_count`)*
- `VK_KHR_driver_properties` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_KHR_image_format_list` *(consulte o capítulo sobre `VK_KHR_image_format_list`)*
- `VK_KHR_imageless_framebuffer` *(consulte o capítulo sobre `VK_KHR_imageless_framebuffer`)*
- `VK_KHR_sampler_mirror_clamp_to_edge` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_KHR_separate_depth_stencil_layouts` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_KHR_shader_atomic_int64` *(consulte o capítulo sobre Operações Atômicas)*
- `VK_KHR_shader_float16_int8` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_shader_float_controls` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_shader_subgroup_extended_types` *(consulte o capítulo sobre Subgroups)*
- `VK_KHR_spirv_1_4` *(consulte o capítulo sobre Recursos de Shaders)*
- [`VK_KHR_timeline_semaphore`](https://www.khronos.org/blog/vulkan-timeline-semaphores)
- `VK_KHR_uniform_buffer_standard_layout` *(consulte o capítulo sobre Layout de Memória em Shaders)*
- `VK_KHR_vulkan_memory_model` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_EXT_descriptor_indexing` *(consulte o capítulo sobre `VK_EXT_descriptor_indexing`)*
- `VK_EXT_host_query_reset` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_EXT_sampler_filter_minmax` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_EXT_scalar_block_layout` *(consulte o capítulo sobre Layout de Memória em Shaders)*
- `VK_EXT_separate_stencil_usage` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_EXT_shader_viewport_index_layer` *(consulte o capítulo sobre Recursos de Shaders)*

## Vulkan 1.3

> **Nota:** [Seção da Especificação Vulkan — Vulkan 1.3](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.3)

O Vulkan 1.3 foi lançado em 25 de janeiro de 2022.

- `VK_KHR_copy_commands2` *(consulte o capítulo sobre Extensões de Limpeza / Expansões `pNext`)*
- [`VK_KHR_dynamic_rendering`](https://www.khronos.org/blog/streamlining-render-passes)
- `VK_KHR_format_feature_flags2` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_KHR_maintenance4` *(consulte o capítulo sobre Extensões de Manutenção)*
- [`VK_KHR_shader_integer_dot_product`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_integer_dot_product.html#_description)
- `VK_KHR_shader_non_semantic_info` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_shader_terminate_invocation` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_KHR_synchronization2` *(consulte o capítulo sobre `VK_KHR_synchronization2`)*
- `VK_KHR_zero_initialize_workgroup_memory` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_EXT_4444_formats` *(consulte o capítulo sobre Extensões de Limpeza)*
- `VK_EXT_extended_dynamic_state` *(consulte o capítulo sobre Estado Dinâmico)*
- `VK_EXT_extended_dynamic_state2` *(consulte o capítulo sobre Estado Dinâmico)*
- `VK_EXT_image_robustness` *(consulte o capítulo sobre Robustez)*
- `VK_EXT_inline_uniform_block` *(consulte o capítulo sobre `VK_EXT_inline_uniform_block`)*
- [`VK_EXT_pipeline_creation_cache_control`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_creation_cache_control.html#_description)
- [`VK_EXT_pipeline_creation_feedback`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_creation_feedback.html#_description)
- [`VK_EXT_private_data`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_private_data.html#_description)
- `VK_EXT_shader_demote_to_helper_invocation` *(consulte o capítulo sobre Recursos de Shaders)*
- `VK_EXT_subgroup_size_control` *(consulte o capítulo sobre Subgroups)*
- [`VK_EXT_texel_buffer_alignment`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_texel_buffer_alignment.html#_description)
- [`VK_EXT_texture_compression_astc_hdr`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_texture_compression_astc_hdr.html#_description)
- [`VK_EXT_tooling_info`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_tooling_info.html#_description)
- `VK_EXT_ycbcr_2plane_444_formats` *(consulte o capítulo sobre Extensões de Limpeza)*

## Vulkan 1.4

> **Nota:** [Seção da Especificação Vulkan — Vulkan 1.4](https://docs.vulkan.org/spec/latest/appendices/versions.html#versions-1.4)

O Vulkan 1.4 foi lançado em 3 de dezembro de 2024.

- [`VK_KHR_dynamic_rendering_local_read`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_dynamic_rendering_local_read.html#_description)
- [`VK_KHR_global_priority`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_global_priority.html#_description)
- [`VK_KHR_index_type_uint8`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_index_type_uint8.html#_description)
- [`VK_KHR_line_rasterization`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_line_rasterization.html#_description)
- [`VK_KHR_load_store_op_none`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_load_store_op_none.html#_description)
- [`VK_KHR_maintenance5`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance5.html#_description)
- [`VK_KHR_maintenance6`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_maintenance6.html#_description)
- [`VK_KHR_map_memory2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_map_memory2.html#_description)
- [`VK_KHR_push_descriptor`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_push_descriptor.html#_description)
- [`VK_KHR_shader_expect_assume`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_expect_assume.html#_description)
- [`VK_KHR_shader_float_controls2`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_float_controls2.html#_description)
- [`VK_KHR_shader_subgroup_rotate`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_shader_subgroup_rotate.html#_description)
- [`VK_KHR_vertex_attribute_divisor`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_vertex_attribute_divisor.html#_description)
- [`VK_EXT_host_image_copy`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_host_image_copy.html#_description)
- [`VK_EXT_pipeline_protected_access`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_protected_access.html#_description)
- [`VK_EXT_pipeline_robustness`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_pipeline_robustness.html#_description)
