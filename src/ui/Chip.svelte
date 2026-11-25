<!-- Filter chip: 8px radius, 1px line, selected = --ink fill with --surface text. Toggle button. -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import { play } from '../lib/sound'

  let { on = false, onclick, children }: { on?: boolean; onclick: () => void; children?: Snippet } = $props()
</script>

<button type="button" class="chip" class:on aria-pressed={on} onclick={() => { play('select'); onclick() }}>{@render children?.()}</button>

<style>
  .chip {
    min-height: 40px; max-width: 100%; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px;
    font-size: var(--fs-sm); color: var(--ink); background: var(--surface); text-align: left; overflow-wrap: anywhere;
    transition: background-color var(--t-std) var(--ease-out), color var(--t-std) var(--ease-out);
  }
  .chip.on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
  .chip :global(.num) { font-weight: 600; }
</style>
