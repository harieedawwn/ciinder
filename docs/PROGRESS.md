# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

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
