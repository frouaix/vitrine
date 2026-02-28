// Copyright (c) 2026 François Rouaix

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: '/vitrine/',
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        basic: resolve(__dirname, 'basic.html'),
        calendar: resolve(__dirname, 'calendar.html'),
        cameraControls: resolve(__dirname, 'camera-controls.html'),
        cameraControlsTest: resolve(__dirname, 'camera-controls-test.html'),
        events: resolve(__dirname, 'events.html'),
        performance: resolve(__dirname, 'performance.html'),
        primitives: resolve(__dirname, 'primitives.html'),
        testGuiInteractions: resolve(__dirname, 'test-gui-interactions.html'),
        componentDemo: resolve(__dirname, 'component-demo.html')
      }
    }
  },
  resolve: {
    alias: {
      'vitrine': resolve(__dirname, '../core/src/index.ts'),
      'vitrine-gui': resolve(__dirname, '../gui/src/index.ts')
    }
  },
  server: {
    port: 8080,
    open: '/gallery.html'
  }
});
