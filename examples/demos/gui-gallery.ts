// Copyright (c) 2026 François Rouaix

// GUI Gallery Demo - Carousel with images and content
import { rectangle, circle, line, text, group } from 'vitrine';
import type { Block } from 'vitrine';
import {
  vstack,
  hstack,
  label,
  button,
  panel,
  carousel,
  transformGUIControl,
  colorfulTheme
} from '../../src/GUI/index.ts';

interface GalleryImageItem {
  stTitle: string;
  stDescription: string;
  color: string;
}

interface GalleryDemoState {
  currentIndex: number;
  fAutoPlay: boolean;
  images: GalleryImageItem[];
  time: number;
  autoPlayInterval: number;
}

/** Generate a placeholder image as a group of Vitrine primitives. */
function makePlaceholder(dxp: number, dyp: number, img: GalleryImageItem, index: number): Block {
  const children: Block[] = [];

  // Background fill
  children.push(rectangle({ x: 0, y: 0, dx: dxp, dy: dyp, fill: img.color }));

  // Decorative pattern varies per slide
  switch (index % 5) {
    case 0: // Mountains
      children.push(
        line({ x1: 0, y1: dyp, x2: dxp * 0.35, y2: dyp * 0.25, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 3 }),
        line({ x1: dxp * 0.35, y1: dyp * 0.25, x2: dxp * 0.55, y2: dyp * 0.55, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 3 }),
        line({ x1: dxp * 0.55, y1: dyp * 0.55, x2: dxp * 0.75, y2: dyp * 0.15, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 3 }),
        line({ x1: dxp * 0.75, y1: dyp * 0.15, x2: dxp, y2: dyp, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 3 }),
        circle({ x: dxp * 0.8, y: dyp * 0.2, radius: 25, fill: 'rgba(255,255,200,0.6)' })
      );
      break;
    case 1: // Sunset circles
      children.push(
        circle({ x: dxp * 0.5, y: dyp * 0.65, radius: 80, fill: 'rgba(255,200,50,0.5)' }),
        circle({ x: dxp * 0.5, y: dyp * 0.65, radius: 55, fill: 'rgba(255,150,50,0.5)' }),
        circle({ x: dxp * 0.5, y: dyp * 0.65, radius: 30, fill: 'rgba(255,100,50,0.6)' }),
        line({ x1: 0, y1: dyp * 0.7, x2: dxp, y2: dyp * 0.7, stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 })
      );
      break;
    case 2: // Trees
      for (let i = 0; i < 5; i++) {
        const tx = dxp * (0.1 + i * 0.2);
        const th = dyp * (0.3 + Math.sin(i * 1.5) * 0.15);
        children.push(
          rectangle({ x: tx - 5, y: dyp - th * 0.3, dx: 10, dy: th * 0.3, fill: 'rgba(100,60,30,0.6)' }),
          circle({ x: tx, y: dyp - th * 0.3, radius: th * 0.25, fill: 'rgba(255,255,255,0.4)' })
        );
      }
      break;
    case 3: // Dunes / waves
      for (let i = 0; i < 4; i++) {
        const wy = dyp * (0.4 + i * 0.15);
        children.push(
          circle({ x: dxp * 0.3, y: wy, radius: dxp * 0.4, fill: `rgba(255,255,255,${0.08 + i * 0.04})` }),
          circle({ x: dxp * 0.7, y: wy + 20, radius: dxp * 0.35, fill: `rgba(255,255,255,${0.06 + i * 0.03})` })
        );
      }
      break;
    case 4: // City grid
      for (let col = 0; col < 6; col++) {
        const bx = dxp * (0.1 + col * 0.14);
        const bh = dyp * (0.3 + ((col * 37 + 13) % 17) / 17 * 0.35);
        children.push(
          rectangle({ x: bx, y: dyp - bh, dx: dxp * 0.08, dy: bh, fill: 'rgba(255,255,255,0.2)', cornerRadius: 2 })
        );
        for (let row = 0; row < Math.floor(bh / 20); row++) {
          children.push(
            rectangle({ x: bx + 5, y: dyp - bh + 8 + row * 20, dx: dxp * 0.08 - 10, dy: 8, fill: 'rgba(255,255,200,0.3)', cornerRadius: 1 })
          );
        }
      }
      break;
  }

  // Title overlay at bottom
  children.push(
    rectangle({ x: 0, y: dyp - 40, dx: dxp, dy: 40, fill: 'rgba(0,0,0,0.4)' }),
    text({ x: dxp / 2, y: dyp - 15, text: img.stTitle, fill: 'white', fontSize: 18, align: 'center', baseline: 'middle' })
  );

  return group({ x: 0, y: 0 }, children);
}

