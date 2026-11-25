# PHASES

One phase per Claude Code session. Each phase lists what to read (read ONLY that), tasks, and "Done when".
Model/effort is chosen by the user before the session; it's listed so the previous session can announce it.

| # | Phase | Model | Effort | Deploy |
|---|---|---|---|---|
| 0 | Scaffold, docs, sounds, CI (done by planner) | — | — | — |
| 1 | Core engine: model, parser, grading, share codec, tests | Sonnet 5.5 | medium | no |
| 2 | App shell + design system + sound + icon + library home | Opus 5.5 | medium | yes |
| 3 | Import & editor: paste/open, live check, error report, save, guide | Sonnet 5.5 | medium | no |
| 4 | Player: mcq, tf, short, cloze, note; practice/test; results; retry | Opus 5.5 | medium | yes |
| 5 | Player: match, order, group, flash (touch + mouse + keyboard) | Opus 5.5 | medium | no |
| 6 | Essay study modes + markdown/math rendering | Opus 5.5 | medium | yes |
| 7 | Share link, standalone HTML, exports, backup, PWA offline | Sonnet 5.5 | high | yes |
| 8 | QA & polish across devices, perf, a11y, final pass | Opus 5.5 | medium | yes |

Why these picks: Sonnet 5.5 medium for well-specified, testable logic (cheapest that holds quality); Opus 5.5 medium where taste,
interaction feel or tricky pointer logic matter (Opus medium ≥ Sonnet high at similar cost). Phase 7 is fiddly build config → Sonnet high.
Nothing needs xhigh/max. If a phase fails twice on the same problem, rerun that phase with effort one step higher, not a bigger model.

---

