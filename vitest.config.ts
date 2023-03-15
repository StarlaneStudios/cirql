/// <reference types="vitest" />

import { defineConfig } from 'vite';

export default defineConfig((e) => ({
  publicDir: e.command == 'serve' ? 'public' : false,
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'Cirql',
      fileName: 'cirql',
    },
    rollupOptions: {
      external: ['zod', 'isomorphic-ws'],
      output: {
        globals: {
          zod: 'Zod',
          'isomorphic-ws': 'WebSocket',
        },
      },
    },
  },
  test: {},
}));
