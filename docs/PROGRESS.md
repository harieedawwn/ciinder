# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

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
