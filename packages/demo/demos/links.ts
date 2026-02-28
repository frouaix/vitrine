// Copyright (c) 2026 François Rouaix

// Links Demo — showcases the link() block with text, images, and shapes
import { group, rectangle, text, circle, ellipse, link, image } from 'vitrine';

// Create a small placeholder image for the demo
function createPlaceholderImage(label: string, colBg: string, colText: string): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colBg;
  ctx.roundRect(0, 0, 120, 80, 8);
  ctx.fill();
  ctx.fillStyle = colText;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 60, 40);
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

const githubImg = createPlaceholderImage('GitHub', '#24292e', '#fff');
const docsImg = createPlaceholderImage('Docs', '#1971c2', '#fff');

export const demo = {
  id: 'links',
  name: 'Links',
  description: 'Clickable links with text, images, and shapes — opens URLs in new tabs',

  init: () => {
    return { time: 0 };
  },

  update: (state: { time: number }, dt: number) => {
    state.time += dt;
  },

  render: (state: { time: number }) => {
    const col = { bg: '#f8f9fa', heading: '#333', label: '#666', box: '#e9ecef', border: '#dee2e6' };

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: col.bg }),

      // ── Section 1: Text links ──
      text({ x: 20, y: 25, text: 'Text Links', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      text({ x: 20, y: 55, text: 'Simple text links (click to open in new tab):', fontSize: 12, fill: col.label, baseline: 'top' as const }),

      link({ href: 'https://github.com', x: 20, y: 80 }, [
        text({ text: 'github.com', fontSize: 14, fill: '#228be6', baseline: 'top' as const })
      ]),

      link({ href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API', x: 20, y: 105 }, [
        text({ text: 'MDN Canvas API Reference', fontSize: 14, fill: '#228be6', baseline: 'top' as const })
      ]),

      link({ href: 'https://www.typescriptlang.org/', x: 20, y: 130 }, [
        text({ text: 'TypeScript Documentation', fontSize: 14, fill: '#228be6', baseline: 'top' as const })
      ]),

      // Styled text link
      text({ x: 350, y: 55, text: 'Styled text link:', fontSize: 12, fill: col.label, baseline: 'top' as const }),

      link({ href: 'https://github.com/frouaix/vitrine', x: 350, y: 80 }, [
        rectangle({ dx: 220, dy: 30, fill: '#e7f5ff', stroke: '#228be6', strokeWidth: 1, cornerRadius: 4 }),
        text({ x: 110, y: 15, text: '⭐ Star Vitrine on GitHub', fontSize: 13, fill: '#1971c2', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // ── Section 2: Image links ──
      text({ x: 20, y: 175, text: 'Image Links', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      text({ x: 20, y: 205, text: 'Images wrapped in link() become clickable:', fontSize: 12, fill: col.label, baseline: 'top' as const }),

      link({ href: 'https://github.com', x: 20, y: 230 }, [
        image({ src: githubImg, dx: 120, dy: 80 }),
        text({ x: 60, y: 90, text: 'Click to visit', fontSize: 10, fill: col.label, align: 'center' as const, baseline: 'top' as const })
      ]),

      link({ href: 'https://developer.mozilla.org', x: 170, y: 230 }, [
        image({ src: docsImg, dx: 120, dy: 80 }),
        text({ x: 60, y: 90, text: 'Click to visit', fontSize: 10, fill: col.label, align: 'center' as const, baseline: 'top' as const })
      ]),

      // ── Section 3: Shape links ──
      text({ x: 20, y: 345, text: 'Shape Links', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      text({ x: 20, y: 375, text: 'Any block can be a link — shapes, groups, composites:', fontSize: 12, fill: col.label, baseline: 'top' as const }),

      // Circle link
      link({ href: 'https://github.com/frouaix/vitrine/issues', x: 60, y: 440 }, [
        circle({ radius: 35, fill: '#ff6b6b' }),
        text({ y: -5, text: '🐛', fontSize: 20, align: 'center' as const, baseline: 'middle' as const }),
        text({ y: 15, text: 'Issues', fontSize: 11, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Rounded rectangle link
      link({ href: 'https://github.com/frouaix/vitrine/pulls', x: 150, y: 405 }, [
        rectangle({ dx: 100, dy: 70, fill: '#51cf66', cornerRadius: 12 }),
        text({ x: 50, y: 25, text: '🔀', fontSize: 20, align: 'center' as const, baseline: 'middle' as const }),
        text({ x: 50, y: 50, text: 'Pull Requests', fontSize: 11, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Ellipse link
      link({ href: 'https://github.com/frouaix/vitrine/wiki', x: 330, y: 440 }, [
        ellipse({ radiusX: 55, radiusY: 35, fill: '#845ef7' }),
        text({ y: -5, text: '📖', fontSize: 20, align: 'center' as const, baseline: 'middle' as const }),
        text({ y: 15, text: 'Wiki', fontSize: 11, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // ── Section 4: Links with transforms ──
      text({ x: 20, y: 500, text: 'Transformed Links', fontSize: 16, fill: col.heading, baseline: 'top' as const }),

      text({ x: 20, y: 530, text: 'Links respect transforms (position, rotation, scale, opacity):', fontSize: 12, fill: col.label, baseline: 'top' as const }),

      // Rotated link
      link({ href: 'https://github.com', x: 80, y: 570, rotation: -0.1 }, [
        rectangle({ x: -50, y: -15, dx: 100, dy: 30, fill: '#228be6', cornerRadius: 6 }),
        text({ text: 'Rotated', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Scaled link
      link({ href: 'https://github.com', x: 230, y: 570, scaleX: 1.2, scaleY: 1.2 }, [
        rectangle({ x: -50, y: -15, dx: 100, dy: 30, fill: '#f76707', cornerRadius: 6 }),
        text({ text: 'Scaled', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Animated opacity link
      link({ href: 'https://github.com', x: 400, y: 570, opacity: 0.5 + 0.5 * Math.sin(state.time * 2) }, [
        rectangle({ x: -50, y: -15, dx: 100, dy: 30, fill: '#e64980', cornerRadius: 6 }),
        text({ text: 'Pulsing', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
      ]),

      // Card-style link
      link({ href: 'https://github.com/frouaix/vitrine', x: 450, y: 175 }, [
        rectangle({ dx: 300, dy: 150, fill: '#fff', stroke: '#dee2e6', strokeWidth: 1, cornerRadius: 8 }),
        rectangle({ dx: 300, dy: 50, fill: '#228be6', cornerRadius: 0 }),
        text({ x: 150, y: 25, text: 'Vitrine', fontSize: 18, fill: '#fff', align: 'center' as const, baseline: 'middle' as const }),
        text({ x: 15, y: 65, text: 'Immediate-mode graphics library for', fontSize: 12, fill: '#333', baseline: 'top' as const }),
        text({ x: 15, y: 85, text: 'TypeScript. Declarative block-based', fontSize: 12, fill: '#333', baseline: 'top' as const }),
        text({ x: 15, y: 105, text: 'DSL for canvas rendering.', fontSize: 12, fill: '#333', baseline: 'top' as const }),
        text({ x: 15, y: 130, text: 'Click to visit →', fontSize: 12, fill: '#228be6', baseline: 'top' as const })
      ]),

      // Link grid
      ...(() => {
        const urls = [
          { href: 'https://github.com', label: 'GitHub', col: '#24292e' },
          { href: 'https://stackoverflow.com', label: 'Stack Overflow', col: '#f48024' },
          { href: 'https://developer.mozilla.org', label: 'MDN', col: '#1971c2' },
          { href: 'https://www.typescriptlang.org', label: 'TypeScript', col: '#3178c6' },
        ];
        return urls.map((item, i) =>
          link({ href: item.href, x: 450 + (i % 2) * 155, y: 350 + Math.floor(i / 2) * 60 }, [
            rectangle({ dx: 140, dy: 45, fill: item.col, cornerRadius: 6 }),
            text({ x: 70, y: 22, text: item.label, fontSize: 13, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
          ])
        );
      })()
    ]);
  }
};
