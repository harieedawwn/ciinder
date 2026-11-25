<script lang="ts">
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { motionReduced } from '../state/settings.svelte'
  import { runToastAction, toastState } from './toast.svelte'
</script>

<div class="wrap" aria-live="polite">
  {#if toastState.current}
    {@const t = toastState.current}
    {#key t.id}
      <div class="toast" role="status" transition:fly={{ y: motionReduced() ? 0 : 16, duration: motionReduced() ? 120 : 220, easing: cubicOut }}>
        <span>{t.text}</span>
        {#if t.action}<button onclick={runToastAction}>{t.action.label}</button>{/if}
      </div>
    {/key}
  {/if}
</div>

<style>
  .wrap {
    position: fixed; left: 0; right: 0; bottom: calc(16px + var(--safe-b)); z-index: 50;
    display: flex; justify-content: center; padding: 0 16px; pointer-events: none;
  }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 12px; max-width: 480px;
    min-height: 48px; padding: 4px 4px 4px 16px; border-radius: var(--r-ctl);
    background: var(--ink); color: var(--bg); font-size: var(--fs-sm); box-shadow: var(--shadow);
  }
  span { padding: 8px 0; }
  span:last-child { padding-right: 12px; }
  button { min-height: 40px; padding: 0 12px; border-radius: var(--r-chip); color: var(--mark); font-weight: 600; }
</style>
