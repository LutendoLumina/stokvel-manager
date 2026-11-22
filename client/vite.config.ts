import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The "proxy" is a forwarding address: any request starting with /api
    // is passed on to the NestJS server, so the browser only talks to one address.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
