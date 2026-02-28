// Copyright (c) 2026 François Rouaix

// Image Cropping & CSS Filters Demo — showcases Phase 3 Canvas features
import {
  group, rectangle, text, circle, ellipse, image,
  linearGradient, stop
} from 'vitrine';
import type { Block } from 'vitrine';

/** Create a programmatic sprite sheet image (4×2 grid of colored tiles). */
function createSpriteSheet(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#845ef7', '#ff922b', '#20c997', '#f06595'];
  const labels = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '⚡', '💖'];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const i = row * 4 + col;
      ctx.fillStyle = colors[i];
      ctx.fillRect(col * 50, row * 50, 50, 50);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], col * 50 + 25, row * 50 + 25);
    }
  }
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

/** Create a sample photo-like image for filter demos. */
function createSampleImage(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, 40);
  sky.addColorStop(0, '#74c0fc');
  sky.addColorStop(1, '#d0ebff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 120, 45);
  // Ground
  const ground = ctx.createLinearGradient(0, 40, 0, 80);
  ground.addColorStop(0, '#8ce99a');
  ground.addColorStop(1, '#2b8a3e');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 40, 120, 40);
  // Sun
  ctx.fillStyle = '#ffd43b';
  ctx.beginPath();
  ctx.arc(90, 20, 12, 0, Math.PI * 2);
  ctx.fill();
  // Tree
  ctx.fillStyle = '#5c4032';
  ctx.fillRect(35, 30, 6, 20);
  ctx.fillStyle = '#2d8a4e';
  ctx.beginPath();
  ctx.arc(38, 28, 14, 0, Math.PI * 2);
  ctx.fill();
  // House
  ctx.fillStyle = '#e8590c';
  ctx.fillRect(65, 38, 24, 18);
  ctx.fillStyle = '#495057';
  ctx.beginPath();
  ctx.moveTo(62, 40);
  ctx.lineTo(77, 28);
  ctx.lineTo(92, 40);
  ctx.closePath();
  ctx.fill();
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

