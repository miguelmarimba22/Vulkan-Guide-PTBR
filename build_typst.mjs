import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MD_DIR = path.join(ROOT, 'chapters_md');
const IMG_ROOT = path.join(ROOT, 'Vulkan-Guide', 'chapters');
const REPO_IMG_ROOT = path.join(ROOT, 'Vulkan-Guide', 'images');
const OUT_TYP = path.join(ROOT, 'vulkan_guide_ptbr.typ');

// Estrutura oficial extraída de antora/modules/ROOT/nav.adoc (84 capítulos)
const PARTS = [
  {
    number: 'Parte I',
    title: 'Visão Geral e Logística',
    subtitle: 'Fundamentos da API Vulkan, ecossistema, plataformas, SPIR-V, validação e ferramentas de desenvolvimento.',
    chapters: [
      'what_is_vulkan.md',
      'what_vulkan_can_do.md',
      'vulkan_spec.md',
      'platforms.md',
      'checking_for_support.md',
      'versions.md',
      'vulkan_profiles.md',
      'vulkan_release_summary.md',
      'what_is_spirv.md',
      'portability_initiative.md',
      'vulkan_cts.md',
      'development_tools.md',
      'ide.md',
      'validation_overview.md',
      'profiling.md',
      'decoder_ring.md',
    ],
  },
  {
    number: 'Parte II',
    title: 'Usando Vulkan na Prática',
    subtitle: 'Loader, extensões, filas, WSI, sincronização, alocação de memória, descritores, estado dinâmico, compute e linguagens de shader em C++20.',
    chapters: [
      'embedded_programming.md',
      'deprecated.md',
      'tile_based_rendering_best_practices.md',
      'loader.md',
      'layers.md',
      'querying_extensions_features.md',
      'enabling_extensions.md',
      'enabling_features.md',
      'spirv_extensions.md',
      'formats.md',
      'queues.md',
      'wsi.md',
      'windowing_audio_input.md',
      'pnext_and_stype.md',
      'synchronization.md',
      'extensions/VK_KHR_synchronization2.md',
      'swapchain_semaphore_reuse.md',
      'synchronization_examples.md',
      'memory_allocation.md',
      'sparse_resources.md',
      'protected.md',
      'buffer_device_address.md',
      'buffer_device_address_alignment.md',
      'pipeline_cache.md',
      'threading.md',
      'depth.md',
      'primitive_topology.md',
      'mapping_data_to_shaders.md',
      'storage_image_and_texel_buffers.md',
      'vertex_input_data_processing.md',
      'descriptor_arrays.md',
      'descriptor_dynamic_offset.md',
      'descriptor_buffer.md',
      'descriptor_heap.md',
      'location_component_interface.md',
      'push_constants.md',
      'ways_to_provide_spirv.md',
      'buffer_array_length.md',
      'robustness.md',
      'shader_abort.md',
      'dynamic_state.md',
      'dynamic_state_map.md',
      'compute_shaders.md',
      'subgroups.md',
      'shader_memory_layout.md',
      'atomics.md',
      'image_copies.md',
      'common_pitfalls.md',
      'hlsl.md',
      'slang.md',
      'high_level_shader_language_comparison.md',
    ],
  },
  {
    number: 'Parte III',
    title: 'Quando e Por Que Usar Extensões',
    subtitle: 'Guia prático das principais extensões KHR e EXT: ray tracing, descriptor indexing, recursos externos, debug utils e otimizações avançadas.',
    chapters: [
      'extensions/cleanup.md',
      'extensions/device_groups.md',
      'extensions/external.md',
      'extensions/ray_tracing.md',
      'extensions/shader_features.md',
      'extensions/translation_layer_extensions.md',
      'extensions/VK_EXT_descriptor_indexing.md',
      'extensions/VK_EXT_inline_uniform_block.md',
      'extensions/VK_EXT_memory_priority.md',
      'extensions/VK_KHR_descriptor_update_template.md',
      'extensions/VK_KHR_draw_indirect_count.md',
      'extensions/VK_KHR_image_format_list.md',
      'extensions/VK_KHR_imageless_framebuffer.md',
      'extensions/VK_KHR_sampler_ycbcr_conversion.md',
      'extensions/VK_KHR_shader_subgroup_uniform_control_flow.md',
      'extensions/VK_EXT_debug_utils.md',
      'extensions/VK_KHR_extended_flags.md',
    ],
  },
];

