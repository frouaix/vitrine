# Markdown rendering

## Goals

1. Demonstrate how to use `texta` and transformations to implement a Markdown text editor
1. Demonstrate the theming capabilities afforded by general purpose attributes

## Implementation

1. Define symbolic attributes required for the different kinds of markdown styles
1. Write a transform from markdown to texta with symbolic attributes
1. Write a transform from texta with symbolic attributes to render attributes, avoiding inlining constants and parameters for render attributes
1. Add a new markdown.html demo to the current set of demo pages. This page is split vertically in two, with the left hand side being a built-in HTML multiline text editor and the right hand side being the markdown rendering, updated in real-time. At the foot of the page, show the performance measurement. At the top of the page, offer 3 buttons that populate the input editor with sample markdown content illustrating all available markdown styles.

---

## Plan

### Markdown subset

Support the following inline and block-level constructs (no tables, no HTML passthrough):

| Construct | Markdown syntax | Semantic token |
|---|---|---|
| Heading 1 | `# …` | `h1` |
| Heading 2 | `## …` | `h2` |
| Heading 3 | `### …` | `h3` |
| Bold | `**…**` or `__…__` | `bold` |
| Italic | `*…*` or `_…_` | `italic` |
| Bold + italic | `***…***` | `bold-italic` |
| Inline code | `` `…` `` | `code-inline` |
| Strikethrough | `~~…~~` | `strikethrough` |
| Blockquote | `> …` | `blockquote` |
| Code block | ` ``` … ``` ` | `code-block` |
| Unordered list item | `- …` / `* …` | `list-item` |
| Ordered list item | `1. …` | `list-item-ordered` |
| Horizontal rule | `---` | `hr` |
| Plain text / paragraph | (default) | *(idStyleDefault)* |

### Step 1 — Define semantic tokens in `SemanticStyleMeta`

Each distinct markdown construct maps to one `token` string stored in `mpSemantic.token` on a `SemanticStyleEntry`. No render properties are set at this stage.

```ts
// example entries produced by the markdown parser
{ mpSemantic: { token: 'h1' } }
{ mpSemantic: { token: 'bold' } }
{ mpSemantic: { token: 'code-inline' } }
```

### Step 2 — Markdown → `AttributedTextValueSemantic` parser

Location: `packages/texta/src/markdown.ts` (new file, demo-only scope for now; not part of the `browser.ts` public surface until stabilised).

Algorithm — single-pass line scanner:
1. Split input on `\n`.
2. For each line, detect the block-level prefix (`#`, `>`, `- `, `1. `, ` ``` `, `---`). Strip the prefix and record the block token for the whole line.
3. For the remaining text, run an inline span scanner over `**`, `*`, `__`, `_`, `~~`, `` ` `` delimiters. Produce a flat list of `{ text, token }` spans.
4. Concatenate spans with `\n` line separators. Build `rgIdStyleRef` by interning each span's `SemanticStyleEntry` via `internStyleEntry` from `dictionary.ts`.
5. Return an `AttributedTextValueSemantic`.

### Step 3 — Theming transform

Use the existing `transformSemanticToRenderWithCache` from `theming.ts`. Define a `ThemingTransformConfig` constant that maps each token to concrete `StyleEntry` render properties:

```ts
const markdownTheme: ThemingTransformConfig = {
  mpToken_StylePatch: {
    h1:               { fontSize: 32, fontWeight: '700', lineHeight: 44 },
    h2:               { fontSize: 26, fontWeight: '700', lineHeight: 36 },
    h3:               { fontSize: 21, fontWeight: '600', lineHeight: 30 },
    bold:             { fontWeight: '700' },
    italic:           { fontStyle: 'italic' },
    'bold-italic':    { fontWeight: '700', fontStyle: 'italic' },
    'code-inline':    { fontFamily: 'ui-monospace', background: '#f1f5f9', fill: '#0f172a' },
    strikethrough:    { /* fill is unchanged; strikethrough flag handled on render bridge */ },
    blockquote:       { fill: '#64748b', fontStyle: 'italic' },
    'code-block':     { fontFamily: 'ui-monospace', fontSize: 14, lineHeight: 22, fill: '#0f172a', background: '#f8fafc' },
    'list-item':      {},
    'list-item-ordered': {},
    hr:               { fill: 'transparent' },
  }
};
```

The render result is an `AttributedTextValueRender` ready for the `texta()` block.

### Step 4 — `markdown.html` demo page

**Layout** (full viewport, no canvas border):
```
┌─────────────────────────────────────────────────────────┐
│  [Sample 1]  [Sample 2]  [Sample 3]         Performance │  ← toolbar (HTML)
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   <textarea>         │   <canvas> (vitrine texta)       │
│   (raw markdown)     │   re-rendered on every input     │
│                      │   event, debounced 16 ms         │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

- Left pane: native `<textarea>` taking 50% width, full height, monospace font.
- Right pane: `ImmediateRenderer` canvas at 50% width. The `texta()` block uses `dx` equal to the canvas width minus padding, `baseline: 'top'`, `lineHeight` driven by the theme.
- Preview scrolling: `enableCameraControls: true` with `renderer.camera([...])` enables wheel-based panning on the preview surface.
- The canvas is re-scaled via `resizeObserver` on the right pane and `renderer.resize()`.
- Performance readout (`renderer.getPerformanceStats()`) shown in the toolbar right side as plain text, updated each frame.

**Three sample payloads** (toolbar buttons):
1. *Basics* — covers headings H1–H3, bold, italic, bold-italic, plain text.
2. *Code & quoting* — inline code, code block, blockquote, strikethrough, horizontal rule.
3. *Lists* — unordered and ordered lists, mixed with inline styles.

**Wiring:**
- `input` event on the textarea triggers `parseMarkdown(textarea.value)` → `transformSemanticToRenderWithCache` → `renderer.render(...)`.
- The theming cache is keyed by `idTheme: 'markdown-default'`; `iVersion` changes on each edit ensure the cache is bypassed correctly.

### Step 5 — Vite wiring

- Add `markdown: resolve(__dirname, 'markdown.html')` to `rollupOptions.input` in `packages/demo/vite.config.ts`.
- No new aliases needed (`texta/browser` alias already present).
- Add nav link in `texta.html` and update `gallery.ts`.

### Known constraints / open questions

- **Multi-line code blocks**: the `texta()` block renders all text as a single attributed run via `dx` wrapping. Code blocks with internal `\n` are already handled by the existing newline splitting in `renderTexta`. No special treatment needed.
- **`strikethrough` flag**: `StyleEntry.strikethrough` is a boolean, not a fill colour. `renderTexta` does not yet draw strikethrough decorations. This can be deferred; the theming step sets the flag and the renderer can handle it in a later pass.
- **List bullets**: bullet characters (`•`, `1.`) are prepended as plain text during parsing, so no special renderer support is needed.
- **Scrolling**: supported via renderer camera controls in the preview pane (mouse wheel for vertical pan, Shift + wheel for horizontal pan).
