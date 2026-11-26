// Cloudflare Worker: per-set link previews for ciinder short links.
// GET /s/<id> → HTML with og:title / og:description of that set (Zalo, Facebook, Messenger read these),
// then the browser is redirected to the app: https://harieedawwn.github.io/ciinder/#k=<id>.
// Deploy: Cloudflare dashboard → Workers & Pages → Create → Hello World → Edit code → paste this file → Deploy.
const PROJECT = 'ciinder'
const KEY = 'AIzaSyAOMQ6CvBNGMWRRpz2E9RSWDJ-Vdl4aSTE' // public Firebase web key (read access is limited by firestore.rules)
const APP = 'https://harieedawwn.github.io/ciinder/'
const IMAGE = APP + 'og.png'

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function inflate(payload) {
  // payload = 'A' + base64url(zlib(utf8 source))
  const b64 = payload.slice(1).replace(/-/g, '+').replace(/_/g, '/')
  const bin = Uint8Array.from(atob(b64 + '==='.slice((b64.length + 3) % 4)), (c) => c.charCodeAt(0))
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Response(stream).text()
}

function summarize(src) {
  const lines = src.split(/\r?\n/)
  const title = (lines.find((l) => /^#\s/.test(l)) || '# Bộ câu hỏi').replace(/^#\s+/, '').trim()
  const meta = (k) => (lines.find((l) => l.toLowerCase().startsWith('@' + k + ':')) || '').split(':').slice(1).join(':').trim()
  const count = lines.filter((l) => /^---\s*\S/.test(l) && !/^---\s*(note|ngu-canh|context|passage|info)\b/i.test(l)).length
  const parts = [count ? `${count} câu` : '', meta('subject'), meta('desc')].filter(Boolean)
  return { title, desc: (parts.join(' · ') || 'Bộ câu hỏi luyện tập') + ' · Bấm để làm bài.' }
}

function page(id, title, desc) {
  const url = `${APP}#k=${id}`
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="ciinder">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
<script>location.replace(${JSON.stringify(url)})</script>
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`
}

export default {
  async fetch(req) {
    const m = /^\/s\/([A-Za-z0-9]{6,16})/.exec(new URL(req.url).pathname)
    if (!m) return Response.redirect(APP, 302)
    const id = m[1]
    let title = 'ciinder · Bộ câu hỏi luyện tập', desc = 'Bấm để làm bài ngay, không cần tài khoản.'
    try {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/sets/${id}?key=${KEY}`, { cf: { cacheTtl: 3600 } })
      if (r.ok) ({ title, desc } = summarize(await inflate((await r.json()).fields.z.stringValue)))
    } catch {}
    return new Response(page(id, title, desc), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
  },
}