// Escapa string para uso dentro de aspas duplas em Typst ("...")
function escapeTypstString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '');
}

// Escapa texto puro para markup Typst
function escapeTypstText(str) {
  return str.replace(/([\\#$*_<>@~\[\]`])/g, '\\$1');
}

// Mapeia tag de linguagem de bloco de código para linguagem suportada pelo Typst
function mapLang(lang) {
  const l = (lang || '').trim().toLowerCase();
  if (!l) return 'text';
  if (l === 'c++' || l === 'cpp' || l === 'cxx' || l === 'hpp') return 'cpp';
  if (l === 'c' || l === 'h') return 'c';
  if (l === 'glsl' || l === 'vert' || l === 'frag' || l === 'comp') return 'glsl';
  if (l === 'hlsl' || l === 'slang') return 'hlsl';
  if (l === 'cmake') return 'cmake';
  if (l === 'bash' || l === 'sh' || l === 'shell' || l === 'zsh' || l === 'console') return 'bash';
  if (l === 'powershell' || l === 'ps1') return 'powershell';
  if (l === 'json') return 'json';
  if (l === 'xml' || l === 'html') return 'xml';
  if (l === 'python' || l === 'py') return 'python';
  if (l === 'yaml' || l === 'yml') return 'yaml';
  if (l === 'spvasm' || l === 'spirv' || l === 'asm') return 'asm';
  if (l === 'ini' || l === 'toml') return 'toml';
  return 'text';
}

const CLEAN_SVG_DIR = path.join(ROOT, 'clean_svgs');
fs.mkdirSync(CLEAN_SVG_DIR, { recursive: true });

// Substitui light-dark(a, b) por a (respeitando parênteses aninhados como rgb(...))
function replaceLightDark(str) {
  let out = '';
  let i = 0;
  const marker = 'light-dark(';
  while (i < str.length) {
    const idx = str.indexOf(marker, i);
    if (idx === -1) {
      out += str.slice(i);
      break;
    }
    out += str.slice(i, idx);
    let pos = idx + marker.length;
    let depth = 1;
    let firstArgEnd = -1;
    let endPos = -1;
    while (pos < str.length && depth > 0) {
      const ch = str[pos];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endPos = pos;
          break;
        }
      } else if (ch === ',' && depth === 1 && firstArgEnd === -1) {
        firstArgEnd = pos;
      }
      pos++;
    }
    if (endPos !== -1 && firstArgEnd !== -1) {
      out += str.slice(idx + marker.length, firstArgEnd).trim();
      i = endPos + 1;
    } else {
      out += marker;
      i = idx + marker.length;
    }
  }
  return out;
}

function sanitizeSvg(absPath) {
  const relFromRepo = path.relative(path.join(ROOT, 'Vulkan-Guide'), absPath);
  const safeName = relFromRepo.replace(/[\\/]/g, '__');
  const outPath = path.join(CLEAN_SVG_DIR, safeName);

  let svg = fs.readFileSync(absPath, 'utf8');
  // 1. Resolve CSS light-dark(light, dark) -> light
  svg = replaceLightDark(svg);
  // 2. Remove <foreignObject>...</foreignObject> mantendo o fallback <image>/<text>
  svg = svg.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '');
  // 3. Remove tags <switch> e </switch> para o usvg renderizar o fallback diretamente
  svg = svg.replace(/<\/?switch\b[^>]*>/gi, '');

  fs.writeFileSync(outPath, svg, 'utf8');
  return path.relative(ROOT, outPath).replace(/\\/g, '/');
}

