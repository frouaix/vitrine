// Copyright (c) 2026 François Rouaix

// Gradients & Patterns Demo — showcases Phase 2 Canvas features
import {
  group, rectangle, text, circle, ellipse, arc, path,
  linearGradient, radialGradient, conicGradient, stop
} from 'vitrine';

export const demo = {
  id: 'gradients',
  name: 'Gradients & Patterns',
  description: 'Linear, radial, and conic gradients with pattern fills',

  init: () => {
    return { time: 0 };
  },

  update: (state: { time: number }, dt: number) => {
    state.time += dt;
  },

  render: (state: { time: number }) => {
    const t = state.time;

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#f8f9fa' }),

      // --- Section 1: Linear gradients ---
      text({ x: 60, y: 25, text: 'Linear Gradients', fontSize: 16, fill: '#333', baseline: 'top' as const }),

      // Horizontal
      rectangle({
        x: 20, y: 55, dx: 160, dy: 80,
        fill: linearGradient(0, 0, 160, 0, [
          stop(0, '#4dabf7'),
          stop(1, '#ff6b6b')
        ]),
        cornerRadius: 8
      }),
      text({ x: 100, y: 150, text: 'horizontal', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Vertical
      rectangle({
        x: 200, y: 55, dx: 160, dy: 80,
        fill: linearGradient(0, 0, 0, 80, [
          stop(0, '#51cf66'),
          stop(1, '#845ef7')
        ]),
        cornerRadius: 8
      }),
      text({ x: 280, y: 150, text: 'vertical', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Diagonal with multiple stops
      rectangle({
        x: 380, y: 55, dx: 160, dy: 80,
        fill: linearGradient(0, 0, 160, 80, [
          stop(0, '#ff6b6b'),
          stop(0.33, '#ffd43b'),
          stop(0.66, '#51cf66'),
          stop(1, '#4dabf7')
        ]),
        cornerRadius: 8
      }),
      text({ x: 460, y: 150, text: 'rainbow diagonal', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Gradient stroke
      rectangle({
        x: 560, y: 55, dx: 160, dy: 80,
        stroke: linearGradient(0, 0, 160, 0, [
          stop(0, '#4dabf7'),
          stop(1, '#ff6b6b')
        ]),
        strokeWidth: 4,
        cornerRadius: 8
      }),
      text({ x: 640, y: 150, text: 'gradient stroke', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // --- Section 2: Radial gradients ---
      text({ x: 60, y: 175, text: 'Radial Gradients', fontSize: 16, fill: '#333', baseline: 'top' as const }),

      // Basic radial
      circle({
        x: 100, y: 260, radius: 50,
        fill: radialGradient(0, -10, 5, 0, 0, 50, [
          stop(0, '#ffffff'),
          stop(0.7, '#4dabf7'),
          stop(1, '#1864ab')
        ])
      }),
      text({ x: 100, y: 325, text: 'sphere', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Glow effect
      circle({
        x: 260, y: 260, radius: 50,
        fill: radialGradient(0, 0, 0, 0, 0, 50, [
          stop(0, '#ffd43b'),
          stop(0.5, '#ff922b'),
          stop(1, 'rgba(255,107,107,0)')
        ])
      }),
      text({ x: 260, y: 325, text: 'glow', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Bullseye
      circle({
        x: 420, y: 260, radius: 50,
        fill: radialGradient(0, 0, 0, 0, 0, 50, [
          stop(0, '#ff6b6b'),
          stop(0.2, '#ff6b6b'),
          stop(0.2, '#fff'),
          stop(0.4, '#fff'),
          stop(0.4, '#ff6b6b'),
          stop(0.6, '#ff6b6b'),
          stop(0.6, '#fff'),
          stop(0.8, '#fff'),
          stop(0.8, '#ff6b6b'),
          stop(1, '#ff6b6b')
        ])
      }),
      text({ x: 420, y: 325, text: 'bullseye', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Radial on ellipse
      ellipse({
        x: 580, y: 260, radiusX: 70, radiusY: 40,
        fill: radialGradient(0, 0, 0, 0, 0, 70, [
          stop(0, '#e5dbff'),
          stop(1, '#845ef7')
        ])
      }),
      text({ x: 580, y: 325, text: 'ellipse', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // --- Section 3: Conic gradients ---
      text({ x: 60, y: 350, text: 'Conic Gradients', fontSize: 16, fill: '#333', baseline: 'top' as const }),

      // Color wheel
      circle({
        x: 100, y: 435, radius: 50,
        fill: conicGradient(0, 0, 0, [
          stop(0, '#ff6b6b'),
          stop(0.17, '#ffd43b'),
          stop(0.33, '#51cf66'),
          stop(0.5, '#4dabf7'),
          stop(0.67, '#845ef7'),
          stop(0.83, '#ff6b6b'),
          stop(1, '#ff6b6b')
        ])
      }),
      text({ x: 100, y: 500, text: 'color wheel', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Sweep gauge
      arc({
        x: 260, y: 435, radius: 50,
        startAngle: -Math.PI * 0.75,
        endAngle: Math.PI * 0.75,
        fill: conicGradient(-Math.PI * 0.75, 0, 0, [
          stop(0, '#51cf66'),
          stop(0.5, '#ffd43b'),
          stop(1, '#ff6b6b')
        ]),
        stroke: '#333',
        strokeWidth: 1
      }),
      text({ x: 260, y: 500, text: 'sweep gauge', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Animated conic
      circle({
        x: 420, y: 435, radius: 50,
        fill: conicGradient(t * 2, 0, 0, [
          stop(0, '#4dabf7'),
          stop(0.5, '#ff6b6b'),
          stop(1, '#4dabf7')
        ])
      }),
      text({ x: 420, y: 500, text: 'animated', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Pie chart with conic gradient
      circle({
        x: 580, y: 435, radius: 50,
        fill: conicGradient(0, 0, 0, [
          stop(0, '#4dabf7'),
          stop(0.35, '#4dabf7'),
          stop(0.35, '#51cf66'),
          stop(0.6, '#51cf66'),
          stop(0.6, '#ffd43b'),
          stop(0.85, '#ffd43b'),
          stop(0.85, '#ff6b6b'),
          stop(1, '#ff6b6b')
        ]),
        stroke: '#fff',
        strokeWidth: 2
      }),
      text({ x: 580, y: 500, text: 'pie chart', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // --- Section 4: Gradient combinations ---
      text({ x: 60, y: 525, text: 'Combinations', fontSize: 16, fill: '#333', baseline: 'top' as const }),

      // Gradient-filled path
      path({
        pathData: starPath(120, 570, 30, 12),
        fill: linearGradient(90, 540, 150, 600, [
          stop(0, '#ffd43b'),
          stop(1, '#ff922b')
        ]),
        stroke: '#e67700',
        strokeWidth: 1
      }),
      text({ x: 120, y: 605, text: 'star', fontSize: 11, fill: '#666', align: 'center' as const, baseline: 'top' as const }),

      // Button-like gradient
      rectangle({
        x: 190, y: 548, dx: 120, dy: 40,
        fill: linearGradient(0, 0, 0, 40, [
          stop(0, '#51cf66'),
          stop(1, '#2f9e44')
        ]),
        cornerRadius: 20
      }),
      text({ x: 250, y: 568, text: 'Button', fontSize: 14, fill: '#fff', align: 'center' as const, baseline: 'middle' as const }),

      // Progress bar with gradient
      group({ x: 340, y: 548 }, [
        rectangle({ dx: 200, dy: 24, fill: '#e9ecef', cornerRadius: 12 }),
        rectangle({
          dx: 140, dy: 24,
          fill: linearGradient(0, 0, 140, 0, [
            stop(0, '#4dabf7'),
            stop(1, '#845ef7')
          ]),
          cornerRadius: 12
        }),
        text({ x: 70, y: 12, text: '70%', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Metallic effect
      rectangle({
        x: 570, y: 548, dx: 100, dy: 40,
        fill: linearGradient(0, 0, 0, 40, [
          stop(0, '#e0e0e0'),
          stop(0.3, '#ffffff'),
          stop(0.5, '#c0c0c0'),
          stop(0.7, '#ffffff'),
          stop(1, '#a0a0a0')
        ]),
        stroke: '#888',
        strokeWidth: 1,
        cornerRadius: 4
      }),
      text({ x: 620, y: 568, text: 'Metallic', fontSize: 12, fill: '#444', align: 'center' as const, baseline: 'middle' as const })
    ]);
  }
};

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
