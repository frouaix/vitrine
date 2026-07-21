import type { LayoutDocument } from 'vitrine-layout-pagination';
import { createPaginatedLayoutEngine } from 'vitrine-layout-pagination';

function paragraph(id: string, text: string): LayoutDocument['body'] {
  return {
    kind: 'text',
    id,
    text,
    textStyle: {
      fontSize: 16,
      lineHeight: 24,
      fill: '#1e293b'
    }
  };
}

export const documentPresentation: LayoutDocument = {
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
      gap: 28,
      children: [
        {
          kind: 'text',
          id: 'slide-title-heading',
          text: 'Q3 Product Narrative',
          textStyle: { fontSize: 42, fill: '#0f172a', lineHeight: 52 }
        },
        {
          kind: 'text',
          id: 'slide-title-subheading',
          text: 'A browser-authored slide deck with fixed 16:9 page geometry and reusable page semantics.',
          textStyle: { fontSize: 22, fill: '#334155', lineHeight: 32 }
        },
        { kind: 'spacer', size: 32 },
        {
          kind: 'box',
          id: 'slide-title-hero',
          height: 220,
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
          child: {
            kind: 'text',
            id: 'slide-title-hero-text',
            text: 'Every slide is an explicit page, not a flow fragment. That means browser preview, PDF export, and page-level transitions can all share the same authored geometry.',
            textStyle: { fontSize: 24, fill: '#1e293b', lineHeight: 34 }
          }
        }
      ]
    },
    {
      kind: 'stack',
      id: 'slide-agenda',
      gap: 20,
      children: [
        {
          kind: 'text',
          id: 'slide-agenda-heading',
          text: 'Why explicit presentation pages?',
          textStyle: { fontSize: 36, fill: '#0f172a', lineHeight: 44 }
        },
        {
          kind: 'box',
          id: 'slide-agenda-card-1',
          height: 132,
          padding: { top: 18, right: 20, bottom: 18, left: 20 },
          child: {
            kind: 'text',
            id: 'slide-agenda-card-1-text',
            text: '1. Page size and aspect ratio stay stable across browsers and projectors.',
            textStyle: { fontSize: 20, fill: '#1e293b', lineHeight: 30 }
          }
        },
        {
          kind: 'box',
          id: 'slide-agenda-card-2',
          height: 132,
          padding: { top: 18, right: 20, bottom: 18, left: 20 },
          child: {
            kind: 'text',
            id: 'slide-agenda-card-2-text',
            text: '2. Slide-level semantics make PDF export and page thumbnails straightforward.',
            textStyle: { fontSize: 20, fill: '#1e293b', lineHeight: 30 }
          }
        },
        {
          kind: 'box',
          id: 'slide-agenda-card-3',
          height: 132,
          padding: { top: 18, right: 20, bottom: 18, left: 20 },
          child: {
            kind: 'text',
            id: 'slide-agenda-card-3-text',
            text: '3. A later adapter can turn the same page model into browser previews, canvases, or exported files.',
            textStyle: { fontSize: 20, fill: '#1e293b', lineHeight: 30 }
          }
        }
      ]
    },
    {
      kind: 'stack',
      id: 'slide-closing',
      gap: 26,
      children: [
        {
          kind: 'text',
          id: 'slide-closing-heading',
          text: 'Next step',
          textStyle: { fontSize: 38, fill: '#0f172a', lineHeight: 48 }
        },
        {
          kind: 'text',
          id: 'slide-closing-body',
          text: 'Keep the document model renderer-agnostic, then add richer slide composition and a Vitrine preview adapter without confusing slide pages with paginated flow content.',
          textStyle: { fontSize: 24, fill: '#334155', lineHeight: 34 }
        },
        { kind: 'spacer', size: 30 },
        {
          kind: 'box',
          id: 'slide-closing-banner',
          height: 150,
          padding: { top: 28, right: 28, bottom: 28, left: 28 },
          child: {
            kind: 'text',
            id: 'slide-closing-banner-text',
            text: 'Presentation pages: explicit, stable, and ready for browser preview.',
            textStyle: { fontSize: 28, fill: '#1d4ed8', lineHeight: 38 }
          }
        }
      ]
    }
  ]
};

export const presentationResult = createPaginatedLayoutEngine().layout(documentPresentation);

export const documentFlow: LayoutDocument = {
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
    text: 'Vitrine Layout & Pagination — Draft Notes',
    textStyle: {
      fontSize: 14,
      lineHeight: 18,
      fill: '#1d4ed8'
    }
  },
  footer: {
    kind: 'text',
    id: 'doc-footer',
    text: 'Semantic flow document · repeated footer region',
    textStyle: {
      fontSize: 12,
      lineHeight: 16,
      fill: '#64748b'
    }
  },
  body: {
    kind: 'stack',
    id: 'doc-body',
    gap: 16,
    children: [
      {
        kind: 'text',
        id: 'doc-title',
        text: 'Paginated Markdown-like Documentation',
        textStyle: {
          fontSize: 28,
          lineHeight: 36,
          fill: '#0f172a'
        }
      },
      paragraph(
        'doc-intro',
        'This scenario represents markdown or extended-markdown content rendered through text and texta primitives. The authored content should paginate semantically, with repeated headers and footers, instead of arbitrary page slicing.'
      ),
      paragraph(
        'doc-section-1',
        'The flow engine should own page geometry, content boxes, and break rules. Rich text, tables, images, and custom blocks can participate through measurement contracts so the pagination layer stays renderer-agnostic.'
      ),
      paragraph(
        'doc-section-2',
        'That same paginated structure should later feed browser previews and PDF export. The goal is for document flow to decide where page boundaries belong, while renderers decide how the resulting pages are drawn.'
      ),
      {
        kind: 'box',
        id: 'doc-callout',
        height: 150,
        padding: { top: 18, right: 20, bottom: 18, left: 20 },
        child: {
          kind: 'text',
          id: 'doc-callout-text',
          text: 'Callout: a semantic document paginator should prefer stable section and paragraph breaks over viewport slicing, especially for exported PDFs.',
          textStyle: {
            fontSize: 18,
            lineHeight: 28,
            fill: '#1e293b'
          }
        }
      },
      paragraph(
        'doc-section-3',
        'Tables and other measured blocks should integrate through delegates so pagination can see their intrinsic sizes and make better break decisions. This is especially important for documentation with callouts, examples, and embedded diagrams.'
      ),
      {
        kind: 'pageBreak',
        id: 'doc-break-1'
      },
      {
        kind: 'text',
        id: 'doc-section-4-title',
        text: 'Second chapter',
        textStyle: {
          fontSize: 22,
          lineHeight: 30,
          fill: '#0f172a'
        }
      },
      paragraph(
        'doc-section-4',
        'An explicit page break is still useful in documentation workflows. It lets authors control chapter starts or front matter while still relying on automatic pagination within each chapter.'
      ),
      paragraph(
        'doc-section-5',
        'The preview shown here is intentionally document-like: multiple pages at once, repeated furniture, and consistent body boxes. It is not a presentation deck or a freeform canvas scene.'
      ),
      paragraph(
        'doc-section-6',
        'Later phases can add richer fragmentation for complex boxes, better typography-aware text handling, and adapters that convert these paginated results into Vitrine block trees or PDF pages with higher fidelity.'
      )
    ]
  }
};

export const flowResult = createPaginatedLayoutEngine().layout(documentFlow);
