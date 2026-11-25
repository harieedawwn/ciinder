<script lang="ts">
  // Mode choice + start/resume buttons for one set; used by the library sheet and the standalone player.
  import type { Snippet } from 'svelte'
  import { kindCounts, sectionCounts, selectItems, STUDY_KINDS } from '../../core/attempt'
  import type { QuizSet } from '../../core/types'
  import { PLAYABLE } from '../../play/registry'
  import { parse } from '../../core/parse'
  import { getSet, touchSet } from '../../state/library.svelte'
  import { loadProgress } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import { setPrint, type Print } from './print'
  import { startOptions } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import Fingerprint from '../../ui/Fingerprint.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import StartOptions from './StartOptions.svelte'
  import { loadPrefs, newSeed, savePrefs, type StartPrefs } from './startPrefs'

  type Info = { id: string; subject?: string; count: number }
  let { entry, active = true, onstart, extra, withKey = false }: { entry: Info; active?: boolean; onstart?: () => void; extra?: Snippet; withKey?: boolean } = $props()

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
  let quiz = $state<QuizSet | null>(null)
  let optionsOpen = $state(false)
  let opt = $state<StartPrefs>({ mode: 'practice', shuffle: true, mixOptions: true, kinds: [], sections: [], count: 0, seed: newSeed() })

  const kinds = $derived(quiz ? kindCounts(quiz, PLAYABLE) : [])
  const sections = $derived(quiz ? sectionCounts(quiz, PLAYABLE) : [])
  const pool = $derived(quiz ? selectItems(quiz, { ...opt, count: 0 }, PLAYABLE).length : 0)
  const picked = $derived(quiz ? selectItems(quiz, opt, PLAYABLE) : [])
  const filtered = $derived(opt.kinds.length > 0 || opt.sections.length > 0 || (opt.count > 0 && opt.count < pool))

  $effect(() => {
    if (loaded === entry.id) savePrefs(entry.id, $state.snapshot(opt))
  })

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
      const set = parse(rec.source).set
      const { meta, items } = set
      studyCount = items.filter((it) => STUDY_KINDS.has(it.kind)).length
      const saved = loadPrefs(id)
      const kindIds = new Set(kindCounts(set, PLAYABLE).map((k) => k.kind))
      const sectionIds = new Set(sectionCounts(set, PLAYABLE).map((s) => s.id))
      opt = {
        mode: saved?.mode ?? meta.mode,
        shuffle: saved?.shuffle ?? meta.shuffle,
        mixOptions: saved?.mixOptions ?? true,
        kinds: (saved?.kinds ?? []).filter((k) => kindIds.has(k)),
        sections: (saved?.sections ?? []).filter((s) => sectionIds.has(s)),
        count: saved?.count ?? 0,
        seed: saved?.seed ?? newSeed(),
      }
      quiz = set
      loaded = id
    })
  })

  function start(fresh: boolean, study = false) {
    startOptions.fresh = fresh
    startOptions.only = null
    startOptions.study = study
    startOptions.mode = opt.mode
    startOptions.shuffle = opt.shuffle
    startOptions.mixOptions = opt.mixOptions
    startOptions.pick = fresh && !study && filtered ? picked : null
    if (fresh) opt.seed = newSeed()
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
      {@const on = opt.mode === m.id}
      <IndexCard plain hot={on} class="mode press {on ? 'stack stack-1' : ''}">
        <button role="radio" aria-checked={on} onclick={() => (opt.mode = m.id)}>{m.name}</button>
      </IndexCard>
    {/each}
  </div>
  {#if quiz}
    <Button variant="quiet" icon={optionsOpen ? 'up' : 'down'} aria-expanded={optionsOpen} onclick={() => (optionsOpen = !optionsOpen)}>Tùy chọn</Button>
    {#if optionsOpen}<StartOptions bind:opt {kinds} {sections} {pool} />{/if}
    <p class="sum num">{picked.length} câu · {opt.mode === 'test' ? 'Làm bài' : 'Luyện tập'} · từ {quiz.items.filter((it) => PLAYABLE.has(it.kind)).length} câu</p>
  {/if}
  {#if resume}
    <Button variant="primary" icon="next" onclick={() => start(false)}>Tiếp tục <span class="num">{resume}</span></Button>
    <Button icon="retry" onclick={() => start(true)}>Bắt đầu</Button>
  {:else}
    <Button variant="primary" icon="check" onclick={() => start(true)}>Bắt đầu</Button>
  {/if}
  {#if studyCount && loaded === entry.id}
    <Button icon="eye" onclick={() => start(true, true)}>Học tự luận <span class="num">{studyCount}</span></Button>
  {/if}
  {#if withKey && quiz}<Button variant="quiet" icon="file" onclick={() => { onstart?.(); go(`/key/${entry.id}`) }}>Đáp án &amp; in</Button>{/if}
  {@render extra?.()}
</div>

<style>
  .panel { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 4px 14px 8px 0; }
  .modes :global(.body) { padding: 0; }
  .modes button { width: 100%; min-height: 48px; font-weight: 600; font-size: var(--fs-md); color: var(--muted); border-radius: var(--r-card); }
  .modes button[aria-checked='true'] { color: var(--ink); }
  .sum { font-size: var(--fs-sm); font-weight: 600; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
</style>
