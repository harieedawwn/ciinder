<script lang="ts">
  import { parse } from '../../core/parse'
  import { getSet, touchSet, type SetEntry } from '../../state/library.svelte'
  import { loadProgress } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import { startOptions } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import Segmented from '../../ui/Segmented.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import Switch from '../../ui/Switch.svelte'

  let { entry, open = $bindable(false) }: { entry: SetEntry | null; open?: boolean } = $props()

  const MODES = [
    { id: 'practice', name: 'Luyện tập' },
    { id: 'test', name: 'Làm bài' },
  ] as const

  let loaded = $state<string | null>(null)
  /** Position of an unfinished attempt ("Tiếp tục"), e.g. "5/20". */
  let resume = $state('')

  $effect(() => {
    const id = entry?.id
    if (!open || !id) return
    resume = ''
    void loadProgress(id).then((p) => {
      if (entry?.id === id && p.current) resume = `${Math.min(p.current.pos + 1, p.current.order.length)}/${p.current.order.length}`
    })
    if (loaded === id) return
    void getSet(id).then((rec) => {
      if (!rec) return
      const { meta } = parse(rec.source).set
      startOptions.mode = meta.mode
      startOptions.shuffle = meta.shuffle
      loaded = id
    })
  })

  function start(fresh: boolean) {
    if (!entry) return
    startOptions.fresh = fresh
    startOptions.only = null
    void touchSet(entry.id, { openedAt: Date.now() })
    open = false
    go(`/play/${entry.id}`)
  }

  function edit() {
    if (!entry) return
    open = false
    go(`/edit/${entry.id}`)
  }
</script>

<Sheet bind:open title={entry?.title ?? ''}>
  {#if entry}
    <div class="stack">
      <p class="meta">
        {#if entry.subject}<span>{entry.subject}</span>{/if}
        <span class="num">{entry.count} câu</span>
      </p>
      <Segmented bind:value={startOptions.mode} options={MODES} label="Chế độ" />
      <Switch bind:checked={startOptions.shuffle} label="Trộn thứ tự" />
      {#if resume}
        <Button variant="primary" icon="next" onclick={() => start(false)}>Tiếp tục <span class="num">{resume}</span></Button>
        <Button icon="retry" onclick={() => start(true)}>Bắt đầu</Button>
      {:else}
        <Button variant="primary" icon="check" onclick={() => start(true)}>Bắt đầu</Button>
      {/if}
      <div class="row">
        <Button icon="edit" onclick={edit}>Sửa</Button>
        <Button icon="copy" disabled>Chia sẻ</Button>
      </div>
    </div>
  {/if}
</Sheet>

<style>
  .stack { display: grid; gap: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
