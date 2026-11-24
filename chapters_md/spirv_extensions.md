# Usando Extensões SPIR-V

SPIR-V (consulte o capítulo sobre *O que é SPIR-V*) é a representação de shader usada no momento de `vkCreateShaderModule`. Assim como o Vulkan, o [SPIR-V também possui extensões](https://github.com/KhronosGroup/SPIRV-Guide/blob/master/chapters/extension_overview.md) e um [sistema de capacidades (*capabilities*)](https://github.com/KhronosGroup/SPIRV-Guide/blob/master/chapters/capabilities.md).

É importante lembrar que SPIR-V é uma linguagem intermediária e não uma API; ele depende de uma API, como o Vulkan, para expor quais recursos estão disponíveis para a aplicação em tempo de execução. Este capítulo tem como objetivo explicar como o Vulkan, atuando como API cliente de SPIR-V, interage com as extensões e capacidades SPIR-V.

## Exemplo de Extensão SPIR-V

Neste exemplo, [`VK_KHR_8bit_storage`](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_8bit_storage.html) e [`SPV_KHR_8bit_storage`](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_8bit_storage.html) serão usadas para expor a capacidade `UniformAndStorageBuffer8BitAccess`. A seguir está a aparência do SPIR-V desmontado (*disassembled*):

```text
OpCapability Shader
OpCapability UniformAndStorageBuffer8BitAccess
OpExtension  "SPV_KHR_8bit_storage"
```

### Passos para usar recursos SPIR-V

1. Certifique-se de que a extensão e a capacidade SPIR-V estão disponíveis no Vulkan.
2. Verifique se a extensão, os recursos (*features*) ou a versão do Vulkan necessários são suportados.
3. Se necessário, habilite a extensão e os recursos do Vulkan.
4. Se necessário, verifique se existe uma extensão correspondente para a linguagem de shader de alto nível (por exemplo, GLSL ou HLSL) sendo utilizada.

Detalhando cada passo:

#### Verifique se o recurso SPIR-V é suportado

Dependendo do recurso de shader, pode ser necessária apenas uma `OpExtension` ou uma `OpCapability`. Neste exemplo, `UniformAndStorageBuffer8BitAccess` faz parte da extensão [`SPV_KHR_8bit_storage`](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_8bit_storage.html).

Para verificar se a extensão SPIR-V é suportada, consulte a [Tabela de Extensões SPIR-V Suportadas](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-extensions) na especificação do Vulkan.

![Tabela de extensões SPIR-V mostrando SPV_KHR_8bit_storage](images/spirv_extensions_8bit_extension.png)

Consulte também a [Tabela de Capacidades SPIR-V Suportadas](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#spirvenv-capabilities) na especificação do Vulkan.

![Tabela de capacidades SPIR-V mostrando UniformAndStorageBuffer8BitAccess](images/spirv_extensions_8bit_capability.png)

> **Nota:** Embora a tabela mencione `VkPhysicalDeviceVulkan12Features::uniformAndStorageBuffer8BitAccess`, o campo `VkPhysicalDevice8BitStorageFeatures::uniformAndStorageBuffer8BitAccess` é um alias e pode ser considerado equivalente aqui.

Felizmente, caso você esqueça de verificar, as *Vulkan Validation Layers* possuem uma [validação gerada automaticamente](https://github.com/KhronosGroup/Vulkan-ValidationLayers/blob/main/layers/vulkan/generated/spirv_validation_helper.cpp). Tanto as *Validation Layers* quanto as tabelas da especificação do Vulkan são baseadas no arquivo [`./xml/vk.xml`](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/xml/vk.xml).

```xml
<spirvcapability name="UniformAndStorageBuffer8BitAccess">
    <enable struct="VkPhysicalDeviceVulkan12Features" feature="uniformAndStorageBuffer8BitAccess" requires="VK_VERSION_1_2,VK_KHR_8bit_storage"/>
</spirvcapability>

<spirvextension name="SPV_KHR_8bit_storage">
    <enable version="VK_VERSION_1_2"/>
    <enable extension="VK_KHR_8bit_storage"/>
</spirvextension>
```

#### Verifique o suporte e habilite se necessário

Neste exemplo, é necessário ou `VK_KHR_8bit_storage` ou um dispositivo Vulkan 1.2.

Se estiver usando um dispositivo Vulkan 1.0 ou 1.1, a extensão `VK_KHR_8bit_storage` precisará ser suportada e habilitada no momento da criação do dispositivo (consulte o capítulo sobre *Habilitando Extensões*).

Independentemente de usar a extensão ou a versão do Vulkan, se exigido, a aplicação ainda **deve** garantir que qualquer recurso Vulkan correspondente necessário seja suportado e habilitado na criação do dispositivo (consulte o capítulo sobre *Habilitando Recursos*). Algumas extensões e capacidades SPIR-V não requerem um recurso Vulkan específico, mas tudo isso está listado nas tabelas da especificação.

Para este exemplo, o recurso `VkPhysicalDeviceVulkan12Features::uniformAndStorageBuffer8BitAccess` ou `VkPhysicalDevice8BitStorageFeatures::uniformAndStorageBuffer8BitAccess` deve ser suportado e habilitado.

#### Usando extensões na linguagem de shader de alto nível

Para este exemplo, o GLSL possui a extensão [`GL_EXT_shader_16bit_storage`](https://github.com/KhronosGroup/GLSL/blob/master/extensions/ext/GL_EXT_shader_16bit_storage.txt), que inclui a extensão correspondente `GL_EXT_shader_8bit_storage`.

Ferramentas como `glslang` e `SPIRV-Tools` se encarregarão de garantir que a `OpExtension` e a `OpCapability` correspondentes sejam utilizadas.
