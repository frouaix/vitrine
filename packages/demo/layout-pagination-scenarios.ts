import { group, rectangle, text } from 'vitrine';
import { createPaginatedLayoutEngine } from 'vitrine-layout-pagination';
import {
  createVitrineLayoutMeasureDelegate,
  type VitrineLayoutDocument,
  type VitrineLayoutLeafContent
} from 'vitrine-layout-pagination-adapter';
import { generateSampleEvents, rsCalendarDayView, rsCalendarMonthView } from 'vitrine-gui';
import {
  applyStyle,
  detectRgStorageMode,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16,
  texta as textaBlock,
  type AttributedTextValue
} from 'texta/browser';
import { parseMarkdownToRender } from 'texta/markdown';
import { buildDebugTextaScene } from './text-selection-debug-texta-scene.js';

type DemoDocument = VitrineLayoutDocument<string>;

const rgCalendarEvent = generateSampleEvents();

function paragraph(id: string, value: string): DemoDocument['body'] {
  return {
    kind: 'text',
    id,
    text: value,
    textStyle: {
      fontSize: 16,
      lineHeight: 24,
      fill: '#1e293b'
    }
  };
}

function createLeafContent(
  minHeight: number,
  renderBlocks: VitrineLayoutLeafContent['renderBlocks'],
  clip: boolean = true
): VitrineLayoutLeafContent {
  return {
    intrinsicSize: {
      minWidth: 0,
      maxWidth: Number.POSITIVE_INFINITY,
      minHeight
    },
    clip,
    renderBlocks
  };
}

function getUnitCount(strText: string, rgStorageMode: AttributedTextValue['rgStorageMode']): number {
  if (rgStorageMode === 'fastCodeUnit') {
    return strText.length;
  }
  if (rgStorageMode === 'fastCodePoint') {
    return getRgCodePointBoundaryUtf16(strText).length - 1;
  }
  return getRgGraphemeBoundaryUtf16(strText).length - 1;
}

function getRgSegGraphemeToUtf16(
  strText: string,
  rgStorageMode: AttributedTextValue['rgStorageMode']
): number[] {
  if (rgStorageMode !== 'segmentedGrapheme') {
    return [];
  }
  return getRgGraphemeBoundaryUtf16(strText).slice(1);
}

function createAttributedText(
  strText: string,
  styleDefault: Record<string, unknown>
): AttributedTextValue {
  const rgStorageMode = detectRgStorageMode(strText);
  const iUnits = getUnitCount(strText, rgStorageMode);
  return {
    iVersion: 1,
    rgUnits: 'grapheme',
    rgStorageMode,
    strText,
    rgSegGraphemeToUtf16: getRgSegGraphemeToUtf16(strText, rgStorageMode),
    rgIdStyleRef: new Array(iUnits).fill(1),
    mpId_StyleEntry: { 1: styleDefault },
    idStyleDefault: 1
  };
}

function applyRanges(
  value: AttributedTextValue,
  ranges: Array<{ start: number; end: number; style: Record<string, unknown> }>
): AttributedTextValue {
  let next = value;
  for (const range of ranges) {
    next = applyStyle(next, range.start, range.end, range.style, 'merge');
  }
  return next;
}

const valueSlideAside = applyRanges(
  createAttributedText(
    'Selection geometry, styled runs, and markdown all flow through the same Vitrine block pipeline.',
    { fontFamily: 'ui-sans-serif', fontSize: 18, fill: '#0f172a', lineHeight: 28 }
  ),
  [
    { start: 0, end: 18, style: { fontWeight: '700', fill: '#2563eb' } },
    { start: 20, end: 31, style: { fontStyle: 'italic', fill: '#7c3aed' } },
    { start: 63, end: 84, style: { fontWeight: '700', background: '#dbeafe', fill: '#1d4ed8' } }
  ]
);

