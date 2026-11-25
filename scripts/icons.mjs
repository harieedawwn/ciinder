// Renders public/icon.svg → PNG app icons (run: node scripts/icons.mjs). Outputs are committed.
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const pub = new URL('../public/', import.meta.url)
const master = readFileSync(new URL('icon.svg', pub), 'utf8')

// Maskable: full-bleed accent, artwork scaled into the 80% safe zone.
const inner = master.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '').replace(/<rect width="512" height="512" rx="112"[^>]*\/>/, '')
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2B59C3"/><g transform="translate(51.2 51.2) scale(.8)">${inner}</g></svg>`
// Apple applies its own corner mask: square background.
const apple = master.replace('rx="112" ', '')

const jobs = [
  ['icon-192.png', master, 192],
  ['icon-512.png', master, 512],
  ['icon-maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', apple, 180],
]
for (const [name, svg, size] of jobs) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(new URL(name, pub), png)
  console.log(name, png.length)
}
