<!-- Set fingerprint: one thin tick per question, coloured by kind; full height = answered correctly last time.
     docs/DESIGN.md "Layout v2" §2. -->
<script lang="ts">
  import type { Kind } from '../core/types'
  type Props = { kinds: Kind[]; done?: boolean[]; size?: 'sm' | 'lg'; label?: string }
  let { kinds, done = [], size = 'sm', label }: Props = $props()

  const COLOR: Record<Kind, string> = {
    mcq: 'var(--ink)', tf: 'color-mix(in srgb, var(--ink) 70%, transparent)', short: 'color-mix(in srgb, var(--ink) 45%, transparent)',
    cloze: 'color-mix(in srgb, var(--ink) 45%, transparent)', match: 'var(--accent)', order: 'var(--accent)', group: 'var(--accent)',
    essay: 'var(--mark-strong)', flash: 'var(--mark-strong)', note: 'transparent',
  }
  const ticks = $derived(kinds.filter((k) => k !== 'note'))
</script>

<div class="fp {size}" role="img" aria-label={label ?? `${ticks.length} câu`}>
  {#each ticks as k, i (i)}
    <i style="background: {COLOR[k]}" class:full={done[i]}></i>
  {/each}
</div>

<style>
  .fp { display: flex; align-items: flex-end; gap: 2px; height: 14px; overflow: hidden; }
  .fp.lg { height: 28px; gap: 3px; }
  i { flex: 0 0 2px; height: 50%; border-radius: 1px; transition: transform var(--t-large) var(--spring); transform-origin: bottom; }
  .lg i { flex-basis: 3px; }
  i.full { height: 100%; }
</style>
