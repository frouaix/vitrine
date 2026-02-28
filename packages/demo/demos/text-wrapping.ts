// Copyright (c) 2026 François Rouaix

// Text Wrapping Demo — showcases word-wrap, alignment, clipping, and line height
import { group, rectangle, text } from 'vitrine';

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
const SHORT = 'Hello, this is a short sentence that should wrap to multiple lines.';

export const demo = {
  id: 'text-wrapping',
  name: 'Text Wrapping',
  description: 'Word wrapping with dx, vertical clipping with dy, alignment, and line height',

  init: () => {
    return { time: 0 };
  },

  update: (state: { time: number }, dt: number) => {
    state.time += dt;
  },

  render: (state: { time: number }) => {
    const col = { bg: '#f8f9fa', heading: '#333', label: '#666', box: '#e9ecef', border: '#dee2e6' };

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 700, fill: col.bg }),

      // ── Section 1: Basic word wrap ──
      text({ x: 20, y: 25, text: 'Basic Word Wrap (dx)', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      // No dx — single line (reference)
      text({ x: 20, y: 55, text: 'No dx (single line):', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      text({ x: 20, y: 72, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const }),

      // dx: 200
      text({ x: 20, y: 95, text: 'dx: 200', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 20, y: 112, dx: 200, dy: 80, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 20, y: 112, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 200 }),

      // dx: 350
      text({ x: 250, y: 95, text: 'dx: 350', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 250, y: 112, dx: 350, dy: 80, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 250, y: 112, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 350 }),

      // dx: 120 — narrow
      text({ x: 630, y: 95, text: 'dx: 120 (narrow)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 630, y: 112, dx: 120, dy: 120, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 630, y: 112, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 120 }),

      // ── Section 2: Alignment ──
      text({ x: 20, y: 245, text: 'Alignment', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      // Left align (default)
      text({ x: 20, y: 275, text: 'align: left', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 20, y: 292, dx: 200, dy: 75, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 20, y: 292, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 200, align: 'left' as const }),

      // Center align
      text({ x: 250, y: 275, text: 'align: center', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 250, y: 292, dx: 200, dy: 75, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 350, y: 292, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 200, align: 'center' as const }),

      // Right align
      text({ x: 480, y: 275, text: 'align: right', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 480, y: 292, dx: 200, dy: 75, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 680, y: 292, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 200, align: 'right' as const }),

      // ── Section 3: Vertical clipping (dy) ──
      text({ x: 20, y: 380, text: 'Vertical Clipping (dy)', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      // No dy — all lines visible
      text({ x: 20, y: 410, text: 'No dy (all lines)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 20, y: 427, dx: 200, dy: 120, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 20, y: 427, text: LOREM, fontSize: 12, fill: '#222', baseline: 'top' as const, dx: 200 }),

      // dy: 55 — clipped
      text({ x: 250, y: 410, text: 'dy: 55 (clipped)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 250, y: 427, dx: 200, dy: 55, fill: col.box, stroke: '#e03131', strokeWidth: 1 }),
      text({ x: 250, y: 427, text: LOREM, fontSize: 12, fill: '#222', baseline: 'top' as const, dx: 200, dy: 55 }),

      // dy: 90 — more room
      text({ x: 480, y: 410, text: 'dy: 90 (more room)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 480, y: 427, dx: 200, dy: 90, fill: col.box, stroke: '#2f9e44', strokeWidth: 1 }),
      text({ x: 480, y: 427, text: LOREM, fontSize: 12, fill: '#222', baseline: 'top' as const, dx: 200, dy: 90 }),

      // ── Section 4: Line height ──
      text({ x: 20, y: 565, text: 'Line Height', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      // Tight (1.0x)
      text({ x: 20, y: 595, text: 'lineHeight: 13 (tight)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 20, y: 612, dx: 180, dy: 65, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 20, y: 612, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 180, lineHeight: 13 }),

      // Default (1.4x)
      text({ x: 220, y: 595, text: 'lineHeight: default (1.4×)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 220, y: 612, dx: 180, dy: 85, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 220, y: 612, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 180 }),

      // Spacious (2.0x)
      text({ x: 420, y: 595, text: 'lineHeight: 26 (spacious)', fontSize: 11, fill: col.label, baseline: 'top' as const }),
      rectangle({ x: 420, y: 612, dx: 180, dy: 115, fill: col.box, stroke: col.border, strokeWidth: 1 }),
      text({ x: 420, y: 612, text: SHORT, fontSize: 13, fill: '#222', baseline: 'top' as const, dx: 180, lineHeight: 26 }),

      // ── Section 5: Styled wrapped text ──
      text({ x: 630, y: 565, text: 'Styled', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      // Stroked text
      rectangle({ x: 630, y: 595, dx: 150, dy: 80, fill: '#1a1b2e', stroke: col.border, strokeWidth: 1 }),
      text({
        x: 630, y: 595, text: 'Stroked wrapped text with glow effect',
        fontSize: 14, fill: '#ffd43b', stroke: '#ff6b6b', strokeWidth: 0.5,
        baseline: 'top' as const, dx: 150
      }),

      // Animated width
      ...(() => {
        const animDx = 100 + Math.sin(state.time * 1.5) * 60;
        return [
          text({ x: 630, y: 410, text: `Animated dx: ${Math.round(animDx)}`, fontSize: 11, fill: col.label, baseline: 'top' as const }),
          rectangle({ x: 630, y: 427, dx: animDx, dy: 120, fill: col.box, stroke: '#7950f2', strokeWidth: 1 }),
          text({ x: 630, y: 427, text: SHORT, fontSize: 12, fill: '#5f3dc4', baseline: 'top' as const, dx: animDx })
        ];
      })()
    ]);
  }
};
