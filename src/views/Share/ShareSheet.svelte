<script lang="ts">
  import { LINK_SOFT_MAX, encodeShare, shareLink } from '../../core/share'
  import { cloudEnabled, shortIdFor, shortLink } from '../../lib/cloud'
  import { copyText } from '../../lib/clipboard'
  import { downloadHtml, downloadSource } from '../../lib/exportHtml'
  import { play } from '../../lib/sound'
  import { getSet, type SetEntry } from '../../state/library.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import { toast } from '../../ui/toast.svelte'

  let { entry, open = $bindable(false) }: { entry: (Pick<SetEntry, 'id' | 'title'> & { count?: number }) | null; open?: boolean } = $props()

  let source = $state('')
  let busy = $state(false)
  let making = $state(false)
  const base = location.origin + import.meta.env.BASE_URL

  const link = $derived(source ? shareLink(source, base) : '')
  const short = cloudEnabled()
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

  /** Short `#k=` link when cloud is on and reachable; otherwise the long link. */
  async function bestLink(): Promise<string> {
    if (!cloudEnabled()) return link
    making = true
    try {
      return shortLink(await shortIdFor(source, encodeShare(source)), base)
    } catch {
      toast('Không tạo được liên kết ngắn, đã dùng liên kết đầy đủ')
      return link
    } finally {
      making = false
    }
  }

  async function copy(full = false) {
    if (await copyText(full ? link : await bestLink())) {
      play('copy')
      toast('Đã sao chép liên kết')
    } else toast('Không sao chép được. Hãy nhấn giữ liên kết rồi chọn Sao chép.')
  }

  async function share() {
    try {
      const t = entry?.title ?? 'Bộ câu hỏi'
      // Link previews can't show per-set info (hash links), so the message itself carries the title.
      await navigator.share({ title: t, text: `${t}${entry?.count ? ` · ${entry.count} câu` : ''}`, url: await bestLink() })
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
        {#if long && !short}<p class="warn">Liên kết dài, nên gửi tệp HTML.</p>{/if}
        <Button variant={long && !short ? 'secondary' : 'primary'} icon="copy" disabled={!link || making} onclick={() => copy()}>
          {making ? 'Đang tạo liên kết…' : 'Sao chép liên kết'}
        </Button>
        {#if short}<Button icon="copy" disabled={!link} onclick={() => copy(true)}>Liên kết đầy đủ</Button>{/if}
        {#if canShare}<Button icon="next" disabled={!link || making} onclick={share}>Chia sẻ</Button>{/if}
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
