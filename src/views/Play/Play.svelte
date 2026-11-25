<script lang="ts">
  import { buildOrder, studyOrder } from '../../core/attempt'
  import { parse } from '../../core/parse'
  import { PLAYABLE } from '../../play/registry'
  import { hasMath, loadRender } from '../../render/rich.svelte'
  import { getSet, isTemp } from '../../state/library.svelte'
  import { flush, loadProgress, startAttempt, type Attempt } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import { startOptions } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import { toast } from '../../ui/toast.svelte'
  import SaveBar from '../Shared/SaveBar.svelte'
  import Controls from './Controls.svelte'
  import Deck from './Deck.svelte'
  import GridSheet from './GridSheet.svelte'
  import { Player } from './player.svelte'
  import SubmitSheet from './SubmitSheet.svelte'
  import Timer from './Timer.svelte'

  let { id, review = false }: { id: string; review?: boolean } = $props()

  let player = $state<Player | null>(null)
  let problem = $state<'' | 'missing' | 'empty'>('')
  let gridOpen = $state(false)
  let confirmOpen = $state(false)

  $effect(() => {
    void load(id, review)
    return flush
  })

  async function load(setId: string, isReview: boolean) {
    const rec = await getSet(setId).catch(() => undefined)
    if (!rec) return void (problem = 'missing')
    const { set } = parse(rec.source)
    // Render chunks (markdown, and KaTeX when needed) load while progress is read, so cards never show raw text.
    const render = loadRender(hasMath(rec.source))
    const data = await loadProgress(setId)
    await render
    if (isReview) {
      if (!data.last) return go(`/result/${setId}`)
      data.last.pos = 0
      player = new Player(setId, set, data.last, true)
      return
    }
    let attempt: Attempt | null = data.current
    if (attempt && !startOptions.fresh && new Player(setId, set, attempt, false).items.length) {
      player = new Player(setId, set, attempt, false)
      return
    }
    const fresh = startOptions.fresh
    const only = startOptions.only ?? undefined
    const study = fresh && startOptions.study
    startOptions.fresh = false
    startOptions.only = null
    startOptions.study = false
    const seed = (Math.random() * 2 ** 32) >>> 0
    const order = study
      ? studyOrder(set, data.mastery)
      : buildOrder(set, { shuffle: fresh ? startOptions.shuffle : set.meta.shuffle, seed, kinds: PLAYABLE, only })
    if (!order.length) return void (problem = 'empty')
    const mode = study ? 'practice' : fresh ? startOptions.mode : set.meta.mode
    const endsAt = mode === 'test' && set.meta.time ? Date.now() + set.meta.time * 60_000 : undefined
    attempt = startAttempt({ mode, seed, order, endsAt, retry: !!only, study })
    player = new Player(setId, set, attempt, false)
  }

  const progressValue = $derived.by(() => {
    const p = player
    if (!p) return 0
    if (p.review) return (p.pos + 1) / p.items.length
    const done = p.items.filter((it) => p.done(it)).length
    return done / p.items.length
  })

  function submit() {
    if (!player) return
    if (player.review) return go(`/result/${id}`)
    if (player.unanswered() > 0) confirmOpen = true
    else finish()
  }

  function finish() {
    player?.finish()
    go(`/result/${id}`)
  }

  function expire() {
    if (!player || player.review) return
    finish()
    toast('Hết giờ. Bài đã được nộp.')
  }

  const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

  function keys(e: KeyboardEvent) {
    if (!player || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return
    if (/^[1-9]$/.test(e.key) && !typing(e.target)) {
      player.choose(Number(e.key))
      e.preventDefault()
    } else if (e.key === 'Enter' && !(e.target as Element).closest('button, textarea, form, [role="button"]')) {
      e.preventDefault()
      primary()
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !typing(e.target)) {
      e.preventDefault()
      if (e.key === 'ArrowRight') player.next()
      else player.prev()
    }
  }

  function primary() {
    const p = player
    if (!p) return
    if (p.checkable) p.check()
    else if (p.last) submit()
    else p.next()
  }
</script>

<svelte:window onkeydown={keys} />

{#if player}
  <section class="play" class:shared={isTemp(id)}>
    <div class="stroke" aria-hidden="true"><span style:transform="scaleX({progressValue})"></span></div>
    <SaveBar {id} />
    <header class="head">
      <h1>{player.set.title}</h1>
      {#if player.attempt.endsAt && !player.review}<Timer endsAt={player.attempt.endsAt} onexpire={expire} />{/if}
      <Button variant="quiet" icon="grid" label="Danh sách câu" onclick={() => (gridOpen = true)} />
    </header>
    <Deck {player} />
    <Controls {player} onprimary={primary} />
  </section>
  <GridSheet {player} bind:open={gridOpen} onsubmit={submit} />
  <SubmitSheet bind:open={confirmOpen} left={player.unanswered()} label={player.practice ? 'Xong' : 'Nộp bài'} onconfirm={finish} />
{:else if problem}
  <section class="play empty">
    <p>{problem === 'missing' ? 'Không tìm thấy bộ câu hỏi này trên máy.' : 'Bộ này chưa có câu hỏi để luyện tập.'}</p>
    <Button icon="back" onclick={() => go('/')}>Thư viện</Button>
  </section>
{/if}

<style>
  .play {
    display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; max-width: 680px; margin: 0 auto;
    padding: 0 max(16px, var(--safe-r)) 0 max(16px, var(--safe-l));
  }
  .stroke { position: sticky; top: calc(56px + var(--safe-t)); z-index: 5; height: 4px; margin: 0 -4px; border-radius: 2px; overflow: hidden; }
  .stroke span {
    display: block; height: 100%; background: var(--mark-strong); border-radius: 2px;
    transform-origin: left center; transition: transform var(--t-large) var(--ease-out);
  }
  .head { display: flex; align-items: center; gap: 12px; min-height: 44px; }
  h1 { flex: 1; min-width: 0; font-size: var(--fs-md); font-weight: 600; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .head :global(.quiet) { margin-right: -8px; color: var(--muted); }
  .empty { justify-items: start; gap: 16px; padding-top: 24px; }
  /* Phones: controls stay in the thumb zone at the bottom. */
  @media (max-width: 699px) {
    .play:not(.empty) { grid-template-rows: auto auto 1fr auto; min-height: calc(100dvh - 56px - var(--safe-t)); }
    .play.shared { grid-template-rows: auto auto auto 1fr auto; }
  }
  @media (max-height: 500px) { .stroke { top: calc(48px + var(--safe-t)); } }
</style>
