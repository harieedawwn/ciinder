# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

## Phase 13 — Start options, answer key & print, AI prompts
- `selectItems`/`kindCounts`/`sectionCounts` in `core/attempt.ts` (+ tests). StartPanel "Tùy chọn" (collapsed): Xáo thứ tự, Xáo đáp án, Dạng câu hỏi / Phần chips (`ui/Chip`), Số câu; summary line; last choice per set in localStorage (`startPrefs.ts`, includes pick seed).
- Xáo đáp án off = `Attempt.fixedOptions`, honoured by Mcq/Tf only (match/order/group/cloze keep their seeded mix, otherwise they would start solved).
- `#/key/<id>` (`views/Key`): Đề / Đáp án segmented, In = window.print(), A4 print CSS, uses the saved filter + seed of the set. Button "Đáp án & in" only in the library sheet.
- GuideSheet: second card "Lời nhắn cho AI" with the 3 `AI_PROMPTS`, read-only box + Sao chép.
- Known: not checked in a browser (headless); verify passes. All phases are now done.
Next: none — all phases complete (only Backlog items remain, on request)

## Phase 12 — Short share links (Firestore REST)
- `src/lib/cloud.ts` (plain fetch, no SDK): `put`/`get`/`shortIdFor` (id cached in IndexedDB `short:<hash>`), 8 s timeout, typed `CloudFailure`. Empty `cloud.config.ts` = feature off, app unchanged.
- Share sheet: "Sao chép liên kết"/"Chia sẻ" create `#k=<id>`; on failure fall back to the long link + toast; "Liên kết đầy đủ" kept as secondary. `#k=` opens via `Shared.svelte` (loading / offline / not-found screens); router treats `k=` like `s=`.
- Decision: write uses Firestore `:commit` with `REQUEST_TIME` transform (so `t == request.time` in docs/firestore.rules holds); collision = HTTP 409, retried once.
- Known: not tested against a real Firestore (config empty). User must: create Firestore, paste docs/firestore.rules, fill src/lib/cloud.config.ts.
Next: Phase 13 — Sonnet 5.5, medium

## Phase 11 — Redesign v2 C: player + result
- Player: each question is an IndexCard with `stack` (2/1/0 edges by remaining), counter `3 / 20` inside the card; Deck's own edges removed; top progress bar uses `--mark-strong`.
- Mcq/Tf rows are ruled (1px --line), 24px letter stamp r6 (selected = filled --ink); correct text in `<Mark>`, wrong in `strike`. Flash faces/essay answer = card with margin line; Rate = three small tabs (selected on --mark).
- Result: score in `<Mark strong delay=200>`, lg Fingerprint of this attempt, sections in an IndexCard with thin bars, wrong items = stack card with prev/next.
- Decision: Cloze bank / Match / Order / Group keep their current item styling (logic untouched); only the card around them changed. Standalone player 379 KB.
- Known: not screenshot-checked in a browser (headless); verify passes.
Next: Phase 12 — Sonnet 5.5, medium (needs src/lib/cloud.config.ts filled by the user first)

## Phase 10 — Redesign v2 B: editor, sheets, transitions
- Editor = two IndexCards (desktop, plain labels) / one card whose tabs switch panes (< 900px); Segmented removed. Issues stay under the source card.
- Sheet: margin line, `pull-in` on ≥ 600px (phones keep the slide so the spring does not fight the transform transition), optional `vtName`. Settings: `themeReveal` + `<Mark>` under the selected theme. Guide/Share content = IndexCard sections.
- Router navigation now uses `transition()`; Home opens a set with `morph(card, 'set-card')`, the set sheet panel takes the same name (opens already shown during a morph).
- Decision: sheet-closing back-morph not built (only route changes reverse). Checked editor at 390×844 and 1280×800; transitions not visually verified in a real browser (headless).
Next: Phase 11 — Sonnet 5.5, medium

## Phase 9 — Redesign v2 A: Home
- Home = desk: `HomeNav` (rail ≥ 1024 with Mark on active tab; bottom bar below), TopBar hidden on Home/Guide ≥ 1024. SetCard = tilted IndexCard + Fingerprint + Mark score, `stack` when not all answered correctly. Subject groups headed by a divider tab (≥ 2 subjects). `EmptyDesk` card with paste area; global paste on Home → editor.
- Fingerprint data comes from `views/Home/print.ts` (parses the set + last results lazily per card; no SetEntry schema change).
- Set sheet: large fingerprint + two mode IndexCards (selected = `stack-1` + `hot`); StartPanel's local `.stack` renamed `.panel` (clashes with global `.stack`).
- Decision: set sheet body is not wrapped in an extra IndexCard (Sheet gets the margin line in Phase 10). Checked empty state at 390×844 and 1280×800; library grid not screenshotted.
Next: Phase 10 — Sonnet 5.5, medium