export const demo = {
  id: 'image-filters',
  name: 'Image Cropping & Filters',
  description: 'Source cropping, blur, brightness, contrast, and more',

  init: () => {
    return {
      time: 0,
      spriteSheet: createSpriteSheet(),
      sampleImg: createSampleImage()
    };
  },

  update: (state: { time: number }, dt: number) => {
    state.time += dt;
  },

  render: (state: { time: number; spriteSheet: HTMLImageElement; sampleImg: HTMLImageElement }) => {
    const { spriteSheet, sampleImg, time } = state;

    const blocks: Block[] = [
      rectangle({ dx: 800, dy: 600, fill: '#f8f9fa' }),

      // --- Section 1: Image source cropping ---
      text({ x: 60, y: 25, text: 'Image Source Cropping', fontSize: 16, fill: '#333', baseline: 'top' as const }),

      // Full sprite sheet
      text({ x: 20, y: 55, text: 'Full sprite sheet (200×100):', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      image({ x: 20, y: 75, dx: 200, dy: 100, src: spriteSheet }),
      rectangle({ x: 20, y: 75, dx: 200, dy: 100, stroke: '#ccc', strokeWidth: 1 }),

      // Individual cropped sprites
      text({ x: 260, y: 55, text: 'Cropped sprites (50×50 each):', fontSize: 12, fill: '#666', baseline: 'top' as const }),
    ];

    // Render each sprite from the sheet
    const labels = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Orange', 'Teal', 'Pink'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const i = row * 4 + col;
        const xPos = 260 + col * 65;
        const yPos = 75 + row * 75;
        blocks.push(
          image({
            x: xPos, y: yPos, dx: 50, dy: 50,
            src: spriteSheet,
            sx: col * 50, sy: row * 50, sw: 50, sh: 50
          }),
          rectangle({ x: xPos, y: yPos, dx: 50, dy: 50, stroke: '#aaa', strokeWidth: 1 }),
          text({ x: xPos + 25, y: yPos + 55, text: labels[i], fontSize: 10, fill: '#666', align: 'center' as const, baseline: 'top' as const })
        );
      }
    }

    // Scaled-up crop
    blocks.push(
      text({ x: 580, y: 55, text: 'Scaled-up crop:', fontSize: 12, fill: '#666', baseline: 'top' as const }),
      image({
        x: 580, y: 75, dx: 120, dy: 120,
        src: spriteSheet,
        sx: 0, sy: 0, sw: 50, sh: 50
      }),
      rectangle({ x: 580, y: 75, dx: 120, dy: 120, stroke: '#aaa', strokeWidth: 1 }),

      // Animated crop region
      text({ x: 580, y: 205, text: 'Animated crop:', fontSize: 12, fill: '#666', baseline: 'top' as const }),
    );
    const cropCol = Math.floor(time * 2) % 4;
    const cropRow = Math.floor(time * 0.5) % 2;
    blocks.push(
      image({
        x: 600, y: 225, dx: 80, dy: 80,
        src: spriteSheet,
        sx: cropCol * 50, sy: cropRow * 50, sw: 50, sh: 50
      }),
      rectangle({ x: 600, y: 225, dx: 80, dy: 80, stroke: '#4dabf7', strokeWidth: 2 })
    );

    // --- Section 2: CSS Filters ---
    blocks.push(
      text({ x: 60, y: 245, text: 'CSS Filters', fontSize: 16, fill: '#333', baseline: 'top' as const })
    );

    const filterDemos: Array<{ label: string; filter: string }> = [
      { label: 'Original', filter: '' },
      { label: 'blur(2px)', filter: 'blur(2px)' },
      { label: 'brightness(1.5)', filter: 'brightness(1.5)' },
      { label: 'contrast(2)', filter: 'contrast(2)' },
      { label: 'grayscale(1)', filter: 'grayscale(1)' },
      { label: 'sepia(1)', filter: 'sepia(1)' },
      { label: 'saturate(3)', filter: 'saturate(3)' },
      { label: 'hue-rotate(90deg)', filter: 'hue-rotate(90deg)' },
      { label: 'invert(1)', filter: 'invert(1)' },
      { label: 'opacity(0.5)', filter: 'opacity(0.5)' },
    ];

    for (let i = 0; i < filterDemos.length; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const xPos = 20 + col * 150;
      const yPos = 275 + row * 120;
      const { label, filter } = filterDemos[i];

      blocks.push(
        group({ x: xPos, y: yPos }, [
          image({
            dx: 120, dy: 80,
            src: sampleImg,
            ...(filter ? { filter } : {})
          }),
          rectangle({ dx: 120, dy: 80, stroke: '#ccc', strokeWidth: 1 }),
          text({ x: 60, y: 86, text: label, fontSize: 10, fill: '#666', align: 'center' as const, baseline: 'top' as const })
        ])
      );
    }

    // --- Section 3: Filters on shapes ---
    blocks.push(
      text({ x: 60, y: 520, text: 'Filters on Shapes', fontSize: 16, fill: '#333', baseline: 'top' as const })
    );

    // Blurred rectangle
    blocks.push(
      rectangle({
        x: 30, y: 545, dx: 100, dy: 40,
        fill: '#4dabf7',
        cornerRadius: 8,
        filter: 'blur(2px)'
      }),
      text({ x: 80, y: 560, text: 'Blurred', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
    );

    // Drop shadow via filter
    blocks.push(
      circle({
        x: 210, y: 565, radius: 25,
        fill: '#ff6b6b',
        filter: 'drop-shadow(4px 4px 4px rgba(0,0,0,0.4))'
      }),
      text({ x: 210, y: 565, text: 'Shadow', fontSize: 10, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
    );

    // Brightness-boosted gradient
    blocks.push(
      rectangle({
        x: 270, y: 545, dx: 100, dy: 40,
        fill: linearGradient(0, 0, 100, 0, [
          stop(0, '#845ef7'),
          stop(1, '#4dabf7')
        ]),
        cornerRadius: 8,
        filter: 'brightness(1.3)'
      }),
      text({ x: 320, y: 560, text: 'Bright', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
    );

    // Grayscale shape
    blocks.push(
      ellipse({
        x: 440, y: 565, radiusX: 40, radiusY: 20,
        fill: '#51cf66',
        stroke: '#2f9e44',
        strokeWidth: 2,
        filter: 'grayscale(1)'
      }),
      text({ x: 440, y: 565, text: 'Grayscale', fontSize: 10, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
    );

    // Animated hue rotation
    const hue = Math.floor(time * 60) % 360;
    blocks.push(
      rectangle({
        x: 520, y: 545, dx: 100, dy: 40,
        fill: '#ff6b6b',
        cornerRadius: 8,
        filter: `hue-rotate(${hue}deg)`
      }),
      text({ x: 570, y: 560, text: 'Hue shift', fontSize: 12, fill: '#fff', align: 'center' as const, baseline: 'middle' as const })
    );

    // Combined filters
    blocks.push(
      circle({
        x: 690, y: 565, radius: 25,
        fill: '#ffd43b',
        filter: 'contrast(1.5) saturate(2)'
      }),
      text({ x: 690, y: 565, text: 'Combo', fontSize: 10, fill: '#333', align: 'center' as const, baseline: 'middle' as const })
    );

    return group({ x: 0, y: 0 }, blocks);
  }
};
