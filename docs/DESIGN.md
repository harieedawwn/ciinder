# DESIGN — look, motion, sound, words

> v2 (after user review): the v1 build was clean but generic — centered column of buttons, nothing memorable.
> Section "Layout v2" below is now the main brief. Calm and clean still, but every screen must have a recognisable idea.

Idea: **study desk**. Questions are index cards that deal from a stack; the accent of the app is a **highlighter**
(keyword masks, progress, correct marks are highlighter strokes). Clean, calm, tactile. Content is the hero.

## Hard "do not" list (these are the AI-template defaults we refuse)
- No gradients of any kind (backgrounds, buttons, text). No glow, neon, bloom, colored shadows, glassmorphism / `backdrop-filter`.
- No emoji anywhere in UI. No decorative blobs, floating circles, random geometric shapes, noise textures, grid backgrounds.
- No helper paragraphs, captions explaining features, "Tip:" boxes, tooltips on obvious buttons, onboarding carousels. Labels are short nouns/verbs. If something needs explaining, redesign it.
- No pill-shaped everything (radius rules below), no "01 / 02 / 03" numbered section labels, no monospace decoration labels, no italic accent word in headings, no ALL-CAPS tracking-wide eyebrow labels, no centered marketing hero with a tagline.
- No confetti, no bouncing mascots, no arcade sounds.
- Icons: one consistent stroke set (1.75px stroke, round caps, 24 grid), inline SVG in `ui/Icon.svelte`. Only where they help recognition.

## Themes (`src/styles/tokens.css`, `[data-theme]` on <html>, persisted; default follows system light/dark → Sáng/Đêm)
| token | Sáng | Lá | Đào | Oải hương | Đêm |
|---|---|---|---|---|---|
| --bg | #F4F5F7 | #ECF0EA | #F7EDEA | #EEECF6 | #121416 |
| --surface | #FFFFFF | #FBFCFA | #FFF9F7 | #FCFBFF | #1B1E22 |
| --raised | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #23272C |
| --ink | #16181D | #18221B | #2B1E1C | #1F1B2E | #E9E6E1 |
| --muted | #636A75 | #5D6B60 | #7A6561 | #686279 | #9A9790 |
| --line | #E2E5EA | #D9E0D7 | #EBDAD5 | #DEDAEC | #2C3036 |
| --accent | #2B59C3 | #3B7149 | #A34740 | #6752BC | #E3B15C |
| --on-accent | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #1A1408 |
| --accent-soft | #E3EAF8 | #DDE9DF | #F6DEDA | #E5E0F6 | #3A3122 |
| --mark (highlighter) | #FFE27A | #F3D98B | #FFD9A8 | #FFE48A | #6B5622 |
| --good | #1F7751 | #2C7445 | #2C7451 | #2C7455 | #6FC49A |
| --good-soft | #DDF1E6 | #DCEEDF | #DDEFE3 | #DDEFE6 | #1E3A2D |
| --bad | #B23D34 | #AC4237 | #B2362E | #AF3E38 | #E5796E |
| --bad-soft | #F8E1DE | #F5E0DC | #F7DCD7 | #F6E0DE | #42231F |
Text pairs (ink/muted/accent/good/bad on bg, surface and their soft fills) are ≥ 4.5:1 in every theme; Phase 8 darkened accent/good/bad where needed.
Theme names in UI exactly: Sáng, Lá, Đào, Oải hương, Đêm. Theme picker = row of small swatch cards (bg + accent + mark), no text descriptions. Update `<meta name="theme-color">` on change.

## Type
- UI: Be Vietnam Pro 400/500/600/700 (fontsource, vietnamese+latin subsets). Essay answers & long passages: Lora 400/600.
- Scale (rem): 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75. Line-height 1.5 body, 1.25 headings. `font-variant-numeric: tabular-nums` for scores/timers.
- Question text 1.125rem, options 1rem. Headings weight 600, never 800+.

## Shape & space
- Radius: cards 14px, buttons/inputs 10px, chips 8px, sheets 18px top corners. Fully round only for icon-only circular buttons.
- Borders 1px `--line`. Elevation: only `--raised` + `0 1px 2px rgb(0 0 0 / .06)`; dragged item gets `0 8px 24px rgb(0 0 0 / .12)` (neutral, never colored).
- Spacing: 4px base (4, 8, 12, 16, 20, 24, 32, 48). Player column max-width 680px; library grid min card 260px.
- Touch targets ≥ 40px even when visuals are smaller on phones.

