import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  test: {
    exclude: ['tests/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/__tests__/**',
        'src/index.jsx',
        'src/testUtils/**',
      ],
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          redux: ['redux', 'react-redux', '@reduxjs/toolkit'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
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
      '/kick': 'http://localhost:9000',
      '/promote': 'http://localhost:9000',
      '/setLabel': 'http://localhost:9000',
      '/timer': 'http://localhost:9000',
      '/stomp': {
        target: 'http://localhost:9000',
        ws: true,
      },
      '/actuator': 'http://localhost:9000',
    },
  },
})
