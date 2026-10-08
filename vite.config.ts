import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Mutations run in the local Worker; Vite continues to provide React HMR.
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true } } },
})
