// Copyright (c) 2026 François Rouaix

// GUI Gallery Demo - Carousel with images and content
import { ImmediateRenderer } from 'vitrine';
import {
  vstack,
  hstack,
  label,
  button,
  panel,
  carousel,
  guiImage,
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

export const demo = {
  id: 'gui-gallery',
  name: 'GUI Gallery',
  description: 'Image gallery with carousel navigation',
  
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
      autoPlayInterval: 3
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

    // Build gallery GUI
    const gui = vstack(
      { x: 50, y: 30, spacing: 25, padding: 0 },
      [
        // Header
        panel(
          { dx: 900, dy: 100, padding: 25 },
          [
            hstack(
              { spacing: 25, alignment: 'center' },
              [
                label({ 
                  stText: '🖼️ Image Gallery', 
                  fontSize: 28,
                  fontWeight: 'bold'
                }),
                button({
                  stLabel: state.fAutoPlay ? '⏸ Pause' : '▶ Auto Play',
                  variant: 'primary',
                  dx: 180,
                  dy: 50,
                  x: 530,
                  onClick: () => {
                    state.fAutoPlay = !state.fAutoPlay;
                    state.time = 0;
                  }
                })
              ]
            )
          ]
        ),

        // Main carousel area
        panel(
          { dx: 900, dy: 450, padding: 25 },
          [
            // Carousel with image placeholders
            carousel(
              {
                dx: 850,
                dy: 350,
                currentIndex: state.currentIndex,
                onIndexChange: (index) => { 
                  state.currentIndex = index;
                  state.time = 0;
                }
              },
              state.images.map((img: GalleryImageItem, index: number) => 
                vstack(
                  { spacing: 20, alignment: 'center' },
                  [
                    // Image placeholder (colored rectangle)
                    panel(
                      { dx: 850, dy: 280, padding: 0 },
                      [
                        // We'll use a colored rectangle as image placeholder
                        label({ 
                          stText: `[Image ${index + 1}]`,
                          fontSize: 40,
                          x: 425,
                          y: 140,
                          align: 'center'
                        })
                      ]
                    ),
                    
                    // Image info
                    vstack(
                      { spacing: 8, alignment: 'center' },
                      [
                        label({ 
                          stText: img.stTitle, 
                          fontSize: 24,
                          fontWeight: 'bold',
                          align: 'center'
                        }),
                        label({ 
                          stText: img.stDescription, 
                          fontSize: 16,
                          align: 'center'
                        })
                      ]
                    )
                  ]
                )
              )
            )
          ]
        ),

        // Navigation controls
        panel(
          { dx: 900, dy: 100, padding: 25 },
          [
            hstack(
              { spacing: 18, alignment: 'center', x: 200 },
              [
                button({
                  stLabel: '⏮ First',
                  variant: 'secondary',
                  dx: 130,
                  dy: 50,
                  onClick: () => { 
                    state.currentIndex = 0;
                    state.time = 0;
                  }
                }),
                button({
                  stLabel: '◀ Previous',
                  variant: 'secondary',
                  dx: 150,
                  dy: 50,
                  onClick: () => { 
                    state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
                    state.time = 0;
                  }
                }),
                label({ 
                  stText: `${state.currentIndex + 1} / ${state.images.length}`,
                  fontSize: 18,
                  fontWeight: 'bold',
                  dx: 70,
                  align: 'center'
                }),
                button({
                  stLabel: 'Next ▶',
                  variant: 'secondary',
                  dx: 150,
                  dy: 50,
                  onClick: () => { 
                    state.currentIndex = (state.currentIndex + 1) % state.images.length;
                    state.time = 0;
                  }
                }),
                button({
                  stLabel: 'Last ⏭',
                  variant: 'secondary',
                  dx: 130,
                  dy: 50,
                  onClick: () => { 
                    state.currentIndex = state.images.length - 1;
                    state.time = 0;
                  }
                })
              ]
            )
          ]
        )
      ]
    );

    // Transform GUI DSL to Core DSL
    return transformGUIControl(gui, context);
  }
};