## Motion (`src/styles/motion.css` + Svelte transitions)
Tokens: `--ease-out: cubic-bezier(.22,1,.36,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`, `--spring: linear(0, .5 7%, .86 15%, 1.02 24%, 1.04 30%, 1.01 41%, 1 100%)` (fallback --ease-out).
Durations: 120ms micro, 220ms standard, 360ms large. `prefers-reduced-motion` or setting → only opacity fades ≤120ms.
Signature interactions (these make the app feel unique — build them well, keep them cheap):
1. **Card deal** (next question): current card leaves up-left (translate −24px, rotate −2°, fade) while next card rises from the stack beneath (scale .97→1, translateY 12px→0, --spring). Behind the active card, 1–2 offset card edges hint the remaining stack. Previous = mirrored.
2. **Ink press** (choosing an option): fill expands from the pointer position via `clip-path: circle()` in --accent-soft, 220ms. Selected option keeps a 2px accent left edge.
3. **Highlighter mark** (correct): a --mark stroke wipes left→right behind the correct text (clip-path inset, 360ms, slight skew, rounded ends). Wrong: short 2px horizontal shake once (180ms) + strike line drawn through the text in --bad.
4. **Keyword reveal** (essay mask): masked keyword is a --mark block of the same width; tapping wipes it away to reveal the word.
5. **Progress**: thin highlighter stroke along the top of the player that grows with --ease-out.
6. **Route change**: View Transitions API cross-fade + 8px slide when supported; otherwise Svelte fade/fly 220ms.
7. **Sheets/dialogs**: bottom sheet on phones (drag handle, swipe down to close), centered dialog ≥ 600px. Scrim `rgb(0 0 0 / .32)`, no blur.
Never animate width/height/top/left. Never run continuous animations while idle.

## Sound (`src/lib/sound.ts`, synthesized — no audio files)
Every cue = band-passed noise tick (2–5 ms contact) + pitch-dropping triangle body (thock), low-passed, through a light
compressor. Character: short, dry, solid ("đặc"), low-mid. Never chimes, bells, arcade bleeps or reverb.
Single setting: Âm thanh on/off (Switch, next to Rung). Tune only in RECIPES inside sound.ts; keep every cue ≤ 200 ms except
complete/achievement (≤ 400 ms). Same event→cue map as before (press, select, check, error, forward/back, snap, drop, streak at 3/5/10...).
Haptics: `navigator.vibrate(8)` on correct, `[6,40,6]` on wrong (Android); own toggle "Rung".

## Words (Vietnamese, plain, friendly, never cute)
Use these labels (sentence case, no "!" spam, no emoji, no slang, no hype):
Thư viện · Tạo bộ mới · Dán nội dung · Mở tệp · Hướng dẫn cho AI · Sao chép · Tải về · Lưu · Xem trước · Bắt đầu · Tiếp tục · Kiểm tra · Câu tiếp · Câu trước · Nộp bài · Xem lại · Làm lại · Làm lại câu sai · Chia sẻ · Sao chép liên kết · Tải tệp HTML · Tải tệp nội dung · Cài đặt · Giao diện · Âm thanh · Rung · Cỡ chữ · Giảm chuyển động · Toàn màn hình · Gợi ý · Giải thích · Đúng · Sai · Đã thuộc · Nhớ một phần · Chưa thuộc · Xong · Xóa · Đổi tên · Nhân bản.
Mode names: Luyện tập (practice) · Làm bài (test). Essay modes: Đọc dần · Che từ khóa · Tự nhớ.
Empty library: one short line + the three primary actions (Hướng dẫn cho AI, Dán nội dung, Mở tệp). Nothing else.
Errors: say what happened + what to do, one line each. No blaming the user.