// Resolve caminho de imagem para caminho relativo ao OUT_TYP (usando barras /)
const missingImages = [];
function resolveImagePath(rawSrc) {
  let clean = rawSrc.trim().replace(/^<|>$/g, '');
  // Remove query/fragment se houver
  clean = clean.split('?')[0].split('#')[0];
  if (/^https?:\/\//i.test(clean)) return null;

  const candidates = [
    path.join(IMG_ROOT, clean),
    path.join(IMG_ROOT, 'images', clean),
    path.join(IMG_ROOT, 'images', 'extensions', path.basename(clean)),
    path.join(IMG_ROOT, 'images', path.basename(clean)),
    path.join(REPO_IMG_ROOT, clean),
    path.join(REPO_IMG_ROOT, path.basename(clean)),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      if (c.toLowerCase().endsWith('.svg')) {
        return sanitizeSvg(c);
      }
      return path.relative(ROOT, c).replace(/\\/g, '/');
    }
  }
  missingImages.push(rawSrc);
  return null;
}

// Converte formatação inline Markdown (código, links, negrito, itálico, tachado) para Typst
function convertInline(text) {
  if (!text) return '';
  // Quebras <br> em tabelas ou texto
  let s = text.replace(/<br\s*\/?>/gi, ' \u2028 ');

  // Tokenização segura: extrai inline code e links primeiro
  const tokens = [];
  const placeholder = (typstCode) => {
    const id = tokens.length;
    tokens.push(typstCode);
    return `\uE000${id}\uE001`;
  };

  // 1. Inline code (`...` ou ``...``)
  s = s.replace(/(`+)([^`]+?)\1/g, (_, _ticks, code) => {
    return placeholder(`#ic("${escapeTypstString(code.trim())}")`);
  });

  // 2. Imagens inline ![alt](src)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const rel = resolveImagePath(src);
    if (!rel) return placeholder(escapeTypstText(alt || '[Imagem]'));
    return placeholder(`#image("${escapeTypstString(rel)}", width: 82%)`);
  });

  // 3. Links [label](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
    const inner = formatBasicInline(label);
    return placeholder(`#link("${escapeTypstString(url)}")[${inner}]`);
  });

  // Links internos ou relativos [label](path) -> mantém apenas texto estilizado
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label) => {
    return placeholder(formatBasicInline(label));
  });

  // 4. URLs nuas https://...
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s)<>]+)/g, (_, pre, url) => {
    const trimmedUrl = url.replace(/[.,;:!?]+$/, '');
    const trailing = url.slice(trimmedUrl.length);
    return `${pre}${placeholder(`#link("${escapeTypstString(trimmedUrl)}")[#raw("${escapeTypstString(trimmedUrl)}")]`)}${trailing}`;
  });

  // 5. Formatação básica no texto restante
  let out = formatBasicInline(s);

  // Restaura quebras de linha de <br>
  out = out.replace(/\u2028/g, '\\ ');

  // Restaura tokens
  out = out.replace(/\uE000(\d+)\uE001/g, (_, idx) => tokens[Number(idx)]);
  return out;
}

function formatBasicInline(text) {
  const parts = [];
  const put = (code) => {
    const id = parts.length;
    parts.push(code);
    return `\uE002${id}\uE003`;
  };

  let s = text;

  // Negrito + Itálico ***...***
  s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, (_, inner) => put(`#strong[#emph[${escapeTypstText(inner)}]]`));
  // Negrito **...**
  s = s.replace(/\*\*([^*]+?)\*\*/g, (_, inner) => put(`#strong[${escapeTypstText(inner)}]`));
  // Tachado ~~...~~
  s = s.replace(/~~([^~]+?)~~/g, (_, inner) => put(`#strike[${escapeTypstText(inner)}]`));
  // Itálico *...* (evitando multiplicar ou espaços nas bordas)
  s = s.replace(/(^|[^\w\\])\*([^\s*][^*]*?[^\s*]|[^\s*])\*(?!\w)/g, (_, pre, inner) => {
    return `${pre}${put(`#emph[${escapeTypstText(inner)}]`)}`;
  });
  // Itálico _..._ (somente com fronteira de palavra para não pegar VK_KHR_foo)
  s = s.replace(/(^|[\s(\[])_([^\s_][^_]*?[^\s_]|[^\s_])_(?=$|[\s.,;:!?\)\]])/g, (_, pre, inner) => {
    return `${pre}${put(`#emph[${escapeTypstText(inner)}]`)}`;
  });

  // Escapa texto restante
  s = escapeTypstText(s);

  // Restaura placeholders
  s = s.replace(/\uE002(\d+)\uE003/g, (_, idx) => parts[Number(idx)]);
  return s;
}