const valueDocumentCallout = applyRanges(
  createAttributedText(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Styled spans, background highlights, and mixed emphasis should remain native block content even after pagination.',
    { fontFamily: 'Georgia', fontSize: 18, fill: '#334155', lineHeight: 30 }
  ),
  [
    { start: 0, end: 11, style: { fontWeight: '700', fill: '#1d4ed8' } },
    { start: 28, end: 39, style: { fontStyle: 'italic', fill: '#7c3aed' } },
    { start: 64, end: 85, style: { background: '#fef3c7', fill: '#92400e' } },
    { start: 126, end: 145, style: { fontWeight: '700', fill: '#0f766e' } }
  ]
);

const valueDocumentSummary = applyRanges(
  createAttributedText(
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
    { fontFamily: 'ui-sans-serif', fontSize: 17, fill: '#1f2937', lineHeight: 26 }
  ),
  [
    { start: 0, end: 22, style: { fontWeight: '700', fill: '#2563eb' } },
    { start: 51, end: 73, style: { fontStyle: 'italic', fill: '#7c3aed' } },
    { start: 89, end: 111, style: { background: '#dcfce7', fill: '#166534' } }
  ]
);

const stSlideMarkdown = `## Demo collage

- **Calendar Views** brings dense visual structure.
- *Texta* contributes styled runs and rich inline formatting.
- Both now sit inside paginated slides as regular Vitrine blocks.`;

const stDocumentMarkdownIntro = `# Layout package demo

This document borrows directly from the **Markdown** and **Texta** demos.

> The page model decides pagination. The content stays renderer-native.

Lorem ipsum dolor sit amet, *consectetur adipiscing elit*, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

- **Bold** emphasis for section keywords
- Inline \`code\` for implementation details
- Mixed rhythm with paragraphs and lists`;

const stDocumentMarkdownChapter = `## Formatted narrative

Lorem ipsum dolor sit amet, consectetur adipiscing elit. **Praesent** commodo cursus magna, vel scelerisque nisl consectetur et.

1. Build semantic content with markdown or texta.
2. Measure it as a paginated layout node.
3. Render the resulting fragments as Vitrine blocks.

---

\`\`\`
render(layoutDocument)
  -> paginate()
  -> buildVitrineBlocksFromPaginatedLayout()
\`\`\``;

const stDocumentMarkdownClosing = `### Closing note

*Curabitur blandit tempus porttitor.* Donec sed odio dui. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.

> Lorem ipsum pages can still carry polished formatting without leaving the Vitrine block model.`;

const valueMarkdownIntro = parseMarkdownToRender(stDocumentMarkdownIntro);
const valueMarkdownChapter = parseMarkdownToRender(stDocumentMarkdownChapter);
const valueMarkdownClosing = parseMarkdownToRender(stDocumentMarkdownClosing);
const valueSlideMarkdown = parseMarkdownToRender(stSlideMarkdown);

function frameCard(x: number, y: number, width: number, height: number, title: string, subtitle?: string): ReturnType<typeof group> {
  return group({ x, y }, [
    rectangle({
      dx: width,
      dy: height,
      fill: '#ffffff',
      stroke: '#d7e1ee',
      strokeWidth: 1,
      cornerRadius: 20,
      shadow: { offsetX: 0, offsetY: 10, blur: 24, color: 'rgba(15, 23, 42, 0.08)' }
    }),
    text({
      x: 20,
      y: 18,
      text: title,
      fontSize: 16,
      fill: '#0f172a',
      font: '600 16px ui-sans-serif',
      baseline: 'top'
    }),
    ...(subtitle
      ? [text({
          x: 20,
          y: 42,
          text: subtitle,
          fontSize: 12,
          fill: '#64748b',
          baseline: 'top'
        })]
      : [])
  ]);
}

function monthCalendarBlocks(x: number, y: number, scale: number): ReturnType<typeof group> {
  return group({ x, y, scaleX: scale, scaleY: scale }, [
    rsCalendarMonthView({
      cMonth: 1,
      dateStart: new Date(2026, 1, 1),
      dayStartWeek: 0,
      rgEvent: rgCalendarEvent,
      x: 0,
      y: 0
    })
  ]);
}

function weekCalendarBlocks(x: number, y: number, scale: number): ReturnType<typeof group> {
  return group({ x, y, scaleX: scale, scaleY: scale }, [
    rsCalendarDayView({
      cDay: 5,
      dateStart: new Date(2026, 1, 16),
      hourStart: 8,
      hourEnd: 18,
      rgEvent: rgCalendarEvent,
      x: 0,
      y: 0
    })
  ]);
}

