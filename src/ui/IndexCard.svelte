<!-- Index card: surface card with a thin margin line and optional divider tabs on its top edge.
     Tabs are real buttons (or plain labels when no onclick). docs/DESIGN.md "Layout v2" §1. -->
<script lang="ts" module>
  export interface CardTab { label: string; onclick?: () => void; primary?: boolean; active?: boolean }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { play } from '../lib/sound'

  type Props = HTMLAttributes<HTMLDivElement> & {
    tabs?: CardTab[]
    /** Hide the margin line (e.g. tiny cards). */
    plain?: boolean
    /** Margin line in accent colour (drop target active, selected). */
    hot?: boolean
    children?: Snippet
  }
  let { tabs = [], plain = false, hot = false, children, class: cls = '', ...rest }: Props = $props()
</script>

<div {...rest} class="card {cls}" class:plain class:hot class:has-tabs={tabs.length > 0}>
  {#if tabs.length}
    <div class="tabs">
      {#each tabs as t (t.label)}
        {#if t.onclick}
          <button type="button" class="tab press" class:primary={t.primary} class:active={t.active}
            onclick={() => { play('press'); t.onclick?.() }}>{t.label}</button>
        {:else}
          <span class="tab" class:active={t.active}>{t.label}</span>
        {/if}
      {/each}
    </div>
  {/if}
  <div class="body">{@render children?.()}</div>
</div>

<style>
  .card {
    position: relative; background: var(--surface); border: 1px solid var(--line);
    border-radius: var(--r-card); box-shadow: var(--shadow);
  }
  .card.has-tabs { margin-top: 30px; }
  .body { position: relative; padding: 20px 20px 20px 36px; }
  .card.plain .body { padding-left: 20px; }
  .body::before {
    content: ''; position: absolute; top: 0; bottom: 0; left: 18px; width: 1px;
    background: var(--accent-soft); transition: background-color var(--t-std) var(--ease-out);
  }
  .card.plain .body::before { display: none; }
  .card.hot .body::before { background: var(--accent); }
  @media (max-width: 599px) {
    .body { padding: 16px 16px 16px 30px; }
    .body::before { left: 14px; }
  }

  .tabs { position: absolute; left: 28px; bottom: 100%; display: flex; gap: 6px; }
  .tab {
    position: relative; top: 1px; height: 30px; padding: 0 14px; display: inline-flex; align-items: center;
    background: var(--surface); color: var(--muted); border: 1px solid var(--line); border-bottom: 0;
    border-radius: var(--r-chip) var(--r-chip) 0 0; font-size: var(--fs-xs); font-weight: 600; white-space: nowrap;
  }
  .tab.active { color: var(--ink); }
  .tab.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); top: 0; }
  button.tab:not(.primary) { transform-origin: bottom; }
  @media (hover: hover) { button.tab:not(.primary):hover { color: var(--ink); transform: translateY(-2px); } }
</style>
