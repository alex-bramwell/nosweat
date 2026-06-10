import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In Docker, Vite runs inside the frontend container, so `localhost` is not
      // the backend - docker-compose sets VITE_PROXY_TARGET=http://backend:3001.
      // Defaults to localhost for host-based `npm run dev`.
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
