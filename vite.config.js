
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Imposta la directory principale
  build: {
    outDir: 'dist', // Directory di output
    rollupOptions: {
      input: {
        main: './index.html', // Specifica il file HTML come input
      },
    },
  },
});