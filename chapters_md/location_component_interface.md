# Interface de Location e Component

Este capítulo é uma visão geral da seção [Atribuição de Location e Component](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-iointerfaces-locations) da especificação Vulkan, com o intuito de fornecer exemplos, especialmente em torno de alguns dos casos extremos mais incomuns.

A maneira mais simples de pensar em uma `Location` é que ela é composta por quatro `Component` de 32 bits. Isso significa que um `vec4`/`float4`/`uvec4`/etc. cabe perfeitamente em uma única `Location`. Múltiplas variáveis podem ser empacotadas na mesma `Location` desde que seus `Component` não se sobreponham.

Locations são usadas tanto para `Input` quanto para `Output` para fazer a interface entre estágios de shader sempre que possível.

## Conselho para Usuários em Geral

Para a maioria das pessoas, este capítulo aprofunda-se muito mais em casos extremos do que o modo como desenvolvedores costumam usar a interface de `Location`. Para esses desenvolvedores, o conselho simples a levar em conta é:

1. Use menos `Location` sempre que possível.
2. Se precisar de muitas `Location`, certifique-se de permanecer [abaixo dos limites](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-iointerfaces-limits).

## Exemplo Básico

Aqui está um exemplo básico:

```glsl
layout(location=0) in vec4 a;
layout(location=1, component = 0) in vec2 b;
layout(location=1, component = 2) in float c;
```

![Exemplo básico de atribuição de locations e components](images/location_example_basic.svg)

## 16 bits

Valores de 16 bits sempre consomem um `Component` completo de 32 bits. Portanto, um vetor com elementos de 16 bits consumirá os mesmos recursos que um vetor com elementos de 32 bits; eles não são empacotados de forma compacta.

```glsl
layout(location=0) in f16vec3 a;
```

![Consumo de components por um vetor de 16 bits](images/location_example_16bit.svg)

## Cruzando Fronteiras de Location

Todos os vetores de 16 bits e 32 bits devem caber dentro de uma única `Location`, portanto o exemplo a seguir **não** é permitido. Os últimos dois elementos consumiriam `component = 4` e `component = 5`, que não existem.

```glsl
layout(location=0, component = 2) in vec4 a;
```

![Exemplo inválido de vetor cruzando fronteiras de location](images/location_example_boundaries.svg)

## 64 bits

Valores de 64 bits são especiais, pois podem consumir até 2 `Location`, mas só podem começar em `Component` `0` ou `2`.

```glsl
layout(location=0) in f64vec3 a;
```

![Consumo de duas locations por um vetor de 64 bits](images/location_example_64bit.svg)

## Intercalando Components

A tentativa a seguir de fazer múltiplas variáveis compartilharem o mesmo componente [não é permitida](https://godbolt.org/z/h61baYhT4).

```glsl
layout(location=0) in vec2 in_a; // Components 0 e 1
layout(location=0, component=1) in float in_f; // Inválido: sobrepõe o component 1
```

A modificação a seguir torna o código válido, pois múltiplas variáveis podem compartilhar uma `Location`, apenas não um `Component`:

```patch
layout(location=0) in vec2 in_a;
// Altera in_f para usar o component 2 em vez disso
- layout(location=0, component=1) in float in_f;
+ layout(location=0, component=2) in float in_f;
```

## Arrays

Um elemento de um array consumirá todos os `Component` em uma `Location` que ele consumiria como um valor fora de array, com cada elemento subsequente consumindo a próxima `Location` disponível.

Por exemplo:

```glsl
layout(location=0) in float a[3];
```

![Consumo de locations por um array de floats](images/location_example_array.svg)

Como visto, usar um escalar ou algo como um `vec2`/`float2` deixará muitos slots de `Component` sem uso.

É **permitido** utilizar qualquer outro `Component` em uma `Location` que esteja sendo consumida por um array.

> **Nota:** Esse comportamento tem funcionamento garantido em drivers compatíveis com a CTS 1.4.6.0 e versões superiores.

```glsl
layout(location=0) in float a[3];
layout(location=2, component=2) in float b;
```

`float b` continua sendo válido porque o array consome apenas a primeira parte da `Location` 2.

![Uso de component livre na mesma location de um elemento de array](images/location_example_array2.svg)

> **Nota:** Alguns estágios de shader, como geometry shaders, possuem um array envolvendo sua interface de correspondência; esse array externo é desconsiderado nos exemplos acima.

## Matrizes

Uma matriz é armazenada como um array de vetores; isso significa que algo como:

```glsl
layout(location = 0) in mat3x2 a;
```

consome locations e components de forma idêntica a:

```glsl
// N == 3
// O stride do array é por Location
layout(location = 0) in vec2 a[3];
```

que, por sua vez, é armazenado de forma idêntica a:

```glsl
// Cada vetor consome apenas os 2 primeiros components de cada location
layout(location = 0) in vec2 a0;
layout(location = 1) in vec2 a1;
layout(location = 2) in vec2 a2;
```

Isso significa que o seguinte código é permitido:

```glsl
layout(location = 0) in mat3x2 a;
layout(location = 1, component = 2) in float b;
layout(location = 2, component = 2) in float c;
```

Os floats `b` e `c` continuam sendo válidos aqui.

![Empacotamento de floats nos components livres de uma matriz](images/location_example_matrix.svg)

> **Nota:** Diferentemente de arrays ou vetores independentes, [matrizes não podem ser decoradas com `Component`](https://godbolt.org/z/f81PvP538), portanto serão sempre empacotadas a partir do component 0.
