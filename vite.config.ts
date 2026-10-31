/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// Replaces create-react-app (react-scripts). Kept as before:
// - the output goes to build/ (Dockerfile: ADD build ...), with source maps as react-scripts made them;
// - the variables in .env* keep their prefix REACT_APP_ (read through import.meta.env);
// - the dev server runs on port 3000 (strict: the Keycloak client's redirect URI) with the proxies of the
//   former src/setupProxy.js, plus /energystore (.env.development points REACT_APP_ENERGY_SERVER_URL there).
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
    strictPort: true,
    proxy: {
      '/admin': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, '/'),
        headers: {Connection: 'keep-alive'},
      },
      '/energystore': {
        target: 'http://localhost:9081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/energystore/, ''),
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
    // react-scripts ran Jest with resetMocks: true. Close, not identical: Vitest resets a vi.fn(impl)
    // to impl, Jest's resetMocks to an empty function.
    mockReset: true,
    // as react-scripts' collectCoverageFrom: every source file, also the ones no test loads
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
    },
  },
})