## Phase 1 — Core engine
Read: docs/FORMAT.md, docs/ARCH.md (Folder map only), public/ciinder-guide.md (for the sync test).
Tasks:
1. `src/core/types.ts`, `normalize.ts`, `issues.ts`, `parse.ts`, `grade.ts`, `shuffle.ts` (mulberry32 seeded), `share.ts` exactly per FORMAT.md.
2. Tests (Vitest): every type happy path; every E_ code; lenient inputs (fenced output, preamble chatter, `A.` labels, `[x]`, `(Đ)/(S)`, `Đáp án: B`, aliases, `\` escape, `//` comments, CRLF); line numbers point to original text; grading incl. THPT tf ladder, numeric with comma + tol, loose diacritics (đ→d); share round-trip with Vietnamese + math, and decoding from hrefs polluted like `...#s=A<p>?zarsrc=30&utm_source=zalo&utm_medium=zalo` and `...?fbclid=x#s=A<p>`; truncated payload → clean error.
3. Sync test: extract every ```text block from public/ciinder-guide.md, parse each → 0 errors.
4. Perf sanity: parsing a 300-item generated set < 50 ms in tests.
Done when: `npm run verify` passes. No UI work in this phase.

## Phase 2 — App shell, design system, sound, icon, library home
Read: docs/DESIGN.md, docs/ARCH.md.
Tasks:
1. `styles/tokens.css` (5 themes exactly from DESIGN), `base.css` (reset, fonts via @fontsource subsets only, focus-visible rings in --accent, selection color --mark), `motion.css`.
2. `state/settings.svelte.ts` (theme, sound pack, haptics, text size 90–130%, reduce motion; persisted), `state/router.svelte.ts` (hash routes from ARCH), `state/library.svelte.ts` (idb-keyval CRUD + index).
3. `lib/sound.ts` (Web Audio, lazy pack loading, cue map + gains + throttles from DESIGN), `lib/fullscreen.ts` (Fullscreen API + webkit + focus-mode fallback, F key), `lib/env.ts`, `lib/haptics.ts`.
4. `ui/` kit: Button (primary/secondary/quiet/icon), Icon set, Sheet (bottom sheet on phone / dialog on wide, swipe-to-close, focus trap, Esc), Toast, Segmented, Switch, Menu.
5. App frame: top bar (wordmark, fullscreen, settings), Settings sheet (theme swatches, sound pack, Rung, Cỡ chữ, Giảm chuyển động).
6. Library home: empty state per DESIGN (one line + 3 actions; actions may route to placeholders for now), set cards (title, subject, item count, last score as a highlighter bar, last opened), card menu (Đổi tên, Nhân bản, Xóa with undo toast).
7. Icon per DESIGN → `public/icon.svg` + generated PNGs + `manifest.webmanifest` + apple-touch-icon; favicon links in index.html.
8. Responsive check at 360×740, 390×844, 768×1024, 1280×800, landscape 844×390 (DevTools/preview if available; else reason from CSS). Safe areas.
Done when: verify passes, app deploys, themes switch smoothly, sounds play after first tap, fullscreen works or falls back.

## Phase 3 — Import & editor
Read: docs/FORMAT.md §1, §5; docs/DESIGN.md (Words); src/core/types.ts; src/ui/ (skim names only).
Tasks:
1. "Hướng dẫn cho AI" sheet: Sao chép (clipboard) + Tải về (`ciinder-guide.md`); in-app browser fallback (show text to copy). No extra explanation text beyond one short line.
2. Editor view `#/new`, `#/edit/<id>` (lazy chunk): large textarea with line numbers gutter (lightweight, no CodeMirror), Dán nội dung (clipboard read with fallback), Mở tệp (.txt .md .json; drag & drop on desktop, also drop anywhere on library), debounce parse 250 ms.
3. Issues panel: list errors (tap → scroll/select that line), warnings collapsed into one line; button "Sao chép báo cáo lỗi" → `issuesReport()` text.
4. Preview pane (wide screens side-by-side; phones: tabs Nội dung / Xem trước) showing title, sections, item count per kind, and a compact read-only render of each item.
5. Save → library → go to set page; unsaved-changes guard. JSON import: accept a QuizSet JSON with `source` or an array exported in Phase 7.
6. Library card tap → set detail sheet/page: Bắt đầu (mode choice Luyện tập/Làm bài, shuffle toggle), Sửa, Chia sẻ (placeholder until Phase 7).
Done when: verify passes; pasting each guide example works; a broken input shows correct line-numbered issues and the copied report reads well.

## Phase 4 — Player core
Read: docs/DESIGN.md (Motion, Sound, Words), docs/FORMAT.md §7, src/core/types.ts, src/core/grade.ts, src/ui/ index.
Tasks:
1. `play/registry.ts` + Play view: card stack with **card deal** transition, progress highlighter, question counter, prev/next, keyboard (1–9 choose, Enter check/next, ←/→), swipe left/right on phones to navigate (only when not interacting with a control).
2. Kinds: Mcq (single/multi, ink press, highlighter/strike feedback), Tf (Đ/S segmented per statement, THPT label a/b/c/d), Short (numeric keyboard `inputmode="decimal"` when numeric), Cloze (inline inputs; `bank` = tap word → fills next empty blank, tap filled blank → returns word), Note (shown collapsible above its questions).
3. Practice mode: Kiểm tra per question → feedback + explanation (expand) + hint button before answering. Test mode: no feedback, optional timer from `@time`, question grid navigator sheet, Nộp bài with confirm when unanswered.
4. `state/progress.svelte.ts`: save answers + position continuously (resume "Tiếp tục"), attempts history, per-item last result.
5. Result view: score % and /10, per-section breakdown, list of wrong items → Xem lại (read-only replay with answers) and Làm lại câu sai (new attempt with only wrong items). Streak/complete/achievement sounds per DESIGN.
6. Option shuffle seeded per attempt (respect shuffle=no); `@shuffle` for questions.
Done when: verify passes; a mixed set plays end to end on phone and desktop in both modes; resume works after reload.

## Phase 5 — Interactive kinds
Read: docs/DESIGN.md (Motion, Sound), src/play/registry.ts, one existing kind component as reference.
Tasks:
1. Shared pointer-drag helper `play/drag.ts` (Pointer Events, works with touch/mouse/pen, auto-scroll near edges, `touch-action` handled, no library). Every drag interaction ALSO has a tap alternative (tap item → tap target) and keyboard support.
2. Match: two columns (stacked on narrow screens), tap left then right to pair, pairs get the same subtle index color/number, unpair by tapping; feedback per pair.
3. Order: drag handles + up/down buttons; FLIP animation on reorder; feedback marks positions.
4. Group: items in a tray, drop/tap into group boxes; feedback per item.
5. Flash: flip card (3D rotateY with backface hidden; reduce-motion → crossfade), self-rate Chưa thuộc / Nhớ một phần / Đã thuộc → stored as mastery; not scored.
Done when: verify passes; all four kinds usable with thumb only on a 360px phone, and with keyboard only on desktop.

## Phase 6 — Essay study + rich content
Read: docs/DESIGN.md (Motion 4, Sound), docs/FORMAT.md §4, src/play/registry.ts.
Tasks:
1. `render/markdown.ts` (marked subset + DOMPurify, links target=_blank rel=noopener, images lazy) and `render/math.ts` (KaTeX + mhchem lazy-loaded only when `$` present; render errors show source text, never crash). Apply everywhere content is shown.
2. Essay component with modes (segmented: Đọc dần · Che từ khóa · Tự nhớ):
   - Đọc dần: slider (and drag anywhere on text on phones) reveals the answer word by word; unrevealed words shown as faint placeholders of the same width so layout never jumps; buttons +1 câu / hiện hết.
   - Che từ khóa: [[keywords]] masked with --mark blocks; tap to reveal one (keyword reveal motion); "Hiện tất cả"; optional typing check: tap a mask → small input; correct → reveal with check sound.
   - Tự nhớ: answer hidden; user recalls (optional textarea to write it out), then Hiện đáp án → self-rate.
   - All modes end with self-rating Chưa thuộc / Nhớ một phần / Đã thuộc → mastery; Xong goes next.
3. Study-only session: from set page "Học tự luận" plays only essay+flash items, ordering not-yet-mastered first.
4. Lora font for essay answers; comfortable reading width (≤ 68ch).
Done when: verify passes; long Vietnamese essays with math render correctly and the slider is smooth (no layout shift) on a mid phone.

## Phase 7 — Sharing, export, offline
Read: docs/FORMAT.md §8, docs/ARCH.md (Routing, In-app browsers), src/core/share.ts.
Tasks:
1. Share sheet: Sao chép liên kết, system share (`navigator.share`) when available, length warning > 12000 chars recommending HTML file, Tải tệp HTML, Tải tệp nội dung (.txt).
2. Opening `#s=` links: decode → play immediately; banner action "Lưu vào thư viện"; corrupted link → friendly screen. Test with Zalo-polluted URLs.
3. Standalone player: `player.html` + `src/player-main.ts` built by a second Vite config with `vite-plugin-singlefile` into `dist/player.html` (only player + kinds + render; fonts: inline UI font vietnamese+latin 400/600 only; KaTeX via CDN with graceful fallback). The app fetches `player.html`, injects the source into `<script type="text/plain" id="ciinder-src">` (escape `</`), downloads `<title>.html`. Progress in the standalone file uses localStorage keyed by set id.
   Update `build` script to build both and copy player.html into dist.
4. Library backup: export all sets + progress as one `.json`; import with merge (skip duplicates by id).
5. PWA: vite-plugin-pwa (generateSW), precache app shell + fonts + guide, runtime cache sfx; `autoUpdate`, a quiet toast "Đã có bản mới" with Tải lại.
6. Download helper with in-app browser fallback (copy text / open in browser instructions sheet).
Done when: verify passes; a shared link opened in a fresh profile plays; downloaded HTML works offline by double-click; app works offline after first visit.

## Phase 8 — QA & polish
Read: docs/DESIGN.md (do-not list), docs/PROGRESS.md, docs/INBOX.md.
Tasks:
1. Bundle check (`vite build` output): initial JS ≤ 90 KB gzip; move anything heavy behind `import()`.
2. Device pass at the sizes in Phase 2 + iPad split view; iOS: safe areas, input zoom (inputs ≥ 16px on iOS), rubber-band scroll, 100dvh with keyboard open. Android Chrome + Zalo UA simulation.
3. A11y: roles/labels, focus order, visible focus, contrast ≥ 4.5 for text in all 5 themes (fix tokens if needed and update DESIGN), reduced motion.
4. UI audit against the do-not list; remove any explanatory text that slipped in; unify spacing/radii; check every animation uses tokens.
5. Write `README.md` (short, Vietnamese: what it is, link, how to use with AI, credits: UI SFX CC0, fonts OFL).
6. Fix everything in docs/INBOX.md.
Done when: verify passes, deployed, PROGRESS lists remaining known issues (if any) honestly.

## Backlog (not scheduled; only if the user asks)
- In-app AI using the user's own free Gemini key (BYOK, key stays in localStorage) to generate sets directly.
- Short links via a free backend (Firebase/Supabase) for very large sets.
- Spaced-repetition schedule for flash/essay mastery; class mode with results collection.
- New kinds: hotspot on image, error-spotting in a sentence, timeline drag.
