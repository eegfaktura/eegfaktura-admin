/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// Replaces create-react-app (react-scripts). Kept as before:
// - the output goes to build/ (Dockerfile: ADD build ...), with source maps as react-scripts made them;
// - the variables in .env* keep their prefix REACT_APP_ (read through import.meta.env);
// - the dev server runs on port 3000 with the proxies of the former src/setupProxy.js.
// The runtime configuration (/config/keycloak-config.json) is rendered by Caddy and not part of the build.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/admin': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, '/'),
        headers: {Connection: 'keep-alive'},
      },
      '/cash': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cash/, ''),
      },
      '/api': {
        target: 'http://localhost:9080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // react-scripts ran Jest with resetMocks: true
    mockReset: true,
  },
})
