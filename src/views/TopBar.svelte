<script lang="ts">
  import { fullscreen, toggleFullscreen } from '../lib/fullscreen.svelte'
  import Button from '../ui/Button.svelte'

  let { onsettings }: { onsettings: () => void } = $props()
</script>

<header class="bar" class:focus={fullscreen.focusMode}>
  <a class="word" href="#/">ciinder</a>
  <div class="actions">
    <Button
      variant="icon"
      icon={fullscreen.active ? 'shrink' : 'expand'}
      label="Toàn màn hình"
      aria-pressed={fullscreen.active}
      onclick={toggleFullscreen}
    />
    <Button variant="icon" icon="settings" label="Cài đặt" onclick={onsettings} />
  </div>
</header>

<style>
  .bar {
    position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
    height: calc(56px + var(--safe-t));
    padding: var(--safe-t) max(8px, var(--safe-r), (100% - 1200px) / 2 + 8px) 0 max(16px, var(--safe-l), (100% - 1200px) / 2 + 16px);
    background: var(--bg);
  }
  .word { font-size: var(--fs-xl); font-weight: 600; color: var(--ink); text-decoration: none; letter-spacing: -0.01em; border-radius: var(--r-chip); }
  .actions { display: flex; gap: 2px; }
  .focus { position: fixed; right: 0; left: auto; background: transparent; }
  .focus .word, .focus .actions > :global(:last-child) { display: none; }
  @media (max-height: 500px) { .bar { height: calc(48px + var(--safe-t)); } }
</style>
