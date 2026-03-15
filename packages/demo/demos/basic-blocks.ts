// Copyright (c) 2026 François Rouaix

import {
  arc,
  circle,
  ellipse,
  group,
  image,
  line,
  path,
  rectangle,
  text
} from 'vitrine';

interface BasicBlocksState {
  time: number;
  svgImage: HTMLImageElement;
}

function buildSvgDataUrl(): string {
  const stSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="140" viewBox="0 0 220 140">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dbeafe"/>
          <stop offset="100%" stop-color="#bfdbfe"/>
        </linearGradient>
      </defs>
      <rect width="220" height="140" rx="18" fill="url(#bg)"/>
      <circle cx="54" cy="48" r="26" fill="#2563eb" opacity="0.9"/>
      <rect x="88" y="28" width="98" height="18" rx="9" fill="#1d4ed8" opacity="0.9"/>
      <rect x="88" y="56" width="78" height="12" rx="6" fill="#60a5fa"/>
      <path d="M30 106 C62 74, 90 126, 118 94 S168 82, 190 102" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
      <text x="30" y="126" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">SVG via image()</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stSvg)}`;
}

function createSvgImage(): HTMLImageElement {
  const img = new Image();
  img.src = buildSvgDataUrl();
  return img;
}

function starPath(dxCenter: number, dyCenter: number, duOuter: number, duInner: number): string {
  const parts: string[] = [];

  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? duOuter : duInner;
    const x = dxCenter + Math.cos(angle) * radius;
    const y = dyCenter + Math.sin(angle) * radius;
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

function renderSvgPanel(state: BasicBlocksState) {
  if (!state.svgImage.complete || state.svgImage.naturalWidth === 0) {
    return [
      rectangle({
        x: 560,
        y: 360,
        dx: 280,
        dy: 200,
        fill: '#ffffff',
        stroke: '#ced4da',
        strokeWidth: 2,
        cornerRadius: 16
      }),
      text({
        x: 700,
        y: 455,
        text: 'Loading SVG...',
        fontSize: 18,
        fill: '#6b7280',
        align: 'center' as const,
        baseline: 'middle' as const
      })
    ];
  }

  return [
    rectangle({
      x: 560,
      y: 360,
      dx: 280,
      dy: 200,
      fill: '#ffffff',
      stroke: '#ced4da',
      strokeWidth: 2,
      cornerRadius: 16,
      shadow: { color: 'rgba(15, 23, 42, 0.08)', blur: 12, offsetX: 0, offsetY: 6 }
    }),
    image({
      x: 590,
      y: 390,
      dx: 220,
      dy: 140,
      src: state.svgImage
    }),
    text({
      x: 700,
      y: 548,
      text: 'Preloaded SVG rendered through image()',
      fontSize: 12,
      fill: '#6b7280',
      align: 'center' as const,
      baseline: 'middle' as const
    })
  ];
}

export const demo = {
  id: 'basic-blocks',
  name: 'Basic Blocks + SVG',
  description: 'Core shapes, text, transforms, and an SVG rendered through image()',
  size: { width: 900, height: 620 },

  init: (): BasicBlocksState => {
    return {
      time: 0,
      svgImage: createSvgImage()
    };
  },

  update: (state: BasicBlocksState, dt: number): void => {
    state.time += dt;
  },

  render: (state: BasicBlocksState) => {
    const angle = Math.sin(state.time * 1.4) * 0.35;

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 900, dy: 620, fill: '#f8fafc' }),
      text({ x: 32, y: 24, text: 'Basic Blocks', fontSize: 22, fill: '#0f172a', baseline: 'top' as const }),
      text({ x: 32, y: 54, text: 'Rectangle, circle, ellipse, line, arc, path, text, group, and SVG image', fontSize: 13, fill: '#64748b', baseline: 'top' as const }),

      text({ x: 140, y: 110, text: 'Filled Shapes', fontSize: 16, fill: '#334155', align: 'center' as const, baseline: 'middle' as const }),
      rectangle({ x: 40, y: 140, dx: 180, dy: 110, fill: '#f97316', stroke: '#c2410c', strokeWidth: 3, cornerRadius: 18 }),
      text({ x: 130, y: 268, text: 'rectangle()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),
      circle({ x: 310, y: 194, radius: 56, fill: '#38bdf8', stroke: '#0369a1', strokeWidth: 3 }),
      text({ x: 310, y: 268, text: 'circle()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),
      ellipse({ x: 470, y: 194, radiusX: 76, radiusY: 48, fill: '#4ade80', stroke: '#15803d', strokeWidth: 3 }),
      text({ x: 470, y: 268, text: 'ellipse()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),

      text({ x: 180, y: 328, text: 'Strokes & Paths', fontSize: 16, fill: '#334155', align: 'center' as const, baseline: 'middle' as const }),
      line({ x1: 40, y1: 368, x2: 220, y2: 430, stroke: '#8b5cf6', strokeWidth: 6 }),
      text({ x: 130, y: 442, text: 'line()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),
      arc({ x: 330, y: 398, radius: 48, startAngle: -Math.PI * 0.8, endAngle: Math.PI * 0.25, fill: '#fde68a', stroke: '#d97706', strokeWidth: 3 }),
      text({ x: 330, y: 452, text: 'arc()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),
      path({ pathData: starPath(470, 398, 50, 22), fill: '#fda4af', stroke: '#be123c', strokeWidth: 3 }),
      text({ x: 470, y: 452, text: 'path()', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'top' as const }),

      text({ x: 700, y: 110, text: 'Text + Group Transform', fontSize: 16, fill: '#334155', align: 'center' as const, baseline: 'middle' as const }),
      text({ x: 700, y: 150, text: 'text()', fontSize: 28, fill: '#0f172a', align: 'center' as const, baseline: 'middle' as const }),
      group({ x: 700, y: 248, rotation: angle }, [
        rectangle({ x: -56, y: -56, dx: 112, dy: 112, fill: '#c4b5fd', stroke: '#7c3aed', strokeWidth: 2, cornerRadius: 16 }),
        circle({ x: 0, y: 0, radius: 22, fill: '#ffffff', stroke: '#7c3aed', strokeWidth: 2 }),
        text({ x: 0, y: 0, text: 'group()', fontSize: 12, fill: '#5b21b6', align: 'center' as const, baseline: 'middle' as const })
      ]),
      text({ x: 700, y: 322, text: 'Animated transform on a grouped subtree', fontSize: 12, fill: '#64748b', align: 'center' as const, baseline: 'middle' as const }),

      text({ x: 700, y: 360, text: 'SVG Image', fontSize: 16, fill: '#334155', align: 'center' as const, baseline: 'middle' as const }),
      ...renderSvgPanel(state)
    ]);
  }
};