function buildMarkdownPanel(
  valueMarkdown: AttributedTextValue,
  width: number,
  height: number
): ReturnType<typeof group> {
  return group({}, [
    rectangle({
      dx: width,
      dy: height,
      fill: '#ffffff',
      stroke: '#d7e1ee',
      strokeWidth: 1,
      cornerRadius: 18
    }),
    group({ x: 22, y: 22, clip: true, dx: width - 44, dy: height - 44 }, [
      textaBlock({
        x: 0,
        y: 0,
        dx: width - 44,
        texta: valueMarkdown,
        baseline: 'top'
      })
    ])
  ]);
}

function buildTextaPanel(
  title: string,
  valueTexta: AttributedTextValue,
  width: number,
  height: number
): ReturnType<typeof group> {
  return group({}, [
    rectangle({
      dx: width,
      dy: height,
      fill: '#ffffff',
      stroke: '#d7e1ee',
      strokeWidth: 1,
      cornerRadius: 18
    }),
    text({
      x: 18,
      y: 16,
      text: title,
      fontSize: 13,
      fill: '#64748b',
      font: '600 13px ui-sans-serif',
      baseline: 'top'
    }),
    group({ x: 18, y: 42, clip: true, dx: width - 36, dy: height - 60 }, [
      textaBlock({
        x: 0,
        y: 0,
        dx: width - 36,
        texta: valueTexta,
        baseline: 'top'
      })
    ])
  ]);
}

function slideShowcaseContent(): VitrineLayoutLeafContent {
  return createLeafContent(408, ({ frame }) => {
    const dxLeft = frame.width * 0.58;
    const dxRight = frame.width - dxLeft - 24;
    const dyInner = frame.height - 70;
    const sMonth = Math.min((dxLeft - 40) / 1160, (dyInner - 34) / 560);
    const sTexta = Math.min((dxRight - 24) / 1000, (dyInner - 34) / 920);

    return [
      frameCard(0, 0, dxLeft, frame.height, 'Calendar Views demo', 'Month view scaled into slide geometry'),
      frameCard(dxLeft + 24, 0, dxRight, frame.height, 'Texta selection demo', 'The same debug scene embedded as slide content'),
      group({ x: 20, y: 64, clip: true, dx: dxLeft - 40, dy: dyInner - 14 }, [
        monthCalendarBlocks(0, 0, sMonth)
      ]),
      group({ x: dxLeft + 36, y: 64, clip: true, dx: dxRight - 24, dy: dyInner - 14 }, [
        group({ scaleX: sTexta, scaleY: sTexta }, [buildDebugTextaScene()])
      ])
    ];
  });
}

function slidePlannerContent(): VitrineLayoutLeafContent {
  return createLeafContent(430, ({ frame }) => {
    const dxVisual = frame.width * 0.68;
    const dxAside = frame.width - dxVisual - 24;
    const sWeek = Math.min((dxVisual - 40) / 1360, (frame.height - 98) / 800);

    return [
      frameCard(0, 0, dxVisual, frame.height, 'Calendar demo reuse', 'Week view adapted to fit a slide panel'),
      frameCard(dxVisual + 24, 0, dxAside, frame.height, 'Compact markdown/texta aside', 'Small amount of copy, heavy visual bias'),
      group({ x: 20, y: 68, clip: true, dx: dxVisual - 40, dy: frame.height - 88 }, [
        weekCalendarBlocks(0, 0, sWeek)
      ]),
      group({ x: dxVisual + 40, y: 64 }, [
        buildMarkdownPanel(valueSlideMarkdown, dxAside - 32, 150)
      ]),
      group({ x: dxVisual + 40, y: 232 }, [
        buildTextaPanel('Texta aside', valueSlideAside, dxAside - 32, 150)
      ])
    ];
  });
}

