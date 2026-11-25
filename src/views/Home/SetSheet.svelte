<script lang="ts">
  import { parse } from '../../core/parse'
  import { getSet, touchSet, type SetEntry } from '../../state/library.svelte'
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

  $effect(() => {
    const id = entry?.id
    if (!open || !id || loaded === id) return
    void getSet(id).then((rec) => {
      if (!rec) return
      const { meta } = parse(rec.source).set
      startOptions.mode = meta.mode
      startOptions.shuffle = meta.shuffle
      loaded = id
    })
  })

  function start() {
    if (!entry) return
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
      <Button variant="primary" icon="check" onclick={start}>Bắt đầu</Button>
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
