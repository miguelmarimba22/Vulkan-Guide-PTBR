# Descriptor Buffer

Este capítulo tem como objetivo ilustrar melhor como funciona o mapeamento de memória da extensão [`VK_EXT_descriptor_buffer`](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/proposals/VK_EXT_descriptor_buffer.adoc).

O objetivo aqui **não** é mostrar um exemplo real ou um uso recomendado, mas sim ajudar a compreender como a API mapeia dados para o shader, para que depois você possa utilizar essa API da forma que preferir.

> **Nota:** Este capítulo utilizará apenas Storage Buffers porque é mais simples demonstrar os mapeamentos dessa forma. Samplers e imagens funcionam de maneira geral do mesmo modo, mas com ressalvas explicadas em mais detalhes na proposta da extensão.

## Sobrecarga de Terminologia

Para esclarecer alguns termos antes de começar:

* **"descriptor buffers"** (*buffers de descritores*) são simplesmente `VkBuffer` criados com as flags `VK_BUFFER_USAGE_RESOURCE_DESCRIPTOR_BUFFER_BIT_EXT`.
* **"samplers"** são `VkSampler` (`VK_DESCRIPTOR_TYPE_SAMPLER`).
* **"resources"** (*recursos*) são todos os outros `VkDescriptorType`:
  * Isso pode ser um `VkBuffer`, que pode ser chamado de **"resource buffer"** (*buffer de recurso*).

## O Shader de Exemplo

Vamos usar um shader básico que possui 3 conjuntos (*sets*), cada um com 3 descritores em seu interior. Cada descritor recebe a escrita de um valor único.

```glsl
layout (set = 0, binding = 0) buffer A { uint a; };
layout (set = 0, binding = 1) buffer B { uint b; };
layout (set = 0, binding = 2) buffer C { uint c; };

layout (set = 1, binding = 0) buffer D { uint d; };
layout (set = 1, binding = 1) buffer E { uint e; };
layout (set = 1, binding = 2) buffer F { uint f; };

layout (set = 2, binding = 0) buffer G { uint g; } array[3];

void main() {
    a = 10;
    b = 20;
    c = 30;
    d = 40;
    e = 50;
    f = 60;
    array[0].g = 70;
    array[1].g = 80;
    array[2].g = 90;
}
```

Com esse shader, teremos então 3 `VkDescriptorSetLayout` em um único pipeline que corresponde exatamente à interface do shader.

```cpp
// Conjuntos (sets) 0 e 1
constexpr std::array<VkDescriptorSetLayoutBinding, 3> bindings_a{{
    {.binding = 0, .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, .descriptorCount = 1},
    {.binding = 1, .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, .descriptorCount = 1},
    {.binding = 2, .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, .descriptorCount = 1},
}};

// Conjunto (set) 2
constexpr std::array<VkDescriptorSetLayoutBinding, 1> bindings_b{{
    {.binding = 0, .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, .descriptorCount = 3},
}};

// Criação ilustrativa dos layouts de descriptor set e do pipeline layout
VkDescriptorSetLayout ds_layout_0 = create_descriptor_set_layout(bindings_a); // Set 0
VkDescriptorSetLayout ds_layout_1 = create_descriptor_set_layout(bindings_a); // Set 1
VkDescriptorSetLayout ds_layout_2 = create_descriptor_set_layout(bindings_b); // Set 2

std::array<VkDescriptorSetLayout, 3> set_layouts{ds_layout_0, ds_layout_1, ds_layout_2};
VkPipelineLayout pipeline_layout = create_pipeline_layout(set_layouts);
```

## Consultando os Tamanhos de Descriptor Set Layout

Agora, usando os comandos `vkGetDescriptorSetLayoutSizeEXT` e `vkGetDescriptorSetLayoutBindingOffsetEXT`, podemos obter informações do driver sobre o tamanho necessário para usar corretamente esses `VkDescriptorSetLayout`.

> **Nota:** Não presuma que o `binding 0` terá o menor deslocamento (*offset*)! O driver pode reordenar os bindings de uma maneira mais otimizada, de modo que os offsets podem não ser crescentes conforme os números dos bindings.

