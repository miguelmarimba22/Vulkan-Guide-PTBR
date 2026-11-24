# Especificação Vulkan

A Especificação Vulkan (geralmente chamada de *Vulkan Spec*) é a descrição oficial de como a API Vulkan funciona e é, em última análise, usada para determinar o que é ou não um uso válido do Vulkan. À primeira vista, a Vulkan Spec parece um texto imenso e árido, mas geralmente é o recurso mais útil para manter aberto durante o desenvolvimento.

> **Nota:** Consulte a Especificação Vulkan desde cedo e com frequência.

## Variações da Especificação Vulkan

A Especificação Vulkan pode ser compilada para qualquer versão e com qualquer combinação de extensões. O Khronos Group hospeda o [Registro da Especificação Vulkan](https://registry.khronos.org/vulkan/specs/), que contém algumas variações disponíveis publicamente e suficientes para a maioria dos desenvolvedores. Qualquer pessoa pode gerar sua própria variação da Especificação Vulkan a partir do repositório [Vulkan-Docs](https://github.com/KhronosGroup/Vulkan-Docs/blob/main/BUILD.adoc).

Ao compilar a Especificação Vulkan, você informa para qual versão do Vulkan deseja gerá-la, bem como quais extensões incluir. Uma Especificação Vulkan sem nenhuma extensão também é chamada de [versão *core*](https://docs.vulkan.org/spec/latest/chapters/extensions.html#extendingvulkan-coreversions), pois representa o conjunto mínimo do Vulkan que uma implementação precisa suportar para estar em conformidade (consulte o capítulo sobre Vulkan CTS).

## Versão da Especificação Vulkan

Do Vulkan 1.0 ao 1.3, havia uma versão dedicada da especificação para cada versão. Para reduzir as permutações de compilação, a partir do Vulkan 1.4 existe agora uma versão `latest` que será sempre atualizada para a versão mais recente do Vulkan.

O [Vulkan SDK](https://vulkan.lunarg.com/doc/sdk/1.4.304.0/windows/1.4-extensions/vkspec.html) sempre conterá a versão da especificação com a qual foi criado.

## Formatos da Especificação Vulkan

A Especificação Vulkan pode ser compilada em diferentes formatos.

### Antora

Para combinar vários recursos e melhorar a navegação, existe agora uma [versão da especificação gerada com Antora](https://docs.vulkan.org/spec/latest/index.html), cujo uso é recomendado.

### HTML

Se você quiser visualizar a Especificação Vulkan em sua totalidade em HTML, basta acessar o arquivo `html/vkspec.html`:

https://registry.khronos.org/vulkan/specs/latest/html/vkspec.html

O Vulkan SDK vem acompanhado da Especificação Vulkan completa em HTML correspondente à versão do SDK: (https://vulkan.lunarg.com/doc/sdk/1.4.304.0/windows/1.4-extensions/vkspec.html).

### PDF

Para visualizar o formato PDF, acesse o arquivo `pdf/vkspec.pdf`:

https://registry.khronos.org/vulkan/specs/latest/pdf/vkspec.pdf

O Vulkan SDK também inclui uma versão em PDF: (https://vulkan.lunarg.com/doc/sdk/1.4.341.1/windows/1.4-extensions/vkspec.pdf).

### Páginas de manual (*Man pages*)

Atualmente, o Khronos Group hospeda as *Vulkan Man Pages* apenas para a versão mais recente da especificação, com todas as extensões, no [registro online](https://registry.khronos.org/vulkan/specs/latest/man/html/).

As *Vulkan Man Pages* também podem ser encontradas no Vulkan SDK para cada versão do SDK. Consulte as [Man Pages](https://vulkan.lunarg.com/doc/sdk/latest/windows/apispec.html) do Vulkan SDK mais recente.
