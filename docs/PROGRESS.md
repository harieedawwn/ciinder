# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

## Phase 1 — core engine (Sonnet 5.5, medium)
- `src/core/`: types, normalize, issues, preprocess/tokens/walk, build(+build-text), math, parse, grade, shuffle (mulberry32), share; 71 tests incl. guide-sync (every ```text example parses with 0 errors) and 300-item perf.
- Decisions: share decode verifies adler32 itself (fflate skips it) so truncation is always detected; tf allows 2–8 statements (FORMAT) though guide says 2–6; "1.000" parses as 1 (single dot = decimal), "1.000.000" as thousands; fenced-block stripping only when text doesn't already start with a ciinder line.
- Answer shapes for grade.ts are documented at the top of `grade.ts` (match/group/order indices) — Phase 4/5 players must follow them.
- Known issues: none.
Next: Phase 2 — Opus 5.5, medium

## Phase 0 — scaffold (planner)
- Vite 8 + Svelte 5 + TS scaffold, deps installed (see ARCH), base `/ciinder/`, `npm run verify` passes.
- `.github/workflows/deploy.yml`: deploys to Pages only when commit message contains `[deploy]` (or manual run).
- `public/sfx/{soft,glass,minimal}` — UI SFX (romainsimon/uisfx, CC0), cue list in DESIGN.md.
- `public/ciinder-guide.md` — the guide users give to their AI (final draft; parser must accept all its examples).
- Specs written: FORMAT, ARCH, DESIGN, PHASES.
Next: Phase 1 — Sonnet 5.5, medium
