import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['react-pdf', 'pdfjs-dist'],
          ui: ['lucide-react', 'react-color'],
          fabric: ['fabric'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.entry'],
  },
})