import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const api = 'http://127.0.0.1:4317';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // The API rejects foreign Origin headers, so the dev proxy presents itself as the API host.
      '/api': { target: api, changeOrigin: true, headers: { origin: api } },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0 },
});