```cpp
// Isso pode ser feito em um array onde o set/binding são índices usados para obter os tamanhos/offsets
VkDeviceSize set_0_size = 0;
VkDeviceSize set_1_size = 0;
VkDeviceSize set_2_size = 0;
vkGetDescriptorSetLayoutSizeEXT(device, ds_layout_0, &set_0_size);
vkGetDescriptorSetLayoutSizeEXT(device, ds_layout_1, &set_1_size);
vkGetDescriptorSetLayoutSizeEXT(device, ds_layout_2, &set_2_size);

VkDeviceSize binding_0_offset = 0;
VkDeviceSize binding_1_offset = 0;
VkDeviceSize binding_2_offset = 0;
vkGetDescriptorSetLayoutBindingOffsetEXT(device, ds_layout_0, 0, &binding_0_offset);
vkGetDescriptorSetLayoutBindingOffsetEXT(device, ds_layout_0, 1, &binding_1_offset);
vkGetDescriptorSetLayoutBindingOffsetEXT(device, ds_layout_0, 2, &binding_2_offset);

// ...
```

> **Nota:** Embora pareça que poderíamos simplesmente calcular `VkPhysicalDeviceDescriptorBufferPropertiesEXT::storageBufferDescriptorSize * 3` para obter o tamanho, isso está incorreto, pois o driver pode precisar reservar memória extra para os descritores no `VkDescriptorSetLayout`. O valor `storageBufferDescriptorSize` é usado para o mapeamento (veja abaixo) com `vkGetDescriptorEXT`.

## Criando Descriptor Buffers

Vamos criar um `VkBuffer` "especial" com `VK_BUFFER_USAGE_RESOURCE_DESCRIPTOR_BUFFER_BIT_EXT`, o que o torna um `VkBuffer` do tipo "descriptor buffer".

Esses buffers podem ser grandes e armazenam uma "tabela de consulta" (*lookup table*) para seus recursos e samplers.

> **Nota:** O limite mínimo exigido para `VkPhysicalDeviceDescriptorBufferPropertiesEXT::descriptorBufferAddressSpaceSize` é de 128 MB, mas muitos dispositivos conseguem suportar até 4 GB.

Para esta demonstração, vamos criar dois deles.

![Dois descriptor buffers criados na memória](images/descriptor_buffer_1.svg)

## Criando Recursos

Para esta demonstração, vamos criar alguns `VkBuffer` "normais" que usaremos como nossos recursos. Eles são pequenos porque todos os descritores no nosso shader são declarados como `uint`.

![Resource buffers criados para armazenar os dados](images/descriptor_buffer_2.svg)

## Mapeando Recursos para o Descriptor Buffer

Usando `vkGetDescriptorEXT`, encontramos um espaço no "descriptor buffer" e o mapeamos para nossos recursos.

> **Nota:** Na verdade, você pode usar qualquer memória de host para isso, mas, por simplicidade, vamos mapear diretamente para o descriptor buffer por enquanto.

O código a seguir mapeará os 3 descritores usando um único resource buffer.

```cpp
// Memória mapeada via vkMapMemory()
auto* descriptor_ptr = static_cast<std::byte*>(descriptor_buffer_a.GetMappedMemory());

// 64 bytes neste exemplo
const size_t descriptor_size = descriptor_buffer_props.storageBufferDescriptorSize;

const VkDeviceAddress buffer_x_address = vkGetBufferDeviceAddress(device, &buffer_x_addr_info);

// Resultados de exemplo obtidos de vkGetDescriptorSetLayoutBindingOffsetEXT
constexpr VkDeviceSize binding_0_offset = 0;
constexpr VkDeviceSize binding_1_offset = 64;
constexpr VkDeviceSize binding_2_offset = 128;

VkDescriptorAddressInfoEXT address_info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_ADDRESS_INFO_EXT,
    .pNext = nullptr,
    .address = buffer_x_address,
    .range = 4,
    .format = VK_FORMAT_UNDEFINED,
};

VkDescriptorGetInfoEXT get_info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_GET_INFO_EXT,
    .pNext = nullptr,
    .type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
    .data = {.pStorageBuffer = &address_info},
};

vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_0_offset);

address_info.address = buffer_x_address + 4;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_1_offset);

address_info.address = buffer_x_address + 12;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_2_offset);
```

