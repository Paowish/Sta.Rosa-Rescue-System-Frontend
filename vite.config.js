import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.36',
      'hammily-unscaled-synthia.ngrok-free.dev',
      '.ngrok-free.dev'  // This allows ALL ngrok subdomains
    ],
    proxy: {
      '/api': {
        target: ' https://sta-rosa-rescue-system-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})