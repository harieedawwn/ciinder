/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// App is served from https://harieedawwn.github.io/ciinder/ — routing is hash-based (see docs/ARCH.md).
export default defineConfig({
  base: '/ciinder/',
  plugins: [svelte()],
  build: { target: 'es2020', cssMinify: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
