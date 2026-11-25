/// <reference types="vitest/config" />
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const PLAYER = fileURLToPath(new URL('dist-player/player.html', import.meta.url))

/** Ships the standalone player template (built first by `npm run build`) as /player.html. */
function playerTemplate(): Plugin {
  return {
    name: 'ciinder-player-template',
    apply: 'build',
    generateBundle() {
      if (existsSync(PLAYER)) this.emitFile({ type: 'asset', fileName: 'player.html', source: readFileSync(PLAYER) })
      else this.warn('dist-player/player.html missing: run the player build first')
    },
  }
}

// App is served from https://harieedawwn.github.io/ciinder/ — routing is hash-based (see docs/ARCH.md).
export default defineConfig({
  base: '/ciinder/',
  plugins: [
    svelte(),
    playerTemplate(),
    VitePWA({
      // Prompt mode: a new version waits until the user taps "Tải lại", so a quiz is never reloaded mid-question.
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,md,webmanifest}'],
        globIgnores: ['**/node_modules/**'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/player\.html$/],
      },
    }),
  ],
  build: { target: 'es2020', cssMinify: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
