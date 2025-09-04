
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      // Proxy /api requests to the backend running on port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
});

