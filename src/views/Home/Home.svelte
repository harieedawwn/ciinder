<script lang="ts">
  import { ingestText, startWithFile } from '../../lib/ingest'
  import { draft } from '../../state/session.svelte'
  import { go, router } from '../../state/router.svelte'
  import { library_ui } from '../../state/session.svelte'
  import GuideSheet from '../Guide/GuideSheet.svelte'
  import { morph } from '../../lib/vt'
  import SetSheet from './SetSheet.svelte'
  import { duplicateSet, library, removeSet, renameSet, sortedEntries, type SetEntry } from '../../state/library.svelte'
  import Button from '../../ui/Button.svelte'
  import EmptyDesk from './EmptyDesk.svelte'
  import HomeNav from './HomeNav.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { dismiss, toast } from '../../ui/toast.svelte'
  import SetCard from './SetCard.svelte'

  let { onsettings }: { onsettings: () => void } = $props()

  const entries = $derived(sortedEntries())
  /** Entries grouped by subject (only when ≥ 2 subjects); `index` keeps the fall-in stagger continuous. */
  const groups = $derived.by(() => {
    const subjects = new Set(entries.map((e) => e.subject ?? ''))
    const list = subjects.size < 2 ? [{ name: '', items: entries }] : [...subjects].sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || a.localeCompare(b, 'vi')).map((name) => ({ name, items: entries.filter((e) => (e.subject ?? '') === name) }))
    let n = 0
    return list.map((g) => ({ name: g.name, items: g.items.map((e) => ({ e, index: n++ })) }))
  })

  let guideOpen = $state(router.route.name === 'guide')
  let selected = $state<SetEntry | null>(null)
  let setOpen = $state(false)
  let dragging = $state(false)

  $effect(() => {
    guideOpen = router.route.name === 'guide'
  })
  $effect(() => {
    if (router.route.name === 'guide' && !guideOpen) go('/')
  })
  $effect(() => {
    const id = library_ui.openId
    const e = id ? library.entries.find((x) => x.id === id) : undefined
    if (e) {
      library_ui.openId = null
      openSet(e)
    }
  })

  function openSet(e: SetEntry, el: HTMLElement | null = null) {
    const open = () => { selected = e; setOpen = true }
    if (el) void morph(el, 'set-card', open)
    else open()
  }

  const dropFile = (e: DragEvent) => {
    e.preventDefault()
    dragging = false
    void startWithFile(e.dataTransfer?.files?.[0] ?? null)
  }

  let renaming = $state<SetEntry | null>(null)
  let renameOpen = $state(false)
  let newName = $state('')

  function startRename(e: SetEntry) {
    renaming = e
    newName = e.title
    renameOpen = true
  }

  async function submitRename(ev: SubmitEvent) {
    ev.preventDefault()
    if (renaming && newName.trim()) await renameSet(renaming.id, newName)
    renameOpen = false
  }

  function remove(e: SetEntry) {
    dismiss(true)
    const op = removeSet(e.id)
    toast(`Đã xóa “${e.title}”`, { action: { label: 'Hoàn tác', run: op.undo }, onExpire: () => void op.commit() })
  }

  async function duplicate(e: SetEntry) {
    if (await duplicateSet(e.id)) toast('Đã nhân bản')
  }

  const actionsFor = (e: SetEntry) => [
    { label: 'Đổi tên', icon: 'edit' as const, run: () => startRename(e) },
    { label: 'Nhân bản', icon: 'copy' as const, run: () => void duplicate(e) },
    { label: 'Xóa', icon: 'trash' as const, danger: true, run: () => remove(e) },
  ]

  function pasted(e: ClipboardEvent) {
    const t = e.target as HTMLElement | null
    if (t?.closest('input, textarea, [contenteditable], dialog')) return
    const text = e.clipboardData?.getData('text')
    if (!text?.trim()) return
    e.preventDefault()
    void ingestText(text).then((out) => {
      if (out === null) return
      draft.text = out
      go('/new')
    })
  }
</script>


<svelte:window
  onpaste={pasted}
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault()
      dragging = true
    }
  }}
  ondragleave={(e) => {
    if (!e.relatedTarget) dragging = false
  }}
  ondrop={dropFile}
/>

<HomeNav {onsettings} />

<section class="page" class:dragging>
  {#if !library.ready}
    <div aria-busy="true"></div>
  {:else if entries.length === 0}
    <EmptyDesk hot={dragging} />
  {:else}
    {#each groups as g (g.name)}
      <div class="group">
        {#if g.name}<h2 class="subject"><span>{g.name}</span></h2>{/if}
        <div class="grid">
          {#each g.items as { e, index } (e.id)}
            <SetCard entry={e} {index} actions={actionsFor(e)} onopen={(el) => openSet(e, el)} />
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</section>

<GuideSheet bind:open={guideOpen} />
<SetSheet entry={selected} bind:open={setOpen} />

<Sheet bind:open={renameOpen} title="Đổi tên">
  <form class="rename" onsubmit={submitRename}>
    <input bind:value={newName} aria-label="Tên bộ" maxlength="120" />
    <Button type="submit" variant="primary" disabled={!newName.trim()}>Lưu</Button>
  </form>
</Sheet>

<style>
  .page {
    width: 100%; max-width: 1200px; margin: 0 auto;
    padding: 16px max(16px, var(--safe-r)) calc(88px + var(--safe-b)) max(16px, var(--safe-l));
  }
  .page.dragging { outline: 2px dashed var(--accent); outline-offset: -8px; }
  .group + .group { margin-top: 36px; }
  .subject { position: relative; height: 30px; margin-bottom: 18px; border-bottom: 1px solid var(--line); font-size: var(--fs-xs); font-weight: 600; }
  .subject span {
    position: absolute; left: 12px; bottom: -1px; height: 30px; padding: 0 14px; display: inline-flex; align-items: center;
    background: var(--surface); border: 1px solid var(--line); border-bottom-color: var(--surface); border-radius: var(--r-chip) var(--r-chip) 0 0;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr)); gap: 12px; }
  @media (min-width: 600px) { .grid { gap: 24px; } }
  @media (min-width: 1024px) {
    .page { max-width: none; margin: 0 0 0 248px; width: auto; padding: 40px 40px 48px; }
  }
  @media (max-height: 500px) and (max-width: 1023px) { .page { padding-bottom: calc(32px + var(--safe-b)); } }
  .rename { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  input {
    min-height: 48px; padding: 0 14px; border-radius: var(--r-ctl); border: 1px solid var(--line);
    background: var(--raised); font-size: var(--fs-md);
  }
  input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }
</style>
