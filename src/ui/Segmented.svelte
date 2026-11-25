<script lang="ts" generics="T extends string | number">
  import { play } from '../lib/sound'
  let {
    value = $bindable(),
    options,
    label,
  }: { value: T; options: readonly { id: T; name: string }[]; label: string } = $props()

  const index = $derived(Math.max(0, options.findIndex((o) => o.id === value)))

  function pick(id: T) {
    if (id === value) return
    value = id
    play('select')
  }

  function key(e: KeyboardEvent) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = options[(index + d + options.length) % options.length]
    pick(next.id)
    ;(e.currentTarget as HTMLElement).querySelectorAll('button')[options.indexOf(next)]?.focus()
  }
</script>

<div class="seg" role="radiogroup" aria-label={label} tabindex="-1" onkeydown={key} style:--n={options.length} style:--i={index}>
  <span class="thumb" aria-hidden="true"></span>
  {#each options as o (o.id)}
    <button role="radio" aria-checked={o.id === value} tabindex={o.id === value ? 0 : -1} onclick={() => pick(o.id)}>{o.name}</button>
  {/each}
</div>

<style>
  .seg {
    position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr);
    padding: 3px; border-radius: var(--r-ctl); background: var(--bg); border: 1px solid var(--line);
  }
  .thumb {
    position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / var(--n));
    border-radius: var(--r-chip); background: var(--raised); box-shadow: var(--shadow);
    transform: translateX(calc(100% * var(--i))); transition: transform var(--t-std) var(--ease-out);
  }
  button {
    position: relative; min-height: 40px; padding: 0 4px; border-radius: var(--r-chip);
    font-size: var(--fs-sm); color: var(--muted); transition: color var(--t-std) var(--ease-out);
  }
  button[aria-checked='true'] { color: var(--ink); font-weight: 600; }
</style>
