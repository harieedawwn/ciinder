# PROGRESS

Newest on top. Each phase adds ≤ 8 lines: what was done, decisions, known issues. Last line of each entry: `Next: Phase N — <model>, <effort>`.

## Phase 0 — scaffold (planner)
- Vite 8 + Svelte 5 + TS scaffold, deps installed (see ARCH), base `/ciinder/`, `npm run verify` passes.
- `.github/workflows/deploy.yml`: deploys to Pages only when commit message contains `[deploy]` (or manual run).
- `public/sfx/{soft,glass,minimal}` — UI SFX (romainsimon/uisfx, CC0), cue list in DESIGN.md.
- `public/ciinder-guide.md` — the guide users give to their AI (final draft; parser must accept all its examples).
- Specs written: FORMAT, ARCH, DESIGN, PHASES.
Next: Phase 1 — Sonnet 5.5, medium
