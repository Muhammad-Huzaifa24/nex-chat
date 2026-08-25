import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://nex-chat-taupe.vercel.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://nex-chat-taupe.vercel.app',
        ws: true,
      },
    },
  },
})
