<script lang="ts">
  import Rich from '../../render/Rich.svelte'
  import type { QuizSet } from '../../core/types'
  import { KIND_NAME, countByKind, promptText, rows } from './summary'

  let { set }: { set: QuizSet } = $props()

  const counts = $derived(countByKind(set.items))
  const sectionAt = $derived(new Map(set.sections.map((s) => [s.firstItem, s.title])))
  const total = $derived(set.items.filter((i) => i.kind !== 'note').length)
</script>

<div class="preview">
  <h2>{set.title}</h2>
  <p class="meta num">
    <span>{total} câu</span>
    {#each counts as c (c.kind)}<span>{KIND_NAME[c.kind]} {c.n}</span>{/each}
  </p>
  <ol>
    {#each set.items as item, i (item.id)}
      {#if sectionAt.has(i)}<li class="section"><h3>{sectionAt.get(i)}</h3></li>{/if}
      <li class="item">
        <span class="tag">{KIND_NAME[item.kind]}</span>
        <p class="prompt"><Rich inline src={promptText(item)} /></p>
        {#each rows(item) as r, j (j)}
          <p class="row" class:good={r.good}><Rich inline src={r.text} /></p>
        {/each}
      </li>
    {/each}
  </ol>
</div>

<style>
  .preview { display: grid; gap: 12px; align-content: start; }
  h2 { font-size: var(--fs-xl); overflow-wrap: anywhere; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
  ol { list-style: none; display: grid; gap: 8px; margin: 0; padding: 0; }
  .section h3 { font-size: var(--fs-lg); margin-top: 8px; }
  .item { display: grid; gap: 4px; padding: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .tag { font-size: var(--fs-xs); color: var(--muted); }
  .prompt { font-weight: 500; overflow-wrap: anywhere; line-height: 1.4; }
  .row { font-size: var(--fs-sm); color: var(--muted); overflow-wrap: anywhere; padding-left: 10px; border-left: 2px solid var(--line); }
  .row.good { color: var(--ink); border-left-color: var(--good); }
</style>
