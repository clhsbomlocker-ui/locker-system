import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // support imports like '@/src/...' and '@/...'
      '@/src': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
  },
})
