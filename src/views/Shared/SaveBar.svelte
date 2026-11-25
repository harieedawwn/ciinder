<script lang="ts">
  // Shown above a set opened from a shared link: it plays right away, saving is optional.
  import { adoptTemp, isTemp } from '../../state/library.svelte'
  import { flush, moveProgress } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import Button from '../../ui/Button.svelte'
  import { toast } from '../../ui/toast.svelte'

  /** `to`: where to go after saving (default: keep playing the saved copy). */
  let { id, to = (next: string) => `/play/${next}` }: { id: string; to?: (next: string) => string } = $props()

  async function save() {
    flush()
    const next = await adoptTemp(id)
    if (!next) return
    moveProgress(next)
    toast('Đã lưu vào thư viện')
    go(to(next))
  }
</script>

{#if isTemp(id)}
  <div class="bar">
    <span>Bộ được chia sẻ</span>
    <Button variant="quiet" icon="plus" onclick={save}>Lưu vào thư viện</Button>
  </div>
{/if}

<style>
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; font-size: var(--fs-sm); color: var(--muted); }
  .bar :global(.quiet) { margin-right: -8px; color: var(--accent); }
</style>
