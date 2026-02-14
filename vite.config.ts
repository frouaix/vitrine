import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples',
  build: {
    outDir: '../dist-examples',
    emptyOutDir: true
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
