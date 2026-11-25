<script lang="ts">
  // Mode choice + start/resume buttons for one set; used by the library sheet and the standalone player.
  import type { Snippet } from 'svelte'
  import { STUDY_KINDS } from '../../core/attempt'
  import { parse } from '../../core/parse'
  import { getSet, touchSet } from '../../state/library.svelte'
  import { loadProgress } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import { setPrint, type Print } from './print'
  import { startOptions } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import Fingerprint from '../../ui/Fingerprint.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import Switch from '../../ui/Switch.svelte'

  type Info = { id: string; subject?: string; count: number }
  let { entry, active = true, onstart, extra }: { entry: Info; active?: boolean; onstart?: () => void; extra?: Snippet } = $props()

  const MODES = [
    { id: 'practice', name: 'Luyện tập' },
    { id: 'test', name: 'Làm bài' },
  ] as const

  let loaded = $state<string | null>(null)
  /** Essay + flash items (Học tự luận). */
  let studyCount = $state(0)
  /** Position of an unfinished attempt ("Tiếp tục"), e.g. "5/20". */
  let resume = $state('')
  let print = $state<Print | null>(null)

  $effect(() => {
    const id = entry.id
    if (!active) return
    resume = ''
    void setPrint(id).then((p) => { if (entry.id === id) print = p })
    void loadProgress(id).then((p) => {
      if (entry.id === id && p.current) resume = `${Math.min(p.current.pos + 1, p.current.order.length)}/${p.current.order.length}`
    })
    if (loaded === id) return
    void getSet(id).then((rec) => {
      if (!rec) return
      const { meta, items } = parse(rec.source).set
      studyCount = items.filter((it) => STUDY_KINDS.has(it.kind)).length
      startOptions.mode = meta.mode
      startOptions.shuffle = meta.shuffle
      loaded = id
    })
  })

  function start(fresh: boolean, study = false) {
    startOptions.fresh = fresh
    startOptions.only = null
    startOptions.study = study
    void touchSet(entry.id, { openedAt: Date.now() })
    onstart?.()
    go(`/play/${entry.id}`)
  }
</script>

<div class="panel">
  <p class="meta">
    {#if entry.subject}<span>{entry.subject}</span>{/if}
    <span class="num">{entry.count} câu</span>
  </p>
  {#if print}<Fingerprint size="lg" kinds={print.kinds} done={print.done} />{/if}
  <div class="modes" role="radiogroup" aria-label="Chế độ">
    {#each MODES as m (m.id)}
      {@const on = startOptions.mode === m.id}
      <IndexCard plain hot={on} class="mode press {on ? 'stack stack-1' : ''}">
        <button role="radio" aria-checked={on} onclick={() => (startOptions.mode = m.id)}>{m.name}</button>
      </IndexCard>
    {/each}
  </div>
  <Switch bind:checked={startOptions.shuffle} label="Trộn thứ tự" />
  {#if resume}
    <Button variant="primary" icon="next" onclick={() => start(false)}>Tiếp tục <span class="num">{resume}</span></Button>
    <Button icon="retry" onclick={() => start(true)}>Bắt đầu</Button>
  {:else}
    <Button variant="primary" icon="check" onclick={() => start(true)}>Bắt đầu</Button>
  {/if}
  {#if studyCount && loaded === entry.id}
    <Button icon="eye" onclick={() => start(true, true)}>Học tự luận <span class="num">{studyCount}</span></Button>
  {/if}
  {@render extra?.()}
</div>

<style>
  .panel { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 4px 14px 8px 0; }
  .modes :global(.body) { padding: 0; }
  .modes button { width: 100%; min-height: 48px; font-weight: 600; font-size: var(--fs-md); color: var(--muted); border-radius: var(--r-card); }
  .modes button[aria-checked='true'] { color: var(--ink); }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
</style>