function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  // Divide em | não escapados e fora de crases
  const cells = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '`') {
      inCode = !inCode;
      cur += ch;
    } else if (ch === '\\' && trimmed[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (ch === '|' && !inCode) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function isTableSeparator(line) {
  const t = line.trim();
  if (!t.includes('|') || !t.includes('-')) return false;
  return /^\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/.test(t);
}

// Converte um arquivo Markdown completo para código Typst
function markdownToTypst(md, headingOffset = 1) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Linha vazia
    if (trimmed === '') {
      i++;
      continue;
    }

    // Bloco de código cercado (``` ou ~~~)
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})\s*([^\s`]*)/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const lang = mapLang(fenceMatch[2]);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // pula fechamento
      const codeStr = codeLines.join('\n');
      out.push(`#codeblock(lang: "${lang}", "${escapeTypstString(codeStr)}")`);
      out.push('');
      continue;
    }

    // Linha horizontal
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push('#line(length: 100%, stroke: 0.5pt + rgb("#D8DEE6"))');
      out.push('');
      i++;
      continue;
    }

    // Cabeçalho (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length + headingOffset, 5);
      const titleText = headingMatch[2].replace(/\s+#+\s*$/, '');
      const eqs = '='.repeat(level);
      out.push(`${eqs} ${convertInline(titleText)}`);
      out.push('');
      i++;
      continue;
    }

    // Imagem em linha isolada: ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1].trim();
      const src = imgMatch[2].trim();
      const rel = resolveImagePath(src);
      if (rel) {
        const cap = alt ? `, caption: [${convertInline(alt)}]` : '';
        out.push(`#figure(image("${escapeTypstString(rel)}", width: 88%)${cap})`);
        out.push('');
      } else if (alt) {
        out.push(`#emph[${escapeTypstText(`[Figura: ${alt}]`)}]`);
        out.push('');
      }
      i++;
      continue;
    }

    // Blockquote / Callout (> ...)
    if (trimmed.startsWith('>')) {
      const qLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        qLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const fullQuote = qLines.join('\n').trim();
      const calloutMatch = fullQuote.match(/^\*\*(Nota|Dica|Importante|Aviso|Atenção|Cuidado|Observação):?\*\*\s*:?\s*([\s\S]*)$/i);
      if (calloutMatch) {
        const kindRaw = calloutMatch[1].toLowerCase();
        const body = calloutMatch[2].trim();
        let kind = 'note';
        let label = 'Nota';
        if (kindRaw === 'dica') { kind = 'tip'; label = 'Dica'; }
        else if (kindRaw === 'importante') { kind = 'important'; label = 'Importante'; }
        else if (kindRaw === 'aviso' || kindRaw === 'atenção' || kindRaw === 'cuidado') { kind = 'warning'; label = calloutMatch[1]; }
        else if (kindRaw === 'observação') { kind = 'note'; label = 'Observação'; }

        const bodyParas = body.split(/\n\s*\n/).map(p => convertInline(p.replace(/\n/g, ' '))).join('\n\n');
        out.push(`#callout(kind: "${kind}", title: "${label}")[${bodyParas}]`);
        out.push('');
      } else {
        const bodyParas = fullQuote.split(/\n\s*\n/).map(p => convertInline(p.replace(/\n/g, ' '))).join('\n\n');
        out.push(`#callout(kind: "quote", title: "")[${bodyParas}]`);
        out.push('');
      }
      continue;
    }

    // Tabela Markdown GFM
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(lines[i]);
      const colCount = Math.max(headers.length, 1);
      i += 2; // pula header e separador
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        const row = splitTableRow(lines[i]);
        while (row.length < colCount) row.push('');
        rows.push(row.slice(0, colCount));
        i++;
      }

      const fontSize = colCount >= 5 ? '7.5pt' : colCount >= 4 ? '8pt' : '8.5pt';
      const colsSpec = `(${Array(colCount).fill('1fr').join(', ')})`;
      const headerCells = headers.map(h => `[#strong[${convertInline(h)}]]`).join(', ');
      const bodyCells = rows
        .flatMap(r => r.map(c => `[${convertInline(c)}]`))
        .join(',\n    ');

      out.push(`#block(breakable: true)[`);
      out.push(`  #set text(size: ${fontSize})`);
      out.push(`  #table(`);
      out.push(`    columns: ${colsSpec},`);
      out.push(`    stroke: 0.45pt + rgb("#D0D7DE"),`);
      out.push(`    inset: (x: 6pt, y: 5pt),`);
      out.push(`    fill: (_, y) => if y == 0 { rgb("#1E242E") } else if calc.odd(y) { white } else { rgb("#F6F8FA") },`);
      out.push(`    table.header(${headers.map(h => `[#text(fill: white, weight: "bold")[${convertInline(h)}]]`).join(', ')}),`);
      if (bodyCells) out.push(`    ${bodyCells},`);
      out.push(`  )`);
      out.push(`]`);
      out.push('');
      continue;
    }

    // Listas (-, *, + ou 1.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      while (i < lines.length) {
        const lm = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        if (!lm) break;
        const indentSpaces = lm[1].length;
        const level = Math.floor(indentSpaces / 2);
        const isOrdered = /^\d+\.$/.test(lm[2]);
        let itemText = lm[3];
        i++;
        // Linhas de continuação indentadas do mesmo item
        while (
          i < lines.length &&
          lines[i].trim() !== '' &&
          !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
          !/^\s*(#{1,6}\s|```|~~~|>|\|)/.test(lines[i]) &&
          /^\s{2,}/.test(lines[i])
        ) {
          itemText += ' ' + lines[i].trim();
          i++;
        }
        const prefix = '  '.repeat(level) + (isOrdered ? '+ ' : '- ');
        out.push(`${prefix}${convertInline(itemText)}`);
      }
      out.push('');
      continue;
    }

    // Parágrafo normal (agrupa linhas consecutivas até linha vazia ou bloco especial)
    const paraLines = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (
        t === '' ||
        /^(`{3,}|~{3,})/.test(t) ||
        /^#{1,6}\s+/.test(t) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(t) ||
        /^!\[([^\]]*)\]\(([^)]+)\)$/.test(t) ||
        t.startsWith('>') ||
        /^\s*([-*+]|\d+\.)\s+/.test(l) ||
        (t.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) {
        break;
      }
      paraLines.push(t);
      i++;
    }
    if (paraLines.length > 0) {
      out.push(convertInline(paraLines.join(' ')));
      out.push('');
    }
  }

  return out.join('\n');
}

function buildDocument() {
  const missingChapters = [];
  let loadedCount = 0;

  const preamble = `// Gerado automaticamente por build_typst.mjs
#set document(
  title: "Guia Completo de Vulkan para C++20 (PT-BR)",
  author: "Baseado em KhronosGroup/Vulkan-Guide — Edição PT-BR C++20",
  date: auto,
)

#set text(
  font: ("Segoe UI", "Libertinus Serif", "Arial"),
  size: 10pt,
  lang: "pt",
  region: "br",
  fill: rgb("#22252A"),
)