## Review after Phase 8 (planner)
- User feedback: UI too basic/generic; sound packs sounded bad. → New brief "Layout v2" in DESIGN.md, Phases 9–10 added.
- Sound rewritten by planner: `src/lib/sound.ts` now synthesizes all cues (tick + thock), `public/sfx` removed, setting is a
  single Âm thanh switch (old pack values migrate to on/off), sfx runtime cache removed. Same `play(cue)` API.
- Then (cost): Phase 9 split into 9/10/11 for Sonnet 5.5 medium. Planner wrote the taste-critical building blocks
  (IndexCard, Mark, Fingerprint, desk.ts, desk.css, vt.ts, --mark-strong); phases only compose them (see PHASES.md).
Next: Phase 9 — Sonnet 5.5, medium

## Phase 8 — QA & polish
- Bundle: initial JS 72 KB gzip (≤ 90); markdown/KaTeX/Editor already lazy. Standalone player 163 KB gzip.
- Contrast: scripted check of ink/muted/accent/good/bad on bg, surface and soft fills; darkened accent (Lá, Đào, Oải hương), good and bad in the 4 light themes to ≥ 4.5:1. DESIGN table + theme swatches updated. Đêm already passed.
- iOS: fields get `max(16px, 1em)` only under `@supports (-webkit-touch-callout: none)` (no focus zoom; phone root is 15px); editor gutter shares `--fs-code` so line numbers stay aligned.
- Motion: dropped box-shadow transitions in Mcq/Match/Group/Rate (only transform/opacity/clip-path + cheap color fades remain). Icon buttons all labelled; reduced motion already global.
- Checked (Playwright Chromium): every guide example stepped at 360×740, 390×844, 507×900 (split view), 768×1024, 1280×800, 844×390 — no horizontal overflow, no console errors; iPhone 13 and Zalo UA editor OK. README.md added.
- Known: real iOS Safari / Zalo WebView not tested on hardware (only emulated); standalone sound needs network; shared set progress resets if its link is reopened after saving.
Next: none — all phases done (Backlog only on request)

## Phase 7 — sharing, export, offline
- Share sheet (SetSheet → Chia sẻ): copy link, `navigator.share`, long-link note > 12000, Tải tệp HTML / nội dung. `lib/download.svelte.ts` falls back to a sheet (copy link / content) inside Zalo/Facebook/etc. File names are ASCII-folded (headless Chromium dropped name + extension for diacritics).
- `#s=` links: `views/Shared` decodes from the full href, registers a temp set (`library.registerTemp`, id = hash of source), plays at once with `SaveBar` ("Lưu vào thư viện" moves progress to the new id); broken link → friendly screen. Zalo-polluted URLs covered by share tests.
- Standalone: `player.html` + `src/player-main.ts` built by `vite.player.config.ts` (singlefile; `idb-keyval` → localStorage shim, bundled KaTeX → CDN loader, text shows source offline, `BASE_URL` = hosted site so sfx play online). `dist/player.html` is emitted by the main build; `npm run build` builds both (367 KB, 163 KB gzip). Source is embedded as JSON with every `<` escaped (`core/export.ts`, tested). Fonts split into `fonts-ui/lite/lora.css` (standalone: UI 400/600 only, Lora falls back to serif).
- Backup: Settings → Sao lưu (Tải về / Mở tệp), `core/backup.ts` (tested) + merge by id; opening a backup `.json` anywhere (Home file picker, drop) merges too.
- PWA: vite-plugin-pwa generateSW, precache 49 files (1.4 MB; KaTeX ttf/woff skipped), sfx runtime cache, `lib/pwa.ts` toast "Đã có bản mới" + Tải lại. Decision: `registerType: 'prompt'` instead of autoUpdate so a quiz is never reloaded mid-question.
- Checked (Playwright): fresh-profile shared link plays, saved HTML opens from file:// offline and resumes, KaTeX loads from CDN, backup export/import into a fresh profile, app reloads offline after first visit, Zalo UA download fallback. Initial JS 72 KB gzip.
- Known: standalone sound needs network; shared set progress is lost if its link is reopened after saving (it becomes a new library set).
Next: Phase 8 — Opus 5.5, medium

