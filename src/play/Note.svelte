<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import type { NoteItem } from '../core/types'
  import { play } from '../lib/sound'
  import Icon from '../ui/Icon.svelte'

  let { item }: { item: NoteItem } = $props()
  let open = $state(true)

  function toggle() {
    open = !open
    play(open ? 'expand' : 'collapse')
  }
</script>

<section class="note">
  <button class="head" aria-expanded={open} onclick={toggle}>
    <span>Ngữ cảnh</span>
    <span class="chev" class:open><Icon name="down" size={20} /></span>
  </button>
  {#if open}<Rich class="body" src={item.prompt} />{/if}
</section>

<style>
  .note { border-left: 2px solid var(--mark); padding-left: 12px; }
  .head { display: flex; align-items: center; gap: 4px; min-height: 40px; font-size: var(--fs-sm); font-weight: 600; color: var(--muted); }
  .chev { display: inline-flex; transition: transform var(--t-std) var(--ease-out); }
  .chev.open { transform: rotate(180deg); }
  .note :global(.body) { padding-bottom: 4px; line-height: 1.55; overflow-wrap: anywhere; max-height: 40dvh; overflow-y: auto; }
</style>
