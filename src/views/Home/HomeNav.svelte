<!-- Home navigation: left rail of divider tabs (≥1024px) and a bottom bar with the same actions (below). -->
<script lang="ts">
  import { fullscreen, toggleFullscreen } from '../../lib/fullscreen.svelte'
  import { play } from '../../lib/sound'
  import { go, router } from '../../state/router.svelte'
  import Button from '../../ui/Button.svelte'
  import Icon, { type IconName } from '../../ui/Icon.svelte'
  import Mark from '../../ui/Mark.svelte'

  let { onsettings }: { onsettings: () => void } = $props()

  const route = $derived(router.route.name)
  const tabs: { label: string; short: string; icon: IconName; path: string; on: (r: string) => boolean }[] = [
    { label: 'Thư viện', short: 'Thư viện', icon: 'grid', path: '/', on: (r) => r === 'home' },
    { label: 'Tạo bộ mới', short: 'Tạo mới', icon: 'plus', path: '/new', on: (r) => r === 'new' },
    { label: 'Hướng dẫn cho AI', short: 'Hướng dẫn', icon: 'guide', path: '/guide', on: (r) => r === 'guide' },
  ]
  const nav = (path: string) => { play('press'); go(path) }
</script>

<nav class="rail" aria-label="Điều hướng">
  <a class="word" href="#/">ciinder</a>
  <div class="tabs">
    {#each tabs as t (t.path)}
      <button class="tab press" aria-current={t.on(route) ? 'page' : undefined} onclick={() => nav(t.path)}>
        <Mark on={t.on(route)}>{t.label}</Mark>
      </button>
    {/each}
  </div>
  <div class="tools">
    <Button variant="icon" icon={fullscreen.active ? 'shrink' : 'expand'} label="Toàn màn hình" aria-pressed={fullscreen.active} onclick={toggleFullscreen} />
    <Button variant="icon" icon="settings" label="Cài đặt" onclick={onsettings} />
  </div>
</nav>

<nav class="bottom" aria-label="Điều hướng">
  {#each tabs as t (t.path)}
    <button class="item press" class:active={t.on(route)} aria-current={t.on(route) ? 'page' : undefined} onclick={() => nav(t.path)}>
      <Icon name={t.icon} />
      <span>{t.short}</span>
    </button>
  {/each}
</nav>

<style>
  .rail { display: none; }
  .bottom {
    position: fixed; z-index: 9; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-around;
    padding: 6px max(8px, var(--safe-r)) calc(6px + var(--safe-b)) max(8px, var(--safe-l));
    background: var(--bg); border-top: 1px solid var(--line);
  }
  .item {
    flex: 1; max-width: 160px; min-height: 48px; display: grid; justify-items: center; align-content: center; gap: 2px;
    color: var(--muted); font-size: var(--fs-xs); font-weight: 600; border-radius: var(--r-ctl);
  }
  .item.active { color: var(--ink); }
  @media (max-height: 500px) { .bottom { display: none; } }

  @media (min-width: 1024px) {
    .bottom { display: none; }
    .rail {
      position: fixed; z-index: 10; top: 0; bottom: 0; left: 0; width: 248px; display: flex; flex-direction: column;
      padding: 20px 16px calc(16px + var(--safe-b)) calc(24px + var(--safe-l)); border-right: 1px solid var(--line); background: var(--bg);
    }
    .word { font-size: var(--fs-xl); font-weight: 600; color: var(--ink); text-decoration: none; letter-spacing: -0.01em; margin-bottom: 32px; }
    .tabs { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
    .tab { text-align: left; min-height: 44px; padding: 0 8px; font-size: var(--fs-md); font-weight: 600; color: var(--muted); border-radius: var(--r-chip); }
    .tab[aria-current='page'] { color: var(--ink); }
    .tools { margin-top: auto; display: flex; gap: 2px; margin-left: -8px; }
  }
</style>
