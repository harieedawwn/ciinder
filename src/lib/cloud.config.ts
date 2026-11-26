// Firebase web config for short share links (Phase 12). Public values, not secrets — security comes from docs/firestore.rules.
// Leave empty to disable short links (the app then shares long #s= links only).
export const cloudConfig = { apiKey: 'AIzaSyAOMQ6CvBNGMWRRpz2E9RSWDJ-Vdl4aSTE', projectId: 'ciinder',
  /** Cloudflare Worker (worker/preview.js) that serves per-set link previews, e.g. 'https://ciinder.abc.workers.dev'. Empty = links point straight at the app. */
  previewBase: '' }
