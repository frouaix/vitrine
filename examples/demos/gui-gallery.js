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
} from '../../src/GUI/index.js';

export const demo = {
  id: 'gui-gallery',
  name: 'GUI Gallery',
  description: 'Image gallery with carousel navigation',
  
  init: () => {
    return {
      currentIndex: 0,
      autoPlay: false,
      images: [
        { title: 'Mountain Landscape', description: 'Beautiful mountain vista', color: '#4dabf7' },
        { title: 'Ocean Sunset', description: 'Stunning ocean view at sunset', color: '#ff6b6b' },
        { title: 'Forest Path', description: 'Peaceful forest trail', color: '#51cf66' },
        { title: 'Desert Dunes', description: 'Golden sand dunes', color: '#ffd43b' },
        { title: 'City Lights', description: 'Urban skyline at night', color: '#8b5cf6' }
      ],
      time: 0,
      autoPlayInterval: 3
    };
  },

  update: (state, dt) => {
    state.time += dt;
    
    // Auto-advance carousel if autoplay is enabled
    if (state.autoPlay && state.time >= state.autoPlayInterval) {
      state.time = 0;
      state.currentIndex = (state.currentIndex + 1) % state.images.length;
    }
  },

  render: (state) => {
    const context = { theme: colorfulTheme };
    const currentImage = state.images[state.currentIndex];

    // Build gallery GUI
    const gui = vstack(
      { x: 50, y: 30, spacing: 25, padding: 0 },
      [
        // Header
        panel(
          { width: 900, height: 100, padding: 25 },
          [
            hstack(
              { spacing: 25, alignment: 'center' },
              [
                label({ 
                  text: '🖼️ Image Gallery', 
                  fontSize: 28,
                  fontWeight: 'bold'
                }),
                button({
                  label: state.autoPlay ? '⏸ Pause' : '▶ Auto Play',
                  variant: 'primary',
                  width: 180,
                  height: 50,
                  x: 530,
                  onClick: () => {
                    state.autoPlay = !state.autoPlay;
                    state.time = 0;
                  }
                })
              ]
            )
          ]
        ),

        // Main carousel area
        panel(
          { width: 900, height: 450, padding: 25 },
          [
            // Carousel with image placeholders
            carousel(
              {
                width: 850,
                height: 350,
                currentIndex: state.currentIndex,
                onIndexChange: (index) => { 
                  state.currentIndex = index;
                  state.time = 0;
                }
              },
              state.images.map((img, index) => 
                vstack(
                  { spacing: 20, alignment: 'center' },
                  [
                    // Image placeholder (colored rectangle)
                    panel(
                      { width: 850, height: 280, padding: 0 },
                      [
                        // We'll use a colored rectangle as image placeholder
                        label({ 
                          text: `[Image ${index + 1}]`,
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
                          text: img.title, 
                          fontSize: 24,
                          fontWeight: 'bold',
                          align: 'center'
                        }),
                        label({ 
                          text: img.description, 
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
          { width: 900, height: 100, padding: 25 },
          [
            hstack(
              { spacing: 18, alignment: 'center', x: 200 },
              [
                button({
                  label: '⏮ First',
                  variant: 'secondary',
                  width: 130,
                  height: 50,
                  onClick: () => { 
                    state.currentIndex = 0;
                    state.time = 0;
                  }
                }),
                button({
                  label: '◀ Previous',
                  variant: 'secondary',
                  width: 150,
                  height: 50,
                  onClick: () => { 
                    state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
                    state.time = 0;
                  }
                }),
                label({ 
                  text: `${state.currentIndex + 1} / ${state.images.length}`,
                  fontSize: 18,
                  fontWeight: 'bold',
                  width: 70,
                  align: 'center'
                }),
                button({
                  label: 'Next ▶',
                  variant: 'secondary',
                  width: 150,
                  height: 50,
                  onClick: () => { 
                    state.currentIndex = (state.currentIndex + 1) % state.images.length;
                    state.time = 0;
                  }
                }),
                button({
                  label: 'Last ⏭',
                  variant: 'secondary',
                  width: 130,
                  height: 50,
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
