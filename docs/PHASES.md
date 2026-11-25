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
| 9 | Redesign v2 A: Home desk, empty state, set sheet | Sonnet 5.5 | medium | no |
| 10 | Redesign v2 B: editor, sheets, theme reveal, morph into player | Sonnet 5.5 | medium | yes |
| 11 | Redesign v2 C: player, question kinds, result | Sonnet 5.5 | medium | yes |
| 12 | Short share links via Firebase Firestore (REST, no SDK) | Sonnet 5.5 | medium | yes |
| 13 | Start options (filters, count, shuffle answers), answer key / print, AI prompts in Guide sheet | Sonnet 5.5 | medium | yes |

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
   Math must look good: every syntax in guide §3 tables renders (test them on one page); `$$` blocks centered, horizontally scrollable on phones (never overflow the card); inline math vertically aligned with text and sized ~1.05em; KaTeX CSS + fonts loaded lazily with the math chunk; math color follows --ink (and --good/--bad inside feedback). Also render math inside options, tf statements, match/order/group items, cloze text, flash and essay. Parser treats `$...$` as atomic (never split on `{{`, `[[`, `::` inside math).
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

## Redesign v2 — building blocks (ALREADY WRITTEN by the planner, use them, don't rewrite them)
- `src/ui/IndexCard.svelte` — card with margin line + `tabs` prop (divider tabs on top edge; `primary`, `active`, `onclick`), `hot`, `plain`.
- `src/ui/Mark.svelte` — highlighter behind text: `<Mark on={x} strong delay={200}>…</Mark>`.
- `src/ui/Fingerprint.svelte` — `<Fingerprint kinds={Kind[]} done={boolean[]} size="sm|lg" />`.
- `src/ui/desk.ts` — `tiltFor(id)` → `"0.73deg"` for `style="--tilt: …"`.
- `src/styles/desk.css` (global classes): `press` (spring press), `tilt` (tilted card, straightens on hover; flat on phones),
  `stack` / `stack stack-1` (card edges beneath), `fall` + `style="--i: n"` (stagger in), `pull-in` (sheet entrance), `strike` + `on`.
- `src/lib/vt.ts` — `transition(update)`, `morph(el, name, update)` (shared-element morph via View Transitions), `themeReveal(x, y, update)`.
- Tokens: `--mark-strong` added. DESIGN.md "Layout v2" describes the intended result for every screen.
Rule for 9–11: compose these; style with existing tokens; do not add new visual ideas beyond the brief.

