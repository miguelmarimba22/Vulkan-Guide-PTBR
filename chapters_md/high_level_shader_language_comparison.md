# Comparação de Linguagens de Shader de Alto Nível no Vulkan

Embora o Vulkan em si consuma *shaders* em um formato binário chamado SPIR-V (consulte o capítulo sobre *O que é SPIR-V*), os *shaders* geralmente são escritos em uma linguagem de alto nível. Esta seção fornece um mapeamento entre funcionalidades de *shader* para as linguagens mais comuns usadas com Vulkan: GLSL, HLSL e Slang. O conteúdo é voltado principalmente para quem deseja migrar de uma linguagem de *shader* de alto nível para outra, servindo como ponto de partida e não como um guia completo de portabilidade de uma linguagem para outra.

> **Dica:** Para mais detalhes sobre o uso de HLSL com Vulkan, consulte o capítulo sobre *HLSL no Vulkan*.
>
> Para mais detalhes sobre o uso de Slang com Vulkan, consulte o capítulo sobre *Linguagem de Shading Slang no Vulkan*.

> **Nota:** As listagens a seguir não são de forma alguma exaustivas, e mapeamentos para extensões mais recentes podem estar ausentes. Observe também que os conceitos nem sempre possuem correspondência 1:1 entre as linguagens. Por exemplo, não existem semânticas em GLSL, enquanto algumas funcionalidades mais novas de GLSL podem (ainda) não estar disponíveis em HLSL ou Slang.
>
> O Slang é amplamente compatível com o HLSL 2018, mas adiciona diversos recursos avançados como genéricos, interfaces e módulos. Na maioria dos casos em que a sintaxe HLSL é exibida, o Slang suporta a mesma sintaxe, podendo oferecer opções adicionais.

## Extensões

Em GLSL, as extensões precisam ser habilitadas explicitamente usando a diretiva `#extension`. Isso **não** é necessário em HLSL ou Slang. Ambos os compiladores selecionam implicitamente as extensões SPIR-V adequadas com base no *shader*.

No HLSL, se necessário, é possível usar os argumentos `-fspv-extension` para selecionar extensões explicitamente.

No Slang, extensões podem ser habilitadas explicitamente por meio de opções de linha de comando como `-D` ou pela API do Slang. O Slang também suporta intrínsecas SPIR-V semelhantes às do HLSL.

## Tipos de Dados

> **Nota:** Os tipos funcionam de maneira semelhante em GLSL, HLSL e Slang. O GLSL possui tipos explícitos para vetores ou matrizes, enquanto o HLSL e o Slang utilizam tipos básicos com sufixos numéricos. O HLSL oferece alguns recursos avançados de tipos, como *templates* de C++, e o Slang estende isso ainda mais com suporte completo a genéricos. Esta seção apresenta um resumo básico com exemplos para mostrar as diferenças de tipos entre as linguagens.

| GLSL | HLSL | Exemplo | Específico do Slang |
| --- | --- | --- | --- |
| `vec` *n* | `float` *n* | `vec4` -> `float4` | |
| `ivec` *n* | `int` *n* | `ivec3` -> `int3` | |
| `mat` *nxm* ou abreviação `mat` *n* | `float` *nxm* | `mat4` -> `float4x4` | |
| n/a | n/a | | tipos de interface (*interface types*) |
| n/a | *templates* limitados | | suporte completo a genéricos |

> **Nota:** O Slang usa os mesmos tipos de dados básicos do HLSL (`float`*n*, `int`*n*, `float`*nxm*, etc.), mas adiciona diversos recursos avançados, como interfaces e suporte completo a genéricos.

