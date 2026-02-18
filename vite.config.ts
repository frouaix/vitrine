// Copyright (c) 2026 François Rouaix

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples',
  base: '/vitrine/',
  build: {
    outDir: '../dist-examples',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html'),
        gallery: resolve(__dirname, 'examples/gallery.html'),
        basic: resolve(__dirname, 'examples/basic.html'),
        calendar: resolve(__dirname, 'examples/calendar.html'),
        cameraControls: resolve(__dirname, 'examples/camera-controls.html'),
        cameraControlsTest: resolve(__dirname, 'examples/camera-controls-test.html'),
        events: resolve(__dirname, 'examples/events.html'),
        performance: resolve(__dirname, 'examples/performance.html'),
        primitives: resolve(__dirname, 'examples/primitives.html'),
        testGuiInteractions: resolve(__dirname, 'examples/test-gui-interactions.html'),
        componentDemo: resolve(__dirname, 'examples/component-demo.html')
      }
    }
  },
  resolve: {
    alias: {
      'vitrine': resolve(__dirname, './src/index.ts')
    }
  },
  server: {
    port: 8080,
    open: '/gallery.html'
  }
});
