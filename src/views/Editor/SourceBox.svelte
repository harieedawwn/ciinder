<script lang="ts">
  // Plain textarea with a line-number gutter (no wrapping, so numbers match lines). Flagged lines are marked.
  let {
    value = $bindable(''),
    flagged,
    el = $bindable(),
  }: { value: string; flagged: Set<number>; el?: HTMLTextAreaElement } = $props()

  const count = $derived(value.split('\n').length)
  let top = $state(0)
</script>

<div class="box">
  <div class="gutter num" aria-hidden="true">
    <div style:transform={`translate3d(0, ${-top}px, 0)`}>
      {#each { length: count } as _, i (i)}<span class:bad={flagged.has(i + 1)}>{i + 1}</span>{/each}
    </div>
  </div>
  <textarea
    bind:this={el}
    bind:value
    onscroll={(e) => (top = e.currentTarget.scrollTop)}
    wrap="off"
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    aria-label="Nội dung bộ câu hỏi"
  ></textarea>
</div>

<style>
  .box { display: flex; min-height: 0; height: 100%; background: var(--raised); border: 1px solid var(--line); border-radius: var(--r-ctl); overflow: hidden; }
  .box:focus-within { outline: 2px solid var(--accent); border-color: transparent; }
  .gutter { flex: none; width: 3.2em; overflow: hidden; background: var(--bg); color: var(--muted); text-align: right; font: var(--fs-code)/1.6 ui-monospace, Menlo, Consolas, monospace; padding-top: 10px; }
  .gutter div { will-change: transform; }
  .gutter span { display: block; padding-right: 8px; }
  .gutter .bad { color: var(--on-accent); background: var(--bad); }
  textarea {
    flex: 1; min-width: 0; resize: none; border: 0; outline: 0; background: transparent;
    padding: 10px 12px; font: var(--fs-code)/1.6 ui-monospace, Menlo, Consolas, monospace; tab-size: 2;
  }
</style>
