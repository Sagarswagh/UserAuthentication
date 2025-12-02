import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_BOOKING_SERVICE_URL || 'http://localhost:8002';

  console.log('🔧 Vite Config - Booking Service Target:', target);

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/available-seats': {
          target: target,
          changeOrigin: true,
        },
        '/book': {
          target: target,
          changeOrigin: true,
        },
        '/user': {
          target: target,
          changeOrigin: true,
        },
        '/bookings/count': {
          target: target,
          changeOrigin: true,
        },
        '/bookings': {
          target: target,
          changeOrigin: true,
        },
        '/booking': {
          target: target,
          changeOrigin: true,
        }
      }
    }
  }
})
