# ciinder

Static web app (GitHub Pages, no backend): users get `public/ciinder-guide.md`, give it + study material to any AI,
paste the AI's text output here, and it becomes interactive quizzes / essay-study cards they can share by link or HTML file.
UI language: Vietnamese. Code, comments, commit messages: English.

## Commands
- `npm run dev` · `npm run verify` (= check + test + build; must pass before every commit)

## Where things are (details: docs/ARCH.md)
- `src/core/` pure TS logic + tests (parse, grade, share) · `src/play/` one component per question kind + registry
- `src/views/` screens · `src/ui/` shared components · `src/state/` rune stores · `src/lib/` browser helpers · `src/styles/` tokens
- Session prompt the user pastes: docs/SESSION_PROMPT.xml
- Specs: docs/FORMAT.md (text format, grading, share codec) · docs/DESIGN.md (look, motion, sound, words) · docs/PHASES.md (plan) · docs/PROGRESS.md (log) · docs/INBOX.md (user notes)

## Rules
- Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`); no Svelte 4 stores/syntax. TypeScript strict.
- No new runtime dependencies without a strong reason (bundle budget in ARCH). Prefer platform APIs.
- Keep files small and single-purpose (< ~300 lines). New question kind = parser case + `src/play/<Kind>.svelte` + registry line + guide section + tests.
- `public/ciinder-guide.md` and `src/core/parse.ts` must stay in sync (a test parses every guide example).
- Follow docs/DESIGN.md strictly, especially the "do not" list. All user-facing strings Vietnamese, from the Words list when possible.
- Content from links/files is untrusted: render only through `src/render/` (sanitized).
- Hash routing only; never read data from `location.search`.
- Mobile overflow: every `display: grid` container sets `grid-template-columns: minmax(0, 1fr)` (or explicit columns); flex/grid children holding text get `min-width: 0`. After UI changes, check at 360px that `scrollWidth == clientWidth` with a long title and formulas.

## Workflow
- Work on `main`. Commit: `phase N: <summary>`; add `[deploy]` to the message only when the phase says Deploy: yes (CI deploys only then).
- Don't read whole folders "to get familiar" — open what the current task needs (grep/glob first).
- Ask the user nothing during a phase unless truly blocked; make sensible decisions and note them in docs/PROGRESS.md.
