<script lang="ts">
  import { copyText, downloadText } from '../../lib/clipboard'
  import IndexCard from '../../ui/IndexCard.svelte'
  import Button from '../../ui/Button.svelte'
  import Segmented from '../../ui/Segmented.svelte'
  import { AI_PROMPTS } from '../../lib/aiPrompts'
  import Sheet from '../../ui/Sheet.svelte'
  import { toast } from '../../ui/toast.svelte'

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let text = $state('')
  let failed = $state(false)
  let showText = $state(false)
  let promptId = $state<(typeof AI_PROMPTS)[number]['id']>('plan')
  const prompt = $derived(AI_PROMPTS.find((p) => p.id === promptId)?.text ?? '')
  let area = $state<HTMLTextAreaElement>()

  $effect(() => {
    if (open && !text && !failed) {
      fetch(`${import.meta.env.BASE_URL}ciinder-guide.md`)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
        .then((t) => (text = t))
        .catch(() => (failed = true))
    }
  })

  async function copyPrompt() {
    if (await copyText(prompt)) toast('Đã sao chép')
    else toast('Không sao chép được. Hãy nhấn giữ trong ô rồi chọn Sao chép.')
  }

  async function copy() {
    if (await copyText(text)) toast('Đã sao chép')
    else {
      showText = true
      queueMicrotask(() => area?.select())
      toast('Không sao chép được. Hãy nhấn giữ trong ô rồi chọn Sao chép.')
    }
  }
</script>

<Sheet bind:open title="Hướng dẫn cho AI">
  <IndexCard plain tabs={[{ label: 'Gửi cho AI' }]}>
   <div class="stack">
    <p>Gửi tệp hướng dẫn và tài liệu cho AI, kèm một lời nhắn.</p>
    {#if failed}
      <p class="err">Không tải được hướng dẫn. Hãy kiểm tra mạng rồi mở lại.</p>
    {:else}
      <div class="row">
        <Button variant="primary" icon="copy" disabled={!text} onclick={copy}>Sao chép</Button>
        <Button icon="file" disabled={!text} onclick={() => downloadText('ciinder-guide.md', text)}>Tải về</Button>
      </div>
      {#if showText}
        <textarea bind:this={area} readonly value={text} aria-label="Nội dung hướng dẫn"></textarea>
      {/if}
    {/if}
   </div>
  </IndexCard>
  <IndexCard plain tabs={[{ label: 'Lời nhắn cho AI' }]}>
    <div class="stack">
      <Segmented bind:value={promptId} options={AI_PROMPTS} label="Lời nhắn" />
      <textarea class="prompt" readonly value={prompt} aria-label="Lời nhắn cho AI"></textarea>
      <div class="row"><Button variant="primary" icon="copy" onclick={copyPrompt}>Sao chép</Button></div>
    </div>
  </IndexCard>
</Sheet>

<style>
  .stack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  textarea.prompt { height: 9.5rem; }
  p { line-height: 1.5; }
  .err { color: var(--bad); }
  .row { display: flex; flex-wrap: wrap; gap: 12px; }
  textarea {
    width: 100%; height: 40vh; padding: 12px; border: 1px solid var(--line); border-radius: var(--r-ctl);
    background: var(--raised); font: 0.8125rem/1.5 ui-monospace, Menlo, Consolas, monospace; resize: none;
  }
</style>
