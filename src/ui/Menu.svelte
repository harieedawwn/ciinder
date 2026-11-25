<script lang="ts" module>
  import type { IconName } from './Icon.svelte'
  export interface MenuItem {
    label: string
    icon?: IconName
    danger?: boolean
    run: () => void
  }
</script>

<script lang="ts">
  // Small anchored action menu: icon button → list. Closes on pick, outside tap, Esc.
  import Button from './Button.svelte'
  import Icon from './Icon.svelte'
  let { items, label }: { items: MenuItem[]; label: string } = $props()

  let open = $state(false)
  let root: HTMLDivElement

  $effect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => !root.contains(e.target as Node) && (open = false)
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      open = false
      root.querySelector<HTMLButtonElement>('.btn')?.focus()
    }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', esc, true)
    root.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', esc, true)
    }
  })

  function pick(item: MenuItem) {
    open = false
    item.run()
  }

  function nav(e: KeyboardEvent) {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const list = [...root.querySelectorAll<HTMLButtonElement>('[role=menuitem]')]
    const i = list.indexOf(document.activeElement as HTMLButtonElement)
    list[(i + d + list.length) % list.length]?.focus()
  }
</script>

<div class="menu" bind:this={root}>
  <Button variant="icon" icon="more" {label} aria-haspopup="menu" aria-expanded={open} onclick={() => (open = !open)} />
  {#if open}
    <div class="list" role="menu" tabindex="-1" aria-label={label} onkeydown={nav}>
      {#each items as item (item.label)}
        <button role="menuitem" class:danger={item.danger} onclick={() => pick(item)}>
          {#if item.icon}<Icon name={item.icon} size={20} />{/if}
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu { position: relative; }
  .list {
    position: absolute; right: 0; top: calc(100% + 4px); z-index: 20; min-width: 180px; padding: 4px;
    background: var(--raised); border: 1px solid var(--line); border-radius: var(--r-ctl); box-shadow: var(--shadow-drag);
    transform-origin: top right; animation: pop var(--t-micro) var(--ease-out);
  }
  @keyframes pop { from { opacity: 0; transform: scale(0.96) translateY(-4px); } }
  button {
    display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px; padding: 0 12px;
    border-radius: var(--r-chip); text-align: left; font-size: var(--fs-md);
  }
  button:hover, button:focus-visible { background: var(--accent-soft); outline: none; }
  .danger { color: var(--bad); }
</style>
