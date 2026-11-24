# Linguagem de Shading Slang no Vulkan

O Vulkan não consome diretamente *shaders* em formato de texto legível por humanos; em vez disso, utiliza SPIR-V (consulte o capítulo sobre *O que é SPIR-V*) como representação intermediária. Isso abre a possibilidade de utilizar outras linguagens de *shader* além do GLSL, desde que elas possam gerar código para o ambiente SPIR-V do Vulkan.

Uma dessas linguagens é a [Slang Shading Language](https://shader-slang.org), desenvolvida pela NVIDIA. Ela foi projetada para atender às necessidades em evolução do desenvolvimento gráfico em tempo real, especialmente no que diz respeito a bases de código de *shaders* que se tornam cada vez maiores e mais complexas. Ela oferece suporte a múltiplas APIs, entre elas suporte de primeira classe para o SPIR-V do Vulkan.

![Visão geral da linguagem Slang](images/slang-write-once-run-anywhere-graphic.webp)

O Slang é desenvolvido em [código aberto](https://github.com/shader-slang) e está sob a [governança do Khronos Group](https://www.khronos.org/news/press/khronos-group-launches-slang-initiative-hosting-open-source-compiler-contributed-by-nvidia), o que significa que conta com amplo apoio da indústria e manutenção ativa.

Sua sintaxe é semelhante à do HLSL (consulte o capítulo sobre *HLSL no Vulkan*), com adições como módulos para tornar a linguagem mais fácil de usar e lidar melhor com bases de código complexas.

Ela possui excelente suporte de ferramentas, com depuradores como [RenderDoc](https://renderdoc.org/) e [Nsight](https://developer.nvidia.com/nsight-graphics). O destaque de sintaxe (*syntax highlighting*) está disponível para a maioria das IDEs populares, como [Visual Studio](https://marketplace.visualstudio.com/items?itemName=shader-slang.slang-vs-extension) e [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=shader-slang.slang-language-extension).

## Recursos Educacionais

Se você é novo em Slang, aqui estão alguns recursos educacionais:

* [Site oficial do Slang](https://shader-slang.org/)
* [Primeiros passos com Slang](https://shader-slang.org/docs/getting-started/)
* [Guia do Usuário do Slang](https://docs.shader-slang.org/en/latest/external/slang/docs/user-guide/)
* [Funcionalidades específicas de SPIR-V](https://docs.shader-slang.org/en/latest/external/slang/docs/user-guide/a2-01-spirv-target-specific.html)
* [Migrando do HLSL](https://shader-slang.org/docs/coming-from-hlsl/)
* [Migrando do GLSL](https://shader-slang.org/docs/coming-from-glsl/)
* [Playground interativo de shaders Slang](https://shader-slang.org/slang-playground/)
* Os *Vulkan Samples* oficiais também vêm acompanhados de *shaders* em Slang.

## Principais Diferenças entre Slang e GLSL

Esta seção resume as diferenças mais importantes que um desenvolvedor encontrará ao migrar de GLSL para Slang.

| Recurso | Slang | GLSL |
| --- | --- | --- |
| Estilo de programação | Orientado a objetos (semelhante a C++) | Procedural (semelhante a C) |
| Estágios por arquivo-fonte | Múltiplos | Um |
| Nome do ponto de entrada (*entry point*) | Definido pelo usuário | Sempre `main` |
| Declaração de estágio | Atributo `[shader("...")]` | Flag do compilador ou extensão de arquivo |
| Tipos vetoriais | `float2`, `float3`, `float4` | `vec2`, `vec3`, `vec4` |
| Tipos matriciais | `float2x2`–`float4x4` | `mat2`–`mat4` |
| Layout padrão de matriz | *Column-major* (linha de comando), *row-major* (biblioteca) | *Column-major* |
| Vínculo de recursos (*resource binding*) | Automático ou explícito | `layout(set=M, binding=N)` — sempre explícito |
| Reutilização de arquivos | Sistema de módulos `import` | Pré-processador `#include` |
| Namespaces | Sim | Não |
| Interfaces e genéricos | Sim | Não |
| Ponteiros | Sim (para uso no lado da GPU) | Não |

## Comparação de Sintaxe

Slang e GLSL diferem bastante em sua sintaxe. Enquanto o GLSL é mais procedural (como C), o Slang é mais orientado a objetos (como C++).

A seguir está o mesmo *shader* escrito em ambas as linguagens para oferecer uma comparação rápida das diferenças básicas, incluindo o *namespace* mencionado anteriormente que, por exemplo, adiciona localizações explícitas:

### GLSL

No GLSL, você precisa de um *shader* separado por estágio.

#### Vertex Shader

[Testar Online](https://godbolt.org/z/6fefo9cWT)

```glsl
#version 450

layout (location = 0) in vec3 inPos;
layout (location = 1) in vec2 inUV;

layout (binding = 0) uniform UBO
{
	mat4 projection;
	mat4 model;
} ubo;

layout (location = 0) out vec2 outUV;

void main()
{
	outUV = inUV;
	gl_Position = ubo.projection * ubo.model * vec4(inPos.xyz, 1.0);
}
```

#### Fragment Shader

[Testar Online](https://godbolt.org/z/4ecx89TWE)

```glsl
#version 450

layout (binding = 1) uniform sampler2D samplerColor;

layout (location = 0) in vec2 inUV;

layout (location = 0) out vec4 outFragColor;

void main()
{
	outFragColor = texture(samplerColor, inUV);
}
```

### Slang

No Slang, um único arquivo pode conter múltiplos estágios de *shader*, o que ajuda a reduzir duplicação. Note também que não precisamos especificar *bindings* explícitos, pois eles são deduzidos implicitamente para `ubo` e `samplerColor` a partir de sua ordem de declaração.

[Testar Online](https://godbolt.org/z/rEYeG6EdY)

```slang
struct VSInput
{
	float3 Pos;
	float2 UV;
	float3 Normal;
};

struct VSOutput
{
	float4 Pos : SV_POSITION;
	float2 UV;
};

struct UBO
{
    float4x4 projection;
    float4x4 model;
};
ConstantBuffer<UBO> ubo;

Sampler2D samplerColor;

[shader("vertex")]
VSOutput vertexMain(VSInput input)
{
	VSOutput output;
	output.UV = input.UV;
	output.Pos = mul(ubo.projection, mul(ubo.model, float4(input.Pos.xyz, 1.0)));
	return output;
}

[shader("fragment")]
float4 fragmentMain(VSOutput input)
{
    return samplerColor.Sample(input.UV);
}
```

## Recursos Adicionais da Linguagem

Além das diferenças de sintaxe mostradas acima, o Slang adiciona diversos recursos de linguagem não disponíveis em GLSL ou HLSL padrão.

### Genéricos

O Slang adiciona suporte completo a genéricos, semelhantes aos de C# ou Java, permitindo código parametrizado com segurança de tipos:

```slang
T min<T>(T a, T b)
{
    return a < b ? a : b;
}

// Uso
float result = min<float>(1.0, 2.0);
int intResult = min<int>(5, 3);
```

### Interfaces e Polimorfismo

O Slang introduz interfaces, permitindo comportamento polimórfico em *shaders*:

```slang
interface IMaterial
{
    float3 evaluateBRDF(float3 viewDir, float3 lightDir, float3 normal);
}

struct LambertianMaterial : IMaterial
{
    float3 albedo;

    float3 evaluateBRDF(float3 viewDir, float3 lightDir, float3 normal)
    {
        return albedo / 3.14159;
    }
}

// Uso polimórfico, sem conhecer o tipo concreto
void shadeSurface(IMaterial material, float3 viewDir, float3 lightDir, float3 normal)
{
    float3 result = material.evaluateBRDF(viewDir, lightDir, normal);
}
```

### Módulos e Namespaces

O Slang oferece um sistema de módulos para melhor organização do código. Os símbolos precisam ser marcados como `public` para serem visíveis fora de seu módulo, e os módulos não introduzem *namespaces* — símbolos importados são usados diretamente:

```slang
// No arquivo: lighting.slang
module Lighting;

public float3 calculateDirectLighting(float3 normal, float3 lightDir, float3 color)
{
    float NdotL = max(0, dot(normal, lightDir));
    return color * NdotL;
}

// No arquivo: main.slang
import Lighting;

float3 directLight = calculateDirectLighting(normal, lightDir, color);
```

### Modelo de Vínculo de Recursos (*Resource Binding*)

Além do vínculo implícito baseado em ordem, o Slang permite agrupar recursos relacionados em blocos de parâmetros (*parameter blocks*):

```slang
struct MaterialResources
{
    Texture2D albedoMap;
    SamplerState samplerState;
};
ParameterBlock<MaterialResources> material;

// Uso
float4 albedo = material.albedoMap.Sample(material.samplerState, uv);
```

Os *parameter blocks* recebem um *descriptor set* e um *binding* automaticamente. Ainda é possível definir um *binding* explícito com `vk::binding` quando um layout estável entre edições de *shader* for necessário:

```slang
[[vk::binding(0, 1)]]
ParameterBlock<MaterialResources> material;
```

## Usando Slang na Sua Aplicação

Do ponto de vista da aplicação, usar Slang é exatamente igual a usar GLSL. Como a aplicação sempre consome *shaders* no formato SPIR-V, a única diferença está no ferramental usado para gerar os *shaders* SPIR-V a partir da linguagem de *shading* desejada.

## Compilando Shaders

Para obter SPIR-V a partir de Slang é necessário um compilador. Assim como GLSL e HLSL, o Slang vem tanto com um compilador offline (um binário disponível para múltiplos sistemas operacionais) quanto com uma biblioteca para compilação em tempo de execução. Ambos podem ser baixados pelo [GitHub](https://github.com/shader-slang/slang/releases) e também fazem parte do [Vulkan SDK](https://vulkan.lunarg.com/sdk/home).

### Compilação Offline Usando o Compilador Independente

Compilar um *shader* offline por meio do binário pré-compilado `slangc` é semelhante a compilar com o `glslang`:

```text
slangc texture.slang -target spirv -o texture.vert.spv
```

Isso gerará um único arquivo SPIR-V contendo todos os estágios de *shader* fornecidos no arquivo-fonte Slang.

Estágios específicos de *shader* podem ser compilados da seguinte forma:

```text
slangc texture.slang -target spirv -entry vertexMain -stage vertex -o texture.vert.spv
```

Capacidades (*capabilities*) são habilitadas implicitamente com base no uso dos recursos, mas também podem ser especificadas explicitamente:

```text
slangc heap.slang -target spirv -entry vertexMain -stage vertex -o heap.vert.spv -capability spvDescriptorHeapEXT
```

O SPIR-V resultante pode então ser carregado diretamente pela aplicação, da mesma forma que o SPIR-V gerado a partir de GLSL.

O `slangc` também pode compilar código-fonte HLSL ou GLSL diretamente para SPIR-V, usando a opção `-lang` (ou `-allow-glsl`) para selecionar a linguagem de entrada:

```text
# Modo de compatibilidade HLSL
slangc -target spirv -lang hlsl -entry main -o shader.spv shader.hlsl

# Modo de compatibilidade GLSL
slangc -target spirv -allow-glsl -entry main -o shader.spv shader.glsl
```

### Compilação em Tempo de Execução Usando a Biblioteca

O Slang também pode ser integrado a uma aplicação Vulkan por meio da API Slang Compiler, permitindo a compilação de *shaders* em tempo de execução. Para isso, é necessário incluir os cabeçalhos do compilador Slang e vincular (*link*) com a biblioteca `slang` (ou `slang-compiler`).

Compilar Slang para SPIR-V em tempo de execução é bastante direto:

```cpp
#include "slang/slang.h"
#include "slang/slang-com-ptr.h"

#include <array>
#include <cstdint>

// ...

// Inicializa o compilador de shaders Slang
Slang::ComPtr<slang::IGlobalSession> slangGlobalSession;
slang::createGlobalSession(slangGlobalSession.writeRef());

const auto slangTargets = std::to_array<slang::TargetDesc>({
    {
        .format = SLANG_SPIRV,
        .profile = slangGlobalSession->findProfile("spirv"),
    }
});
const auto slangOptions = std::to_array<slang::CompilerOptionEntry>({
    {
        .name = slang::CompilerOptionName::EmitSpirvDirectly,
        .value = { .kind = slang::CompilerOptionValueKind::Int, .intValue0 = 1 },
    }
});
const slang::SessionDesc slangSessionDesc{
    .targets = slangTargets.data(),
    .targetCount = static_cast<SlangInt>(slangTargets.size()),
    // Corresponde ao layout de matrizes do GLSL
    .defaultMatrixLayoutMode = SLANG_MATRIX_LAYOUT_COLUMN_MAJOR,
    .compilerOptionEntries = slangOptions.data(),
    .compilerOptionEntryCount = static_cast<uint32_t>(slangOptions.size()),
};

// Carrega e compila o shader
Slang::ComPtr<slang::ISession> slangSession;
slangGlobalSession->createSession(slangSessionDesc, slangSession.writeRef());
Slang::ComPtr<slang::IModule> slangModule{
    slangSession->loadModuleFromSource("shader", "shader.slang", nullptr, nullptr)
};
Slang::ComPtr<ISlangBlob> spirv;
slangModule->getTargetCode(0, spirv.writeRef());

const VkShaderModuleCreateInfo shaderModuleCI{
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .pNext = nullptr,
    .flags = 0,
    .codeSize = spirv->getBufferSize(),
    .pCode = static_cast<const uint32_t*>(spirv->getBufferPointer()),
};

// Cria o shader module a ser utilizado pela aplicação
VkShaderModule shaderModule = VK_NULL_HANDLE;
chk(vkCreateShaderModule(device, &shaderModuleCI, nullptr, &shaderModule));

// Obtém os estágios de shader a partir do único módulo recém-compilado
const std::array<VkPipelineShaderStageCreateInfo, 2> shaderStages{{
    {
        .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
        .pNext = nullptr,
        .flags = 0,
        .stage = VK_SHADER_STAGE_VERTEX_BIT,
        .module = shaderModule,
        .pName = "main",
        .pSpecializationInfo = nullptr,
    },
    {
        .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
        .pNext = nullptr,
        .flags = 0,
        .stage = VK_SHADER_STAGE_FRAGMENT_BIT,
        .module = shaderModule,
        .pName = "main",
        .pSpecializationInfo = nullptr,
    },
}};

const VkGraphicsPipelineCreateInfo pipelineCI{
    .sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO,
    // ...
    .stageCount = static_cast<uint32_t>(shaderStages.size()),
    .pStages = shaderStages.data(),
};
chk(vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &pipelineCI, nullptr, &pipeline));
```

## Boas Práticas para Escrever Shaders em Slang para Vulkan

### Organização de Código

* **Use módulos**: organize o código em módulos lógicos com responsabilidades bem definidas.
* **Aproveite importações**: use `import` em vez de `#include` para um gerenciamento de dependências superior.
* **Use interfaces**: defina interfaces para funcionalidades comuns a fim de habilitar polimorfismo.

### Considerações de Desempenho

* **Faça profiling do despacho de interfaces**: teste o impacto de desempenho do polimorfismo baseado em interfaces; frequentemente as interfaces são resolvidas em tempo de compilação por meio de especialização, mas isso não é garantido em todos os usos.
* **Aproveite avaliação em tempo de compilação**: utilize genéricos e especialização para mover trabalho para o tempo de compilação.
* **Considere especialização**: gere variantes especializadas de *shaders* para caminhos críticos de desempenho.

### Boas Práticas Específicas do Vulkan

* **Use parameter blocks**: organize recursos em *parameter blocks* para melhor estruturação.
* **Deixe o Slang atribuir bindings**: o Slang atribui automaticamente índices de *descriptor set* e *binding*, portanto atributos `vk::binding` explícitos geralmente são desnecessários; adicione-os apenas quando precisar de um layout estável entre edições de *shader* ou precisar corresponder a *bindings* definidos em outro lugar da aplicação.
* **Compatibilidade entre APIs**: use compilação condicional para código específico do Vulkan onde *parameter blocks* não se encaixem bem (veja abaixo).

## Tópicos Avançados

### Compilação Cruzada e Portabilidade

O Slang não define automaticamente macros de pré-processador específicas de destino, já que o pré-processamento é executado uma única vez independentemente de quantos destinos estão sendo compilados. Defina sua própria macro na linha de comando (por exemplo, `-DTARGET_VULKAN=1`) para cada compilação de destino:

```slang
// TARGET_VULKAN é definida na linha de comando,
// por exemplo: `slangc -target spirv -DTARGET_VULKAN=1 ...`
#ifdef TARGET_VULKAN
[[vk::binding(0, 0)]]
#endif
ParameterBlock<GlobalResources> globals;
```

### Composição e Reutilização de Shaders

Interfaces, genéricos e módulos são recursos independentes do Slang que se combinam muito bem para construir código de *shader* reutilizável:

```slang
// Em lighting.slang
module Lighting;

public interface ILight
{
    float3 calculateLighting(float3 position, float3 normal, float3 viewDir);
}

// Em directional_light.slang
module Lights.Directional;
import Lighting;

public struct DirectionalLight : ILight
{
    float3 direction;
    float3 color;

    float3 calculateLighting(float3 position, float3 normal, float3 viewDir)
    {
        // Implementação
    }
}

// No shader principal
module Main;
import Lighting;
import Lights.Directional;

float3 shadeSurface(ILight light, float3 position, float3 normal, float3 viewDir)
{
    return light.calculateLighting(position, normal, viewDir);
}
```

## Reflexão e Introspecção de Shaders

O Slang fornece uma API de reflexão (*reflection API*) para inspecionar código de *shader* compilado a partir do código da aplicação no host:

* **Layout de tipos e campos**: consulta os campos, tipos e layout de memória de um programa.
* **Layout de vínculo de recursos**: consulta o *descriptor set* e o *binding* atribuídos a cada recurso, o que pode ser usado para construir *descriptor set layouts* sem fixar *bindings* diretamente no código.
* **Parâmetros de ponto de entrada**: consulta os parâmetros de um determinado *entry point*.

Os dados de reflexão são obtidos após compilar ou vincular um programa, por meio de `slang::ProgramLayout` e interfaces relacionadas como `TypeLayoutReflection` e `VariableLayoutReflection`. Consulte a [documentação da API de reflexão do Slang](https://shader-slang.org/slang/user-guide/reflection) para detalhes e exemplos.

## Referências e Leituras Complementares

* [Repositório do Slang no GitHub](https://github.com/shader-slang/slang)
* [Documentação do Slang](https://docs.shader-slang.org/en/latest/)
* [Guia da Linguagem Slang](https://github.com/shader-slang/spec)
* [SPIR-V Guide](https://github.com/KhronosGroup/SPIRV-Guide)
* [Vulkan Interfaces with SPIR-V](https://docs.vulkan.org/spec/latest/chapters/interfaces.html)
* Consulte o capítulo sobre *HLSL no Vulkan*
