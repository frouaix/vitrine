import { describe, expect, it } from 'vitest';
import {
  createPaginatedLayoutEngine,
  createNullMeasureDelegate,
  prepareLayoutDocument,
  resolvePageSpec,
  validateLayoutDocument
} from '../src/index.ts';
import type { LayoutDocument, LayoutMeasureRequest, LayoutMeasuredContent } from '../src/index.ts';

describe('layout pagination foundations', () => {
  it('resolves page specs into a content box', () => {
    expect(resolvePageSpec({
      width: 612,
      height: 792,
      margins: {
        top: 36,
        right: 24,
        bottom: 48,
        left: 24
      }
    })).toEqual({
      id: undefined,
      width: 612,
      height: 792,
      unit: 'pt',
      margins: {
        top: 36,
        right: 24,
        bottom: 48,
        left: 24
      },
      contentBox: {
        x: 24,
        y: 36,
        width: 564,
        height: 708
      }
    });
  });

  it('rejects margins larger than the page', () => {
    expect(() => resolvePageSpec({
      width: 100,
      height: 100,
      margins: {
        left: 60,
        right: 60
      }
    })).toThrow('Page margins exceed the page size.');
  });

  it('prepares a validated document through the engine', () => {
    const document: LayoutDocument = {
      kind: 'flow',
      id: 'doc-1',
      page: {
        width: 595,
        height: 842,
        unit: 'pt'
      },
      body: {
        kind: 'stack',
        gap: 12,
        children: [
          { kind: 'text', text: 'Hello page' },
          { kind: 'spacer', size: 24 }
        ]
      }
    };

    validateLayoutDocument(document);
    const prepared = prepareLayoutDocument(document);
    expect(prepared.kind).toBe('flow');
    expect(prepared.page.contentBox.width).toBe(499);

    const engine = createPaginatedLayoutEngine();
    expect(engine.prepare(document)).toEqual(prepared);
  });

  it('prepares presentation documents as explicit slide sequences', () => {
    const document: LayoutDocument = {
      kind: 'presentation',
      id: 'deck-1',
      page: {
        width: 1280,
        height: 720,
        unit: 'px',
        margins: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      previewScale: 'contain',
      slides: [
        {
          kind: 'stack',
          children: [
            { kind: 'text', text: 'Title slide' }
          ]
        },
        {
          kind: 'stack',
          children: [
            { kind: 'text', text: 'Agenda slide' }
          ]
        }
      ]
    };

    const prepared = prepareLayoutDocument(document);
    expect(prepared).toEqual({
      kind: 'presentation',
      documentId: 'deck-1',
      page: {
        id: undefined,
        width: 1280,
        height: 720,
        unit: 'px',
        margins: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        contentBox: {
          x: 0,
          y: 0,
          width: 1280,
          height: 720
        }
      },
      previewScale: 'contain',
      slides: document.slides,
      background: undefined,
      foreground: undefined
    });
  });

  it('lays out flow content across multiple pages with repeated artifacts', () => {
    const document: LayoutDocument = {
      kind: 'flow',
      id: 'doc-flow',
      page: {
        width: 200,
        height: 220,
        unit: 'px',
        margins: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      header: {
        kind: 'spacer',
        id: 'header',
        size: 20
      },
      footer: {
        kind: 'spacer',
        id: 'footer',
        size: 15
      },
      background: {
        kind: 'spacer',
        id: 'bg',
        size: 0
      },
      foreground: {
        kind: 'spacer',
        id: 'fg',
        size: 0
      },
      body: {
        kind: 'stack',
        gap: 10,
        children: [
          { kind: 'spacer', id: 'a', size: 60 },
          { kind: 'spacer', id: 'b', size: 60 },
          { kind: 'spacer', id: 'c', size: 60 }
        ]
      }
    };

    const result = createPaginatedLayoutEngine(createNullMeasureDelegate()).layout(document);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]!.bodyBox).toEqual({
      x: 10,
      y: 30,
      width: 180,
      height: 165
    });
    expect(result.pages[0]!.fragments.map((fragment) => `${fragment.artifactKind ?? 'body'}:${fragment.nodeId ?? fragment.nodeKind}`)).toEqual([
      'background:bg',
      'header:header',
      'body:a',
      'body:b',
      'footer:footer',
      'foreground:fg'
    ]);
    expect(result.pages[1]!.fragments.some((fragment) => fragment.nodeId === 'c')).toBe(true);
  });

  it('honors explicit page breaks in flow documents', () => {
    const document: LayoutDocument = {
      kind: 'flow',
      id: 'doc-break',
      page: {
        width: 200,
        height: 180,
        unit: 'px'
      },
      body: {
        kind: 'stack',
        children: [
          { kind: 'text', id: 'intro', text: 'Intro' },
          { kind: 'pageBreak', id: 'break-1' },
          { kind: 'text', id: 'after-break', text: 'After break' }
        ]
      }
    };

    const result = createPaginatedLayoutEngine().layout(document);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]!.fragments.some((fragment) => fragment.nodeId === 'intro')).toBe(true);
    expect(result.pages[1]!.fragments.some((fragment) => fragment.nodeId === 'after-break')).toBe(true);
  });

  it('uses measurement delegates for measured nodes', () => {
    const document: LayoutDocument = {
      kind: 'flow',
      id: 'doc-measured',
      page: {
        width: 300,
        height: 220,
        unit: 'px'
      },
      body: {
        kind: 'stack',
        children: [
          {
            kind: 'measured',
            id: 'hero',
            measureKey: 'hero',
            content: { kind: 'hero' }
          }
        ]
      }
    };

    const engine = createPaginatedLayoutEngine({
      measure(request: LayoutMeasureRequest): LayoutMeasuredContent | null {
        if (request.node.kind !== 'measured') {
          return null;
        }
        return {
          intrinsicSize: {
            minWidth: request.availableSpace.width,
            maxWidth: request.availableSpace.width,
            minHeight: 96
          },
          preferredRect: {
            x: 0,
            y: 0,
            width: request.availableSpace.width,
            height: 96
          },
          renderData: { measured: true }
        };
      }
    });

    const result = engine.layout(document);
    const fragment = result.pages[0]!.fragments.find((entry) => entry.nodeId === 'hero');
    expect(fragment?.rect.height).toBe(96);
    expect(fragment?.renderData).toEqual({ measured: true });
  });
});
