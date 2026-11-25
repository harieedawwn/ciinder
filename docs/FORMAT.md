# FORMAT — ciinder text format (parser spec)

User-facing description + examples live in `public/ciinder-guide.md` (Vietnamese, written for the *user's* AI).
This file is the precise spec for `src/core/parse.ts`. If the two disagree, fix both in the same commit.
A test MUST parse every ```text block of the guide with zero errors (keeps guide and parser in sync).

## 1. Pre-processing (lenient, emit warnings not errors)
1. Normalize `\r\n` → `\n`, strip BOM, replace NBSP with space, trim trailing spaces per line.
2. If the text contains a fenced block (```` ``` ````/```` ```text ````) whose body contains a `--- ` header line, use only the body of the largest such block (AI chat often wraps output). Warn `W_FENCE_STRIPPED`.
3. Lines before the first `# `, `@`, `##` or `--- ` line are dropped (chatter). Warn `W_PREAMBLE` if non-empty.
4. Lines starting with `//` are ignored everywhere. Blank lines are kept inside prompts/answers (paragraphs), trimmed at block edges.

## 2. Document grammar (line based)
```
doc      := title? meta* (section | block)*
title    := "# " text                       (first one only; later "# " lines inside blocks are content)
meta     := "@" key ":" value                (only before first section/block; unknown keys → warning)
section  := "## " text                       (closes current block)
block    := header line*                     (until next header | section | EOF)
header   := "---" " "? type (" " attr)*      (case-insensitive; "---" alone on a line = markdown hr inside content, NOT a header)
attr     := key "=" value | flag             (shuffle=no, points=2, tol=0.01, loose, bank)
```
Meta keys: `desc subject grade mode(practice|test) time(minutes, number) shuffle(yes|no)`.

Type aliases (normalize to the canonical name; warn `W_ALIAS`):
| canonical | aliases |
|---|---|
| mcq | tn, trac-nghiem, choice, multiple |
| tf | ds, dung-sai, truefalse, true-false |
| short | tln, tra-loi-ngan, answer |
| cloze | dien, fill, blank |
| match | noi, pair, pairs |
| order | sap-xep, sequence, sort |
| group | phan-loai, category, categorize |
| essay | tu-luan, recall |
| flash | the, card, flashcard |
| note | ngu-canh, context, passage, info |

## 3. Line roles inside a block
Checked in this order. A leading `\` escapes the role (removed, line becomes plain content).
| prefix | role | allowed in |
|---|---|---|
| `?? ` | explanation (multiple lines join with `\n`) | all scored types |
| `!! ` | hint | all scored types |
| `>>>` (alone) | separator prompt/answer | essay, flash |
| `+ ` / `- ` | correct / wrong item | mcq, tf; `-` also: order items, group items, cloze-bank distractors |
| `= ` | accepted answer | short |
| `[Name]` (whole line) | group header | group |
| `a :: b` | pair; `:: b` = distractor | match |
| other | prompt content (before first role line) or continuation of previous item (indented ≥2 spaces) | all |

In `essay`/`flash` everything after `>>>` is raw answer markdown (role prefixes are NOT parsed there, except `??`/`!!` at line start).

Lenient item recognition (warn `W_ITEM_STYLE`):
- `[x] text` / `[ ] text` → `+` / `-` (mcq, tf).
- Leading labels stripped from item text: `A. `, `A) `, `a) `, `1. `, `1) ` (only directly after the role prefix or at line start for options).
- tf: trailing `(Đ)`, `(S)`, `[Đ]`, `[S]`, `(Đúng)`, `(Sai)`, `(T)`, `(F)` decide truth and are removed; a line with such suffix counts as an item even without `+`/`-`.
- mcq: a line `Đáp án: B` / `Answer: B,C` after lettered options marks correct ones.
- order: numbered lines `1. x` accepted as items in that order.

## 4. Inline syntax (kept as markdown in the model, rendered by `src/render/`)
- Markdown subset: bold, italic, inline code, line breaks, lists, tables, images, links (open in new tab). Raw HTML is escaped/sanitized (DOMPurify) — content from share links is untrusted.
- Math: `$...$`, `$$...$$` via KaTeX (+ mhchem `\ce{}`), lazy-loaded only if content contains `$`.
- `{{a|b}}` cloze blank (cloze only; elsewhere literal).
- `[[kw]]` essay keyword (essay answer only; elsewhere render inner text plain).

## 5. Validation (errors block saving; warnings don't)
| code | condition |
|---|---|
| E_NO_BLOCKS | no blocks at all |
| E_UNKNOWN_TYPE | header type not canonical/alias |
| E_EMPTY_PROMPT | scored block without prompt (flash front counts as prompt) |
| E_MCQ_OPTIONS | mcq < 2 options or 0 correct |
| E_TF_ITEMS | tf < 2 or > 8 statements |
| E_SHORT_ANSWER | short without `=` |
| E_CLOZE_BLANK | cloze without `{{}}`, or empty blank |
| E_MATCH_PAIRS | match < 2 real pairs |
| E_ORDER_ITEMS | order < 2 items |
| E_GROUPS | group < 2 groups or a group with 0 items |
| E_SEPARATOR | essay/flash without `>>>` or empty answer |
| E_MATH | unbalanced `$` or `{}` inside math (best effort) |
Warnings: W_NO_EXPLAIN (only counted, shown as one summary line), W_DUP_OPTION, W_ALL_CORRECT, W_MCQ_MANY_OPTIONS (>6), W_ESSAY_NO_KEYWORD, W_UNKNOWN_META, W_UNKNOWN_ATTR + the lenient ones above.

Each issue: `{ code, line, message_vi, fix_vi }` (line = 1-based in ORIGINAL text).
`issuesReport(issues, source)` builds the text the user copies back to their AI:
```
ciinder không đọc được một số chỗ trong bộ câu hỏi. Hãy sửa các lỗi sau rồi xuất lại TOÀN BỘ theo đúng hướng dẫn định dạng ciinder:
- Dòng 12 (--- mcq): Câu trắc nghiệm chưa có phương án đúng. Thêm dấu + trước phương án đúng.
...
```

## 6. Model (src/core/types.ts) — sketch, refine in code
```ts
type Kind = 'mcq'|'tf'|'short'|'cloze'|'match'|'order'|'group'|'essay'|'flash'|'note'
interface QuizSet { v: 1; title: string; meta: Meta; sections: Section[]; items: Item[]; source: string }
interface Meta { desc?: string; subject?: string; grade?: string; mode: 'practice'|'test'; time?: number; shuffle: boolean }
interface Section { id: string; title: string; firstItem: number }
interface ItemBase { id: string; kind: Kind; prompt: string; explain?: string; hint?: string; points: number; line: number; sectionId?: string; noteId?: string }
// mcq: options {text, correct}[], multi: boolean, shuffle
// tf: statements {text, correct}[], shuffle
// short: answers string[], numeric: boolean, tol?: number, loose
// cloze: text with blanks {answers[]}[] (parsed into segments), bank, distractors[], loose
// match: pairs {left,right}[], distractors[], shuffle
// order: items[]; group: groups {name, items[]}[]
// essay: answer (markdown with [[kw]]), keywords string[]; flash: back; note: body
```
`id` = short stable hash of `kind + prompt + first item` (progress survives edits/re-imports; on collision append index).

## 7. Grading (src/core/grade.ts) — pure functions, return score 0..1
- mcq single: 1/0. multi: max(0, (right picks − wrong picks) / correctCount).
- tf: per statement. If exactly 4 statements use the THPT ladder 0/1/2/3/4 correct → 0, 0.1, 0.25, 0.5, 1. Otherwise fraction.
- short: numeric if every answer parses as number (`,` or `.` decimal, allow spaces/thousand dots carefully): |x − a| ≤ tol (default 1e-9). Text: compare normalized (trim, collapse spaces, lowercase, strip trailing punctuation; `loose` also removes diacritics incl. đ→d).
- cloze: fraction of blanks correct (same text rules). match/group: fraction of correct placements. order: fraction of items in correct position.
- essay/flash: not scored; self-rating `again | partial | known` stored as mastery.
Set score = Σ(score·points) / Σ(points) over scored items, shown as %, and also on a 10-point scale.

## 8. Share codec (src/core/share.ts)
- Encode: `utf8(source)` → `fflate.zlibSync(level 9)` (adler32 detects truncation) → base64url (no padding) → prefix version char `A`.
- Link: `${origin}${base}#s=A<payload>`.
- Decode from ANY href: regex `/[#&?]s=A([A-Za-z0-9_-]+)/` on the full `location.href`, payload ends at the first char outside the alphabet. This survives Zalo/Facebook appending `?zarsrc=..&utm_source=..` or `fbclid` after the hash or before it.
- On decode failure show "Liên kết bị thiếu hoặc hỏng" with option to go home; never crash.
- Length > 12000 chars → share UI recommends the HTML file instead (link still offered).
