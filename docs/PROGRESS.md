# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

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
