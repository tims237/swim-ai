import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,        // port obligatoire pour matcher le CORS du backend
    strictPort: true,  // échoue si 3000 est pris, au lieu de prendre un autre port
  },
})