## Phase 6 — essay study + rich content
- `src/render/`: `tokens.ts` (math → private-use tokens before marked, `[[kw]]` → `<mark class="kw">`, tested), `markdown.ts` (marked subset: no headings / indented code; DOMPurify; links new tab, images lazy), `math.ts` (KaTeX + mhchem + CSS, cached, errors show source in --bad), `Rich.svelte` (only `{@html}` for content). Applied to prompts, notes, options, tf, match/order/group, cloze text + bank, flash, short answer, hint/explain, editor preview, result list.
- Chunks are lazy: Play awaits markdown (+ KaTeX if the set has `$`) while reading progress, so no raw text flashes. Initial JS 63 KB gzip; markdown 28 KB, math 86 KB. Fixed base `svg{max-width:100%}` hiding KaTeX accent arrows (`\vec`).
- Essay (`play/Essay.svelte` + `essay/Reveal|Masks|Recall`, `words.ts`): Đọc dần (slider, touch drag on text, faint same-size word blocks, +1 câu / Hiện hết, progress-step at sentence ends), Che từ khóa (wipe reveal, Gõ từ khóa typing check, Hiện tất cả), Tự nhớ (textarea, Hiện đáp án). Then shared `Rate.svelte` → mastery; Xong goes next. Mode kept in session. Lora for answers, ≤ 68ch.
- `Answer` kind `essay` (unscored, counts as answered). `studyOrder` + SetSheet "Học tự luận n" (essay + flash, Chưa thuộc/unrated first). Enter no longer triggers the player inside forms / role=button.
- Checked 390×844 (touch drag reveal: no height change, no page overflow, every guide §3 formula renders) and 1280×800 (typed keyword check); no console errors.
Next: Phase 7 — Sonnet 5.5, high

## Phase 5 — interactive kinds
- `play/drag.ts`: Pointer Events drag action (touch/mouse/pen, 6px threshold, per-frame re-measure so the node stays under the pointer through edge auto-scroll and live reorders, click after drag swallowed, `touch-action: none` only on handles/chips, no text selection while dragging).
- Match (tap left/right in either order, pair number badges, tap paired to re-pick; keys 1–9 pick left then right; reveal: wrong pairs show the correct right with highlighter). Stacked columns below 520px card width.
- Order (grip drag with live reorder + `animate:flip`, Lên/Xuống buttons keep focus; reveal marks each position and shows the correct number). Group (tray + boxes; tap chip → tap box/tray, drag, or keys: 1–9 picks a tray chip then a group).
- Flash (3D rotateY flip, crossfade under reduced motion; Chưa thuộc / Nhớ một phần / Đã thuộc, keys 1–3). New `Answer` kind `flash`; ratings also kept in `prog:<id>.mastery`. Flash is never checked or scored: `Player.checkable`/`done`, unanswered counts scored items only; flash-only results show "Đã thuộc n/N thẻ".
- Core helpers `matchRights`, `orderStart` (never pre-solved), `groupTray` + `core/kinds.test.ts`.
- Checked 390×844 / 360×740 touch (CDP touch drag for order + group) and 1280×800 keyboard + mouse drag; no console errors.
Next: Phase 6 — Opus 5.5, medium

## Phase 4 — player core
- `play/` registry + Mcq (single/multi), Tf (Đ/S per statement, a–f labels), Short (decimal keyboard when numeric), Cloze (inputs or tap bank), Note (collapsible above its questions). Feedback: highlighter wipe / shake + strike (`styles/feedback.css`, `lib/wipe.ts`).
- Play view: card deal (`views/Play/deal.ts`, JS twin of --spring), stack edges, highlighter progress stroke, counter → question grid sheet, keys 1–9 / Enter / ←→, touch swipe outside controls. Practice: Kiểm tra, verdict, Giải thích, Gợi ý; streak sounds 3/5/10. Test: timer from `@time` (deadline stored, auto-submit), Nộp bài confirm when unanswered.
- `core/attempt.ts` (tested): seeded question order (within sections, note groups kept together), option order (respects shuffle=no), bank words, section breakdown. `state/progress.svelte.ts`: `prog:<id>` with current attempt (resume), last attempt, history, per-item results.
- Result view: %, /10, per-section bars, wrong list; Làm lại câu sai / Làm lại / Xem lại (new `#/review/<id>` route, read-only replay). Set sheet shows Tiếp tục n/N when an attempt is open.
- Decisions: only kinds in the registry are played (match/order/group/flash join in Phase 5, essay in 6); prompts are plain text until `src/render/` (Phase 6). Fixed Sheet crash when a route change unmounts a closing sheet.
- Checked 390×844 and 1280×800 (Playwright end-to-end: practice, reload resume, retry wrong, test submit, review). Initial JS 54 KB gzip.
Next: Phase 5 — Opus 5.5, medium

