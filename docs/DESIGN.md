# DESIGN — look, motion, sound, words

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

## Sound (`src/lib/sound.ts`, files in `public/sfx/<pack>/` — UI SFX by romainsimon, CC0)
Packs (setting "Âm thanh"): Tắt · Mềm (`soft`, default) · Trong (`glass`) · Gọn (`minimal`). Master gain .5, per-cue gain below.
| event | file | gain | rule |
|---|---|---|---|
| button tap | press | .35 | throttle 60ms; not for every tiny control |
| choose option / tf / bank word | select | .5 | |
| unselect | deselect | .4 | |
| answer correct | check | .7 | |
| answer wrong | error | .45 | soft, never repeated in a row within 400ms |
| next / previous question | forward / back | .4 | |
| reveal keyword / hint / explanation | expand | .45 | |
| collapse | collapse | .35 | |
| match pair made | snap | .55 | |
| drag start / drop / reorder | drag-start / drop / reorder | .4 | |
| toggle setting | toggle-on / toggle-off | .4 | |
| open / close sheet | open / close | .35 | |
| 3, 5, 10 correct in a row | streak | .5 | only at those counts |
| finish set | complete | .6 | |
| finish with ≥ 90% or essay marked "Đã thuộc" | achievement / success | .6 | |
| link copied | copy | .5 | |
| essay slider passes a sentence end | progress-step | .25 | at most every 120ms |
Unlock AudioContext on first pointerdown. Haptics: `navigator.vibrate(8)` on correct, `[6,40,6]` on wrong, where supported (Android); own toggle "Rung" (default on), independent of sound.

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
