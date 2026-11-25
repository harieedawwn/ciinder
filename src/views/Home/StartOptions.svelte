<script lang="ts">
  // "Tùy chọn" of the start panel: question order, option order, kinds, sections, count.
  import type { Kind } from '../../core/types'
  import Chip from '../../ui/Chip.svelte'
  import Switch from '../../ui/Switch.svelte'
  import { KIND_NAME } from '../Editor/summary'
  import type { StartPrefs } from './startPrefs'

  let { opt = $bindable(), kinds, sections, pool }: {
    opt: StartPrefs
    kinds: { kind: Kind; n: number }[]
    sections: { id: string; title: string; n: number }[]
    /** Items left after kind + section filters. */
    pool: number
  } = $props()

  const COUNTS = [10, 20, 30, 40]
  let allSections = $state(false)
  const shownSections = $derived(allSections ? sections : sections.slice(0, 8))
  const counts = $derived(COUNTS.filter((c) => c < pool))

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
  }
</script>

<div class="opts">
  <Switch bind:checked={opt.shuffle} label="Xáo thứ tự câu hỏi" />
  <Switch bind:checked={opt.mixOptions} label="Xáo đáp án" />
  {#if kinds.length > 1}
    <section>
      <h3>Dạng câu hỏi</h3>
      <div class="chips">
        {#each kinds as k (k.kind)}
          <Chip on={opt.kinds.includes(k.kind)} onclick={() => (opt.kinds = toggle(opt.kinds, k.kind))}>{KIND_NAME[k.kind]} · <span class="num">{k.n}</span></Chip>
        {/each}
      </div>
    </section>
  {/if}
  {#if sections.length > 1}
    <section>
      <h3>Phần</h3>
      <div class="chips">
        {#each shownSections as s (s.id)}
          <Chip on={opt.sections.includes(s.id)} onclick={() => (opt.sections = toggle(opt.sections, s.id))}>{s.title} · <span class="num">{s.n}</span></Chip>
        {/each}
        {#if sections.length > 8 && !allSections}<Chip onclick={() => (allSections = true)}>Xem thêm</Chip>{/if}
      </div>
    </section>
  {/if}
  {#if counts.length}
    <section>
      <h3>Số câu</h3>
      <div class="chips">
        <Chip on={opt.count === 0 || opt.count >= pool} onclick={() => (opt.count = 0)}>Tất cả</Chip>
        {#each counts as c (c)}<Chip on={opt.count === c} onclick={() => (opt.count = c)}><span class="num">{c}</span></Chip>{/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .opts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  section { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0; margin-top: 4px; }
  h3 { font-size: var(--fs-sm); font-weight: 600; color: var(--muted); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; }
</style>
