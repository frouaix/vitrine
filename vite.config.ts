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
        gallery: resolve(__dirname, 'examples/gallery.html')
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
