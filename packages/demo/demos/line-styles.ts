// Copyright (c) 2026 François Rouaix

// Line Styles & Blend Modes Demo — showcases Phase 1 Canvas features
import { group, rectangle, text, circle, line, arc, path, layer, ellipse } from 'vitrine';

export const demo = {
  id: 'line-styles',
  name: 'Line Styles & Blend Modes',
  description: 'Dashed lines, line caps/joins, fill rules, and blend modes',

  init: () => {
    return { time: 0 };
  },

  update: (state: { time: number }, dt: number) => {
    state.time += dt;
  },

  render: (state: { time: number }) => {
    const dashOffset = (state.time * 40) % 40;

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#f8f9fa' }),

      // Section 1: Line cap styles
      text({ x: 60, y: 30, text: 'Line Caps', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // butt (default)
      text({ x: 20, y: 60, text: 'butt', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 80, y1: 68, x2: 240, y2: 68, stroke: '#4dabf7', strokeWidth: 8, lineCap: 'butt' }),
      // round
      text({ x: 20, y: 85, text: 'round', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 80, y1: 93, x2: 240, y2: 93, stroke: '#51cf66', strokeWidth: 8, lineCap: 'round' }),
      // square
      text({ x: 20, y: 110, text: 'square', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 80, y1: 118, x2: 240, y2: 118, stroke: '#ff6b6b', strokeWidth: 8, lineCap: 'square' }),

      // Section 2: Line join styles (triangles)
      text({ x: 310, y: 30, text: 'Line Joins', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // miter
      text({ x: 300, y: 60, text: 'miter', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      path({ pathData: 'M 360 60 L 400 110 L 440 60', stroke: '#4dabf7', strokeWidth: 4, lineJoin: 'miter' }),
      // round
      text({ x: 450, y: 60, text: 'round', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      path({ pathData: 'M 510 60 L 550 110 L 590 60', stroke: '#51cf66', strokeWidth: 4, lineJoin: 'round' }),
      // bevel
      text({ x: 600, y: 60, text: 'bevel', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      path({ pathData: 'M 660 60 L 700 110 L 740 60', stroke: '#ff6b6b', strokeWidth: 4, lineJoin: 'bevel' }),

      // Section 3: Dashed lines
      text({ x: 60, y: 155, text: 'Dash Patterns', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // simple dash
      text({ x: 20, y: 185, text: '[10, 5]', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 100, y1: 193, x2: 380, y2: 193, stroke: '#4dabf7', strokeWidth: 3, lineDash: [10, 5] }),
      // dot-dash
      text({ x: 20, y: 210, text: '[15, 5, 3, 5]', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 100, y1: 218, x2: 380, y2: 218, stroke: '#51cf66', strokeWidth: 3, lineDash: [15, 5, 3, 5] }),
      // animated dash
      text({ x: 20, y: 235, text: 'animated', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      line({ x1: 100, y1: 243, x2: 380, y2: 243, stroke: '#ff6b6b', strokeWidth: 3, lineDash: [20, 10], lineDashOffset: dashOffset }),

      // Dashed shapes
      text({ x: 420, y: 155, text: 'Dashed Shapes', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      rectangle({ x: 420, y: 185, dx: 100, dy: 60, stroke: '#4dabf7', strokeWidth: 2, lineDash: [8, 4], cornerRadius: 8 }),
      circle({ x: 590, y: 215, radius: 30, stroke: '#51cf66', strokeWidth: 2, lineDash: [6, 4] }),
      ellipse({ x: 700, y: 215, radiusX: 45, radiusY: 25, stroke: '#ff6b6b', strokeWidth: 2, lineDash: [10, 5] }),

      // Section 4: Fill rule (evenodd vs nonzero)
      text({ x: 60, y: 280, text: 'Fill Rule', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // Star with nonzero (default) — fills the entire interior
      text({ x: 50, y: 305, text: 'nonzero', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      path({
        pathData: starPath(120, 370, 50, 20),
        fill: '#4dabf7',
        stroke: '#1971c2',
        strokeWidth: 1,
        fillRule: 'nonzero'
      }),
      // Star with evenodd — creates a hole in the center
      text({ x: 220, y: 305, text: 'evenodd', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      path({
        pathData: starPath(290, 370, 50, 20),
        fill: '#51cf66',
        stroke: '#2f9e44',
        strokeWidth: 1,
        fillRule: 'evenodd'
      }),

      // Section 5: Blend modes
      text({ x: 450, y: 280, text: 'Blend Modes', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // Base rectangles
      renderBlendDemo(450, 310, 'normal', '#ff6b6b', '#4dabf7'),
      renderBlendDemo(560, 310, 'multiply', '#ff6b6b', '#4dabf7'),
      renderBlendDemo(670, 310, 'screen', '#ff6b6b', '#4dabf7'),

      // Section 6: Combined — animated dashed arc
      text({ x: 60, y: 440, text: 'Combined Features', fontSize: 16, fill: '#333', baseline: 'top' as const }),
      // Animated dashed arcs
      arc({
        x: 150, y: 520,
        radius: 45,
        startAngle: 0,
        endAngle: Math.PI * 1.5,
        stroke: '#4dabf7',
        strokeWidth: 4,
        lineCap: 'round',
        lineDash: [8, 6],
        lineDashOffset: dashOffset
      }),
      arc({
        x: 150, y: 520,
        radius: 35,
        startAngle: Math.PI * 0.5,
        endAngle: Math.PI * 2,
        stroke: '#ff6b6b',
        strokeWidth: 4,
        lineCap: 'round',
        lineDash: [8, 6],
        lineDashOffset: -dashOffset
      }),

      // Dashed rounded rectangle with round line join
      rectangle({
        x: 250, y: 470,
        dx: 200, dy: 100,
        stroke: '#51cf66',
        strokeWidth: 3,
        cornerRadius: 15,
        lineDash: [12, 6],
        lineDashOffset: dashOffset,
        lineJoin: 'round'
      }),
      text({ x: 350, y: 520, text: 'Animated border', fontSize: 14, fill: '#333', align: 'center' as const, baseline: 'middle' as const }),

      // Dashed circle with animated offset
      circle({
        x: 560, y: 520,
        radius: 45,
        stroke: '#845ef7',
        strokeWidth: 3,
        lineDash: [6, 4],
        lineDashOffset: dashOffset,
        fill: '#e5dbff'
      }),
      text({ x: 560, y: 520, text: 'Loading…', fontSize: 12, fill: '#5f3dc4', align: 'center' as const, baseline: 'middle' as const })
    ]);
  }
};

/** Generate an SVG path for a 5-pointed star. */
function starPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ') + ' Z';
}

/** Render a blend mode comparison tile. */
function renderBlendDemo(x: number, y: number, mode: string, col1: string, col2: string) {
  return group({ x, y }, [
    text({ x: 30, y: -2, text: mode, fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'bottom' as const }),
    layer({ blendMode: mode as any }, [
      rectangle({ x: 0, y: 0, dx: 40, dy: 40, fill: col1 }),
      rectangle({ x: 20, y: 15, dx: 40, dy: 40, fill: col2 })
    ])
  ]);
}
