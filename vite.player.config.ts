import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const SITE = 'https://harieedawwn.github.io/ciinder/'
const katexVersion = (JSON.parse(readFileSync(here('node_modules/katex/package.json'), 'utf8')) as { version: string }).version

/** Standalone-only swaps: idb-keyval → localStorage, bundled KaTeX → CDN loader (docs/ARCH.md, Phase 7). */
function standaloneSwaps(): Plugin {
  return {
    name: 'ciinder-standalone-swaps',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === 'idb-keyval') return here('src/player/kv.ts')
      if (source === './math' && importer?.endsWith('rich.svelte.ts')) return here('src/player/math-cdn.ts')
    },
  }
}

// Builds dist-player/player.html: one self-contained file (JS, CSS, fonts inlined). vite.config.ts copies it into dist.
// Sound effects are synthesized (src/lib/sound.ts), so they work offline too.
export default defineConfig({
  base: './',
  plugins: [standaloneSwaps(), svelte(), viteSingleFile()],
  define: { __KATEX_VERSION__: JSON.stringify(katexVersion), 'import.meta.env.BASE_URL': JSON.stringify(SITE) },
  build: {
    target: 'es2022',
    outDir: 'dist-player',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssMinify: true,
    rollupOptions: { input: here('player.html') },
  },
  publicDir: false,
})