#set par(
  justify: true,
  leading: 0.62em,
  spacing: 0.9em,
)

// Cores do tema Vulkan
#let vulkan-red = rgb("#AC162C")
#let vulkan-dark = rgb("#161920")
#let vulkan-muted = rgb("#5B6370")

// Código inline
#let ic(s) = box(
  fill: rgb("#F1F3F6"),
  inset: (x: 3pt, y: 1.2pt),
  outset: (y: 1pt),
  radius: 2.5pt,
  text(
    font: ("Cascadia Mono", "Consolas", "DejaVu Sans Mono"),
    size: 8.6pt,
    fill: rgb("#9E1B32"),
    raw(s),
  ),
)

// Bloco de código com syntax highlighting
#let codeblock(lang: "text", code) = {
  block(
    width: 100%,
    breakable: true,
    fill: rgb("#F6F8FA"),
    stroke: (left: 2.5pt + vulkan-red, rest: 0.5pt + rgb("#D8DEE6")),
    radius: (right: 4pt, left: 1pt),
    inset: (x: 10pt, y: 8pt),
    above: 0.8em,
    below: 0.9em,
  )[
    #if lang != "text" [
      #place(top + right, dx: 2pt, dy: -4pt)[
        #text(
          font: ("Cascadia Mono", "Consolas", "DejaVu Sans Mono"),
          size: 7pt,
          weight: "bold",
          fill: rgb("#8B949E"),
        )[#upper(lang)]
      ]
    ]
    #set text(
      font: ("Cascadia Mono", "Consolas", "DejaVu Sans Mono"),
      size: 8.1pt,
      fill: rgb("#1F2328"),
    )
    #set par(justify: false, leading: 0.52em)
    #raw(code, lang: lang, block: true)
  ]
}