## Phase 9 — Redesign v2 A: Home
Read: docs/DESIGN.md "Layout v2" (Screens: Home, Empty desk, Set detail), the building blocks above, src/views/Home/*.
Tasks:
1. Layout: ≥ 1024px → left rail 248px (wordmark; vertical tabs Thư viện / Tạo bộ mới / Hướng dẫn cho AI with `<Mark on>`
   behind the active label; settings + fullscreen icons at rail bottom) + desk area. < 1024px → existing top bar + a bottom
   bar with the same 3 actions (icon above short label, safe-area padding).
2. SetCard → IndexCard with `class="tilt press fall"`, `style="--tilt:{tiltFor(id)}; --i:{index}"`, `stack` when the set has
   unfinished progress. Content: title (1.25rem 600), subject · số câu in muted, `<Fingerprint>` (done = last-attempt correct),
   last score as `<Mark on strong>` behind the % text. Grid: `repeat(auto-fill, minmax(260px, 1fr))`, gap 24px desktop / 12px phone.
3. Group cards by subject when ≥ 2 subjects: each group has a header rendered as a single divider tab (IndexCard tabs style
   on a thin line), then its grid.
4. Empty desk: one IndexCard (max-width 560px, `tilt`, --tilt -1deg) with tabs [Hướng dẫn cho AI (primary), Mở tệp];
   title "Chưa có bộ câu hỏi nào."; below it a large textarea-like button "Dán nội dung vào đây" (min-height 160px,
   solid 1px --line, radius 10px, muted text) that reads the clipboard / focuses a paste field.
   Global `paste` event on Home (when focus isn't in an input) → open editor with the pasted text. Drag-over → `hot` on the card.
5. Set sheet: content wrapped in an IndexCard look; big `<Fingerprint size="lg">`; mode choice = two small IndexCards side by
   side (Luyện tập / Làm bài), selected one gets `stack stack-1` + `hot`; Bắt đầu full width primary.
6. Remove unused old Home CSS. Check 390×844 and 1280×800 (≤ 4 screenshots).
Done when: verify passes; Home matches the brief.

## Phase 10 — Redesign v2 B: editor, sheets, transitions
Read: docs/DESIGN.md "Layout v2" (Editor, Transitions), building blocks, src/views/Editor/*, src/ui/Sheet.svelte, src/views/Settings/SettingsSheet.svelte, src/state/router.svelte.ts.
Tasks:
1. Editor: desktop = two IndexCards side by side (tabs: [Nội dung] and [Xem trước]); phone = one IndexCard whose tabs switch
   the two panes. Issues: under the source card as a compact list (keep current behaviour).
2. Sheet.svelte: panel uses `pull-in` and the IndexCard margin line (add the same `::before` line), no other change in behaviour.
3. Settings theme swatches: on click call `themeReveal(e.clientX, e.clientY, () => settings.theme = id)`; selected swatch
   shows `<Mark on>` under its name.
4. Route changes: wrap router navigation in `transition()`. Opening a set from Home: `morph(cardEl, 'set-card', open)`; the
   set sheet's card element gets `style="view-transition-name: set-card"` while open. Back reverses naturally.
5. Guide and Share sheets: content as IndexCard sections (tabs as section labels instead of h3 headings).
Done when: verify passes; transitions work in Chrome/Safari 18 and degrade to instant in Firefox / reduced motion.

## Phase 11 — Redesign v2 C: player + result
Read: docs/DESIGN.md "Layout v2" (Player, Result), building blocks, src/views/Play/Deck.svelte, src/views/Play/ItemView.svelte,
src/play/Mcq.svelte (then apply the same pattern to the other kinds one by one), src/views/Result/Result.svelte.
Tasks:
1. Deck: each question is an IndexCard with `stack` (stack-1 when 1 left, none on last). Counter `3 / 20` top-left of the
   card (muted, tabular). Progress highlighter at screen top: a `--mark-strong` bar scaled with `transform: scaleX()`.
2. Options (Mcq, Tf rows, Cloze bank words, Match/Order/Group items): rows separated by 1px --line (ruled lines), letter
   stamp 24px square radius 6px (outlined; selected → filled --ink, text --surface). Correct → text wrapped in `<Mark on>`;
   wrong → `strike on`. Keep all logic, only markup/CSS.
3. Flash faces and essay answer area as IndexCards; Rate buttons as three small tabs.
4. Result: score numeral 3.5rem 600 tabular inside `<Mark on strong delay={200}>`; `<Fingerprint size="lg">` of this attempt;
   section rows with thin bars (transform scaleX); wrong items as a `stack` IndexCard you can step through (prev/next).
5. Standalone player inherits all of this (same components); keep its size < 400 KB.
Done when: verify passes; full set plays on 390×844 and 1280×800 without layout jumps.

## Phase 12 — Short share links (Firestore REST)
Read: docs/FORMAT.md §8, src/core/share.ts, src/views/Share/ShareSheet.svelte, src/views/Shared/*, src/lib/cloud.config.ts (user fills it).
Why: big sets make `#s=` links 10k+ chars (ugly, Zalo shows a wall of text). Store the compressed payload in Firestore, share `#k=<id>`.
Tasks:
1. `src/lib/cloud.config.ts` exports `{ apiKey, projectId }` (public web config, not a secret). If empty → feature off, app behaves as before.
2. `src/lib/cloud.ts` with plain `fetch` (NO firebase SDK):
   - `put(payload)`: id = 10 random chars [A-Za-z0-9] (crypto.getRandomValues); POST
     `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/sets?documentId=${id}&key=${apiKey}`
     body `{ fields: { z: { stringValue: payload }, t: { timestampValue: new Date().toISOString() } } }`. Retry once with a new id on 409.
   - `get(id)`: GET `.../documents/sets/${id}?key=${apiKey}` → `fields.z.stringValue`. Timeout 8 s, clear errors.
   - Cache: same source hash → reuse id (IndexedDB `short:<hash>`), so sharing twice doesn't create two docs.
3. Share sheet: "Sao chép liên kết" creates the short link (`#k=<id>`), shows a quiet spinner ≤ 8 s; on failure/offline falls back to
   the long `#s=` link with toast "Không tạo được liên kết ngắn, đã dùng liên kết đầy đủ". Keep "Liên kết đầy đủ" as a secondary option.
4. Opening `#k=<id>`: same robust href parsing as `#s=` (regex `/[#&?]k=([A-Za-z0-9]{6,16})/`, survives Zalo params), fetch, decode, play.
   Offline/not found → friendly screen. Saved sets remember their short id.
5. Firestore rules text in `docs/firestore.rules` (user pastes it in the console):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /sets/{id} {
         allow get: if true;
         allow list, update, delete: if false;
         allow create: if request.resource.data.keys().hasOnly(['z','t'])
           && request.resource.data.z is string && request.resource.data.z.size() < 900000
           && request.resource.data.t == request.time;
       }
     }
   }
   ```
   (Use `t: { timestampValue }` = server-checked; if `request.time` equality is too strict over REST, switch the write to a
   `commit` with `transform setToServerValue: REQUEST_TIME` and keep the rule.)
6. Tests for id format, href parsing with Zalo params, fallback path (mock fetch).
Done when: verify passes; with config filled, a 300-question set shares as a ~60-char link that opens on another device.

## Phase 13 — Start options, answer key & print, AI prompts
Read: src/views/Home/StartPanel.svelte, src/state/session.svelte.ts, src/core/attempt.ts, src/views/Guide/GuideSheet.svelte,
src/lib/aiPrompts.ts (planner wrote the texts — use them verbatim), docs/DESIGN.md "Layout v2" + "Words".
Tasks:
1. StartPanel "Tùy chọn" (collapsed by default, one tab-like toggle on the panel; remembers last choice per set):
   - Xáo thứ tự câu hỏi (existing) + **Xáo đáp án** (new switch; off = keep author order everywhere, still respects shuffle=no).
   - **Dạng câu hỏi**: chips per kind present in the set with counts (e.g. "Trắc nghiệm · 96"); none selected = all.
   - **Phần**: chips per `##` section with counts; none selected = all. Show max 8 then "Xem thêm".
   - **Số câu**: Tất cả · 10 · 20 · 30 · 40 (only values < available); picks randomly (seeded) from the filtered pool.
   - One summary line above Bắt đầu: "20 câu · Luyện tập · từ 26 câu" (numbers in tabular 600; no extra wording).
   Implement selection in `core/attempt.ts` as a pure function `selectItems(set, {kinds, sections, count, seed})` + tests.
   Chips: our style (radius 8px, 1px line, selected = --ink fill + --surface text). NOT pills, NOT neon, no helper captions.
2. **Đáp án & in** (button in StartPanel, quiet variant): route `#/key/<id>` — clean printable answer key of the filtered
   selection: each item with correct answer marked (Mark), explanation; segmented "Đề" / "Đáp án" (Đề hides answers).
   Print CSS: white bg, black text, no UI chrome, `break-inside: avoid` per item, A4 margins; button "In" calls window.print().
3. GuideSheet: keep Sao chép / Tải về for the guide file; add below a second IndexCard tab "Lời nhắn cho AI" with the 3 prompts
   from `AI_PROMPTS` as a Segmented (Lên kế hoạch trước · Làm ngay · Chuyển đề có sẵn), the selected text shown in a quiet
   read-only box, and a Sao chép button. One short line on top only: "Gửi tệp hướng dẫn và tài liệu cho AI, kèm một lời nhắn."
4. Check 360px (no overflow, long section names wrap) and 1280px; print preview of the key looks clean.
Done when: verify passes; filters + count produce the right attempt; key page prints well.

## Backlog (not scheduled; only if the user asks)
- In-app AI using the user's own free Gemini key (BYOK, key stays in localStorage) to generate sets directly.
- Short links via a free backend (Firebase/Supabase) for very large sets.
- Spaced-repetition schedule for flash/essay mastery; class mode with results collection.
- New kinds: hotspot on image, error-spotting in a sentence, timeline drag.
