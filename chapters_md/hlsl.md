# HLSL no Vulkan

O Vulkan não consome diretamente *shaders* em formato de texto legível por humanos; em vez disso, utiliza SPIR-V (consulte o capítulo sobre *O que é SPIR-V*) como representação intermediária. Isso abre a possibilidade de utilizar outras linguagens de *shader* além do GLSL, desde que elas possam gerar código para o ambiente SPIR-V do Vulkan.

Uma dessas linguagens é a High Level Shading Language (HLSL) da Microsoft, usada no DirectX. Graças às [adições recentes ao Vulkan 1.2](https://www.khronos.org/blog/hlsl-first-class-vulkan-shading-language), ela agora é considerada uma linguagem de *shading* de primeira classe para o Vulkan e pode ser usada com a mesma facilidade que o GLSL.

Com [algumas exceções](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst#unsupported-hlsl-features), todos os recursos do Vulkan e estágios de *shader* disponíveis no GLSL também podem ser usados com HLSL, incluindo adições recentes ao Vulkan como *ray tracing* acelerado por hardware. Por outro lado, o suporte de HLSL para SPIR-V também contempla recursos exclusivos do Vulkan que (ainda) não estão disponíveis no DirectX.

![Compilação de HLSL para SPIR-V usando DXC](images/what_is_spirv_dxc.png)

## Recursos Educacionais

Se você é novo em HLSL, um bom ponto de partida são os recursos de HLSL no [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl). Outra ótima fonte é a documentação [DirectX-Specs](https://microsoft.github.io/DirectX-Specs/), que contém informações valiosas sobre recursos recentes de *shaders* e os *shader models* do HLSL.

## Por Que Usar HLSL no Vulkan?

Existem várias vantagens em utilizar HLSL para o desenvolvimento com Vulkan:

* **Compatibilidade entre APIs**: escreva *shaders* que podem ser usados tanto no Vulkan quanto no DirectX com alterações mínimas.
* **Sintaxe familiar**: desenvolvedores com experiência em DirectX podem aproveitar o conhecimento já adquirido.
* **Adoção pela indústria**: o HLSL é amplamente utilizado em motores de jogos e aplicações gráficas.
* **Suporte de ferramentas**: rico ecossistema de ferramentas, depuradores e integrações com IDEs.

## Do Ponto de Vista da Aplicação

Do ponto de vista da aplicação, usar HLSL é exatamente igual a usar GLSL. Como a aplicação sempre consome *shaders* no formato SPIR-V, a única diferença está no ferramental usado para gerar os *shaders* SPIR-V a partir da linguagem de *shading* desejada.

## Boas Práticas para Escrever Shaders em HLSL para Vulkan

### Organização de Código

* **Separe os estágios de shader**: mantenha diferentes estágios de *shader* (vértice, fragmento, computação, etc.) em arquivos separados.
* **Use estruturas para entradas e saídas**: defina estruturas claras para as entradas e saídas dos *shaders*.
* **Convenções de nomenclatura consistentes**: adote um padrão consistente para nomes de variáveis, funções e tipos.
* **Design modular**: divida *shaders* complexos em funções e componentes reutilizáveis.

Exemplo de um *shader* HLSL bem organizado:

```hlsl
// Estruturas e constantes comuns
struct VSInput {
    [[vk::location(0)]] float3 Position : POSITION0;
    [[vk::location(1)]] float3 Normal : NORMAL0;
    [[vk::location(2)]] float2 TexCoord : TEXCOORD0;
};
struct VSOutput {
    float4 Position : SV_POSITION;
    [[vk::location(0)]] float3 WorldPos : POSITION0;
    [[vk::location(1)]] float3 Normal : NORMAL0;
    [[vk::location(2)]] float2 TexCoord : TEXCOORD0;
};
// Uniform buffer com matrizes de transformação
struct SceneUBO {
    float4x4 model;
    float4x4 view;
    float4x4 projection;
};
[[vk::binding(0, 0)]]
ConstantBuffer<SceneUBO> ubo : register(b0, space0);
// Função principal do vertex shader
VSOutput main(VSInput input) {
    VSOutput output = (VSOutput)0;
    // Transforma a posição para o espaço de recorte (clip space)
    float4 worldPos = mul(ubo.model, float4(input.Position, 1.0));
    output.Position = mul(ubo.projection, mul(ubo.view, worldPos));
    // Repassa os demais atributos
    output.WorldPos = worldPos.xyz;
    output.Normal = mul((float3x3)ubo.model, input.Normal);
    output.TexCoord = input.TexCoord;
    return output;
}
```

### Considerações de Desempenho

* **Minimize fluxo de controle divergente**: evite ramificações complexas dentro de *wavefronts* de *shader*.
* **Otimize padrões de acesso à memória**: agrupe dados relacionados para melhorar a coerência de cache.
* **Reduza a pressão sobre registradores**: limite o número de variáveis em trechos com alto uso de registradores.
* **Use a precisão apropriada**: utilize tipos de menor precisão (`half`, `min16float`) quando precisão total não for necessária.
* **Aproveite operações de subgrupo**: use intrínsecas de subgrupo/*wave* para operações paralelas eficientes.
* **Prefira constantes de tempo de compilação**: utilize constantes de especialização (*specialization constants*) para valores conhecidos no momento da criação do *pipeline*.

Exemplo de uso de constantes de especialização:

```hlsl
// Define constantes de especialização
[[vk::constant_id(0)]] const bool USE_NORMAL_MAPPING = true;
[[vk::constant_id(1)]] const int LIGHT_COUNT = 4;
[[vk::constant_id(2)]] const float SPECULAR_POWER = 32.0;
// Uso em código condicional
float3 CalculateNormal(float3 normal, float3 tangent, float2 texCoord) {
    if (USE_NORMAL_MAPPING) {
        // Cálculo complexo de normal mapping
        return CalculateNormalFromMap(normal, tangent, texCoord);
    } else {
        // Repasse simples
        return normalize(normal);
    }
}
```

### Depuração e Validação

* **Adicione marcadores de depuração**: use comentários ou variáveis de depuração para demarcar seções importantes.
* **Valide entradas**: verifique valores `NaN` ou inválidos em cálculos críticos.
* **Use camadas de validação**: habilite as *validation layers* do Vulkan durante o desenvolvimento.
* **Aproveite ferramentas de depuração de shaders**: use ferramentas como RenderDoc ou NVIDIA Nsight para depuração de *shaders*.
* **Implemente caminhos alternativos (*fallbacks*)**: forneça caminhos de código mais simples para depurar algoritmos complexos.

### Boas Práticas Específicas do Vulkan

* **Vínculos (*bindings*) explícitos**: sempre especifique índices explícitos de *descriptor set* e *binding*.
* **Layouts de descritores consistentes**: mantenha *descriptor layouts* consistentes entre os estágios de *shader*.
* **Minimize trocas de descriptor sets**: agrupe recursos para minimizar alterações de *descriptor sets* durante a renderização.
* **Considere push constants**: use *push constants* para pequenos blocos de dados que mudam com frequência.
* **Atente-se às limitações do SPIR-V**: alguns recursos do HLSL podem não ser traduzidos diretamente para SPIR-V.

## Migração de GLSL para HLSL

Para uma comparação detalhada, lado a lado, entre a sintaxe, os tipos de dados, o vínculo de recursos, os *built-ins* versus semânticas e outros aspectos de GLSL e HLSL, consulte o capítulo sobre *Comparação de Linguagens de Shader de Alto Nível*.

## Semânticas, Bindings e Pontos de Entrada Específicos do Vulkan

### Descriptor Binding em HLSL

O HLSL oferece duas abordagens para vincular recursos no Vulkan:

* **Sintaxe de registradores HLSL**:

```hlsl
Texture2D albedoMap : register(t0, space1);
SamplerState samplerState : register(s0, space1);
```

* **Atributos específicos do Vulkan**:

```hlsl
[[vk::binding(0, 1)]]
Texture2D albedoMap;
[[vk::binding(0, 1)]]
SamplerState samplerState;
```

Também é possível combinar ambas as abordagens para manter compatibilidade entre APIs:

```hlsl
[[vk::binding(0, 1)]]
Texture2D albedoMap : register(t0, space1);
```

### Tipos de Recursos e Espaços de Registradores (*Register Spaces*)

| Tipo de Recurso | Tipo HLSL | Tipo de Registrador | Equivalente no Vulkan |
| --- | --- | --- | --- |
| Uniform Buffer | `ConstantBuffer<T>` | `b` | `VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER` |
| Storage Buffer | `RWStructuredBuffer<T>` | `u` | `VK_DESCRIPTOR_TYPE_STORAGE_BUFFER` |
| Textura | `Texture2D`, `Texture3D`, etc. | `t` | `VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE` |
| Storage Image | `RWTexture2D`, etc. | `u` | `VK_DESCRIPTOR_TYPE_STORAGE_IMAGE` |
| Sampler | `SamplerState` | `s` | `VK_DESCRIPTOR_TYPE_SAMPLER` |

## Manual de Mapeamento de Recursos HLSL para SPIR-V

Um ótimo ponto de partida para usar HLSL no Vulkan via SPIR-V é o [Manual de Mapeamento de Recursos HLSL para SPIR-V](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst). Ele contém informações detalhadas sobre semânticas, sintaxe, recursos e extensões suportados, entre muitos outros tópicos, sendo leitura obrigatória. O guia de equivalências (*Decoder Ring*, consulte o capítulo correspondente) também possui uma tabela de tradução para conceitos e termos usados no Vulkan e no DirectX.

## O Namespace Vulkan do HLSL

Para tornar o HLSL compatível com o Vulkan, foi introduzido um [namespace implícito](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst#the-implicit-vk-namespace) (`vk`) que fornece uma interface para recursos específicos do Vulkan.

## Comparação de Sintaxe

De forma semelhante às linguagens de programação tradicionais, HLSL e GLSL diferem em sua sintaxe. Enquanto o GLSL é mais procedural (como C), o HLSL é mais orientado a objetos (como C++).

A seguir está o mesmo *shader* escrito em ambas as linguagens para oferecer uma comparação rápida das diferenças básicas, incluindo o *namespace* mencionado anteriormente que, por exemplo, adiciona localizações (*locations*) explícitas:

### GLSL

[Testar Online](https://godbolt.org/z/jcPofTK9j)

```glsl
#version 450

layout (location = 0) in vec3 inPosition;
layout (location = 1) in vec3 inColor;

layout (binding = 0) uniform UBO
{
	mat4 projectionMatrix;
	mat4 modelMatrix;
	mat4 viewMatrix;
} ubo;

layout (location = 0) out vec3 outColor;

void main()
{
	outColor = inColor * float(gl_VertexIndex);
	gl_Position = ubo.projectionMatrix * ubo.viewMatrix * ubo.modelMatrix * vec4(inPosition.xyz, 1.0);
}
```

### HLSL

[Testar Online](https://godbolt.org/z/Y4sd9anMY)

```hlsl
struct VSInput
{
[[vk::location(0)]] float3 Position : POSITION0;
[[vk::location(1)]] float3 Color : COLOR0;
};

struct UBO
{
	float4x4 projectionMatrix;
	float4x4 modelMatrix;
	float4x4 viewMatrix;
};

cbuffer ubo : register(b0, space0) { UBO ubo; }

struct VSOutput
{
	float4 Pos : SV_POSITION;
[[vk::location(0)]] float3 Color : COLOR0;
};

VSOutput main(VSInput input, uint VertexIndex : SV_VertexID)
{
	VSOutput output = (VSOutput)0;
	output.Color = input.Color * float(VertexIndex);
	output.Pos = mul(ubo.projectionMatrix, mul(ubo.viewMatrix, mul(ubo.modelMatrix, float4(input.Position.xyz, 1.0))));
	return output;
}
```

Além das diferenças de sintaxe, variáveis *built-in* utilizam nomes do HLSL. Por exemplo, `gl_VertexIndex` torna-se `VertexIndex` (com a semântica `SV_VertexID`) em HLSL. Uma lista de mapeamentos de *built-ins* entre GLSL e HLSL pode ser encontrada [aqui](https://anteru.net/blog/2016/mapping-between-HLSL-and-GLSL/).

## DirectXShaderCompiler (DXC)

Assim como ocorre com GLSL para SPIR-V, para usar HLSL com Vulkan é necessário um compilador de *shaders*. Enquanto o [glslang](https://github.com/KhronosGroup/glslang) é o compilador de referência de GLSL para SPIR-V, o [DirectXShaderCompiler](https://github.com/microsoft/DirectXShaderCompiler) (DXC) é o compilador de referência de HLSL para SPIR-V. Graças a contribuições da comunidade de código aberto, o *backend* SPIR-V do DXC agora é suportado e habilitado nas compilações oficiais de lançamento, podendo ser usado imediatamente. Embora outras ferramentas de compilação de *shaders* como o [glslang](https://github.com/KhronosGroup/glslang/wiki/HLSL-FAQ) também ofereçam suporte a HLSL, o DXC possui o suporte mais completo e atualizado, sendo a forma recomendada de gerar SPIR-V a partir de HLSL.

### Onde Obter

O [LunarG Vulkan SDK](https://vulkan.lunarg.com/) inclui binários pré-compilados, bibliotecas e cabeçalhos do DXC para você começar rapidamente. Se estiver procurando pelas versões mais recentes, consulte o [repositório oficial do DXC](https://github.com/microsoft/DirectXShaderCompiler/releases).

### Compilação Offline Usando o Compilador Independente

Compilar um *shader* offline por meio do binário pré-compilado `dxc` é semelhante a compilar com o `glslang`:

```text
dxc.exe -spirv -T vs_6_0 -E main .\triangle.vert -Fo .\triangle.vert.spv
```

`-T` seleciona o perfil contra o qual o *shader* será compilado (`vs_6_0` = *Vertex shader model 6*, `ps_6_0` = *Pixel/fragment shader model 6*, etc.).

`-E` seleciona o ponto de entrada principal (*entry point*) do *shader*.

Extensões são habilitadas implicitamente com base no uso dos recursos, mas também podem ser especificadas explicitamente:

```text
dxc.exe -spirv -T vs_6_1 -E main .\input.vert -Fo .\output.vert.spv -fspv-extension=SPV_EXT_descriptor_indexing
```

O SPIR-V resultante pode então ser carregado diretamente, da mesma forma que o SPIR-V gerado a partir de GLSL.

### Compilação em Tempo de Execução Usando a Biblioteca

O DXC também pode ser integrado a uma aplicação Vulkan por meio da API DirectX Compiler, permitindo a compilação de *shaders* em tempo de execução. Para isso, é necessário incluir o cabeçalho `dxcapi.h` e fazer a vinculação (*link*) com a biblioteca `dxcompiler`. A maneira mais fácil é usar a biblioteca dinâmica e distribuí-la junto à sua aplicação (por exemplo, `dxcompiler.dll` no Windows).

Compilar HLSL para SPIR-V em tempo de execução é bastante direto:

```cpp
#include "include/dxc/dxcapi.h"

#include <array>
#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

// ...

HRESULT hres{};

// Inicializa a biblioteca DXC
CComPtr<IDxcLibrary> library;
hres = DxcCreateInstance(CLSID_DxcLibrary, IID_PPV_ARGS(&library));
if (FAILED(hres)) {
    throw std::runtime_error("Não foi possível inicializar a DXC Library");
}

// Inicializa o compilador DXC
CComPtr<IDxcCompiler3> compiler;
hres = DxcCreateInstance(CLSID_DxcCompiler, IID_PPV_ARGS(&compiler));
if (FAILED(hres)) {
    throw std::runtime_error("Não foi possível inicializar o DXC Compiler");
}

// Inicializa os utilitários do DXC
CComPtr<IDxcUtils> utils;
hres = DxcCreateInstance(CLSID_DxcUtils, IID_PPV_ARGS(&utils));
if (FAILED(hres)) {
    throw std::runtime_error("Não foi possível inicializar o DXC Utils");
}

// Carrega o arquivo de texto do shader HLSL a partir do disco
uint32_t codePage = DXC_CP_ACP;
CComPtr<IDxcBlobEncoding> sourceBlob;
hres = utils->LoadFile(filename.c_str(), &codePage, &sourceBlob);
if (FAILED(hres)) {
    throw std::runtime_error("Não foi possível carregar o arquivo do shader");
}

// Seleciona o perfil de destino com base na extensão do arquivo do shader
LPCWSTR targetProfile = nullptr;
if (const auto idx = filename.rfind(L'.'); idx != std::wstring::npos) {
    const std::wstring_view extension = std::wstring_view(filename).substr(idx + 1);
    if (extension == L"vert") {
        targetProfile = L"vs_6_1";
    } else if (extension == L"frag") {
        targetProfile = L"ps_6_1";
    }
    // O mapeamento para outros tipos de arquivo vai aqui (cs_x_y, lib_x_y, etc.)
}

// Configura os argumentos do compilador para compilar o shader HLSL para SPIR-V
const std::vector<LPCWSTR> arguments = {
    // (Opcional) Nome do arquivo do shader a ser exibido, por exemplo, em mensagens de erro
    filename.c_str(),
    // Ponto de entrada principal do shader
    L"-E", L"main",
    // Perfil de destino do shader
    L"-T", targetProfile,
    // Compila para SPIR-V
    L"-spirv"
};

// Compila o shader
const DxcBuffer buffer{
    .Ptr = sourceBlob->GetBufferPointer(),
    .Size = sourceBlob->GetBufferSize(),
    .Encoding = DXC_CP_ACP,
};

CComPtr<IDxcResult> result;
hres = compiler->Compile(
    &buffer,
    arguments.data(),
    static_cast<uint32_t>(arguments.size()),
    nullptr,
    IID_PPV_ARGS(&result));

if (SUCCEEDED(hres)) {
    result->GetStatus(&hres);
}

// Exibe erro caso a compilação tenha falhado
if (FAILED(hres) && result) {
    CComPtr<IDxcBlobEncoding> errorBlob;
    hres = result->GetErrorBuffer(&errorBlob);
    if (SUCCEEDED(hres) && errorBlob) {
        std::cerr << "Falha na compilação do shader:\n\n"
                  << static_cast<const char*>(errorBlob->GetBufferPointer());
        throw std::runtime_error("Falha na compilação");
    }
}

// Obtém o resultado da compilação
CComPtr<IDxcBlob> code;
result->GetResult(&code);

// Cria um shader module do Vulkan a partir do resultado da compilação
const VkShaderModuleCreateInfo shaderModuleCI{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .codeSize = code->GetBufferSize(),
    .pCode = static_cast<const uint32_t*>(code->GetBufferPointer()),
};
VkShaderModule shaderModule = VK_NULL_HANDLE;
vkCreateShaderModule(device, &shaderModuleCI, nullptr, &shaderModule);
```

### Mapeamento de Estágios de Shader do Vulkan para Perfis de Destino HLSL

Ao compilar HLSL com o DXC, é necessário selecionar um perfil de destino (*target shader profile*). O nome de um perfil consiste no tipo de *shader* seguido do *shader model* desejado.

| Estágio de Shader do Vulkan | Perfil de Destino HLSL | Observações |
| --- | --- | --- |
| `VK_SHADER_STAGE_VERTEX_BIT` | `vs` | |
| `VK_SHADER_STAGE_TESSELLATION_CONTROL_BIT` | `hs` | *Hull shader* na terminologia HLSL |
| `VK_SHADER_STAGE_TESSELLATION_EVALUATION_BIT` | `ds` | *Domain shader* na terminologia HLSL |
| `VK_SHADER_STAGE_GEOMETRY_BIT` | `gs` | |
| `VK_SHADER_STAGE_FRAGMENT_BIT` | `ps` | *Pixel shader* na terminologia HLSL |
| `VK_SHADER_STAGE_COMPUTE_BIT` | `cs` | |
| `VK_SHADER_STAGE_RAYGEN_BIT_KHR`, `VK_SHADER_STAGE_ANY_HIT_BIT_KHR`, `VK_SHADER_STAGE_CLOSEST_HIT_BIT_KHR`, `VK_SHADER_STAGE_MISS_BIT_KHR`, `VK_SHADER_STAGE_INTERSECTION_BIT_KHR`, `VK_SHADER_STAGE_CALLABLE_BIT_KHR` | `lib` | Todos os *shaders* relacionados a *ray tracing* são compilados usando o perfil `lib` e devem usar pelo menos o *shader model* 6.3 (por exemplo, `lib_6_3`). |
| `VK_SHADER_STAGE_TASK_BIT_EXT` | `as` | *Amplification shader* na terminologia HLSL. Deve usar pelo menos o *shader model* 6.5 (por exemplo, `as_6_5`). |
| `VK_SHADER_STAGE_MESH_BIT_EXT` | `ms` | Deve usar pelo menos o *shader model* 6.5 (por exemplo, `ms_6_5`). |

Assim, se você quiser compilar um *compute shader* usando recursos do *shader model* 6.6, o perfil de destino será `cs_6_6`. Para um *ray tracing any-hit shader*, será `lib_6_3`.

## Cobertura de Shader Models

O DirectX e o HLSL usam uma noção fixa de *shader model* para descrever o conjunto de recursos suportados. Isso difere da abordagem flexível baseada em extensões utilizada pelo Vulkan e pelo SPIR-V para adicionar recursos aos *shaders*. A tabela a seguir procura listar a cobertura do Vulkan para os *shader models* do HLSL, sem garantia de completude:

| Shader Model | Suportado | Observações |
| --- | --- | --- |
| Shader Model 5.1 e anteriores | ✔ | Excluindo recursos sem equivalente no Vulkan |
| [Shader Model 6.0](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.0) | ✔ | Intrínsecas de *wave*, inteiros de 64 bits |
| [Shader Model 6.1](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.1) | ✔ | `SV_ViewID`, `SV_Barycentrics` |
| [Shader Model 6.2](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.2) | ✔ | Tipos de 16 bits, modo *denorm* |
| [Shader Model 6.3](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.3) | ✔ | *Ray tracing* acelerado por hardware |
| [Shader Model 6.4](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.4) | ✔ | Produto escalar de inteiros em *shader*, `SV_ShadingRate` |
| [Shader Model 6.5](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.5) | ⚠️ (parcialmente) | DXR 1.1 (*KHR ray tracing*), *Mesh* e *Amplification shaders*, intrínsecas de *wave* adicionais |
| [Shader Model 6.6](https://github.com/microsoft/DirectXShaderCompiler/wiki/Shader-Model-6.6) | ⚠️ (parcialmente) | `VK_NV_compute_shader_derivatives`, `VK_KHR_shader_atomic_int64`, `VK_EXT_descriptor_buffer`, `VK_EXT_mutable_descriptor_type` |
| [Shader Model 6.7](https://microsoft.github.io/DirectX-Specs/d3d/HLSL_ShaderModel6_7.html) | ⚠️ (parcialmente) | `VK_KHR_shader_quad_control`, `VkPhysicalDeviceFeatures::shaderStorageImageMultisample` |

## Conclusão

O HLSL oferece uma alternativa poderosa ao GLSL para o desenvolvimento de *shaders* no Vulkan. Ao seguir as boas práticas e diretrizes deste capítulo, você pode criar *shaders* eficientes, sustentáveis e portáteis que aproveitam os pontos fortes do HLSL enquanto tiram máximo proveito das capacidades do Vulkan.

A migração de GLSL para HLSL pode exigir algum esforço, mas os benefícios em termos de reutilização de código, recursos da linguagem e compatibilidade entre APIs podem ser significativos para muitos projetos.

## Referências e Leituras Complementares

* [HLSL to SPIR-V Feature Mapping Manual](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst)
* [SPIR-V Guide](https://github.com/KhronosGroup/SPIRV-Guide)
* [HLSL as a First Class Vulkan Shading Language](https://www.khronos.org/blog/hlsl-first-class-vulkan-shading-language)
* [Vulkan Interfaces with SPIR-V](https://docs.vulkan.org/spec/latest/chapters/interfaces.html)
* [Microsoft HLSL Documentation](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl)
