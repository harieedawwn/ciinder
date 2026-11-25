<script lang="ts">
  // `#s=A…` links: decode from the full href (Zalo/Facebook append junk), then play at once.
  import { decodeShare } from '../../core/share'
  import { registerTemp } from '../../state/library.svelte'
  import { go } from '../../state/router.svelte'
  import Button from '../../ui/Button.svelte'
  import Play from '../Play/Play.svelte'

  const decoded = decodeShare(location.href)
  const id = decoded.ok ? registerTemp(decoded.source) : ''
</script>

{#if decoded.ok}
  <Play {id} />
{:else}
  <section class="broken">
    <p>Liên kết bị thiếu hoặc hỏng.</p>
    <Button variant="primary" icon="back" onclick={() => go('/')}>Thư viện</Button>
  </section>
{/if}

<style>
  .broken { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; gap: 16px; max-width: 680px; margin: 0 auto; padding: 24px max(16px, var(--safe-r)) 0 max(16px, var(--safe-l)); }
  .broken p { font-size: var(--fs-xl); font-weight: 600; line-height: 1.25; }
</style>
