import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Always use 5173 so it matches the backend's FRONTEND_URL (CORS).
  // If the port is busy, fail loudly instead of silently moving to 5174.
  server: { port: 5173, strictPort: true },
})
