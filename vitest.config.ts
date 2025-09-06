import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@classes': path.resolve(__dirname, 'src/classes'),
      '@utilities': path.resolve(__dirname, 'src/utilities'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  }
});