// Caixas de destaque (Nota, Dica, Importante, Aviso)
#let callout(kind: "note", title: "Nota", body) = {
  let palette = if kind == "tip" {
    (bg: rgb("#F0FDF4"), border: rgb("#15803D"), title: rgb("#166534"))
  } else if kind == "warning" {
    (bg: rgb("#FFFBEB"), border: rgb("#D97706"), title: rgb("#92400E"))
  } else if kind == "important" {
    (bg: rgb("#FAF5FF"), border: rgb("#7E22CE"), title: rgb("#6B21A8"))
  } else if kind == "quote" {
    (bg: rgb("#F8FAFC"), border: rgb("#64748B"), title: rgb("#334155"))
  } else {
    (bg: rgb("#EFF6FF"), border: rgb("#1D4ED8"), title: rgb("#1E40AF"))
  }
  block(
    width: 100%,
    breakable: true,
    fill: palette.bg,
    stroke: (left: 3pt + palette.border, rest: 0.4pt + palette.border.lighten(65%)),
    radius: (right: 4pt),
    inset: (x: 10pt, y: 8pt),
    above: 0.8em,
    below: 0.9em,
  )[
    #if title != "" [
      #text(weight: "bold", fill: palette.title, size: 9.2pt)[#title]
      #v(0.25em)
    ]
    #set text(size: 9.4pt)
    #body
  ]
}

// Estilização de figuras e links
#show link: set text(fill: rgb("#0F52BA"))
#show figure.caption: set text(size: 8.5pt, fill: vulkan-muted, style: "italic")
#show figure: set block(breakable: false, above: 1em, below: 1.1em)

// Estilização de cabeçalhos
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(2.5cm)
  block(
    width: 100%,
    fill: vulkan-dark,
    radius: 6pt,
    inset: (x: 20pt, y: 22pt),
  )[
    #text(fill: rgb("#FF6B7B"), size: 11pt, weight: "bold", tracking: 1.5pt)[SEÇÃO PRINCIPAL]
    #v(0.4em)
    #text(fill: white, size: 22pt, weight: "bold")[#it.body]
  ]
  v(1.2em)
}

