<script lang="ts">
  import { canVibrate } from '../../lib/haptics'
  import type { Snippet } from 'svelte'
  import { play } from '../../lib/sound'
  import { SOUND_PACKS, TEXT_SIZES, THEMES, activeTheme, settings, type ThemeId } from '../../state/settings.svelte'
  import Segmented from '../../ui/Segmented.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import Switch from '../../ui/Switch.svelte'

  let { open = $bindable(false), sound = true, extra }: { open?: boolean; sound?: boolean; extra?: Snippet } = $props()

  const sizes = TEXT_SIZES.map((n) => ({ id: n, name: `${n}%` }))

  function pickTheme(id: ThemeId) {
    if (id === activeTheme()) return
    settings.theme = id
    play('select')
  }
</script>

<Sheet bind:open title="Cài đặt">
  <section>
    <h3>Giao diện</h3>
    <div class="themes" role="radiogroup" aria-label="Giao diện">
      {#each THEMES as t (t.id)}
        <button
          class="swatch"
          role="radio"
          aria-checked={activeTheme() === t.id}
          onclick={() => pickTheme(t.id)}
        >
          <span class="chip" style:background={t.bg} aria-hidden="true">
            <span class="a" style:background={t.accent}></span>
            <span class="m" style:background={t.mark}></span>
          </span>
          <span class="name">{t.name}</span>
        </button>
      {/each}
    </div>
  </section>

  {#if sound}
    <section>
      <h3>Âm thanh</h3>
      <Segmented bind:value={settings.sound} options={SOUND_PACKS} label="Âm thanh" />
    </section>
  {/if}

  <section>
    <h3>Cỡ chữ</h3>
    <Segmented bind:value={settings.textSize} options={sizes} label="Cỡ chữ" />
  </section>

  <section class="switches">
    {#if canVibrate}<Switch bind:checked={settings.haptics} label="Rung" />{/if}
    <Switch bind:checked={settings.reduceMotion} label="Giảm chuyển động" />
  </section>
  {@render extra?.()}
</Sheet>

<style>
  section { padding: 12px 0; }
  section + section { border-top: 1px solid var(--line); }
  h3 { font-size: var(--fs-sm); font-weight: 600; color: var(--muted); margin-bottom: 12px; }
  .switches { padding: 4px 0; }
  .themes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .swatch { display: grid; gap: 6px; justify-items: center; padding: 4px 0; border-radius: var(--r-ctl); }
  .chip {
    position: relative; display: block; width: 100%; aspect-ratio: 1; max-width: 64px;
    border-radius: var(--r-ctl); border: 1px solid var(--line); overflow: hidden;
    transition: transform var(--t-std) var(--spring);
  }
  .a { position: absolute; left: 22%; top: 24%; width: 56%; height: 22%; border-radius: 4px; }
  .m { position: absolute; left: 22%; top: 58%; width: 40%; height: 14%; border-radius: 4px; }
  .swatch[aria-checked='true'] .chip { outline: 2px solid var(--accent); outline-offset: 2px; transform: scale(0.94); }
  .name { font-size: var(--fs-xs); color: var(--muted); white-space: nowrap; }
  .swatch[aria-checked='true'] .name { color: var(--ink); font-weight: 600; }
</style>
