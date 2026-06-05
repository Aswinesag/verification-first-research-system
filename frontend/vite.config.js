import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Prefer TypeScript sources over legacy .js duplicates (e.g. api.ts over api.js).
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Investigations (LLM + retrieval + verification) can run several minutes.
        timeout: 600_000,
        proxyTimeout: 600_000,
      },
    },
  }
})
