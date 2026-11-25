<script lang="ts">
  // `#s=A…` (inline payload) and `#k=<id>` (short link) links: parse from the full href (Zalo/Facebook append junk),
  // then show the start screen (mode + options) so visitors can pick what to practise.
  import { decodeShare } from '../../core/share'
  import { CloudFailure, get, parseShortId } from '../../lib/cloud'
  import { getSet, registerTemp, summarize } from '../../state/library.svelte'
  import { go } from '../../state/router.svelte'
  import Button from '../../ui/Button.svelte'
  import Start from '../Standalone/Start.svelte'
  import SaveBar from './SaveBar.svelte'

  type State = { kind: 'loading' } | { kind: 'ready'; id: string } | { kind: 'error'; message: string }

  const shortId = parseShortId(location.href)
  let state = $state<State>(shortId ? { kind: 'loading' } : fromPayload(location.href))

  function fromPayload(href: string): State {
    const decoded = decodeShare(href)
    return decoded.ok ? { kind: 'ready', id: registerTemp(decoded.source) } : { kind: 'error', message: 'Liên kết bị thiếu hoặc hỏng.' }
  }

  function messageFor(e: unknown): string {
    const kind = e instanceof CloudFailure ? e.kind : 'failed'
    if (kind === 'offline') return 'Không có mạng. Hãy kết nối mạng rồi mở lại liên kết.'
    if (kind === 'notfound') return 'Không tìm thấy bộ đề của liên kết này.'
    return 'Không mở được liên kết. Hãy thử lại sau.'
  }

  $effect(() => {
    if (!shortId) return
    let live = true
    get(shortId).then(
      (payload) => {
        if (live) state = fromPayload('#s=' + payload)
      },
      (e) => {
        if (live) state = { kind: 'error', message: messageFor(e) }
      },
    )
    return () => (live = false)
  })
</script>

{#if state.kind === 'ready'}
  {#await getSet(state.id) then rec}
    {#if rec}
      {@const info = summarize(rec.source)}
      <div class="save"><SaveBar id={state.id} to={() => '/'} /></div>
      <Start id={state.id} title={info.title} subject={info.subject} count={info.count} />
    {/if}
  {/await}
{:else if state.kind === 'error'}
  <section class="broken">
    <p>{state.message}</p>
    <Button variant="primary" icon="back" onclick={() => go('/')}>Thư viện</Button>
  </section>
{:else}
  <section class="broken"><p>Đang mở bộ đề…</p></section>
{/if}

<style>
  .save { max-width: 480px; margin: 0 auto; padding: 8px max(16px, var(--safe-r)) 0 max(16px, var(--safe-l)); }
  .broken { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; gap: 16px; max-width: 680px; margin: 0 auto; padding: 24px max(16px, var(--safe-r)) 0 max(16px, var(--safe-l)); }
  .broken p { font-size: var(--fs-xl); font-weight: 600; line-height: 1.25; }
</style>
