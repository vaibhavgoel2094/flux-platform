import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Zero-backend build, deployed as a GitHub Pages project site — base must
// match the repo name, and the production build lands in /docs at the repo
// root (GitHub Pages' other supported source besides gh-pages branch), so
// there is nothing to configure in repo settings beyond picking that folder.
export default defineConfig({
  base: '/flux-platform/',
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