#show heading.where(level: 2): it => {
  pagebreak(weak: true)
  block(
    width: 100%,
    below: 0.9em,
    stroke: (bottom: 1.5pt + vulkan-red),
    inset: (bottom: 5pt),
  )[
    #text(size: 16pt, weight: "bold", fill: vulkan-dark)[#it.body]
  ]
}

#show heading.where(level: 3): it => {
  v(0.6em)
  block(sticky: true, below: 0.45em)[
    #text(size: 12.2pt, weight: "bold", fill: vulkan-red)[#it.body]
  ]
}

#show heading.where(level: 4): it => {
  v(0.45em)
  block(sticky: true, below: 0.35em)[
    #text(size: 10.6pt, weight: "bold", fill: vulkan-dark)[#it.body]
  ]
}

#show heading.where(level: 5): it => {
  v(0.3em)
  block(sticky: true, below: 0.25em)[
    #text(size: 10pt, weight: "semibold", fill: vulkan-muted)[#it.body]
  ]
}

// ==========================================
// CAPA (Edição Independente — Sem Logos de Marca Registrada)
// ==========================================
#set page(paper: "a4", margin: 0mm)
#box(width: 100%, height: 100%, fill: vulkan-dark)[
  // Barra lateral crimson
  #place(top + left)[
    #rect(width: 14mm, height: 297mm, fill: vulkan-red)
  ]
  #pad(left: 28mm, right: 22mm, top: 28mm, bottom: 22mm)[
    #box(
      fill: vulkan-red,
      radius: 3pt,
      inset: (x: 10pt, y: 5pt),
    )[
      #text(fill: white, size: 10pt, weight: "bold", tracking: 2pt)[
        VULKAN • C++20 • PT-BR
      ]
    ]
    #v(24mm)
    #text(fill: rgb("#FF6B7B"), size: 11pt, weight: "bold", tracking: 2pt)[
      TRADUÇÃO INDEPENDENTE E ADAPTADA PARA C++20
    ]
    #v(5mm)
    #set text(hyphenate: false)
    #text(fill: white, size: 34pt, weight: "bold")[
      Guia Completo de\
      Vulkan em Português
    ]
    #v(6mm)
    #line(length: 65mm, stroke: 2.5pt + vulkan-red)
    #v(6mm)
    #text(fill: rgb("#D0D7DE"), size: 13pt)[
      Tradução integral e modernizada para C++20 baseada no repositório\
      #text(fill: white, weight: "semibold")[KhronosGroup/Vulkan-Guide]
    ]
    #v(18mm)
    #block(
      width: 100%,
      fill: rgb("#202530"),
      stroke: (left: 3pt + vulkan-red),
      radius: (right: 4pt),
      inset: 14pt,
    )[
      #set text(fill: rgb("#E6EDF3"), size: 9.8pt)
      #grid(
        columns: (auto, 1fr),
        row-gutter: 6pt,
        column-gutter: 12pt,
        [#text(fill: rgb("#FF8A96"), weight: "bold")[Escopo:]], [Todos os 84 capítulos oficiais + Prefácio C++20],
        [#text(fill: rgb("#FF8A96"), weight: "bold")[Padrão:]], [C++20 (Designated Initializers, std::span, RAII, Vulkan-Hpp)],
        [#text(fill: rgb("#FF8A96"), weight: "bold")[Idioma:]], [Português do Brasil (PT-BR) — Tradução assistida por IA],
        [#text(fill: rgb("#FF8A96"), weight: "bold")[Original:]], [github.com/KhronosGroup/Vulkan-Guide (branch main)],
        [#text(fill: rgb("#FF8A96"), weight: "bold")[Licença:]], [CC-BY-4.0 — Copyright © The Khronos Group Inc.],
      )
    ]
    #v(1fr)
    #line(length: 100%, stroke: 0.5pt + rgb("#323846"))
    #v(4mm)
    #set par(justify: false)
    #text(fill: rgb("#9AA4B2"), size: 8.3pt)[
      #strong[Aviso de Atribuição e Independência:] Este documento é uma obra derivada (tradução para Português e adaptação dos exemplos para C++20, produzida com auxílio de IA) baseada no #emph[Khronos Vulkan Guide], licenciado sob #strong[CC-BY-4.0].\
      Esta publicação é independente e #strong[não é oficial, afiliada nem endossada] pela The Khronos Group Inc. Vulkan é uma marca registrada da The Khronos Group Inc.
    ]
  ]
]

// ==========================================
// PÁGINAS PRELIMINARES (SUMÁRIO E PREFÁCIO)
// ==========================================
#set page(
  paper: "a4",
  margin: (top: 22mm, bottom: 20mm, left: 19mm, right: 19mm),
  numbering: "i",
  header: context {
    if counter(page).get().first() > 1 {
      set text(size: 8pt, fill: vulkan-muted)
      grid(
        columns: (1fr, auto),
        [Guia Completo de Vulkan para C++20 (PT-BR)],
        [KhronosGroup/Vulkan-Guide],
      )
      v(-4pt)
      line(length: 100%, stroke: 0.4pt + rgb("#DCE2EA"))
    }
  },
  footer: context {
    set text(size: 8pt, fill: vulkan-muted)
    line(length: 100%, stroke: 0.4pt + rgb("#DCE2EA"))
    v(-3pt)
    grid(
      columns: (1fr, auto),
      [Edição Completa em Português (PT-BR) • C++20],
      [Página #counter(page).display("i")],
    )
  },
)
#counter(page).update(1)

// Sumário
#text(size: 20pt, weight: "bold", fill: vulkan-dark)[Sumário]
#v(0.4em)
#line(length: 100%, stroke: 1.5pt + vulkan-red)
#v(0.6em)
#outline(
  title: none,
  depth: 2,
  indent: 1.1em,
)