function slideTypographyContent(): VitrineLayoutLeafContent {
  return createLeafContent(392, ({ frame }) => {
    const dxLeft = frame.width * 0.52;
    const dxRight = frame.width - dxLeft - 24;
    const sTexta = Math.min((dxLeft - 24) / 1000, (frame.height - 78) / 920);
    const sMonth = Math.min((dxRight - 40) / 1160, (frame.height - 250) / 560);

    return [
      frameCard(0, 0, dxLeft, frame.height, 'Texta debug collage', 'The existing scene becomes a slide-scale visual texture'),
      frameCard(dxLeft + 24, 0, dxRight, 170, 'Markdown panel', 'Formatted text still renders as native blocks'),
      frameCard(dxLeft + 24, 190, dxRight, frame.height - 190, 'Mini calendar', 'A second embedded visual borrowed from the calendar demo'),
      group({ x: 12, y: 60, clip: true, dx: dxLeft - 24, dy: frame.height - 72 }, [
        group({ scaleX: sTexta, scaleY: sTexta }, [buildDebugTextaScene()])
      ]),
      group({ x: dxLeft + 42, y: 58 }, [
        buildMarkdownPanel(valueSlideMarkdown, dxRight - 36, 100)
      ]),
      group({ x: dxLeft + 44, y: 254, clip: true, dx: dxRight - 40, dy: frame.height - 278 }, [
        monthCalendarBlocks(0, 0, sMonth)
      ])
    ];
  });
}

function markdownSectionContent(
  valueMarkdown: AttributedTextValue,
  minHeight: number
): VitrineLayoutLeafContent {
  return createLeafContent(minHeight, ({ frame }) => [
    buildMarkdownPanel(valueMarkdown, frame.width, frame.height)
  ]);
}

function textaSectionContent(
  title: string,
  valueTexta: AttributedTextValue,
  minHeight: number
): VitrineLayoutLeafContent {
  return createLeafContent(minHeight, ({ frame }) => [
    buildTextaPanel(title, valueTexta, frame.width, frame.height)
  ]);
}

const layoutMeasureDelegate = createVitrineLayoutMeasureDelegate();

export const documentPresentation: DemoDocument = {
  kind: 'presentation',
  id: 'browser-deck',
  page: {
    width: 1280,
    height: 720,
    unit: 'px',
    margins: {
      top: 72,
      right: 92,
      bottom: 72,
      left: 92
    }
  },
  slides: [
    {
      kind: 'stack',
      id: 'slide-title',
      gap: 26,
      children: [
        {
          kind: 'text',
          id: 'slide-title-heading',
          text: 'Paginated slides with real demo content',
          textStyle: { fontSize: 42, fill: '#0f172a', lineHeight: 52 }
        },
        {
          kind: 'text',
          id: 'slide-title-subheading',
          text: 'Calendar Views and the Texta selection scene now live inside the slide deck as Vitrine blocks, not placeholders.',
          textStyle: { fontSize: 21, fill: '#334155', lineHeight: 31 }
        },
        {
          kind: 'measured',
          id: 'slide-title-showcase',
          measureKey: 'slide-title-showcase',
          content: slideShowcaseContent()
        }
      ]
    },
    {
      kind: 'stack',
      id: 'slide-agenda',
      gap: 22,
      children: [
        {
          kind: 'text',
          id: 'slide-agenda-heading',
          text: 'Mostly visual slides, with small rich-text asides',
          textStyle: { fontSize: 36, fill: '#0f172a', lineHeight: 44 }
        },
        {
          kind: 'text',
          id: 'slide-agenda-subheading',
          text: 'The page model stays explicit while measured regions host calendar components, markdown-rendered texta, and selection-debug content.',
          textStyle: { fontSize: 20, fill: '#475569', lineHeight: 30 }
        },
        {
          kind: 'measured',
          id: 'slide-agenda-showcase',
          measureKey: 'slide-agenda-showcase',
          content: slidePlannerContent()
        }
      ]
    },
    {
      kind: 'stack',
      id: 'slide-closing',
      gap: 22,
      children: [
        {
          kind: 'text',
          id: 'slide-closing-heading',
          text: 'The slide deck is now a content host',
          textStyle: { fontSize: 38, fill: '#0f172a', lineHeight: 48 }
        },
        {
          kind: 'text',
          id: 'slide-closing-body',
          text: 'That means presentation pages can mix existing demo scenes, formatted markdown, and attributed text without any separate rendering path.',
          textStyle: { fontSize: 23, fill: '#334155', lineHeight: 34 }
        },
        {
          kind: 'measured',
          id: 'slide-closing-showcase',
          measureKey: 'slide-closing-showcase',
          content: slideTypographyContent()
        }
      ]
    }
  ]
};