## Phase 3 — import & editor
- Guide sheet (`#/guide` opens it over the library): Sao chép (clipboard + execCommand fallback, then visible textarea) / Tải về. Editor (lazy chunk, 4 KB gzip): textarea + line gutter, 250 ms debounced parse, issues panel (tap → selects line; warnings collapsed), "Sao chép báo cáo lỗi", preview (tabs on phones, side-by-side ≥ 900px), save → library → set sheet opens.
- Set sheet on card tap: Luyện tập/Làm bài + shuffle (defaults from `@mode`/`@shuffle`, stored in `state/session.svelte.ts`), Sửa, Chia sẻ (disabled until Phase 7).
- Import: Dán nội dung / Mở tệp / drag & drop (library + editor); JSON (`source` or array / `{sets}`) saved straight to the library (`core/importjson.ts`, tested).
- Decisions: unsaved guard = `leaveGuard` in router (hash restored + confirm sheet) + beforeunload; preview shows plain text (rich render in Phase 6); no wrapping in the editor so gutter lines match.
- Known: play route is still a placeholder; Bắt đầu only sets options and opens it.
Next: Phase 4 — Opus 5.5, medium

## Phase 2 — app shell, design system, sound, library home
- Styles (5 themes, fonts via own @font-face with vi/latin unicode-range, motion tokens + ink press), settings/router/library rune stores, sound (Web Audio, lazy pack, gains/throttles), fullscreen (+ focus-mode fallback, F key), env, haptics.
- UI kit: Button, Icon, Sheet (native <dialog>, swipe-down on phones), Toast (+ undo), Segmented, Switch, Menu. Top bar, Settings sheet, Library home + set cards; other routes are placeholders.
- Icons: `public/icon.svg` + `favicon.svg`; PNGs via `npm run icons` (@resvg/resvg-js dev dep); manifest + apple-touch-icon.
- Decisions: settings is local sheet state, not a `#/settings` route; theme hint in localStorage read by inline script in index.html (no flash); `lib/fullscreen.svelte.ts` (runes) instead of `.ts`.
- Library index carries `lastScore`/`openedAt` (player writes via `touchSet`); delete is deferred until the undo toast expires.
- Known: Đổi tên changes the stored title only; re-saving the source in the editor (Phase 3) re-derives title from `# ...`. Mở tệp / Dán nội dung both route to `#/new` for now.
- Checked 390×844 and 1280×800 in Chromium; initial JS 34.6 KB gzip.
Next: Phase 3 — Sonnet 5.5, medium

## Phase 1 — core engine
- `src/core/`: types, normalize, issues (+ `issuesReport`), parse (document) + block (per-kind body), grade, shuffle, share; 69 Vitest tests incl. guide sync + 300-item perf.
- Decisions: issue lines point at the block's `---` header; `W_NO_EXPLAIN` is one summary issue with the count; report sends errors only (or non-lenient warnings when error-free).
- `note` content is `prompt` (no separate `body`); empty notes are dropped. tf `(Đ)/(S)` suffix overrides a `+`/`-` prefix (spec).
- `grade.ts` `Answer` union fixes response shapes for players (indices are original, unshuffled order); `scoreSet` gives ratio/percent/ten.
- Share decode verifies adler32 itself (fflate's `unzlibSync` doesn't) → truncated links fail cleanly; `LINK_SOFT_MAX = 12000`.
- Math spans are atomic (`core/mathspan.ts`): `{{ [[ ::` inside `$…$` never split (from Phase 6 note, done now).
- Known: single `.` in numbers is decimal ("1.234" = 1.234), multiple must group by 3.
Next: Phase 2 — Opus 5.5, medium

## Phase 0 — scaffold (planner)
- Vite 8 + Svelte 5 + TS scaffold, deps installed (see ARCH), base `/ciinder/`, `npm run verify` passes.
- `.github/workflows/deploy.yml`: deploys to Pages only when commit message contains `[deploy]` (or manual run).
- `public/sfx/{soft,glass,minimal}` — UI SFX (romainsimon/uisfx, CC0), cue list in DESIGN.md.
- `public/ciinder-guide.md` — the guide users give to their AI (final draft; parser must accept all its examples).
- Specs written: FORMAT, ARCH, DESIGN, PHASES.
Next: Phase 1 — Sonnet 5.5, medium
