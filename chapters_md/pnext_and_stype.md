# pNext e sType

Quem é novo no Vulkan logo começa a notar as variáveis `pNext` e `sType` por toda a especificação do Vulkan. O ponteiro `void* pNext` é usado para permitir a expansão da especificação do Vulkan, criando uma lista encadeada (*linked list*) entre estruturas. Já `VkStructureType sType` é usado pelo *loader*, pelas *layers* e pelas implementações para saber qual tipo de estrutura foi passado através de `pNext`. O campo `pNext` é utilizado principalmente ao lidar com extensões que expõem novas estruturas.

## Duas Estruturas Base

A API Vulkan [fornece duas estruturas base](https://docs.vulkan.org/spec/latest/chapters/fundamentals.html#fundamentals-validusage-pNext), `VkBaseInStructure` e `VkBaseOutStructure`, para serem usadas como uma maneira conveniente de iterar por uma cadeia de ponteiros de estruturas.

O `In` em `VkBaseInStructure` refere-se ao fato de que `pNext` é um `const *` e é somente leitura para o *loader*, as *layers* e o *driver* que o recebem. O `Out` em `VkBaseOutStructure` refere-se ao fato de que `pNext` é usado para retornar dados de volta à aplicação.

## Exemplo de Configuração de Estruturas com pNext

```cpp
#include <cstdint>
#include <format>
#include <iostream>

// Exemplo com duas estruturas simples, "a" e "b"
struct VkA {
    VkStructureType sType;
    void* pNext;
    uint32_t value;
};

struct VkB {
    VkStructureType sType;
    void* pNext;
    uint32_t value;
};

// Uma função Vulkan que recebe a struct "a" como argumento.
// Esta função é responsável por preencher os valores.
void vkGetValue(VkA* pA);

// Define "a" e "b" e configura seus sType usando designated initializers do C++20
VkB b{
    .sType = VK_STRUCTURE_TYPE_B,
    .pNext = nullptr,
    .value = 0,
};

VkA a{
    .sType = VK_STRUCTURE_TYPE_A,
    // Aponta o pNext de "a" para "b"
    .pNext = &b,
    .value = 0,
};

// Passa "a" para a função
vkGetValue(&a);

// Usa os valores que foram ambos preenchidos por vkGetValue()
std::cout << std::format("VkA value = {}\n", a.value);
std::cout << std::format("VkB value = {}\n", b.value);
```

## Exemplo de Leitura de Valores com pNext

Por baixo dos panos, o *loader*, as *layers* e o *driver* agora conseguem encontrar as estruturas encadeadas em `pNext`. Veja a seguir um exemplo que ilustra como alguém **poderia** implementar `pNext` do ponto de vista do *loader*, da *layer* ou do *driver*.

```cpp
void vkGetValue(VkA* pA) {
    auto* next = reinterpret_cast<VkBaseOutStructure*>(pA->pNext);
    while (next != nullptr) {
        switch (next->sType) {
            case VK_STRUCTURE_TYPE_B: {
                auto* pB = reinterpret_cast<VkB*>(next);
                // É aqui que o "b.value" acima foi definido
                pB->value = 42;
                break;
            }

            case VK_STRUCTURE_TYPE_C: {
                // É possível encadear quantas estruturas forem suportadas
                auto* pC = reinterpret_cast<VkC*>(next);
                SomeFunction(pC);
                break;
            }

            default:
                LOG(std::format("sType não suportado: {}", static_cast<int>(next->sType)));
                break;
        }

        // Isso funciona porque os dois primeiros campos de todas as structs
        // encadeáveis do Vulkan são "sType" e "pNext", garantindo o mesmo deslocamento (offset) para pNext
        next = next->pNext;
    }

    // ...
}
```
