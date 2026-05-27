import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api/* calls to the customer Node backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // Forward /seller-uploads/* to the customer Node backend which
      // in turn proxies to the seller backend — keeps CORS clean
      '/seller-uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});