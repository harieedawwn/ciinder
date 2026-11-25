<script lang="ts">
  import { onMount, tick, untrack } from 'svelte'
  import { hasErrors, isError } from '../../core/issues'
  import { parse } from '../../core/parse'
  import { pickFile, readClipboard } from '../../lib/clipboard'
  import { ingestText, openFileInto } from '../../lib/ingest'
  import { getSet, saveSet } from '../../state/library.svelte'
  import { go, leaveGuard } from '../../state/router.svelte'
  import { draft, library_ui } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import IndexCard, { type CardTab } from '../../ui/IndexCard.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { toast } from '../../ui/toast.svelte'
  import IssuesPanel from './IssuesPanel.svelte'
  import Preview from './Preview.svelte'
  import SourceBox from './SourceBox.svelte'

  let { id }: { id?: string } = $props()

  const wideQuery = matchMedia('(min-width: 900px)')
  let wide = $state(wideQuery.matches)

  let source = $state(draft.text)
  let initial = draft.text
  let ready = $state(untrack(() => !id))
  let tab = $state<'src' | 'view'>('src')
  let box = $state<HTMLTextAreaElement>()
  let result = $state(untrack(() => parse(source)))
  let saving = $state(false)
  let leaveOpen = $state(false)
  let pendingTarget = ''
  let dragging = $state(false)

  draft.text = ''

  const dirty = $derived(source !== initial)
  const errors = $derived(hasErrors(result.issues))
  const flagged = $derived(new Set(result.issues.filter(isError).map((i) => i.line)))
  const canSave = $derived(source.trim() !== '' && !errors && !saving)

  onMount(() => {
    const onWide = () => (wide = wideQuery.matches)
    wideQuery.addEventListener('change', onWide)
    if (id) {
      void getSet(id).then((rec) => {
        if (!rec) {
          toast('Không tìm thấy bộ câu hỏi này.')
          go('/')
          return
        }
        source = initial = rec.source
        ready = true
      })
    }
    leaveGuard.check = (target) => {
      if (!dirty) return false
      pendingTarget = target.replace(/^#/, '')
      leaveOpen = true
      return true
    }
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    addEventListener('beforeunload', warn)
    return () => {
      wideQuery.removeEventListener('change', onWide)
      leaveGuard.check = null
      removeEventListener('beforeunload', warn)
    }
  })

  // Debounced live check.
  $effect(() => {
    const s = source
    const t = setTimeout(() => (result = parse(s)), 250)
    return () => clearTimeout(t)
  })

  function jump(line: number) {
    tab = 'src'
    void tick().then(() => {
      if (!box) return
      const lines = source.split('\n')
      const n = Math.min(Math.max(line, 1), lines.length)
      const start = lines.slice(0, n - 1).reduce((a, l) => a + l.length + 1, 0)
      box.focus({ preventScroll: true })
      box.setSelectionRange(start, start + lines[n - 1].length)
      const lh = parseFloat(getComputedStyle(box).lineHeight) || 21
      box.scrollTop = Math.max(0, (n - 3) * lh)
    })
  }

  async function apply(text: string | null) {
    if (text !== null) {
      source = text
      tab = 'src'
    }
  }

  async function paste() {
    const t = await readClipboard()
    if (t) await apply(await ingestText(t))
    else {
      tab = 'src'
      box?.focus()
      toast('Không đọc được bộ nhớ tạm. Hãy nhấn giữ trong ô rồi chọn Dán.')
    }
  }

  const openFile = async () => apply(await openFileInto(await pickFile()))

  async function drop(e: DragEvent) {
    e.preventDefault()
    dragging = false
    await apply(await openFileInto(e.dataTransfer?.files?.[0] ?? null))
  }

  async function save() {
    saving = true
    try {
      const sid = await saveSet(source, id)
      initial = source
      library_ui.openId = sid
      toast('Đã lưu')
      go('/')
    } catch {
      toast('Không lưu được. Hãy thử lại hoặc giải phóng bộ nhớ trình duyệt.')
    } finally {
      saving = false
    }
  }

  function leave() {
    leaveGuard.check = null
    leaveOpen = false
    go(pendingTarget || '/')
  }

  const back = () => go('/')

  function tabsFor(which: 'src' | 'view'): CardTab[] {
    const label = which === 'src' ? 'Nội dung' : 'Xem trước'
    // Desktop: both cards are visible, tabs are plain labels. Phone: tabs switch the pane.
    if (wide) return [{ label, active: true }]
    return (['src', 'view'] as const).map((k) => ({
      label: k === 'src' ? 'Nội dung' : 'Xem trước', active: tab === k, onclick: () => (tab = k),
    }))
  }
</script>

<svelte:window
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault()
      dragging = true
    }
  }}
  ondragleave={(e) => {
    if (!e.relatedTarget) dragging = false
  }}
  ondrop={drop}
/>

<section class="ed" class:dragging>
  <div class="bar">
    <Button variant="quiet" icon="back" onclick={back}>Thư viện</Button>
    <div class="tools">
      <Button icon="paste" onclick={paste}>Dán nội dung</Button>
      <Button icon="file" onclick={openFile}>Mở tệp</Button>
      <Button variant="primary" icon="check" disabled={!canSave} onclick={save}>Lưu</Button>
    </div>
  </div>

  {#if ready}
    <div class="main">
      <div class="left" class:hide={!wide && tab !== 'src'}>
        <IndexCard class="pane" plain tabs={tabsFor('src')}>
          <SourceBox bind:value={source} {flagged} bind:el={box} />
        </IndexCard>
        <IssuesPanel issues={result.issues} {source} onjump={jump} />
      </div>
      <div class="right" class:hide={!wide && tab !== 'view'}>
        <IndexCard class="pane" plain tabs={tabsFor('view')}>
          <div class="scroll">
            {#if result.set.items.length}
              <Preview set={result.set} />
            {:else}
              <p class="empty">Chưa có câu hỏi nào để xem.</p>
            {/if}
          </div>
        </IndexCard>
      </div>
    </div>
  {/if}
</section>

<Sheet bind:open={leaveOpen} title="Rời khỏi trang này?">
  <div class="leave">
    <p>Nội dung chưa lưu sẽ mất.</p>
    <Button variant="primary" onclick={() => (leaveOpen = false)}>Ở lại</Button>
    <Button onclick={leave}>Rời đi</Button>
  </div>
</Sheet>

<style>
  .ed {
    display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 1400px; margin: 0 auto;
    padding: 8px max(16px, var(--safe-r)) calc(16px + var(--safe-b)) max(16px, var(--safe-l));
    height: calc(100dvh - 56px - var(--safe-t)); min-height: 420px;
  }
  .ed.dragging { outline: 2px dashed var(--accent); outline-offset: -8px; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .tools { display: flex; gap: 8px; flex-wrap: wrap; }
  .main { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .left { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 12px; min-height: 0; }
  .right { display: grid; min-height: 0; }
  .main :global(.pane) { margin-top: 30px; min-height: 0; display: grid; }
  .main :global(.pane > .body) { padding: 12px; min-height: 0; display: grid; }
  .scroll { overflow-y: auto; overscroll-behavior: contain; min-height: 0; padding: 4px 8px; }
  .hide { display: none; }
  .empty { color: var(--muted); }
  .leave { display: grid; gap: 12px; }
  @media (min-width: 900px) {
    .main { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  }
  @media (max-width: 480px) { .tools :global(.btn) { padding: 0 12px; } }
</style>
