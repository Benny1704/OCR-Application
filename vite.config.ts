import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    headers: {
      "Content-Security-Policy": "style-src 'self' https://cdn-uicons.flaticon.com https://fonts.googleapis.com 'unsafe-inline'"
    }
  }
})
