# Alinhamento de Buffer Device Address

Todas as variáveis acessadas com `PhysicalStorageBuffer` devem possuir um operando de memória `Aligned`.

```text
%x = OpLoad %type %ptr Aligned 16
OpStore %ptr %obj Aligned 16
```

As linguagens de *shader* possuem um valor padrão, mas permitem especificar o alinhamento explicitamente (por exemplo, `buffer_reference_align`).

O objetivo desse alinhamento é servir como uma promessa de quão alinhado aquele ponteiro específico está. O compilador não tem como saber qual será o endereço no momento da compilação do *shader*. Ao fornecer um alinhamento, ele pode gerar código válido para atender ao requisito. O usuário é responsável por garantir que o endereço utilizado respeite esse alinhamento.

```glsl
layout(buffer_reference, buffer_reference_align = 64) buffer MyBDA {
    uint data;
};

MyBDA ptr_a; // em 0x1000
MyBDA ptr_b; // em 0x1010
MyBDA ptr_c; // em 0x1040

ptr_a.data = 0; // (Aligned 64) válido!
ptr_b.data = 0; // (Aligned 64) inválido!
ptr_c.data = 0; // (Aligned 64) válido!
```

Ao decidir um alinhamento, o valor mínimo será sempre maior ou igual ao tamanho do maior tipo escalar/componente presente no bloco.

```glsl
// o alinhamento deve ser de pelo menos 4
layout(buffer_reference) buffer MyBDA {
    vec4 a; // o escalar é float
};

// o alinhamento deve ser de pelo menos 1
layout(buffer_reference) buffer MyBDA {
    uint8_t a; // o escalar é inteiro de 8 bits
};

// o alinhamento deve ser de pelo menos 8
layout(buffer_reference) buffer MyBDA {
    uint a;   // 32 bits
    double b; // 64 bits
};
```

## Exemplo de Definição de Alinhamento

Para ajudar a explicar o alinhamento, vamos considerar o exemplo de carregar um *array* de vetores:

```glsl
layout(buffer_reference, buffer_reference_align = ???) buffer MyBDA {
    uvec4 data[];
};

MyBDA ptr; // em 0x1000
ptr.data[i] = uvec4(0);
```

Aqui temos duas opções: podemos definir `Aligned` como `4` ou `16`.

Se definirmos o alinhamento como `16`, estamos informando ao compilador que ele pode carregar 16 bytes por vez, então ele provavelmente realizará uma operação vetorial de leitura/escrita (*vector load/store*) na memória.

Se definirmos o alinhamento como `4`, o compilador provavelmente não terá como inferir o alinhamento real e fará 4 operações escalares de leitura/escrita de inteiros na memória.

> **Nota:** Algumas GPUs conseguem realizar operações vetoriais de leitura/escrita mesmo em endereços desalinhados.

No próximo caso, se tivéssemos `uvec3` em vez de `uvec4`, como abaixo:

```glsl
layout(buffer_reference, buffer_reference_align = 4, scalar) buffer MyBDA {
    uvec3 data[];
};

data[0]; // 0x1000
data[1]; // 0x100C
data[2]; // 0x1018
data[3]; // 0x1024
```

Sabemos que definir o alinhamento como `16` seria violado em `data[1]` e, portanto, precisamos usar um alinhamento de `4` nesse caso. Felizmente, as linguagens de *shader* ajudam a fazer isso automaticamente para você, como pode ser visto tanto no [glslang](https://godbolt.org/z/jWGKax1ed) quanto no [slang](https://godbolt.org/z/Y7xW3Mfd4).

## Correspondendo o Alinhamento a Partir do Host

Ao lidar com *Buffer Device Address*, você pode fazer um simples `memcpy` para aquela memória no *host*, o que pode facilmente introduzir bugs se você não tiver cuidado com o alinhamento dos dados.

> **Nota:** Os problemas a seguir não estão diretamente ligados apenas ao *Buffer Device Address*, podendo ocorrer com qualquer *uniform buffer* ou *storage buffer*.

Considere o seguinte código GLSL como exemplo ([visualizar online](https://godbolt.org/z/G4P8GdG9q)):

```glsl
// ArrayStride é 16
struct Metadata {
    uint64_t address;
    uint status;
};

layout(buffer_reference, buffer_reference_align = 8, scalar) readonly buffer Payload {
    uint count;      // offset 0
    Metadata meta[]; // offset 8
};

layout(set = 0, binding = 0) buffer SSBO_0 {
    Payload data;
};
```

Como `uint64_t` precisa ser acessado com alinhamento de 8 bytes, o `glslang` (e qualquer outro compilador) será inteligente e empacotará os dados da forma mais compacta possível para você.

A primeira coisa que você pode notar é que `Metadata` precisa ter um *array stride* de 16 em vez de 12. Isso ocorre porque, caso contrário, `uint64_t address` cairia em um endereço não alinhado a 8 bytes em instâncias alternadas do *array*.

O próximo detalhe é que, como o **maior escalar** de `struct Metadata` é um valor de 8 bytes, o compilador sabe que deve posicionar o *offset* em `8` em vez de `4`. É por isso que tentar alterar a struct para:

```glsl
struct Metadata {
    uint status;
    uint64_t address;
};
```

ou

```glsl
struct Metadata {
    uint64_t address;
    uint status;
    uint pad;
};
```

não mudará o *offset* de `8`.

Veja como a memória fica organizada:

![Diagrama do layout de memória para Payload e Metadata](images/buffer_device_address_alignment_1.svg)

Portanto, o cuidado surge quando tentamos mapear nossa memória no *host*. Quando você chama `vkMapMemory` e obtém um `void*`, precisa garantir que a memória esteja organizada exatamente como no diagrama acima. Uma maneira de assegurar isso é utilizar uma struct no *host* que corresponda ao código do *shader*:

```cpp
#include <array>
#include <cstdint>
#include <cstring>
#include <vulkan/vulkan.h>

struct Metadata {
    uint64_t address;
    uint32_t status;
};

struct Payload {
    uint32_t count;
    std::array<Metadata, 2> meta;
};

const Payload payload{
    .count = 2,
    .meta = {{
        {.address = 0xDEADBEEF, .status = 20},
        {.address = 0xDEADBEEF, .status = 5},
    }},
};

void* data = nullptr;
vkMapMemory(device, deviceMemory, 0, VK_WHOLE_SIZE, 0, &data);

// Você também pode copiar diretamente usando std::memcpy
std::memcpy(data, &payload, sizeof(Payload));
```

Se examinarmos o código C++ aqui ([visualizar no Compiler Explorer](https://godbolt.org/z/Gq75qq1x6)), podemos ver que o assembly gerado também mapeia automaticamente os *offsets* exatamente da mesma forma que o código GLSL acima!
