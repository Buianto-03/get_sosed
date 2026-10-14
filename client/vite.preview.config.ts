import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: Object.fromEntries(layers.map((layer) => [`@${layer}`, `${srcPath}/${layer}`])),
  },
  server: {
    host: '127.0.0.1',
  },
  base: '/',
});
