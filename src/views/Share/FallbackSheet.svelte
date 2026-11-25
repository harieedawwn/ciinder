<script lang="ts">
  import { copyText } from '../../lib/clipboard'
  import { fallback } from '../../lib/download.svelte'
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { toast } from '../../ui/toast.svelte'

  const page = location.origin + import.meta.env.BASE_URL

  async function copy(text: string, done: string) {
    toast((await copyText(text)) ? done : 'Không sao chép được. Hãy mở bằng trình duyệt.')
  }
</script>

<Sheet bind:open={fallback.open} title="Không tải được trong ứng dụng này">
  <div class="stack">
    <p>Hãy mở ciinder bằng Safari hoặc Chrome để tải tệp {fallback.name}.</p>
    <Button variant="primary" icon="copy" onclick={() => copy(page, 'Đã sao chép liên kết')}>Sao chép liên kết</Button>
    {#if fallback.text}
      <Button icon="copy" onclick={() => copy(fallback.text, 'Đã sao chép nội dung')}>Sao chép nội dung</Button>
    {/if}
  </div>
</Sheet>

<style>
  .stack { display: grid; gap: 12px; }
  p { overflow-wrap: anywhere; }
</style>
