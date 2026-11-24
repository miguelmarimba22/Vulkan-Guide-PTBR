# Recursos Esparsos (*Sparse Resources*)

Os [recursos esparsos](https://docs.vulkan.org/spec/latest/chapters/sparsemem.html) em Vulkan são uma forma de criar objetos `VkBuffer` e `VkImage` que podem ser vinculados (*bound*) de maneira não contígua a uma ou mais alocações de `VkDeviceMemory`. Existem diversos aspectos e recursos relacionados a recursos esparsos que a [especificação](https://docs.vulkan.org/spec/latest/chapters/sparsemem.html#sparsememory-sparseresourcefeatures) explica muito bem. Conforme destacam as [diretrizes de implementação](https://registry.khronos.org/vulkan/specs/latest/html/vkspec.html#_sparse_resource_implementation_guidelines_informative), a maioria das implementações utiliza recursos esparsos para expor à aplicação uma faixa linear de endereços virtuais de memória, mapeando cada bloco esparso para páginas físicas no momento do vínculo.

## Vinculando Memória Esparsa

Diferentemente de recursos normais que chamam `vkBindBufferMemory()` ou `vkBindImageMemory()`, a memória esparsa é vinculada por meio de uma [operação de queue](https://docs.vulkan.org/spec/latest/chapters/sparsemem.html#sparsememory-resource-binding), a `vkQueueBindSparse()`. A principal vantagem disso é que uma aplicação pode revincular memória a um recurso esparso ao longo de todo o seu ciclo de vida.

É importante notar que isso exige cuidados adicionais por parte da aplicação. As aplicações **devem** usar primitivas de sincronização para garantir que outras *queues* não acessem faixas de memória simultaneamente a uma alteração de vínculo. Além disso, liberar um objeto `VkDeviceMemory` com `vkFreeMemory()` **não** fará com que recursos (ou regiões de recursos) vinculados a esse objeto de memória sejam desvinculados. As aplicações não devem acessar recursos vinculados a memória que já foi liberada.

## Buffers Esparsos

O exemplo a seguir ajuda a demonstrar visualmente como um `VkBuffer` esparso se comporta na memória. Observe que, embora não seja obrigatório, a maioria das implementações usa blocos esparsos de 64 KB para `VkBuffer` (o tamanho real é retornado em `VkMemoryRequirements::alignment`).

Imagine um `VkBuffer` de 256 KB no qual existem 3 partes que a aplicação deseja atualizar separadamente:

* Seção A - 64 KB
* Seção B - 128 KB
* Seção C - 64 KB

A imagem a seguir mostra como a aplicação enxerga esse `VkBuffer`:

![Visualização de um VkBuffer esparso dividido em três seções](images/sparse_resources_buffer.png)

### Imagens Esparsas

#### Regiões de *Mip Tail*

Imagens esparsas podem ser usadas para atualizar níveis de *mip* separadamente, o que resulta em uma [região de mip tail](https://docs.vulkan.org/spec/latest/chapters/sparsemem.html#sparsememory-miptail). A especificação descreve os vários exemplos que podem ocorrer por meio de diagramas.

#### Exemplo Básico de Recursos Esparsos

Os exemplos a seguir ilustram a criação básica de imagens esparsas e seu vínculo à memória física.

Este exemplo básico cria um objeto `VkImage` normal, mas usa alocação de memória de granularidade fina para respaldar o recurso com múltiplas faixas de memória.

```cpp
#include <array>
#include <cassert>
#include <cstdint>
#include <vulkan/vulkan.h>

// Exemplo ilustrativo (MAX_CHUNKS não faz parte da API Vulkan)
constexpr uint32_t MAX_CHUNKS = 64;

VkDevice device{};
VkQueue queue{};
VkImage sparseImage{};
const VkAllocationCallbacks* pAllocator = nullptr;
VkMemoryRequirements memoryRequirements{};
VkDeviceSize offset = 0;
std::array<VkSparseMemoryBind, MAX_CHUNKS> binds{};
uint32_t bindCount = 0;

// ...

// Aloca o objeto de imagem
const VkImageCreateInfo sparseImageInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    .flags = VK_IMAGE_CREATE_SPARSE_BINDING_BIT /* | ... */,
    // ... demais campos de criação da imagem
};
vkCreateImage(device, &sparseImageInfo, pAllocator, &sparseImage);

// Obtém os requisitos de memória
vkGetImageMemoryRequirements(device, sparseImage, &memoryRequirements);

// Vincula a memória com granularidade fina, buscando faixas de memória disponíveis
// a partir de potencialmente múltiplos pools de VkDeviceMemory.
// (Apenas para fins ilustrativos; pode ser otimizado para desempenho)
while (memoryRequirements.size > 0 && bindCount < MAX_CHUNKS) {
    VkSparseMemoryBind& bind = binds[bindCount];
    bind.resourceOffset = offset;

    AllocateOrGetMemoryRange(
        device,
        &memoryRequirements,
        &bind.memory,
        &bind.memoryOffset,
        &bind.size);

    // As faixas de memória devem ter tamanho múltiplo do alinhamento
    assert(IsMultiple(bind.size, memoryRequirements.alignment));
    assert(IsMultiple(bind.memoryOffset, memoryRequirements.alignment));

    memoryRequirements.size -= bind.size;
    offset += bind.size;
    ++bindCount;
}

// Garante que toda a imagem possui memória respaldada
if (memoryRequirements.size > 0) {
    // Condição de erro - blocos (chunks) em excesso
}

const VkSparseImageOpaqueMemoryBindInfo opaqueBindInfo{
    .image = sparseImage,
    .bindCount = bindCount,
    .pBinds = binds.data(),
};

const VkBindSparseInfo bindSparseInfo{
    .sType = VK_STRUCTURE_TYPE_BIND_SPARSE_INFO,
    .pNext = nullptr,
    // ...
    .imageOpaqueBindCount = 1,
    .pImageOpaqueBinds = &opaqueBindInfo,
    // ...
};

// vkQueueBindSparse exige sincronização externa por objeto de queue.
AcquireQueueOwnership(queue);

// Realiza efetivamente o vínculo da memória
vkQueueBindSparse(queue, 1, &bindSparseInfo, VK_NULL_HANDLE);

ReleaseQueueOwnership(queue);
```

#### Recursos Esparsos Avançados

Este exemplo mais avançado cria uma imagem em *array* para uso como *color attachment* / textura e vincula à memória física apenas o LOD zero e os metadados necessários.

```cpp
#include <array>
#include <cassert>
#include <cstdint>
#include <vector>
#include <vulkan/vulkan.h>

constexpr uint32_t MY_IMAGE_ARRAY_SIZE = 4;

VkDevice device{};
VkQueue queue{};
VkImage sparseImage{};
const VkAllocationCallbacks* pAllocator = nullptr;
VkMemoryRequirements memoryRequirements{};
uint32_t sparseRequirementsCount = 0;
std::array<VkSparseMemoryBind, MY_IMAGE_ARRAY_SIZE> binds{};
std::array<VkSparseImageMemoryBind, MY_IMAGE_ARRAY_SIZE> imageBinds{};
uint32_t bindCount = 0;

// Aloca o objeto de imagem (renderizável e amostrável)
const VkImageCreateInfo sparseImageInfo{
    .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO,
    .pNext = nullptr,
    .flags = VK_IMAGE_CREATE_SPARSE_RESIDENCY_BIT /* | ... */,
    // ...
    .format = VK_FORMAT_R8G8B8A8_UNORM,
    // ...
    .arrayLayers = MY_IMAGE_ARRAY_SIZE,
    // ...
    .usage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT | VK_IMAGE_USAGE_SAMPLED_BIT,
    // ...
};
vkCreateImage(device, &sparseImageInfo, pAllocator, &sparseImage);

// Obtém os requisitos de memória
vkGetImageMemoryRequirements(device, sparseImage, &memoryRequirements);

// Obtém as propriedades esparsas dos aspectos da imagem
vkGetImageSparseMemoryRequirements(
    device,
    sparseImage,
    &sparseRequirementsCount,
    nullptr);

std::vector<VkSparseImageMemoryRequirements> sparseReqs(sparseRequirementsCount);

vkGetImageSparseMemoryRequirements(
    device,
    sparseImage,
    &sparseRequirementsCount,
    sparseReqs.data());

// Vincula o nível LOD 0 e quaisquer metadados necessários à memória
for (const auto& req : sparseReqs) {
    if (req.formatProperties.aspectMask & VK_IMAGE_ASPECT_METADATA_BIT) {
        // Metadados não devem ser combinados com outros aspectos
        assert(req.formatProperties.aspectMask == VK_IMAGE_ASPECT_METADATA_BIT);

        if (req.formatProperties.flags & VK_SPARSE_IMAGE_FORMAT_SINGLE_MIPTAIL_BIT) {
            VkSparseMemoryBind& bind = binds[bindCount++];
            bind.size = req.imageMipTailSize;

            // ... Aloca a faixa de memória

            bind.resourceOffset = req.imageMipTailOffset;
            bind.memoryOffset = /* memoryOffset alocado */ 0;
            bind.memory = /* memória alocada */ VK_NULL_HANDLE;
            bind.flags = VK_SPARSE_MEMORY_BIND_METADATA_BIT;
        } else {
            // Necessita de uma região de mip tail por camada do array.
            for (uint32_t a = 0; a < sparseImageInfo.arrayLayers; ++a) {
                VkSparseMemoryBind& bind = binds[bindCount++];
                bind.size = req.imageMipTailSize;

                // ... Aloca a faixa de memória

                bind.resourceOffset =
                    req.imageMipTailOffset + (a * req.imageMipTailStride);
                bind.memoryOffset = /* memoryOffset alocado */ 0;
                bind.memory = /* memória alocada */ VK_NULL_HANDLE;
                bind.flags = VK_SPARSE_MEMORY_BIND_METADATA_BIT;
            }
        }
    } else {
        // Dados do recurso
        const VkExtent3D lod0BlockSize{
            .width = AlignedDivide(
                sparseImageInfo.extent.width,
                req.formatProperties.imageGranularity.width),
            .height = AlignedDivide(
                sparseImageInfo.extent.height,
                req.formatProperties.imageGranularity.height),
            .depth = AlignedDivide(
                sparseImageInfo.extent.depth,
                req.formatProperties.imageGranularity.depth),
        };
        const size_t totalBlocks =
            static_cast<size_t>(lod0BlockSize.width) *
            lod0BlockSize.height *
            lod0BlockSize.depth;

        // Cada bloco possui o mesmo tamanho do requisito de alinhamento;
        // calcula o tamanho total de memória para o nível 0
        const VkDeviceSize lod0MemSize = totalBlocks * memoryRequirements.alignment;
        (void)lod0MemSize;

        // Aloca memória para cada camada do array
        for (uint32_t a = 0; a < sparseImageInfo.arrayLayers; ++a) {
            // ... Aloca a faixa de memória

            imageBinds[a] = VkSparseImageMemoryBind{
                .subresource = VkImageSubresource{
                    .aspectMask = req.formatProperties.aspectMask,
                    .mipLevel = 0,
                    .arrayLayer = a,
                },
                .offset = VkOffset3D{0, 0, 0},
                .extent = sparseImageInfo.extent,
                .memory = /* memória alocada */ VK_NULL_HANDLE,
                .memoryOffset = /* memoryOffset alocado */ 0,
                .flags = 0,
            };
        }
    }
}

const VkSparseImageOpaqueMemoryBindInfo opaqueBindInfo{
    .image = sparseImage,
    .bindCount = bindCount,
    .pBinds = binds.data(),
};

const VkSparseImageMemoryBindInfo imageBindInfo{
    .image = sparseImage,
    .bindCount = sparseImageInfo.arrayLayers,
    .pBinds = imageBinds.data(),
};

const VkBindSparseInfo bindSparseInfo{
    .sType = VK_STRUCTURE_TYPE_BIND_SPARSE_INFO,
    .pNext = nullptr,
    // ...
    .imageOpaqueBindCount = 1,
    .pImageOpaqueBinds = &opaqueBindInfo,
    .imageBindCount = 1,
    .pImageBinds = &imageBindInfo,
    // ...
};

// vkQueueBindSparse exige sincronização externa por objeto de queue.
AcquireQueueOwnership(queue);

// Realiza efetivamente o vínculo da memória
vkQueueBindSparse(queue, 1, &bindSparseInfo, VK_NULL_HANDLE);

ReleaseQueueOwnership(queue);
```