`;

  const chunks = [preamble];

  // Prefácio C++20
  const prefacePath = path.join(MD_DIR, '00_prefacio_cpp20.md');
  if (fs.existsSync(prefacePath)) {
    const md = fs.readFileSync(prefacePath, 'utf8');
    chunks.push(markdownToTypst(md, 1));
  }

  // Reinicia numeração arábica para o corpo principal
  chunks.push(`
#set page(
  numbering: "1",
  footer: context {
    set text(size: 8pt, fill: vulkan-muted)
    line(length: 100%, stroke: 0.4pt + rgb("#DCE2EA"))
    v(-3pt)
    grid(
      columns: (1fr, auto),
      [Guia Completo de Vulkan para C++20 (PT-BR) — KhronosGroup/Vulkan-Guide],
      [Página #counter(page).display("1 de 1", both: true)],
    )
  },
)
#counter(page).update(1)
`);

  for (const part of PARTS) {
    chunks.push(`= ${part.number} — ${part.title}\n`);
    chunks.push(`#text(size: 10.5pt, fill: vulkan-muted, style: "italic")[${escapeTypstText(part.subtitle)}]\n\n`);

    for (const relFile of part.chapters) {
      const fullPath = path.join(MD_DIR, relFile);
      if (!fs.existsSync(fullPath)) {
        missingChapters.push(relFile);
        continue;
      }
      const md = fs.readFileSync(fullPath, 'utf8');
      chunks.push(`// --- Capítulo: ${relFile} ---\n`);
      chunks.push(markdownToTypst(md, 1));
      chunks.push('\n');
      loadedCount++;
    }
  }

  fs.writeFileSync(OUT_TYP, chunks.join('\n'), 'utf8');
  console.log(`Gerado ${OUT_TYP}`);
  console.log(`Capítulos carregados: ${loadedCount} / 84`);
  if (missingChapters.length > 0) {
    console.log(`AVISO - Capítulos ausentes (${missingChapters.length}):`, missingChapters.join(', '));
  }
  if (missingImages.length > 0) {
    console.log(`AVISO - Imagens não encontradas (${missingImages.length}):`, [...new Set(missingImages)].join(', '));
  }
}

buildDocument();
