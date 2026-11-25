<script lang="ts">
  import { LINK_SOFT_MAX, shareLink } from '../../core/share'
  import { copyText } from '../../lib/clipboard'
  import { downloadHtml, downloadSource } from '../../lib/exportHtml'
  import { play } from '../../lib/sound'
  import { getSet, type SetEntry } from '../../state/library.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { toast } from '../../ui/toast.svelte'

  let { entry, open = $bindable(false) }: { entry: Pick<SetEntry, 'id' | 'title'> | null; open?: boolean } = $props()

  let source = $state('')
  let busy = $state(false)

  const link = $derived(source ? shareLink(source, location.origin + import.meta.env.BASE_URL) : '')
  const long = $derived(link.length > LINK_SOFT_MAX)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  $effect(() => {
    const id = entry?.id
    if (!open || !id) return
    source = ''
    void getSet(id).then((rec) => {
      if (entry?.id === id && rec) source = rec.source
    })
  })

  async function copy() {
    if (await copyText(link)) {
      play('copy')
      toast('Đã sao chép liên kết')
    } else toast('Không sao chép được. Hãy nhấn giữ liên kết rồi chọn Sao chép.')
  }

  async function share() {
    try {
      await navigator.share({ title: entry?.title, url: link })
    } catch {
      // Cancelled by the user.
    }
  }

  async function html() {
    busy = true
    const ok = await downloadHtml(entry?.title ?? '', source)
    busy = false
    if (!ok) toast('Chưa tạo được tệp HTML. Hãy kết nối mạng và thử lại.')
  }
</script>

<Sheet bind:open title="Chia sẻ">
  <div class="sections">
    <IndexCard plain tabs={[{ label: 'Liên kết' }]}>
      <div class="stack">
        {#if long}<p class="warn">Liên kết dài, nên gửi tệp HTML.</p>{/if}
        <Button variant={long ? 'secondary' : 'primary'} icon="copy" disabled={!link} onclick={copy}>Sao chép liên kết</Button>
        {#if canShare}<Button icon="next" disabled={!link} onclick={share}>Chia sẻ</Button>{/if}
      </div>
    </IndexCard>
    <IndexCard plain tabs={[{ label: 'Tệp' }]}>
      <div class="stack">
        <Button variant={long ? 'primary' : 'secondary'} icon="file" disabled={!source || busy} onclick={html}>Tải tệp HTML</Button>
        <Button icon="file" disabled={!source} onclick={() => downloadSource(entry?.title ?? '', source)}>Tải tệp nội dung</Button>
      </div>
    </IndexCard>
  </div>
</Sheet>

<style>
  .sections { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .stack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .warn { font-size: var(--fs-sm); color: var(--muted); }
</style>
