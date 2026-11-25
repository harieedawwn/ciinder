<script lang="ts">
  import { go } from '../../state/router.svelte'
  import type { SetEntry } from '../../state/library.svelte'
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import ShareSheet from '../Share/ShareSheet.svelte'
  import StartPanel from './StartPanel.svelte'

  let { entry, open = $bindable(false) }: { entry: SetEntry | null; open?: boolean } = $props()

  let shareOpen = $state(false)

  function edit() {
    if (!entry) return
    open = false
    go(`/edit/${entry.id}`)
  }
</script>

<Sheet bind:open title={entry?.title ?? ''}>
  {#if entry}
    <StartPanel {entry} active={open} onstart={() => (open = false)}>
      {#snippet extra()}
        <div class="row">
          <Button icon="edit" onclick={edit}>Sửa</Button>
          <Button icon="copy" onclick={() => (shareOpen = true)}>Chia sẻ</Button>
        </div>
      {/snippet}
    </StartPanel>
  {/if}
</Sheet>
<ShareSheet {entry} bind:open={shareOpen} />

<style>
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
