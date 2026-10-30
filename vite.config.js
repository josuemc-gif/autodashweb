import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/autodashweb/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