* [Tipos de dados HLSL (Microsoft)](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-data-types)
* [Tipos de dados GLSL (OpenGL Wiki)](https://www.khronos.org/opengl/wiki/Data_Type_(GLSL))
* [Tipos de dados Slang](https://docs.shader-slang.org/en/latest/external/core-module-reference/types/index.html)

A sintaxe para conversão (*casting*) de tipos difere entre as linguagens:

### GLSL

```glsl
mat4x3 mat = mat4x3(ubo.view);
```

### HLSL

```hlsl
float4x3 mat = (float4x3)(ubo.view);
```

### Slang

```slang
float4x3 mat = (float4x3)(ubo.view);
// Ou usando genéricos
let mat = cast<float4x3>(ubo.view);
```

### Layout de Matriz

É importante ter em mente que matrizes em GLSL são *column-major* (armazenadas por coluna), enquanto matrizes em HLSL e Slang são *row-major* (armazenadas por linha) por padrão. Isso afeta aspectos como a construção e a multiplicação de matrizes.

| GLSL | HLSL |
| --- | --- |
| `M * v` | `mul(v, M)` |

![Layout de memória de uma matriz 4x4 com elementos numerados de 0 a 15. Na ordem column-major (GLSL), os números percorrem cada coluna: 0 a 3 preenchem a primeira coluna, 4 a 7 a segunda, e assim por diante, e a matriz é multiplicada por um vetor coluna. Na ordem row-major (HLSL), os números percorrem cada linha: 0 a 3 preenchem a primeira linha, e um vetor linha é multiplicado pela matriz com mul.](images/high_level_shader_language_comparison_matrix.png)

### Tipos Específicos do Slang

O Slang estende o sistema de tipos do HLSL com vários recursos avançados:

#### Interfaces

O Slang suporta interfaces semelhantes às de C# ou Java:

```slang
interface IMaterial {
    float3 evaluateBRDF(float3 viewDir, float3 lightDir, float3 normal);
}

struct LambertianMaterial : IMaterial {
    float3 albedo;

    float3 evaluateBRDF(float3 viewDir, float3 lightDir, float3 normal) {
        return albedo * max(0, dot(normal, lightDir)) / 3.14159;
    }
}
```

#### Genéricos

O Slang oferece suporte completo a genéricos:

```slang
// Função genérica
T min<T>(T a, T b) {
    return a < b ? a : b;
}

// Estrutura genérica
struct Array<T, let N : int> {
    T data[N];

    T getElement(int index) { return data[index]; }
}

// Uso
float result = min<float>(1.0, 2.0);
Array<float, 4> myArray;
```

## Namespace Implícito `vk`

Para conceitos do Vulkan que não estão disponíveis no DirectX, foi adicionado um [namespace implícito](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst#the-implicit-vk-namespace) (`vk`) que marca recursos específicos do Vulkan.

O Slang suporta o mesmo *namespace* `vk` do HLSL para funcionalidades específicas do Vulkan. Isso permite que código Slang utilize os mesmos atributos e funções específicos do Vulkan presentes no HLSL:

```slang
// Vinculando um recurso em Slang usando o namespace vk
[[vk::binding(0, 0)]]
Texture2D albedoMap;

// Push constants em Slang
struct PushConstants {
    float4x4 transform;
};
[[vk::push_constant]]
PushConstants pushConstants;
```

Além de suportar o *namespace* `vk` do HLSL, o Slang também oferece seu próprio sistema de *parameter blocks* que pode ser usado em conjunto com o *namespace* `vk` para um vínculo de recursos mais organizado (consulte a seção *Parameter Blocks do Slang* abaixo).

## Macro SPIR-V

Ao usar o DXC (consulte o capítulo sobre *HLSL no Vulkan*) para compilar HLSL para SPIR-V, você pode utilizar a macro `__spirv__` para código específico do Vulkan. Isso é útil quando *shaders* HLSL precisam funcionar tanto com Vulkan quanto com D3D:

```hlsl
#ifdef __spirv__
[[vk::binding(0, 1)]]
#endif
ConstantBuffer<Node> node : register(b0, space1);
```

O Slang fornece recursos semelhantes de compilação condicional, porém com mais opções para desenvolvimento multi-API. O Slang não define automaticamente macros de pré-processador específicas de destino (o pré-processamento é executado uma única vez, independentemente de quantos destinos estão sendo compilados), portanto qualquer macro de destino precisa ser passada pela linha de comando com `-D`:

```slang
// TARGET_VULKAN é definida na linha de comando,
// por exemplo: `slangc -target spirv -DTARGET_VULKAN=1 ...`
#ifdef TARGET_VULKAN
[[vk::binding(0, 1)]]
#endif
ConstantBuffer<Node> node : register(b0, space1);

// Usar parameter blocks agnósticos de destino do Slang evita
// totalmente a necessidade de compilação condicional
ParameterBlock<Resources> resources;
```

O sistema de compilação multi-destino do Slang permite escrever *shaders* que podem ser compilados para múltiplas APIs gráficas a partir de um único arquivo-fonte, utilizando compilação condicional para tratar diferenças específicas de API quando *parameter blocks* não forem a melhor opção.

## Intrínsecas SPIR-V

O DXC suporta [intrínsecas SPIR-V](https://github.com/microsoft/DirectXShaderCompiler/wiki/GL_EXT_spirv_intrinsics-for-SPIR-V-code-gen) por meio da extensão `GL_EXT_spirv_intrinsics`. Isso adiciona suporte para embutir SPIR-V arbitrário no meio de código HLSL para recursos não disponíveis no DirectX. Para isso, novas palavras-chave foram adicionadas ao *namespace* `vk` que mapeiam *opcodes* SPIR-V, incluindo `vk::ext_extension`, `vk::ext_capability`, `vk::ext_builtin_input`, `vk::ext_execution_mode` e `vk::ext_instruction`.

### Exemplo de uso da extensão SPIR-V de exportação de stencil em HLSL

```hlsl
[[vk::ext_capability(/* StencilExportEXT */ 5013)]]
[[vk::ext_extension("SPV_EXT_shader_stencil_export")]]
vk::ext_execution_mode(/* StencilRefReplacingEXT */ 5027);
```

### Exemplo de configuração do built-in para acessar posições de vértices em ray tracing

```hlsl
[[vk::ext_extension("SPV_KHR_ray_tracing_position_fetch")]]
[[vk::ext_capability(RayTracingPositionFetchKHR)]]
[[vk::ext_builtin_input(HitTriangleVertexPositionsKHR)]]
const static float3 gl_HitTriangleVertexPositions[3];
```

O Slang suporta os mesmos recursos de intrínsecas SPIR-V que o HLSL, permitindo acessar funcionalidades específicas do Vulkan que não possuem mapeamento direto na linguagem. A sintaxe é idêntica à do HLSL:

```slang
[[vk::ext_capability(/* StencilExportEXT */ 5013)]]
[[vk::ext_extension("SPV_EXT_shader_stencil_export")]]
vk::ext_execution_mode(/* StencilRefReplacingEXT */ 5027);
```

Além disso, o Slang oferece uma abordagem mais estruturada para capacidades de extensão por meio de seu sistema de módulos, permitindo encapsular código específico de extensões em módulos dedicados:

```slang
// Em um módulo dedicado para funcionalidade de exportação de stencil
module Extensions.StencilExport;

[[vk::ext_capability(/* StencilExportEXT */ 5013)]]
[[vk::ext_extension("SPV_EXT_shader_stencil_export")]]
vk::ext_execution_mode(/* StencilRefReplacingEXT */ 5027);

public void writeStencil(uint value) {
    // Implementação usando stencil export
}

// No código do shader principal
import Extensions.StencilExport;

void main() {
    // Usa a funcionalidade da extensão
    writeStencil(42);
}
```

## Built-ins vs. Semânticas

> **Nota:** Enquanto o GLSL faz uso extensivo de variáveis de entrada e saída embutidas na linguagem chamadas *built-ins*, não existe esse conceito em HLSL ou Slang. Em vez disso, HLSL e Slang usam [semânticas](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-semantics) (*semantics*), que são identificadores anexados a entradas ou saídas contendo informações sobre o uso pretendido daquela variável. Elas recebem o prefixo `SV_`. Em HLSL e Slang, os valores de entrada são argumentos explícitos do ponto de entrada principal e o *shader* precisa retornar explicitamente uma saída.
>
> O Slang segue a abordagem baseada em semânticas do HLSL, mas oferece recursos adicionais por meio de seu sistema de interfaces que podem abstrair parte dos detalhes das semânticas.

### Abstrações de Interface no Slang

O Slang permite definir interfaces capazes de abstrair parte dos detalhes das semânticas:

```slang
// Define uma interface de vertex shader
interface IVertexShader
{
    // Estrutura de entrada com semânticas
    struct Input
    {
        float3 position;
        float3 normal;
        float2 texCoord;
    };

    // Estrutura de saída com semânticas
    struct Output
    {
        float4 position : SV_POSITION;
        float3 worldPos : POSITION0;
        float3 normal : NORMAL0;
        float2 texCoord : TEXCOORD0;
    };

    // Função de vertex shader
    Output computeVertex(Input input);
}

// Implementa a interface
struct StandardVertexShader : IVertexShader
{
    // Implementação da função de vertex shader
    IVertexShader.Output computeVertex(IVertexShader.Input input)
    {
        IVertexShader.Output output;
        // Implementação...
        return output;
    }
}

// Usa a interface em um ponto de entrada de shader
[shader("vertex")]
IVertexShader.Output vertexMain(IVertexShader.Input input)
{
    StandardVertexShader vertexShader;
    return vertexShader.computeVertex(input);
}
```

Essa abordagem permite código de *shader* mais modular e reutilizável, continuando a tirar proveito do sistema de semânticas.

### Exemplos

#### Escrevendo posições a partir do vertex shader

##### GLSL

```glsl
layout (location = 0) in vec4 inPos;

void main() {
    // A posição de saída do vértice é escrita no built-in gl_Position
    gl_Position = ubo.projectionMatrix * ubo.viewMatrix * ubo.modelMatrix * inPos;
}
```

##### HLSL

```hlsl
struct VSOutput
{
    // A semântica SV_POSITION declara o membro Pos como a posição de saída do vértice
    float4 Pos : SV_POSITION;
};

VSOutput main(VSInput input)
{
    VSOutput output = (VSOutput)0;
    output.Pos = mul(ubo.projectionMatrix, mul(ubo.viewMatrix, mul(ubo.modelMatrix, input.Pos)));
    return output;
}
```

##### Slang

```slang
struct VSOutput
{
    // Igual ao HLSL, usando a semântica SV_POSITION
    float4 Pos : SV_POSITION;
};

// Abordagem padrão (idêntica ao HLSL)
VSOutput main(VSInput input)
{
    VSOutput output = (VSOutput)0;
    output.Pos = mul(ubo.projectionMatrix, mul(ubo.viewMatrix, mul(ubo.modelMatrix, input.Pos)));
    return output;
}

// Alternativa usando interfaces
interface IVertexTransform
{
    float4x4 getTransform();
}

struct StandardTransform : IVertexTransform
{
    float4x4 projectionMatrix;
    float4x4 viewMatrix;
    float4x4 modelMatrix;

    float4x4 getTransform()
    {
        return mul(projectionMatrix, mul(viewMatrix, modelMatrix));
    }
}

VSOutput transformedMain(VSInput input, IVertexTransform transform)
{
    VSOutput output = (VSOutput)0;
    output.Pos = mul(transform.getTransform(), float4(input.Pos, 1.0));
    return output;
}
```

#### Lendo o índice do vértice

##### GLSL

```glsl
void main()
{
    // O índice do vértice é armazenado no built-in gl_VertexIndex
    outUV = vec2((gl_VertexIndex << 1) & 2, gl_VertexIndex & 2);
}
```

##### HLSL

```hlsl
struct VSInput
{
    // A semântica SV_VertexID declara o membro VertexIndex como a entrada do índice do vértice
    uint VertexIndex : SV_VertexID;
};

VSOutput main(VSInput input)
{
    VSOutput output = (VSOutput)0;
    output.UV = float2((input.VertexIndex << 1) & 2, input.VertexIndex & 2);
    return output;
}
```

##### Slang

```slang
struct VSInput
{
    // Igual ao HLSL, usando a semântica SV_VertexID
    uint VertexIndex : SV_VertexID;
};

VSOutput main(VSInput input)
{
    VSOutput output = (VSOutput)0;
    output.UV = float2((input.VertexIndex << 1) & 2, input.VertexIndex & 2);
    return output;
}

// Alternativa usando uma função utilitária
float2 calculateUVFromVertexID(uint vertexID)
{
    return float2((vertexID << 1) & 2, vertexID & 2);
}

VSOutput alternativeMain(VSInput input)
{
    VSOutput output = (VSOutput)0;
    output.UV = calculateUVFromVertexID(input.VertexIndex);
    return output;
}
```

## Interface de Shader

> **Nota:** As interfaces de *shader* diferem bastante entre GLSL, HLSL e Slang. O GLSL usa uma abordagem mais procedural com variáveis globais, enquanto o HLSL adota uma abordagem mais orientada a objetos com estruturas explícitas e semânticas. O Slang estende a abordagem do HLSL com recursos adicionais como *parameter blocks*, interfaces e módulos.

### Parameter Blocks do Slang

O Slang introduz um conceito poderoso chamado *parameter blocks*, que fornece uma forma mais estruturada de organizar os recursos de um *shader*:

```slang
// Define um tipo de parameter block
struct MaterialResources
{
    Texture2D albedoMap;
    SamplerState samplerState;

    struct Constants {
        float4 baseColor;
        float roughness;
        float metallic;
    } constants;
};

// Declara um parameter block - o Slang atribui seu descriptor set e
// binding automaticamente, nenhum binding explícito é necessário
ParameterBlock<MaterialResources> material;

// Uso no código do shader
float4 sampleAlbedo(float2 uv)
{
    // Acessa recursos por meio do parameter block
    return material.albedoMap.Sample(material.samplerState, uv);
}

float getRoughness()
{
    // Acessa constantes por meio do parameter block
    return material.constants.roughness;
}
```

Os *parameter blocks* oferecem diversas vantagens:

* Agrupamento lógico de recursos relacionados.
* Código de *shader* mais limpo com acesso hierárquico.
* Melhor compatibilidade entre diferentes APIs gráficas.
* Suporte a recursos e constantes aninhados.
* Capacidades de reflexão aprimoradas.

### Descriptor Bindings

#### GLSL

```glsl
layout (set = <set-index>, binding = <binding-index>) uniform <type> <name>
```

Existem duas opções para definir índices de *descriptor set* e *binding* em HLSL ao usar Vulkan.

#### Forma HLSL

```hlsl
<type> <name> : register(<register-type><binding-index>, space<set-index>)
```

Usando essa sintaxe, os índices de *descriptor set* e *binding* serão atribuídos implicitamente a partir do *space* e do índice de registrador.

#### Namespace Vulkan

```hlsl
[[vk::binding(binding-index, set-index)]]
<type> <name>
```

Com essa opção, os índices de *descriptor set* e *binding* são definidos explicitamente usando `vk::binding`.

> **Nota:** É possível usar tanto a sintaxe `vk::binding` quanto `register()` para um mesmo descritor. Isso pode ser útil caso o *shader* seja utilizado tanto no Vulkan quanto no DirectX.

#### Exemplos

##### GLSL

```glsl
layout (set = 1, binding = 0) uniform Node {
    mat4 matrix;
} node;
```

##### HLSL

```hlsl
struct Node {
    float4x4 transform;
};

// Estilo HLSL
ConstantBuffer<Node> node : register(b0, space1);

// Estilo Vulkan
[[vk::binding(0, 1)]]
ConstantBuffer<Node> node;

// Combinado
[[vk::binding(0, 1)]]
ConstantBuffer<Node> node : register(b0, space1);
```

### Uniforms

#### GLSL

```glsl
layout (set = <set-index>, binding = <binding-index>) uniform <type> <name>
```

##### Exemplos

```glsl
// Uniform buffer
layout (set = 0, binding = 0) uniform UBO
{
    mat4 projection;
} ubo;

// Combined image sampler
layout (set = 0, binding = 1) uniform sampler2D samplerColor;
```

#### HLSL

```hlsl
<type> <name> : register(<register-type><binding-index>, space<set-index>)
```

ou

```hlsl
[[vk::binding(binding-index, set-index)]]
<type> <name>
```

##### Exemplos

```hlsl
// Uniform buffer
struct UBO
{
    float4x4 projection;
};
ConstantBuffer<UBO> ubo : register(b0, space0);

// Combined image sampler
Texture2D textureColor : register(t1);
SamplerState samplerColor : register(s1);
```

Ao usar a sintaxe de *descriptor binding* do HLSL, `<register type>` pode ser:

| Tipo | Descrição do Registrador | Recurso no Vulkan |
| --- | --- | --- |
| `b` | *Constant buffer* | *Uniform buffer* |
| `t` | Textura e *texture buffer* | *Uniform texel buffer* e *shader storage buffer* somente leitura |
| `c` | Deslocamento de buffer (*buffer offset*) | `layout(offset = N)` |
| `s` | *Sampler* | o mesmo |
| `u` | *Unordered Access View* | *Shader storage buffer*, *storage image* e *storage texel buffer* |

### Entradas de Shader

#### GLSL

```glsl
layout (location = <location-index>) in <type> <name>;
```

##### Exemplo

```glsl
layout (location = 0) in vec3 inPos;
layout (location = 1) in vec3 inNormal;
layout (location = 2) in vec2 inUV0;
layout (location = 3) in vec2 inUV1;
```

#### HLSL

```hlsl
[[vk::location(<location-index>)]] <type> <name> : <semantic-type>;
```

##### Exemplo

```hlsl
struct VSInput
{
[[vk::location(0)]] float3 Pos : POSITION;
[[vk::location(1)]] float3 Normal : NORMAL;
[[vk::location(2)]] float2 UV0 : TEXCOORD0;
[[vk::location(3)]] float2 UV1 : TEXCOORD1;
};

VSOutput main(VSInput input) {
}
```

`<semantic type>` pode ser:

| Semântica | Descrição | Tipo |
| --- | --- | --- |
| `BINORMAL[n]` | Binormal | `float4` |
| `BLENDINDICES[n]` | Índices de mistura (*blend indices*) | `uint` |
| `BLENDWEIGHT[n]` | Pesos de mistura (*blend weights*) | `float` |
| `COLOR[n]` | Cor difusa e especular | `float4` |
| `NORMAL[n]` | Vetor normal | `float4` |
| `POSITION[n]` | Posição do vértice no espaço do objeto | `float4` |
| `POSITIONT` | Posição do vértice transformada | `float4` |
| `PSIZE[n]` | Tamanho do ponto (*point size*) | `float` |
| `TANGENT[n]` | Tangente | `float4` |
| `TEXCOORD[n]` | Coordenadas de textura | `float4` |

`n` é um inteiro opcional entre 0 e o número de recursos suportados ([fonte](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-semantics)).

### Saídas de Shader

#### Passando dados entre estágios

Por exemplo, para *vertex* e *tessellation shaders*.

##### GLSL

```glsl
layout (location = <location-index>) out/in <type> <name>;
```

###### Exemplo

```glsl
layout (location = 0) out vec3 outNormal;
layout (location = 1) out vec3 outColor;
layout (location = 2) out vec2 outUV;
layout (location = 3) out vec3 outViewVec;

void main() {
    gl_Position = vec4(inPos, 1.0);
    outNormal = inNormal;
}
```

##### HLSL

```hlsl
[[vk::location(<location-index>)]] <type> <name> : <semantic-type>;
```

###### Exemplo

```hlsl
struct VSOutput
{
                    float4 Pos : SV_POSITION;
[[vk::location(0)]] float3 Normal : NORMAL;
[[vk::location(1)]] float3 Color : COLOR;
[[vk::location(2)]] float2 UV : TEXCOORD0;
[[vk::location(3)]] float3 ViewVec : TEXCOORD1;
};

VSOutput main(VSInput input) {
    VSOutput output = (VSOutput)0;
    output.Pos = float4(input.Pos.xyz, 1.0);
    output.Normal = input.Normal;
    return output;
}
```

#### Escrevendo em attachments

Para *fragment shaders*.

##### GLSL

```glsl
layout (location = <attachment-index>) out/in <type> <name>;
```

###### Exemplo

```glsl
layout (location = 0) out vec4 outPosition;
layout (location = 1) out vec4 outNormal;
layout (location = 2) out vec4 outAlbedo;

void main() {
    outPosition = ...
    outNormal = ...
    outAlbedo = ...
}
```

##### HLSL

```hlsl
<type> <name> : SV_TARGET<attachment-index>;
```

###### Exemplo

```hlsl
struct FSOutput
{
    float4 Position : SV_TARGET0;
    float4 Normal : SV_TARGET1;
    float4 Albedo : SV_TARGET2;
};

FSOutput main(VSOutput input) {
    output.Position = ...
    output.Normal = ...
    output.Albedo = ...
    return output;
}
```

### Push Constants

> **Nota:** *Push constants* precisam ser tratados por meio de uma *root signature* no D3D.

#### GLSL

```glsl
layout (push_constant) uniform <structure-type> { <members> } <name>
```

##### Exemplo

```glsl
layout (push_constant) uniform PushConsts {
    mat4 matrix;
} pushConsts;
```

#### HLSL

```hlsl
[[vk::push_constant]] <structure-type> <name>;
```

```hlsl
struct PushConsts {
    float4x4 matrix;
};
[[vk::push_constant]] PushConsts pushConsts;
```

### Constantes de Especialização (*Specialization Constants*)

> **Nota:** Constantes de especialização estão disponíveis apenas no Vulkan; o D3D não oferece nada equivalente.

#### GLSL

```glsl
layout (constant_id = <specialization-constant-index>) const int <name> = <default-value>;
```

##### Exemplo

```glsl
layout (constant_id = 0) const int SPEC_CONST = 0;
```

#### HLSL

```hlsl
[[vk::constant_id(<specialization-constant-index>)]] const int <name> = <default-value>;
```

##### Exemplo

```hlsl
[[vk::constant_id(0)]] const int SPEC_CONST = 0;
```

### Subpasses

#### GLSL

```glsl
layout (input_attachment_index = <input-attachment-index>, binding = <binding-index>) uniform subpassInput <name>;
```

##### Exemplo

```glsl
layout (input_attachment_index = 0, binding = 0) uniform subpassInput input0;
```

#### HLSL

```hlsl
[[vk::input_attachment_index(<input-attachment-index>)]][[vk::binding(<binding-index>)]] SubpassInput <name>;
```

##### Exemplo

```hlsl
[[vk::input_attachment_index(0)]][[vk::binding(0)]] SubpassInput input0;
```

### Leituras de Textura

> **Nota:** Enquanto o GLSL utiliza funções globais para acessar imagens, o HLSL utiliza funções-membro do objeto de textura.

#### Exemplo

##### GLSL

```glsl
layout (binding = 0, set = 0) uniform sampler2D sampler0;

void main() {
    vec4 color = texture(sampler0, inUV);
}
```

##### HLSL

```hlsl
Texture2D texture0 : register(t0, space0);
SamplerState sampler0 : register(s0, space0);

float4 main(VSOutput input) : SV_TARGET {
    float4 color = texture0.Sample(sampler0, input.UV);
}
```

| GLSL | HLSL |
| --- | --- |
| `texture` | `Sample` |
| `textureGrad` | `SampleGrad` |
| `textureLod` | `SampleLevel` |
| `textureSize` | `GetDimensions` |
| `textureProj` | n.a., requer divisão de perspectiva manual |
| `texelFetch` | `Load` |
| `sparseTexelsResidentARB` | `CheckAccessFullyMapped` |

> **Nota:** O Slang suporta as mesmas operações de textura que o HLSL, com nomes de funções e comportamento idênticos.

O Slang também suporta operações de textura mais avançadas por meio de seu sistema de *parameter blocks*:

```slang
// Define um parameter block com texturas
struct TextureResources
{
    Texture2D albedoMap;
    Texture2D normalMap;
    Texture2D roughnessMap;
    SamplerState samplerState;
}

// Declara um parameter block
[[vk::binding(0, 0)]]
ParameterBlock<TextureResources> textures;

// Faz amostragem de texturas através do parameter block
float4 sampleAlbedo(float2 uv)
{
    return textures.albedoMap.Sample(textures.samplerState, uv);
}
```

### Formatos de Imagem

#### GLSL

```glsl
layout (set = <set-index>, binding = <image-binding-index>, <image-format>) uniform <memory-qualifier> <image-type> <name>;
```

##### Exemplo

```glsl
layout (set = 0, binding = 0, rgba8) uniform writeonly image2D outputImage;
```

#### HLSL

```hlsl
[[vk::image_format(<image-format>)]]
RWTexture2D<image-components> <name> : register(<register-type><binding-index>, space<set-index>);
```

##### Exemplo

```hlsl
[[vk::image_format("rgba8")]]
RWTexture2D<float4> resultImage : register(u0, space0);
```

## Mapeamento de Built-ins e Funções

### Buffer Device Address

> **Nota:** Atualmente, o HLSL suporta apenas um [subconjunto](https://github.com/microsoft/DirectXShaderCompiler/blob/main/docs/SPIR-V.rst#rawbufferload-and-rawbufferstore) de `VK_KHR_buffer_device_address`.

#### GLSL

##### Exemplo

```glsl
layout(push_constant) uniform PushConstants {
    uint64_t bufferAddress;
} pushConstants;

layout(buffer_reference, scalar) buffer Data {vec4 f[]; };

void main() {
    Data data = Data(pushConstants.bufferAddress);
}
```

#### HLSL

##### Exemplo

```hlsl
struct PushConstants {
    uint64_t bufferAddress;
};
[[vk::push_constant]] PushConstants pushConstants;

void main() {
    float4 data = vk::RawBufferLoad<float4>(pushConstants.bufferAddress);
}
```

### Raytracing

#### Seleção de estágio de shader

Enquanto o GLSL detecta implicitamente o estágio de *shader* (para *ray tracing*) pela extensão do arquivo (ou explicitamente por argumentos do compilador), no HLSL os *shaders* de *ray tracing* precisam ser marcados pelo atributo `[shader("stage")]`:

##### Exemplo

```hlsl
[shader("closesthit")]
void main(inout RayPayload rayPayload, in float2 attribs) {
}
```

Os nomes de estágio correspondem aos do GLSL: `raygeneration`, `intersection`, `anyhit`, `closesthit`, `miss`, `callable`.

#### Shader record buffer

##### GLSL

###### Exemplo

```glsl
layout(shaderRecordEXT, std430) buffer SBT {
    float data;
};
```

##### HLSL

###### Exemplo

```hlsl
struct SBT {
    float data;
};
[[vk::shader_record_ext]]
ConstantBuffer<SBT> sbt;
```

#### Built-ins

| GLSL | HLSL | Observação |
| --- | --- | --- |
| `accelerationStructureEXT` | `RaytracingAccelerationStructure` | |
| `executeCallableEXT` | `CallShader` | |
| `ignoreIntersectionEXT` | `IgnoreHit` | |
| `reportIntersectionEXT` | `ReportHit` | |
| `terminateRayEXT` | `AcceptHitAndEndSearch` | |
| `traceRayEXT` | `TraceRay` | |
| `rayPayloadEXT` (qualificador de armazenamento) | Último argumento de `TraceRay` | |
| `rayPayloadInEXT` (qualificador de armazenamento) | Primeiro argumento do ponto de entrada principal dos estágios *any hit*, *closest hit* e *miss* | |
| `hitAttributeEXT` (qualificador de armazenamento) | Último argumento de `ReportHit` | |
| `callableDataEXT` (qualificador de armazenamento) | Último argumento de `CallShader` | |
| `callableDataInEXT` (qualificador de armazenamento) | Primeiro argumento do ponto de entrada principal do estágio *callable* | |
| `gl_LaunchIDEXT` | `DispatchRaysIndex` | |
| `gl_LaunchSizeEXT` | `DispatchRaysDimensions` | |
| `gl_PrimitiveID` | `PrimitiveIndex` | |
| `gl_InstanceID` | `InstanceIndex` | |
| `gl_InstanceCustomIndexEXT` | `InstanceID` | |
| `gl_GeometryIndexEXT` | `GeometryIndex` | |
| `gl_VertexIndex` | `SV_VertexID` | |
| `gl_WorldRayOriginEXT` | `WorldRayOrigin` | |
| `gl_WorldRayDirectionEXT` | `WorldRayDirection` | |
| `gl_ObjectRayOriginEXT` | `ObjectRayOrigin` | |
| `gl_ObjectRayDirectionEXT` | `ObjectRayDirection` | |
| `gl_RayTminEXT` | `RayTMin` | |
| `gl_RayTmaxEXT` | `RayTCurrent` | |
| `gl_IncomingRayFlagsEXT` | `RayFlags` | |
| `gl_HitTEXT` | `RayTCurrent` | |
| `gl_HitKindEXT` | `HitKind` | |
| `gl_ObjectToWorldEXT` | `ObjectToWorld4x3` | |
| `gl_WorldToObjectEXT` | `WorldToObject4x3` | |
| `gl_WorldToObject3x4EXT` | `WorldToObject3x4` | |
| `gl_ObjectToWorld3x4EXT` | `ObjectToWorld3x4` | |
| `gl_RayFlagsNoneEXT` | `RAY_FLAG_NONE` | |
| `gl_RayFlagsOpaqueEXT` | `RAY_FLAG_FORCE_OPAQUE` | |
| `gl_RayFlagsNoOpaqueEXT` | `RAY_FLAG_FORCE_NON_OPAQUE` | |
| `gl_RayFlagsTerminateOnFirstHitEXT` | `RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH` | |
| `gl_RayFlagsSkipClosestHitShaderEXT` | `RAY_FLAG_SKIP_CLOSEST_HIT_SHADER` | |
| `gl_RayFlagsCullBackFacingTrianglesEXT` | `RAY_FLAG_CULL_BACK_FACING_TRIANGLES` | |
| `gl_RayFlagsCullFrontFacingTrianglesEXT` | `RAY_FLAG_CULL_FRONT_FACING_TRIANGLES` | |
| `gl_RayFlagsCullOpaqueEXT` | `RAY_FLAG_CULL_OPAQUE` | |
| `gl_RayFlagsCullNoOpaqueEXT` | `RAY_FLAG_CULL_NON_OPAQUE` | |
| `gl_RayFlagsSkipTrianglesEXT` | `RAY_FLAG_SKIP_TRIANGLES` | Requer `GL_EXT_ray_flags_primitive_culling` |
| `gl_RayFlagsSkipAABBEXT` | `RAY_FLAG_SKIP_PROCEDURAL_PRIMITIVES` | Requer `GL_EXT_ray_flags_primitive_culling` |
| `gl_HitKindFrontFacingTriangleEXT` | `HIT_KIND_TRIANGLE_FRONT_FACE` | |
| `gl_HitKindBackFacingTriangleEXT` | `HIT_KIND_TRIANGLE_BACK_FACE` | |
| `gl_HitTriangleVertexPositionsEXT` | Requer *Intrínsecas SPIR-V*: `[[vk::ext_extension("SPV_KHR_ray_tracing_position_fetch")]]`, `[[vk::ext_capability(RayTracingPositionFetchKHR)]]`, `[[vk::ext_builtin_input(HitTriangleVertexPositionsKHR)]]` | Requer `GL_EXT_ray_tracing_position_fetch` |
| `shadercallcoherent` | n.a. | |

> **Nota:** O Slang suporta os mesmos *built-ins* de *ray tracing* que o HLSL, com nomes de funções e comportamento idênticos. Adicionalmente, o sistema de interfaces e módulos do Slang pode ser usado para criar código de *ray tracing* mais modular e reutilizável.

```slang
// Define uma interface de ray tracing
interface IRayTracer
{
    struct RayPayload
    {
        float3 color;
        float distance;
        int materialID;
    };

    void traceScene(inout RayPayload payload, float3 origin, float3 direction);
}

// Implementa a interface
struct StandardRayTracer : IRayTracer
{
    RaytracingAccelerationStructure accelerationStructure;

    void traceScene(inout IRayTracer.RayPayload payload, float3 origin, float3 direction)
    {
        // Configura o raio
        uint rayFlags = RAY_FLAG_NONE;
        uint instanceMask = 0xFF;
        uint rayContributionToHitGroupIndex = 0;
        uint multiplierForGeometryContributionToHitGroupIndex = 1;
        uint missShaderIndex = 0;

        // Dispara o raio
        TraceRay(
            accelerationStructure,
            rayFlags,
            instanceMask,
            rayContributionToHitGroupIndex,
            multiplierForGeometryContributionToHitGroupIndex,
            missShaderIndex,
            origin,
            0.001f,    // t mínimo
            direction,
            10000.0f,  // t máximo
            payload);
    }
}
```

### Compute

#### Tamanho do workgroup local

##### GLSL

```glsl
layout (local_size_x = <local-size-x>, local_size_y = <local-size-y>, local_size_z = <local-size-z>) in;
```

###### Exemplo

```glsl
layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;
```

##### HLSL

```hlsl
[numthreads(<local-size-x>, <local-size-y>, <local-size-z>)]
```

###### Exemplo

```hlsl
[numthreads(1, 1, 1)]
void main() {}
```

#### Memória compartilhada

##### GLSL

###### Exemplo

```glsl
shared vec4 sharedData[1024];
```

##### HLSL

###### Exemplo

```hlsl
groupshared float4 sharedData[1024];
```

#### Built-ins

| GLSL | HLSL |
| --- | --- |
| `gl_GlobalInvocationID` | `SV_DispatchThreadID` |
| `gl_LocalInvocationID` | `SV_GroupThreadID` |
| `gl_WorkGroupID` | `SV_GroupID` |
| `gl_LocalInvocationIndex` | `SV_GroupIndex` |
| `gl_NumWorkGroups` | n.a. |
| `gl_WorkGroupSize` | n.a. |

> **Nota:** O Slang suporta as mesmas semânticas de *compute shader* que o HLSL, com nomes e comportamento idênticos. Adicionalmente, o sistema de interfaces e módulos do Slang pode ser usado para criar código de *compute shader* mais modular e reutilizável.

```slang
// Define uma interface de kernel de computação
interface IComputeKernel
{
    void execute(uint3 globalID, uint3 groupID, uint3 localID);
}

// Implementa um kernel de computação específico
struct ImageProcessingKernel : IComputeKernel
{
    RWTexture2D<float4> outputImage;
    Texture2D<float4> inputImage;
    SamplerState samplerState;

    void execute(uint3 globalID, uint3 groupID, uint3 localID)
    {
        // Processa a imagem no pixel atual
        uint2 pixelCoord = globalID.xy;
        float2 uv = float2(pixelCoord) / float2(1920, 1080); // Resolução de exemplo

        // Faz amostragem da entrada e escreve na saída
        float4 color = inputImage.Sample(samplerState, uv);
        outputImage[pixelCoord] = color;
    }
}

// Ponto de entrada principal do compute shader
[numthreads(16, 16, 1)]
void main(
    uint3 dispatchThreadID : SV_DispatchThreadID,
    uint3 groupID : SV_GroupID,
    uint3 groupThreadID : SV_GroupThreadID)
{
    // Cria e utiliza o kernel
    ImageProcessingKernel kernel;
    kernel.execute(dispatchThreadID, groupID, groupThreadID);
}
```

#### Barreiras (*Barriers*)

##### Exemplo

###### GLSL

```glsl
barrier();
for (int j = 0; j < 256; j++) {
    doSomething;
}
barrier();
```

###### HLSL

```hlsl
GroupMemoryBarrierWithGroupSync();
for (int j = 0; j < 256; j++) {
    doSomething;
}
GroupMemoryBarrierWithGroupSync();
```

> **Nota:** As barreiras diferem bastante entre GLSL e HLSL. Algumas barreiras do HLSL não possuem mapeamento direto para o GLSL (tais funções estão em *itálico*, e foram usadas barreiras GLSL o mais próximas possível).

| GLSL | HLSL |
| --- | --- |
| `memoryBarrierShared` | *`GroupMemoryBarrier`* |
| `barrier` | `GroupMemoryBarrierWithGroupSync` |
| `memoryBarrierImage` + `memoryBarrierBuffer` | `DeviceMemoryBarrier` |
| `memoryBarrierImage` + `memoryBarrierBuffer` + `barrier` | *`DeviceMemoryBarrierWithGroupSync`* |
| `memoryBarrier` + `barrier` | `AllMemoryBarrierWithGroupSync` |
| `memoryBarrier` | `AllMemoryBarrier` |

> **Nota:** `barrier` define implicitamente uma barreira de memória para memória `shared`/`groupshared`. De modo geral, `barrier` engloba `memoryBarrierShared`/`GroupMemoryBarrier`.

### Mesh, Task (Amplification) e Geometry Shaders

Esses estágios de *shader* compartilham diversas funções e *built-ins*:

| GLSL | HLSL |
| --- | --- |
| `EmitMeshTasksEXT` | `DispatchMesh` |
| `SetMeshOutputsEXT` | `SetMeshOutputCounts` |
| `EmitVertex` | *StreamType*`<`*Name*`>.Append` (por exemplo, `TriangleStream<MSOutput>`) |
| `EndPrimitive` | *StreamType*`<`*Name*`>.RestartStrip` |
| `gl_PrimitiveShadingRateEXT` | `SV_ShadingRate` |
| `gl_CullPrimitiveEXT` | `SV_CullPrimitive` |
| `gl_in` | Argumento de array para o ponto de entrada principal (por exemplo, `triangle VSInput input[3]`) |

### Tessellation Shaders

| GLSL | HLSL |
| --- | --- |
| `gl_InvocationID` | `SV_OutputControlPointID` |
| `gl_TessLevelInner` | `SV_InsideTessFactor` |
| `gl_TessLevelOuter` | `SV_TessFactor` |
| `gl_TessCoord` | `SV_DomainLocation` |

### Subgrupos (*Subgroups*)

| GLSL | HLSL |
| --- | --- |
| `gl_HelperInvocation` | `IsHelperLane` |
| n.a. | `WaveOnce` |
| `readFirstInvocationARB` | `WaveReadLaneFirst` |
| `readInvocationARB` | `WaveReadLaneAt` |
| `anyInvocationARB` | `WaveActiveAnyTrue` |
| `allInvocationsARB` | `WaveActiveAllTrue` |
| `allInvocationsEqualARB` | `WaveActiveAllEqual` |
| `ballotARB` | `WaveActiveBallot` |
| `gl_NumSubgroups` | `OpVariable` decorada com `NumSubgroups` |
| `gl_SubgroupID` | `OpVariable` decorada com `SubgroupId` |
| `gl_SubgroupSize` | `WaveGetLaneCount` |
| `gl_SubgroupInvocationID` | `WaveGetLaneIndex` |
| `gl_SubgroupEqMask` | n.a. |
| `gl_SubgroupGeMask` | n.a. |
| `gl_SubgroupGtMask` | n.a. |
| `gl_SubgroupLeMask` | n.a. |
| `gl_SubgroupLtMask` | `OpVariable` decorada com `SubgroupLtMask` |
| `subgroupElect` | `WaveIsFirstLane` |
| `subgroupAny` | `WaveActiveAnyTrue` |
| `subgroupAll` | `WaveActiveAllTrue` |
| `subgroupBallot` | `WaveActiveBallot` |
| `subgroupAllEqual` | `WaveActiveAllEqual` |
| `subgroupBallotBitCount` | `WaveActiveCountBits` |
| `subgroupAnd` | `WaveActiveBitAnd` |
| `subgroupOr` | `WaveActiveBitOr` |
| `subgroupXor` | `WaveActiveBitXor` |
| `subgroupAdd` | `WaveActiveSum` |
| `subgroupMul` | `WaveActiveProduct` |
| `subgroupMin` | `WaveActiveMin` |
| `subgroupMax` | `WaveActiveMax` |
| `subgroupExclusiveAdd` | `WavePrefixSum` |
| `subgroupExclusiveMul` | `WavePrefixProduct` |
| `subgroupBallotExclusiveBitCount` | `WavePrefixCountBits` |
| `subgroupBroadcast` | `WaveReadLaneAt` |
| `subgroupBroadcastFirst` | `WaveReadLaneFirst` |
| `subgroupQuadSwapHorizontal` | `QuadReadAcrossX` |
| `subgroupQuadSwapVertical` | `QuadReadAcrossY` |
| `subgroupQuadSwapDiagonal` | `QuadReadAcrossDiagonal` |
| `subgroupQuadBroadcast` | `QuadReadLaneAt` |

### Diversos

| GLSL | HLSL | Observação |
| --- | --- | --- |
| `gl_PointSize` | `[[vk::builtin("PointSize")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_BaseVertexARB` | `[[vk::builtin("BaseVertex")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_BaseInstanceARB` | `[[vk::builtin("BaseInstance")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_DrawID` | `[[vk::builtin("DrawIndex")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_DeviceIndex` | `[[vk::builtin("DeviceIndex")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_ViewportMask` | `[[vk::builtin("ViewportMaskNV")]]` | Apenas Vulkan, sem equivalente direto em HLSL |
| `gl_FragCoord` | `SV_Position` | |
| `gl_FragDepth` | `SV_Depth` | |
| `gl_FrontFacing` | `SV_IsFrontFace` | |
| `gl_InstanceIndex` | `SV_InstanceID` | |
| `gl_ViewIndex` | `SV_ViewID` | |
| `gl_ClipDistance` | `SV_ClipDistance` | |
| `gl_CullDistance` | `SV_CullDistance` | |
| `gl_PointCoord` | `SV_Position` | |
| `gl_Position` | `SV_Position` | |
| `gl_PrimitiveID` | `SV_PrimitiveID` | |
| `gl_ViewportIndex` | `SV_ViewportArrayIndex` | |
| `gl_Layer` | `SV_RenderTargetArrayIndex` | |
| `gl_SampleID` | `SV_SampleIndex` | |
| `gl_SamplePosition` | `EvaluateAttributeAtSample` | |
| `subpassLoad` | `<SubPassInput>.SubpassLoad` | |
| `imageLoad` | `RWTexture1D/2D/3D<T>[]` | |
| `imageStore` | `RWTexture1D/2D/3D<T>[]` | |
| `atomicAdd` | `InterlockedAdd` | |
| `atomicCompSwap` | `InterlockedCompareExchange` | |
| `imageAtomicExchange` | `InterlockedExchange` | |
| `nonuniformEXT` | `NonUniformResourceIndex` | |
| `gl_BaryCoordEXT` | `SV_Barycentrics` | |
| `gl_BaryCoordNoPerspEXT` | `SV_Barycentrics` com `noperspective` | |

## Módulos e Importações no Slang

Um dos recursos mais marcantes do Slang é seu sistema de módulos, que permite melhor organização e reutilização de código. Esse recurso não está disponível nem no GLSL nem no HLSL padrão.

### Declaração de Módulo

No Slang, você pode organizar o código em módulos:

```slang
// Arquivo: Lighting.slang
module Lighting;

// Funções públicas precisam ser marcadas com 'public'
public float3 calculateDirectLighting(float3 normal, float3 lightDir, float3 color)
{
    float NdotL = max(0, dot(normal, lightDir));
    return color * NdotL;
}

// Função privada (não exportada)
float calculateAttenuation(float distance)
{
    return 1.0 / (distance * distance);
}
```

### Importando Módulos

Você pode importar módulos para usar as funcionalidades exportadas por eles:

```slang
// Arquivo: Fragment.slang
module Fragment;

// Importa outro módulo
import Lighting;

[shader("fragment")]
float4 fragmentMain(float3 normal : NORMAL, float3 worldPos : POSITION) : SV_TARGET
{
    float3 lightDir = normalize(float3(1, 1, 1));
    float3 lightColor = float3(1, 1, 1);

    // Usa função do módulo importado - módulos não introduzem namespaces
    float3 directLighting = calculateDirectLighting(normal, lightDir, lightColor);

    return float4(directLighting, 1.0);
}
```

### Módulos Hierárquicos

O Slang suporta organização hierárquica de módulos:

```slang
// Arquivo: Rendering/Materials/PBR.slang
module Rendering.Materials.PBR;

public interface IMaterial { ... }
public struct PBRMaterial : IMaterial { ... }

// Arquivo: Main.slang
module Main;

// Importa um módulo específico
import Rendering.Materials.PBR;

// Usa os tipos importados
PBR::PBRMaterial material;
```

### Benefícios dos Módulos

O sistema de módulos oferece diversas vantagens:

* Melhor organização de código.
* Encapsulamento de detalhes de implementação.
* Redução de conflitos de nomes.
* Dependências explícitas entre componentes.
* Tempos de compilação aprimorados por meio de compilação separada.

## Funções

> **Nota:** A maioria das funções do GLSL também está disponível em HLSL e vice-versa. Esta seção lista funções com nomes divergentes. Funções que possuem equivalência 1:1 (por exemplo, `isnan`) não estão listadas.

| GLSL | HLSL |
| --- | --- |
| `dFdx` | `ddx` |
| `dFdxCoarse` | `ddx_coarse` |
| `dFdxFine` | `ddx_fine` |
| `dFdy` | `ddy` |
| `dFdyCoarse` | `ddy_coarse` |
| `dFdyFine` | `ddy_fine` |
| `fma` | `mad` |
| `fract` | `frac` |
| `mix` | `lerp` |

> **Nota:** O Slang suporta todas as mesmas funções intrínsecas que o HLSL, com nomes idênticos. Além disso, o Slang permite definir suas próprias funções genéricas que funcionam com múltiplos tipos e suporta sobrecarga de operadores e definições personalizadas de funções dentro de interfaces.

* [Funções intrínsecas HLSL (Microsoft)](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-intrinsic-functions)
* [Páginas de referência do OpenGL](https://registry.khronos.org/OpenGL-Refpages/gl4/index.php)
* [Referência da Linguagem Slang](https://github.com/shader-slang/spec)

Aqui está um exemplo de funções genéricas no Slang:

```slang
// Função genérica de interpolação
T interpolate<T>(T a, T b, float t)
{
    return lerp(a, b, t);
}

// Uso com diferentes tipos
float result1 = interpolate(1.0f, 2.0f, 0.5f);                    // Retorna 1.5
float3 result2 = interpolate(float3(1,0,0), float3(0,1,0), 0.5f); // Retorna (0.5, 0.5, 0)
```

O Slang também suporta sobrecarga de operadores e definições personalizadas de funções dentro de interfaces, permitindo código mais expressivo e reutilizável:

```slang
// Define uma interface com operações
interface IVector<T>
{
    T dot(T other);
    T normalize();
    T scale(float factor);
}

// Implementa para float3
struct Float3Vector : IVector<float3>
{
    float3 value;

    float3 dot(float3 other)
    {
        return dot(value, other);
    }

    float3 normalize()
    {
        return normalize(value);
    }

    float3 scale(float factor)
    {
        return value * factor;
    }
}
```