![Mapeamento de três descritores para um único resource buffer](images/descriptor_buffer_3.svg)

Também podemos fazer com que cada descritor mapeie para o seu próprio resource buffer.

```cpp
// Alternando de descriptor buffer
descriptor_ptr = static_cast<std::byte*>(descriptor_buffer_b.GetMappedMemory());

address_info.address = buffer_y1_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_0_offset);

address_info.address = buffer_y2_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_1_offset);

address_info.address = buffer_y3_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + binding_2_offset);
```

![Mapeamento de cada descritor para um resource buffer distinto](images/descriptor_buffer_4.svg)

E, por fim, podemos preencher nosso último conjunto (*set*).

```cpp
constexpr VkDeviceSize set_offset = 256;
assert(set_offset > set_1_size);
assert(set_offset % descriptor_buffer_props.descriptorBufferOffsetAlignment == 0);

address_info.address = buffer_z0_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + set_offset + binding_0_offset);

address_info.address = buffer_z1_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + set_offset + binding_1_offset);

address_info.address = buffer_z2_address;
vkGetDescriptorEXT(device, &get_info, descriptor_size, descriptor_ptr + set_offset + binding_2_offset);
```

![Mapeamento do último descriptor set com deslocamento no descriptor buffer](images/descriptor_buffer_5.svg)

## Vinculando Descriptor Buffers ao Command Buffer

Com `vkCmdBindDescriptorBuffersEXT`, agora vinculamos o "descriptor buffer" ao command buffer.

> **Nota:** Embora você possa criar vários descriptor buffers, existe um limite mais restrito de quantos podem ficar vinculados simultaneamente. As camadas de validação (*validation layers*) avisarão se você ultrapassar limites como `maxDescriptorBufferBindings` ou `maxResourceDescriptorBufferBindings`.

```cpp
const std::array<VkDescriptorBufferBindingInfoEXT, 2> binding_info{{
    {
        .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_BUFFER_BINDING_INFO_EXT,
        .pNext = nullptr,
        .address = descriptor_buffer_a.Address(),
        .usage = VK_BUFFER_USAGE_RESOURCE_DESCRIPTOR_BUFFER_BIT_EXT,
    },
    {
        .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_BUFFER_BINDING_INFO_EXT,
        .pNext = nullptr,
        .address = descriptor_buffer_b.Address(),
        .usage = VK_BUFFER_USAGE_RESOURCE_DESCRIPTOR_BUFFER_BIT_EXT,
    },
}};

vkCmdBindDescriptorBuffersEXT(
    command_buffer,
    static_cast<uint32_t>(binding_info.size()),
    binding_info.data());
```

![Vinculação dos descriptor buffers ao command buffer](images/descriptor_buffer_6.svg)

## Vinculando Offsets

Em seguida, chamamos `vkCmdSetDescriptorBufferOffsetsEXT` e alinhamos os `VkDescriptorSetLayout` (do `VkPipelineLayout`) com o nosso descriptor buffer.

> **Nota:** A maioria dos comandos gravados em um command buffer pode estar em qualquer ordem, desde que esteja dentro/fora de um render pass e antes de um draw. No entanto, `vkCmdSetDescriptorBufferOffsetsEXT` precisa ser chamado **depois** de `vkCmdBindDescriptorBuffersEXT`.

```cpp
constexpr VkDeviceSize set_offset = 256; // definido acima

constexpr uint32_t first_set = 0;
constexpr std::array<uint32_t, 3> buffer_indices{0, 1, 1};
constexpr std::array<VkDeviceSize, 3> buffer_offsets{0, 0, set_offset};

vkCmdSetDescriptorBufferOffsetsEXT(
    command_buffer,
    pipeline_bind_point,
    pipeline_layout,
    first_set,
    static_cast<uint32_t>(buffer_indices.size()),
    buffer_indices.data(),
    buffer_offsets.data());
```

