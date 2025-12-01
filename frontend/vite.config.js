import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/available-seats': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/book': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      }
    }
  }
})
