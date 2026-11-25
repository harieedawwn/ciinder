// Renders public/og.png (1200×630 link-preview image) from public/icon.svg (run: node scripts/og.mjs). Output is committed.
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const pub = new URL('../public/', import.meta.url)
const icon = readFileSync(new URL('icon.svg', pub), 'utf8').replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#F4F5F7"/>
  <g transform="translate(140 175) scale(.55)">${icon}</g>
  <text x="470" y="355" font-family="DejaVu Sans, Arial, sans-serif" font-size="132" font-weight="700" fill="#16181D" letter-spacing="-4">ciinder</text>
  <rect x="474" y="392" width="300" height="22" rx="11" fill="#FFE27A"/>
</svg>`
writeFileSync(new URL('og.png', pub), new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng())
