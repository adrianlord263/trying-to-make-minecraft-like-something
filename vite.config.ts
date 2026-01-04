import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['cannon-es'],
  },
});
