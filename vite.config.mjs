import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [tailwindcss()],
  publicDir: false,
  build: {
    outDir: 'public/css',
    emptyOutDir: false,
    rollupOptions: {
      input: './index-vite.html',
      output: {
        assetFileNames: 'tailwind.css',
      }
    }
  }
})
