<script lang="ts">
  import { go } from '../../state/router.svelte'
  import type { SetEntry } from '../../state/library.svelte'
  import Menu, { type MenuItem } from '../../ui/Menu.svelte'
  import { ago } from './time'

  let { entry, actions }: { entry: SetEntry; actions: MenuItem[] } = $props()

  const pct = $derived(entry.lastScore === undefined ? undefined : Math.round(entry.lastScore * 100))
</script>

<article class="card">
  <a class="main" href="#/play/{encodeURIComponent(entry.id)}" onclick={(e) => (e.preventDefault(), go(`/play/${entry.id}`))}>
    <h2>{entry.title}</h2>
    <p class="meta">
      {#if entry.subject}<span>{entry.subject}</span>{/if}
      <span class="num">{entry.count} câu</span>
    </p>
    <div class="foot">
      {#if pct !== undefined}
        <span class="score num" style:--p={pct / 100}><span class="stroke" aria-hidden="true"></span><b>{pct}%</b></span>
      {/if}
      <span class="when">{ago(entry.openedAt ?? entry.updatedAt)}</span>
    </div>
  </a>
  <div class="more"><Menu items={actions} label="Tùy chọn" /></div>
</article>

<style>
  .card {
    position: relative; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card);
    box-shadow: var(--shadow);
    transition: transform var(--t-std) var(--ease-out), border-color var(--t-std) var(--ease-out);
  }
  .card:has(.main:active) { transform: scale(0.99); }
  .card:has(:global([aria-expanded="true"])) { z-index: 2; }
  @media (hover: hover) { .card:hover { border-color: var(--muted); } }
  .main { display: grid; gap: 6px; padding: 16px 52px 16px 16px; color: inherit; text-decoration: none; border-radius: var(--r-card); }
  h2 { font-size: var(--fs-lg); overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px; min-height: 24px; }
  .score { position: relative; display: inline-flex; align-items: center; padding: 0 8px; min-width: 64px; height: 24px; font-size: var(--fs-sm); }
  .score .stroke {
    position: absolute; inset: 3px 0; border-radius: 6px; background: var(--mark);
    transform-origin: left; transform: scaleX(max(0.12, var(--p))) skewX(-8deg);
  }
  .score b { position: relative; font-weight: 600; }
  .when { margin-left: auto; font-size: var(--fs-xs); color: var(--muted); }
  .more { position: absolute; top: 6px; right: 4px; }
</style>
