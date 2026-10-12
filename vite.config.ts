import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // the 3D engine (three + R3F + drei) lands in one lazy chunk, only loaded by the full version
    chunkSizeWarningLimit: 1000,
  },
})
