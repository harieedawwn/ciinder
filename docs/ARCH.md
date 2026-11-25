# ARCH — how ciinder is built

Static SPA on GitHub Pages (`https://harieedawwn.github.io/ciinder/`). No backend, no API keys, no accounts.
Stack: Vite + Svelte 5 (runes) + TypeScript. Tests: Vitest (core only). Deps already installed: fflate, idb-keyval, marked, dompurify, katex, @fontsource/be-vietnam-pro, @fontsource/lora, vite-plugin-singlefile, vite-plugin-pwa.

## Product flow
1. User taps "Hướng dẫn cho AI" → copies/downloads `ciinder-guide.md`, sends it + study material to any AI (ChatGPT, Gemini, Claude...).
2. AI returns text in the ciinder format → user pastes it / opens the .txt file in ciinder.
3. Parser validates → preview → save to library (IndexedDB, on device).
4. Play (practice or test), essay study modes, review mistakes, retry wrong ones.
5. Share: link (whole set compressed into the URL hash) or a standalone offline `.html` file, or the `.txt` source.

## Folder map (keep it this way; one responsibility per file, files < ~300 lines)
```
src/
  main.ts                 mount + global css import
  App.svelte              router outlet, theme/fullscreen/sound providers
  core/                   PURE TS, no DOM, fully unit-tested
    types.ts              data model (docs/FORMAT.md §6)
    parse.ts              text → QuizSet + issues
    issues.ts             issue codes, vi messages, issuesReport()
    grade.ts              scoring (FORMAT §7)
    normalize.ts          text/number normalization (diacritics, decimals)
    share.ts              encode/decode links (FORMAT §8)
    shuffle.ts            seeded shuffle (seed per attempt)
    *.test.ts
  state/                  Svelte rune stores (.svelte.ts)
    library.svelte.ts     saved sets (idb-keyval), CRUD
    progress.svelte.ts    attempts, per-item mastery, last position
    settings.svelte.ts    theme, sound, text size, motion — persisted
    router.svelte.ts      hash router
  render/                 markdown + math → sanitized HTML
    markdown.ts           marked (subset) + DOMPurify
    math.ts               lazy KaTeX + mhchem
  ui/                     reusable components (Button, Sheet, Dialog, Toast, Icon, Slider, ...)
  views/                  one folder per screen: Home, Editor, Play, Result, Share, Settings
  play/                   one component per question kind: Mcq.svelte, Tf.svelte, Short.svelte, Cloze.svelte,
                          Match.svelte, Order.svelte, Group.svelte, Essay.svelte, Flash.svelte, Note.svelte
                          + registry.ts mapping kind → component (adding a kind = 1 file + 1 registry line + parser case)
  lib/                    browser helpers: sound.ts, fullscreen.ts, env.ts (in-app browser detection), download.ts, haptics.ts
  styles/                 tokens.css (themes), base.css, motion.css
player.html + src/player-main.ts   entry for the standalone offline player (vite.player.config.ts → dist/player.html; src/player/ holds its localStorage + CDN-KaTeX swaps)
public/                   ciinder-guide.md, icons, manifest (sounds are synthesized in src/lib/sound.ts)
docs/                     specs for AI developers (this folder)
```

## Routing (hash only — GitHub Pages has no SPA fallback)
`#/` library · `#/new` editor (paste/open) · `#/edit/<id>` · `#/play/<id>` · `#/result/<id>` · `#/review/<id>` (read-only replay of the last attempt) · `#/settings` as a sheet over current view.
Shared link: `#s=A...` (FORMAT §8). Opening it: decode → parse → play immediately in a temporary set with a "Lưu vào thư viện" action. Never put data in the query string.

## Storage
IndexedDB via idb-keyval: keys `set:<id>` {id, title, source, createdAt, updatedAt}, `prog:<id>` progress, `settings`.
Parse on open (fast) instead of storing the parsed model. Library list keeps a small index `sets:index` for instant render.
Backup: Settings → Sao lưu exports/imports all sets + progress as one `.json` (`core/backup.ts`, merge by id).

## Performance budget (phones first)
- Initial JS ≤ 90 KB gzip for library + player. Editor, KaTeX, marked, export code are lazy `import()`.
- Animate only `transform`, `opacity`, `clip-path`. No `backdrop-filter`, no big box-shadow animation, no layout-thrashing animations.
- Fonts: only `vietnamese` + `latin` subsets, weights 400/500/600/700 for Be Vietnam Pro; Lora 400/600 only for essay reading. `font-display: swap`.
- Long lists: `content-visibility: auto`. Avoid re-rendering whole quiz on each answer (keyed each, per-item state).
- Sounds: synthesized with Web Audio nodes on demand (no files); AudioContext created on first gesture.

## In-app browsers (Zalo, Facebook, Messenger, Instagram, TikTok)
- `lib/env.ts`: detect by UA (`Zalo`, `FBAN|FBAV|FB_IAB`, `Instagram`, `musical_ly|TikTok`).
- Links survive appended params (FORMAT §8). Never rely on `location.search`.
- File downloads often fail there: download buttons fall back to "Sao chép nội dung" / "Mở bằng trình duyệt" sheet.
- Storage may be wiped: shared-link sessions still work fully in memory.
- Fullscreen API is missing on iPhone and most webviews → "focus mode" fallback (hide chrome, 100dvh). iPad Safari: `webkitRequestFullscreen`.

## Viewport rules
`100dvh` (fallback `100vh`), `env(safe-area-inset-*)` padding, `interactive-widget=resizes-content` already in index.html.
Root font-size: 15px < 600px wide, 16px tablet, 16–17px desktop; user text-size setting multiplies it.
Use container queries for components, media queries only for page layout. Landscape phones (height < 500px): compact vertical spacing, player uses two columns when width ≥ 2×height.