export const presentationResult = createPaginatedLayoutEngine(layoutMeasureDelegate).layout(documentPresentation);

export const documentFlow: DemoDocument = {
  kind: 'flow',
  id: 'markdown-doc',
  page: {
    width: 612,
    height: 792,
    unit: 'pt',
    margins: {
      top: 54,
      right: 54,
      bottom: 54,
      left: 54
    }
  },
  background: {
    kind: 'box',
    id: 'doc-bg',
    child: undefined
  },
  header: {
    kind: 'text',
    id: 'doc-header',
    text: 'Markdown + Texta inside paginated Vitrine pages',
    textStyle: {
      fontSize: 14,
      lineHeight: 18,
      fill: '#1d4ed8'
    }
  },
  footer: {
    kind: 'text',
    id: 'doc-footer',
    text: 'Renderer-native content · semantic pagination · reusable page model',
    textStyle: {
      fontSize: 12,
      lineHeight: 16,
      fill: '#64748b'
    }
  },
  body: {
    kind: 'stack',
    id: 'doc-body',
    gap: 18,
    children: [
      {
        kind: 'text',
        id: 'doc-title',
        text: 'Paginated pages with markdown and texta content',
        textStyle: {
          fontSize: 28,
          lineHeight: 36,
          fill: '#0f172a'
        }
      },
      paragraph(
        'doc-intro',
        'This flow demo now pulls content patterns from the markdown and texta demos: formatted headings, lists, code, and rich attributed text all appear as measured Vitrine content inside page fragments.'
      ),
      {
        kind: 'measured',
        id: 'doc-markdown-intro',
        measureKey: 'doc-markdown-intro',
        content: markdownSectionContent(valueMarkdownIntro, 310)
      },
      paragraph(
        'doc-bridge',
        'The paginator still operates over semantic layout nodes, but those nodes now host renderer-native payloads instead of placeholder rectangles.'
      ),
      {
        kind: 'measured',
        id: 'doc-texta-callout',
        measureKey: 'doc-texta-callout',
        content: textaSectionContent('Texta excerpt', valueDocumentCallout, 208)
      },
      paragraph(
        'doc-middle',
        'Lorem ipsum is enough to show the mechanics: spacing, emphasis, and decorative backgrounds survive because the content adapter hands the page preview ordinary Vitrine blocks.'
      ),
      {
        kind: 'measured',
        id: 'doc-markdown-chapter',
        measureKey: 'doc-markdown-chapter',
        content: markdownSectionContent(valueMarkdownChapter, 300)
      },
      {
        kind: 'pageBreak',
        id: 'doc-break-1'
      },
      {
        kind: 'text',
        id: 'doc-section-2-title',
        text: 'Second chapter',
        textStyle: {
          fontSize: 22,
          lineHeight: 30,
          fill: '#0f172a'
        }
      },
      paragraph(
        'doc-second-intro',
        'The second page leans more heavily on texta-specific styling: run-level emphasis, color accents, and highlighted spans drawn through the same custom block type used elsewhere in the repo.'
      ),
      {
        kind: 'measured',
        id: 'doc-texta-summary',
        measureKey: 'doc-texta-summary',
        content: textaSectionContent('Styled summary', valueDocumentSummary, 190)
      },
      {
        kind: 'measured',
        id: 'doc-markdown-closing',
        measureKey: 'doc-markdown-closing',
        content: markdownSectionContent(valueMarkdownClosing, 220)
      },
      paragraph(
        'doc-outro',
        'The result is the core promise of the package: slides and documents can be composed from real Vitrine blocks while pagination remains a separate, reusable concern.'
      )
    ]
  }
};

export const flowResult = createPaginatedLayoutEngine(layoutMeasureDelegate).layout(documentFlow);