![Configuração dos offsets dos descriptor buffers para cada set](images/descriptor_buffer_7.svg)

## Hora de Desenhar

É isso! A partir daqui, você pode simplesmente chamar `vkCmdDraw` (ou outros comandos de ação, como `vkCmdDispatch`) e tudo deverá funcionar corretamente!

![Execução do comando de desenho com os descriptor buffers vinculados](images/descriptor_buffer_8.svg)

## Um Descritor é na Verdade Apenas Memória

Quando você chama `vkGetDescriptorEXT`, o que realmente está acontecendo? O driver está basicamente pegando as informações de `VkDescriptorGetInfoEXT` e transformando-as em um bloco binário (*binary blob*), que agora até a própria aplicação pode ler!

```cpp
#include <cstddef>
#include <cstdint>
#include <format>
#include <iostream>
#include <span>

// Pode ser usada para imprimir os bytes na sua máquina também
void print_bytes(std::span<const std::byte> memory) {
    std::cout << std::format("--- (em {}) ---\n", static_cast<const void*>(memory.data()));
    for (size_t i = 0; i < memory.size(); ++i) {
        std::cout << std::format("{:02X} ", std::to_integer<uint8_t>(memory[i]));
        if ((i + 1) % 16 == 0) {
            std::cout << '\n';
        }
    }
    std::cout << '\n';
}

auto* some_host_memory = static_cast<std::byte*>(buffer.GetMappedMemory());
vkGetDescriptorEXT(device, &get_info, descriptor_size, some_host_memory);

print_bytes({some_host_memory, descriptor_size});

// Exemplo de saída executando no Lavapipe
// Isso representa o que um "descritor" é como um bloco binário:
// --- (em 0x71841c1e7240) ---
// 00 80 1E 1C 84 71 00 00 10 00 00 00 00 00 00 00
// 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
// 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
// 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

### Copiando o Descritor por Conta Própria

Com esse conhecimento, percebemos agora que podemos simplesmente copiar o descritor usando `std::memcpy` por conta própria.

```cpp
#include <cstddef>
#include <cstring>
#include <vector>

std::vector<std::byte> host_memory(descriptor_size);

VkDescriptorAddressInfoEXT address_info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_ADDRESS_INFO_EXT,
    .pNext = nullptr,
    .address = buffer_x_address,
    .range = 4,
    .format = VK_FORMAT_UNDEFINED,
};

VkDescriptorGetInfoEXT get_info{
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_GET_INFO_EXT,
    .pNext = nullptr,
    .type = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
    .data = {.pStorageBuffer = &address_info},
};

vkGetDescriptorEXT(device, &get_info, descriptor_size, host_memory.data());

void* descriptor_ptr = descriptor_buffer_a.GetMappedMemory();
std::memcpy(descriptor_ptr, host_memory.data(), descriptor_size);
```

![Cópia manual do bloco binário do descritor da memória de host para o descriptor buffer](images/descriptor_buffer_9.svg)

### Copiando o Descritor na GPU

Podemos ir um passo além e fazer com que nosso descriptor buffer nem sequer seja visível pelo host (*host visible*).

Podemos gravar o descritor em um `VkBuffer` de *staging* e depois copiá-lo na GPU.

```cpp
void* staging_buffer_ptr = staging_buffer.GetMappedMemory();

vkGetDescriptorEXT(device, &get_info, descriptor_size, staging_buffer_ptr);

const VkBufferCopy copy_region{
    .srcOffset = 0,
    .dstOffset = 0,
    .size = descriptor_size,
};
vkCmdCopyBuffer(command_buffer, staging_buffer, descriptor_buffer_a, 1, &copy_region);
```

![Cópia do descritor de um staging buffer para o descriptor buffer na GPU](images/descriptor_buffer_10.svg)

### Não Esqueça de Adicionar Sincronização

Ao copiar memória para o seu descriptor buffer, certifique-se de adicionar uma barreira (*barrier*) com `VK_ACCESS_2_DESCRIPTOR_BUFFER_READ_BIT_EXT` para garantir que quaisquer escritas estejam visíveis para a GPU quando ela precisar acessá-las!
