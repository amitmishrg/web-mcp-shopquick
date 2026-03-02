import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// GitHub Pages serves at https://<user>.github.io/<repo>/ so base must be /<repo>/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ? `/${process.env.VITE_BASE_PATH}/` : '/',
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