export const demo = {
  id: 'gui-gallery',
  name: 'GUI Gallery',
  description: 'Image gallery with carousel navigation',
  size: { width: 950, height: 680 },
  
  init: (): GalleryDemoState => {
    return {
      currentIndex: 0,
      fAutoPlay: false,
      images: [
        { stTitle: 'Mountain Landscape', stDescription: 'Beautiful mountain vista', color: '#4dabf7' },
        { stTitle: 'Ocean Sunset', stDescription: 'Stunning ocean view at sunset', color: '#ff6b6b' },
        { stTitle: 'Forest Path', stDescription: 'Peaceful forest trail', color: '#51cf66' },
        { stTitle: 'Desert Dunes', stDescription: 'Golden sand dunes', color: '#ffd43b' },
        { stTitle: 'City Lights', stDescription: 'Urban skyline at night', color: '#8b5cf6' }
      ],
      time: 0,
      autoPlayInterval: 1
    };
  },

  update: (state: GalleryDemoState, dt: number): void => {
    state.time += dt;
    
    // Auto-advance carousel if autoplay is enabled
    if (state.fAutoPlay && state.time >= state.autoPlayInterval) {
      state.time = 0;
      state.currentIndex = (state.currentIndex + 1) % state.images.length;
    }
  },

  render: (state: GalleryDemoState) => {
    const context = { theme: colorfulTheme };
    const dxpSlide = 860;
    const dypSlide = 350;

    // Build gallery GUI
    const gui = vstack(
      { x: 20, y: 20, duSpacing: 25, duPadding: 0, alignment: 'center', dx: 900 },
      [
        // Title bar
        label({
          stText: '🖼️ Image Gallery',
          fontSize: 26,
          fontWeight: 'bold',
          dx: 900,
          dy: 36
        }),

        // Main carousel area
        panel(
          { dx: 900, dy: dypSlide + 60, duPadding: 20 },
          [
            carousel(
              {
                dx: dxpSlide,
                dy: dypSlide + 30,
                currentIndex: state.currentIndex,
                onIndexChange: (index) => {
                  state.currentIndex = index;
                  state.time = 0;
                }
              },
              state.images.map((img: GalleryImageItem, index: number) =>
                panel(
                  { dx: dxpSlide, dy: dypSlide, duPadding: 0 },
                  [
                    label({
                      stText: '',
                      dx: dxpSlide,
                      dy: dypSlide
                    })
                  ]
                )
              )
            )
          ]
        ),

        // Navigation controls
        hstack(
          { duSpacing: 12, duPadding: 0, alignment: 'center' },
          [
            button({
              stLabel: '⏮ First',
              variant: 'secondary',
              dx: 100,
              dy: 40,
              onClick: () => {
                state.currentIndex = 0;
                state.time = 0;
              }
            }),
            button({
              stLabel: '◀ Prev',
              variant: 'secondary',
              dx: 100,
              dy: 40,
              onClick: () => {
                state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
                state.time = 0;
              }
            }),
            button({
              stLabel: state.fAutoPlay ? '⏸ Pause' : '▶ Play',
              variant: state.fAutoPlay ? 'danger' : 'secondary',
              dx: 110,
              dy: 40,
              onClick: () => {
                state.fAutoPlay = !state.fAutoPlay;
                state.time = 0;
              }
            }),
            button({
              stLabel: 'Next ▶',
              variant: 'secondary',
              dx: 100,
              dy: 40,
              onClick: () => {
                state.currentIndex = (state.currentIndex + 1) % state.images.length;
                state.time = 0;
              }
            }),
            button({
              stLabel: 'Last ⏭',
              variant: 'secondary',
              dx: 100,
              dy: 40,
              onClick: () => {
                state.currentIndex = state.images.length - 1;
                state.time = 0;
              }
            })
          ]
        )
      ]
    );

    // Transform GUI DSL to Core DSL, then overlay placeholder images
    const guiBlock = transformGUIControl(gui, context);

    // Overlay the placeholder image on top of the carousel panel
    const img = state.images[state.currentIndex];
    const placeholder = makePlaceholder(dxpSlide, dypSlide, img, state.currentIndex);
    // Position matches: vstack y=20, spacing=15, title dy=36 → panel starts at 20+36+15=71
    // panel padding=20, carousel starts at 20 inside panel → image at 71+20=91
    const placeholderPositioned = group({ x: 40, y: 91, clip: true, dx: dxpSlide, dy: dypSlide }, [placeholder]);

    return group({ x: 0, y: 0 }, [guiBlock, placeholderPositioned]);
  }
};
