import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
    proxy: {
      '/createSession': 'http://localhost:9000',
      '/joinSession': 'http://localhost:9000',
      '/logout': 'http://localhost:9000',
      '/vote': 'http://localhost:9000',
      '/reset': 'http://localhost:9000',
      '/refresh': 'http://localhost:9000',
      '/sessions': 'http://localhost:9000',
      '/sessionUsers': 'http://localhost:9000',
      '/version': 'http://localhost:9000',
      '/stomp': {
        target: 'http://localhost:9000',
        ws: true,
      },
      '/actuator': 'http://localhost:9000',
    },
  },
});
