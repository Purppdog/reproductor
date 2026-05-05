import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // 1. Agrega esta configuración de build
  build: {
    minify: 'terser', // o 'esbuild' (alternativa más rápida)
    terserOptions: {
      compress: {
        drop_console: true, // Elimina console.logs en producción
        keep_fnames: true,  // Evita que renombre funciones
      },
      format: {
        comments: false,
      },
    },
    sourcemap: true, // Genera source maps para debugging
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
  },
})