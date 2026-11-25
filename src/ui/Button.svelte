<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import Icon, { type IconName } from './Icon.svelte'

  type Props = HTMLButtonAttributes & {
    variant?: 'primary' | 'secondary' | 'quiet' | 'icon'
    icon?: IconName
    /** Accessible name; required for icon-only buttons. */
    label?: string
    sound?: boolean
    children?: Snippet
  }
  let { variant = 'secondary', icon, label, sound = true, children, onclick, type = 'button', ...rest }: Props = $props()

  function click(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (sound) play('press')
    onclick?.(e)
  }
</script>

<button {...rest} {type} class="btn {variant}" aria-label={label} onclick={click} use:ink>
  {#if icon}<Icon name={icon} />{/if}
  {#if children && variant !== 'icon'}<span>{@render children()}</span>{/if}
</button>

<style>
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 44px; padding: 0 16px; border-radius: var(--r-ctl);
    font-size: var(--fs-md); font-weight: 500; line-height: 1.2; white-space: nowrap;
    transition: transform var(--t-micro) var(--ease-out), background-color var(--t-std) var(--ease-out);
  }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.5; pointer-events: none; }
  .primary { background: var(--accent); color: var(--on-accent); font-weight: 600; }
  .primary:global(.ink)::after { background: rgb(255 255 255 / 0.16); }
  .secondary { background: var(--raised); color: var(--ink); border: 1px solid var(--line); box-shadow: var(--shadow); }
  .quiet { color: var(--ink); padding: 0 12px; }
  .icon { width: 44px; padding: 0; border-radius: 50%; color: var(--ink); }
  @media (hover: hover) {
    .quiet:hover, .icon:hover { background: var(--accent-soft); }
    .secondary:hover { border-color: var(--muted); }
  }
</style>
