import { group, rectangle, text } from 'vitrine';
import {
  applyStyle,
  detectRgStorageMode,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16,
  texta as textaBlock
} from 'texta/browser';

export const DEBUG_TEXTA_BLOCK_IDS = [
  'ta1',
  'ta2',
  'ta3',
  'ta4',
  'ta5',
  'ta6',
  'ta7',
  'ta8',
  'ta9',
  'ta10'
];

function getUnitCount(strText, rgStorageMode) {
  if (rgStorageMode === 'fastCodeUnit') {
    return strText.length;
  }
  if (rgStorageMode === 'fastCodePoint') {
    return getRgCodePointBoundaryUtf16(strText).length - 1;
  }
  return getRgGraphemeBoundaryUtf16(strText).length - 1;
}

function getRgSegGraphemeToUtf16(strText, rgStorageMode) {
  if (rgStorageMode !== 'segmentedGrapheme') {
    return [];
  }
  return getRgGraphemeBoundaryUtf16(strText).slice(1);
}

function createAttributedText(strText, styleDefault) {
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

function applyRanges(value, ranges) {
  let next = value;
  const unitCount = next.rgIdStyleRef.length;
  for (const range of ranges) {
    const start = Math.max(0, Math.min(unitCount, range.start));
    const end = Math.max(start, Math.min(unitCount, range.end));
    if (end > start) {
      next = applyStyle(next, start, end, range.style, 'merge');
    }
  }
  return next;
}

function valueHeadline() {
  const base = createAttributedText(
    'Texta Selection Debug: mixed runs and styles',
    { fontFamily: 'ui-sans-serif', fontSize: 22, fill: '#0f172a', lineHeight: 30 }
  );

  return applyRanges(base, [
    { start: 0, end: 5, style: { fontWeight: '700', fill: '#2563eb' } },
    { start: 6, end: 15, style: { fontStyle: 'italic', fill: '#7c3aed' } },
    { start: 23, end: 28, style: { fontWeight: '700', background: '#fef3c7', fill: '#92400e' } },
    { start: 34, end: 40, style: { fontWeight: '700', fill: '#0f766e' } }
  ]);
}

function valueParagraph() {
  const str = 'Wrapped paragraph with highlighted tokens, italic spans, and varying line height to stress hit testing and caret alignment in texta selection.';
  const base = createAttributedText(
    str,
    { fontFamily: 'Georgia', fontSize: 16, fill: '#334155', lineHeight: 24 }
  );

  return applyRanges(base, [
    { start: 0, end: 7, style: { fontWeight: '700', fill: '#1d4ed8' } },
    { start: 28, end: 44, style: { fontStyle: 'italic', fill: '#7c3aed' } },
    { start: 65, end: 89, style: { lineHeight: 30, fontSize: 18, fill: '#0f766e' } },
    { start: 96, end: 112, style: { background: '#dcfce7', fill: '#166534' } }
  ]);
}

function valueMultilineRuns() {
  const str = 'Line one: regular\nLine two: bold + orange\nLine three: small mono + cyan bg';
  const base = createAttributedText(
    str,
    { fontFamily: 'ui-sans-serif', fontSize: 17, fill: '#1f2937', lineHeight: 27 }
  );

  return applyRanges(base, [
    { start: 20, end: 39, style: { fontWeight: '700', fill: '#c2410c' } },
    { start: 52, end: 74, style: { fontFamily: 'monospace', fontSize: 14, background: '#cffafe', fill: '#0f172a' } }
  ]);
}

function valueMixedScript() {
  const str = 'Unicode mix: precomposed e\u0301 vs decomposed e\u0301, flag \ud83c\uddeb\ud83c\uddf7, tone \ud83d\udc4d\ud83c\udffd, ZWJ \ud83d\udc69\u200d\ud83d\udcbb, family \ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66, VS16 \u2764\ufe0f, Indic \u0915\u094d\u0937, CJK \u6587\u5b57\u30ec\u30f3\u30c0\u30ea\u30f3\u30b0';
  const base = createAttributedText(
    str,
    { fontFamily: 'ui-sans-serif', fontSize: 15, fill: '#0f172a', lineHeight: 24 }
  );

  const iFlag = str.indexOf('\ud83c\uddeb\ud83c\uddf7');
  const iTone = str.indexOf('\ud83d\udc4d\ud83c\udffd');
  const iZwj = str.indexOf('\ud83d\udc69\u200d\ud83d\udcbb');
  const iFamily = str.indexOf('\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66');
  const iVs16 = str.indexOf('\u2764\ufe0f');
  const iIndic = str.indexOf('\u0915\u094d\u0937');
  const iCjk = str.indexOf('\u6587\u5b57\u30ec\u30f3\u30c0\u30ea\u30f3\u30b0');

  return applyRanges(base, [
    { start: 0, end: 11, style: { fontWeight: '700', fill: '#2563eb' } },
    { start: Math.max(0, iFlag - 5), end: iFlag + 8, style: { fill: '#7c3aed', fontStyle: 'italic' } },
    { start: Math.max(0, iTone - 5), end: iTone + 8, style: { background: '#fef3c7', fill: '#92400e' } },
    { start: Math.max(0, iZwj - 4), end: iZwj + 10, style: { fill: '#be123c', fontWeight: '700' } },
    { start: Math.max(0, iFamily - 7), end: iFamily + 14, style: { fill: '#0f766e' } },
    { start: Math.max(0, iVs16 - 4), end: iVs16 + 6, style: { background: '#fee2e2', fill: '#b91c1c' } },
    { start: Math.max(0, iIndic - 6), end: iIndic + 7, style: { fill: '#1d4ed8', fontWeight: '700' } },
    { start: Math.max(0, iCjk - 4), end: str.length, style: { fill: '#065f46' } }
  ]);
}

function valueAlignment(tag) {
  const str = `${tag}: center and right aligned runs`; 
  const base = createAttributedText(
    str,
    { fontFamily: 'ui-sans-serif', fontSize: 15, fill: '#334155', lineHeight: 22 }
  );
  return applyRanges(base, [
    { start: 0, end: tag.length, style: { fontWeight: '700', fill: '#1d4ed8' } },
    { start: 20, end: str.length, style: { fontStyle: 'italic', fill: '#7c3aed' } }
  ]);
}

function valueClipped() {
  const str = 'This texta block should visibly clip. Long token: SUPERCALIFRAGILISTICEXPIALIDOCIOUS_TOKEN_1234567890 and then more wrapped rows to force vertical overflow beyond the frame.';
  const base = createAttributedText(
    str,
    { fontFamily: 'Georgia', fontSize: 15, fill: '#334155', lineHeight: 22 }
  );

  const stPrefix = 'This texta block';
  const stLabel = 'Long token:';
  const stTail = 'vertical overflow beyond the frame';
  const iPrefix = str.indexOf(stPrefix);
  const iLabel = str.indexOf(stLabel);
  const iTail = str.indexOf(stTail);

  return applyRanges(base, [
    { start: iPrefix, end: iPrefix + stPrefix.length, style: { fontWeight: '700', fill: '#1d4ed8' } },
    { start: iLabel, end: iLabel + stLabel.length, style: { background: '#ede9fe', fill: '#6d28d9' } },
    { start: iTail, end: iTail + stTail.length, style: { fontStyle: 'italic', fill: '#0f766e' } }
  ]);
}

function textaCard({ title, id, x, y, dx, dy, align, baseline, value, fill = '#ffffff', clipText = false }) {
  const dxContent = dx - 24;
  const dyContent = dy - 46;
  let xTexta = 12;
  if (align === 'center') {
    xTexta = 12 + dxContent / 2;
  } else if (align === 'right' || align === 'end') {
    xTexta = 12 + dxContent;
  }

  const textaContent = clipText
    ? group({ x: 12, y: 34, clip: true, dx: dxContent, dy: dyContent }, [
      textaBlock({
        id,
        x: xTexta - 12,
        y: 0,
        dx: dxContent,
        dy: dyContent,
        baseline: baseline ?? 'top',
        align: align ?? 'left',
        texta: value
      })
    ])
    : textaBlock({
      id,
      x: xTexta,
      y: 34,
      dx: dxContent,
      dy: dyContent,
      baseline: baseline ?? 'top',
      align: align ?? 'left',
      texta: value
    });

  return group({ x, y }, [
    rectangle({ dx, dy, fill, stroke: '#dbe3ef', strokeWidth: 1, cornerRadius: 10 }),
    text({ x: 12, y: 12, text: title, fontSize: 12, fill: '#64748b', baseline: 'top', font: '600 12px ui-sans-serif' }),
    textaContent
  ]);
}

export function buildDebugTextaScene() {
  return group({}, [
    rectangle({ dx: 1000, dy: 920, fill: '#ffffff' }),

    textaCard({
      title: 'ta1: headline with mixed run styles',
      id: 'ta1',
      x: 26,
      y: 20,
      dx: 470,
      dy: 110,
      value: valueHeadline()
    }),

    textaCard({
      title: 'ta2: wrapped paragraph with dynamic line-height runs',
      id: 'ta2',
      x: 26,
      y: 142,
      dx: 470,
      dy: 210,
      value: valueParagraph()
    }),

    textaCard({
      title: 'ta3: explicit multiline with per-line run styles',
      id: 'ta3',
      x: 26,
      y: 364,
      dx: 470,
      dy: 176,
      value: valueMultilineRuns()
    }),

    textaCard({
      title: 'ta4: unicode and emoji runs',
      id: 'ta4',
      x: 26,
      y: 552,
      dx: 470,
      dy: 176,
      value: valueMixedScript()
    }),

    textaCard({
      title: 'ta5: clipped rows (dy constrained)',
      id: 'ta5',
      x: 26,
      y: 740,
      dx: 470,
      dy: 124,
      value: valueClipped(),
      fill: '#fffdfa',
      clipText: true
    }),

    textaCard({
      title: 'ta6: centered layout',
      id: 'ta6',
      x: 508,
      y: 20,
      dx: 466,
      dy: 120,
      align: 'center',
      value: valueAlignment('Center')
    }),

    textaCard({
      title: 'ta7: right aligned layout',
      id: 'ta7',
      x: 508,
      y: 152,
      dx: 466,
      dy: 120,
      align: 'right',
      value: valueAlignment('Right')
    }),

    textaCard({
      title: 'ta8: top baseline + dense wrap',
      id: 'ta8',
      x: 508,
      y: 284,
      dx: 466,
      dy: 150,
      baseline: 'top',
      value: applyRanges(
        createAttributedText(
          'Dense wrapping at narrow width with bold and italic markers for caret edge tests.',
          { fontFamily: 'ui-sans-serif', fontSize: 14, fill: '#334155', lineHeight: 18 }
        ),
        [
          { start: 0, end: 5, style: { fontWeight: '700', fill: '#1d4ed8' } },
          { start: 33, end: 49, style: { fontStyle: 'italic', fill: '#7c3aed' } },
          { start: 59, end: 73, style: { background: '#dcfce7', fill: '#166534' } }
        ]
      )
    }),

    textaCard({
      title: 'ta9: run opacity and background mix',
      id: 'ta9',
      x: 508,
      y: 446,
      dx: 466,
      dy: 170,
      value: applyRanges(
        createAttributedText(
          'Opacity fades, highlighted chips, and medium-large glyphs in one wrapped block.',
          { fontFamily: 'ui-sans-serif', fontSize: 16, fill: '#0f172a', lineHeight: 24 }
        ),
        [
          { start: 0, end: 13, style: { opacity: 0.45, fill: '#1d4ed8' } },
          { start: 15, end: 32, style: { background: '#fef3c7', fill: '#92400e', fontWeight: '700' } },
          { start: 38, end: 56, style: { fontSize: 19, fill: '#7c3aed' } }
        ]
      )
    }),

    textaCard({
      title: 'ta10: tiny run + giant run extremes',
      id: 'ta10',
      x: 508,
      y: 628,
      dx: 466,
      dy: 264,
      value: applyRanges(
        createAttributedText(
          'size extremes tiny then huge then normal for insertion geometry checks',
          { fontFamily: 'ui-sans-serif', fontSize: 15, fill: '#334155', lineHeight: 23 }
        ),
        [
          { start: 0, end: 12, style: { fontSize: 11, fill: '#475569' } },
          { start: 18, end: 27, style: { fontSize: 32, fontWeight: '700', fill: '#be123c', lineHeight: 38 } },
          { start: 33, end: 42, style: { fontFamily: 'monospace', background: '#e0f2fe', fill: '#0c4a6e' } }
        ]
      ),
      fill: '#f8fafc'
    })
  ]);
}
