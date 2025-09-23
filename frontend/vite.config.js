import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base if deploying under a subpath on GitHub Pages, e.g., '/your-repo/'
  base: process.env.VITE_BASE_PATH || '/',
})
