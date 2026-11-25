<script lang="ts">
  import { go } from '../../state/router.svelte'
  import { duplicateSet, library, removeSet, renameSet, sortedEntries, type SetEntry } from '../../state/library.svelte'
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { dismiss, toast } from '../../ui/toast.svelte'
  import SetCard from './SetCard.svelte'

  const entries = $derived(sortedEntries())

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
</script>

{#snippet starters(primary: boolean)}
  <Button variant={primary ? 'primary' : 'secondary'} icon="guide" onclick={() => go('/guide')}>Hướng dẫn cho AI</Button>
  <Button variant="secondary" icon="paste" onclick={() => go('/new')}>Dán nội dung</Button>
  <Button variant="secondary" icon="file" onclick={() => go('/new')}>Mở tệp</Button>
{/snippet}

<section class="page">
  {#if !library.ready}
    <div aria-busy="true"></div>
  {:else if entries.length === 0}
    <div class="empty">
      <p>Chưa có bộ câu hỏi nào.</p>
      <div class="starters">{@render starters(true)}</div>
    </div>
  {:else}
    <div class="head">
      <h1>Thư viện</h1>
      <Button variant="primary" icon="plus" onclick={() => go('/new')}>Tạo bộ mới</Button>
    </div>
    <div class="grid">
      {#each entries as e (e.id)}
        <SetCard entry={e} actions={actionsFor(e)} />
      {/each}
    </div>
  {/if}
</section>

<Sheet bind:open={renameOpen} title="Đổi tên">
  <form class="rename" onsubmit={submitRename}>
    <input bind:value={newName} aria-label="Tên bộ" maxlength="120" />
    <Button type="submit" variant="primary" disabled={!newName.trim()}>Lưu</Button>
  </form>
</Sheet>

<style>
  .page {
    width: 100%; max-width: 1200px; margin: 0 auto;
    padding: 8px max(16px, var(--safe-r)) calc(32px + var(--safe-b)) max(16px, var(--safe-l));
  }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 20px; }
  h1 { font-size: var(--fs-2xl); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr)); gap: 12px; }
  .empty { display: grid; gap: 24px; max-width: 400px; margin: 12vh auto 0; }
  .empty p { font-size: var(--fs-xl); font-weight: 600; line-height: 1.25; }
  .starters { display: grid; gap: 12px; }
  .starters :global(.btn) { justify-content: flex-start; }
  @media (max-height: 500px) { .empty { margin-top: 16px; } .starters { grid-template-columns: repeat(3, auto); justify-content: start; } }
  .rename { display: grid; gap: 12px; }
  input {
    min-height: 48px; padding: 0 14px; border-radius: var(--r-ctl); border: 1px solid var(--line);
    background: var(--raised); font-size: var(--fs-md);
  }
  input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }
</style>