## Icon & brand
Wordmark: lowercase "ciinder", Be Vietnam Pro 600, ink color, no logo lockup tricks.
App icon (SVG master `public/icon.svg` → PNG 192/512/maskable/apple-touch 180 generated by a script with `sharp` or `@resvg/resvg-js` dev dep):
rounded square in --accent (#2B59C3); centered a slightly rotated (−6°) white index card with soft corner; across the card one thick
--mark (#FFE27A) highlighter stroke with round ends shaped like a lowercase "c" opening to the right. Flat colors, no gradient, no shadow.
Must read clearly at 16px (favicon variant may drop the card and keep only the "c" stroke on accent).

## Layout v2 — the desk (main brief for Phases 9–10)
Metaphor, used consistently: the screen is a **desk**, sets are **index cards**, navigation are **divider tabs**, the accent
is the **highlighter**. Paper details are subtle and functional (one margin line, tabs, stacks) — never skeuomorphic
textures, never background patterns.

### Signature elements (build as reusable ui/ components)
1. `IndexCard`: surface card, 14px radius, 1px line, a single thin vertical **margin line** in --accent-soft 18px from
   the left edge (index-card feel), content starts after it. Optional `tab` prop: a divider tab sticking out of the top edge
   (rounded top corners 8px, 1px line, same surface colour, label 0.8125rem 600) — used for section labels and actions.
2. **Set fingerprint**: every set card shows one row of thin vertical ticks, one per question, coloured by kind
   (mcq/tf/short/cloze: --ink at 3 opacities; match/order/group: --accent; essay/flash: --mark-strong). It is the set's
   visual identity — unique per set, informative, zero text. Ticks already answered correctly in the last attempt are full
   height, others half height → the fingerprint doubles as progress.
3. **Highlighter** (`ui/Mark.svelte`): a --mark stroke with slightly irregular rounded ends (SVG path, not a rectangle)
   drawn behind text with a left→right clip-path wipe. Used for: active nav tab label, last score under set titles,
   correct answers, score numeral on Result, selected theme. One component, everywhere.
4. **Stack**: cards with remaining items show 1–2 offset edges beneath (translate 4/8px, rotate ±1°), drawn with
   pseudo-elements (cheap). Sets with progress show the stack; finished sets lie flat.

### Screens
- **Home (desk)**. Desktop ≥ 1024: left rail 248px: wordmark at top, then vertical divider tabs "Thư viện",
  "Tạo bộ mới", "Hướng dẫn cho AI" (active one marked with the highlighter), settings + fullscreen at the bottom of the rail.
  Right: the desk — set cards in a masonry-like grid, each with a tiny stable tilt (−1.2°…1.2°, derived from set id hash)
  that straightens to 0° and lifts 3px on hover/focus (--spring). Group by subject when ≥ 2 subjects: each group headed
  by a divider tab with the subject name. Phone: top bar (wordmark left, icons right), cards in one column without tilt,
  bottom bar with the 3 actions as compact tabs (thumb zone, safe-area aware).
- **Empty desk**: one large IndexCard (max 560px) slightly tilted, title "Chưa có bộ câu hỏi nào." on the first ruled
  position; inside, the paste area itself: a big quiet field "Dán nội dung vào đây" — pasting (or Ctrl/Cmd+V anywhere on
  Home) goes straight to the editor with the text. Two divider tabs on the card's top edge: "Hướng dẫn cho AI" (primary,
  accent) and "Mở tệp". Dropping a file anywhere: the whole card straightens and its margin line turns --accent.
- **Set detail** (sheet): the set's IndexCard opens big: title, fingerprint at large size, mode choice as two
  side-by-side cards (Luyện tập / Làm bài) with the chosen one stacked "on top", Bắt đầu as a full-width primary button.
- **Editor**: two IndexCards side by side on desktop (source | preview) like cards on a desk; phone: one card with two
  tabs. Issues appear as small notes clipped to the card's right edge at the line's height (desktop) / a list under the
  card (phone).
- **Player**: the question is an IndexCard centred on the desk with the remaining stack visible beneath; counter top-left
  as `3 / 20` in muted tabular numbers; progress = highlighter stroke across the top of the screen. Options are rows on
  the card's ruled lines (1px --line between them), each with a small square letter stamp (A B C D, 24px, 6px radius);
  selected = stamp filled --ink + ink-press fill. Bottom action bar fixed, thumb reachable on phones.
- **Result**: big score numeral (3.5rem, tabular) with the highlighter drawn under it after a 200ms delay; under it the set
  fingerprint in final state; sections as rows with mini bars; wrong items as a small stack of cards you can flip through.

### Transitions (the memorable part; all transform/opacity/clip-path; reduced motion → fades)
1. **Card → screen morph**: opening a set uses the View Transitions API with `view-transition-name` on the tapped card
   so it grows into the set sheet / player card; back reverses it. Fallback (no VT API): FLIP with Web Animations.
2. **Deal**: next question as in Motion §1 (current card slides out up-left with −2° rotate, next rises from the stack).
3. **Tab switch**: highlighter slides between divider tabs (one element animated with transform), content cross-fades
   with 6px horizontal shift in the tab's direction.
4. **Theme change**: View Transition with an expanding `clip-path: circle()` from the tapped swatch.
5. **Sheet**: rises with --spring and a 1.5° rotation that settles to 0 (like pulling a card), scrim fades.
6. **Press**: every button/card scales to .97 on pointerdown, springs back on release. Primary buttons: a highlighter
   underline grows under the label on hover (desktop only).
7. **Stagger**: on first Home render cards fall onto the desk with 30ms stagger (translateY 10px + rotate settle),
   max 12 cards animated, rest appear instantly.
Budget: 60 fps on a mid Android phone; max 2 animated elements per transition besides the moved cards; no animation
loops at idle.

### New tokens
`--mark-strong` (more saturated highlighter for ticks: Sáng #F2C230, Lá #D9B34A, Đào #F2A65A, Oải hương #EBC23F, Đêm #C9A227),
`--desk` (desk background, = --bg), `--tilt` set per card inline. Keep every other token.
