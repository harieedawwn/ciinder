<script lang="ts">
  import Rich from '../../render/Rich.svelte'
  import { sectionScores } from '../../core/attempt'
  import { parse } from '../../core/parse'
  import { isScored, type QuizSet } from '../../core/types'
  import { getSet } from '../../state/library.svelte'
  import { loadProgress, type Attempt } from '../../state/progress.svelte'
  import { go } from '../../state/router.svelte'
  import { startOptions } from '../../state/session.svelte'
  import Button from '../../ui/Button.svelte'
  import { promptText } from '../Editor/summary'

  let { id }: { id: string } = $props()

  let quiz = $state<QuizSet | null>(null)
  let attempt = $state<Attempt | null>(null)
  let missing = $state(false)

  $effect(() => {
    void (async () => {
      const rec = await getSet(id).catch(() => undefined)
      const data = rec ? await loadProgress(id) : null
      if (!rec || !data?.last) return void (missing = true)
      quiz = parse(rec.source).set
      attempt = data.last
    })()
  })

  const scores = $derived(attempt?.scores ?? {})
  const played = $derived.by(() => {
    const byId = new Map(quiz?.items.map((it) => [it.id, it]))
    return (attempt?.order ?? []).flatMap((iid, n) => {
      const it = byId.get(iid)
      return it && isScored(it) ? [{ it, n }] : []
    })
  })
  /** Self-rated (flash/essay) sessions have no score: show how many cards were rated Đã thuộc. */
  const cards = $derived.by(() => {
    const ids = new Set(quiz?.items.filter((it) => it.kind === 'flash' || it.kind === 'essay').map((it) => it.id))
    const seen = (attempt?.order ?? []).filter((iid) => ids.has(iid))
    const answers = attempt?.answers ?? {}
    return { total: seen.length, known: seen.filter((iid) => { const a = answers[iid]; return (a?.kind === 'flash' || a?.kind === 'essay') && a.rating === 'known' }).length }
  })
  const wrong = $derived(played.filter(({ it }) => (scores[it.id] ?? 0) < 1))
  const right = $derived(played.length - wrong.length)
  const percent = $derived(attempt?.percent ?? 0)
  const ten = $derived((Math.round(percent) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 }))
  const sections = $derived(quiz && attempt ? sectionScores(quiz, attempt.order, scores) : [])

  function again(onlyWrong: boolean) {
    if (!attempt) return
    startOptions.fresh = true
    startOptions.mode = attempt.mode
    startOptions.only = onlyWrong ? wrong.map(({ it }) => it.id) : null
    go(`/play/${id}`)
  }
</script>

{#if quiz && attempt}
  <section class="result">
    <h1>{quiz.title}</h1>
    {#if played.length}
      <div class="score">
        <p class="big num">{percent}%</p>
        <p class="ten num">{ten}/10</p>
      </div>
    {:else}
      <div class="score"><p class="big num">{cards.known}/{cards.total}</p></div>
    {/if}
    <p class="meta num">
      <span>{attempt.mode === 'test' ? 'Làm bài' : 'Luyện tập'}</span>
      {#if played.length}<span>Đúng {right}/{played.length} câu</span>{/if}
      {#if cards.total}<span>Đã thuộc {cards.known}/{cards.total} thẻ</span>{/if}
    </p>

    {#if sections.length > 1}
      <ul class="sections">
        {#each sections as s, i (i)}
          {@const r = s.max ? s.got / s.max : 0}
          <li>
            <span class="name">{s.title || 'Khác'}</span>
            <span class="num pct">{Math.round(r * 100)}%</span>
            <span class="bar" aria-hidden="true"><span style:transform="scaleX({r})"></span></span>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="actions">
      <Button variant="primary" icon="retry" onclick={() => again(wrong.length > 0)}>{wrong.length ? 'Làm lại câu sai' : 'Làm lại'}</Button>
      <Button icon="eye" onclick={() => go(`/review/${id}`)}>Xem lại</Button>
      {#if wrong.length}<Button icon="retry" onclick={() => again(false)}>Làm lại</Button>{/if}
      <span class="home"><Button variant="quiet" icon="back" onclick={() => go('/')}>Thư viện</Button></span>
    </div>

    {#if wrong.length}
      <h2>Câu sai</h2>
      <ol class="wrong">
        {#each wrong as { it, n } (it.id)}
          {@const s = scores[it.id] ?? 0}
          <li>
            <span class="n num">{n + 1}</span>
            <span class="text"><Rich inline src={promptText(it)} /></span>
            <span class="tag" class:part={s > 0}>{s > 0 ? 'Đúng một phần' : 'Sai'}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
{:else if missing}
  <section class="result">
    <p>Chưa có kết quả cho bộ này.</p>
    <Button icon="back" onclick={() => go('/')}>Thư viện</Button>
  </section>
{/if}

<style>
  .result {
    display: grid; gap: 16px; align-content: start; max-width: 680px; margin: 0 auto;
    padding: 8px max(16px, var(--safe-r)) calc(32px + var(--safe-b)) max(16px, var(--safe-l));
  }
  h1 { font-size: var(--fs-md); color: var(--muted); overflow-wrap: anywhere; }
  .score { display: flex; align-items: baseline; gap: 16px; }
  .big { font-size: 3.5rem; font-weight: 600; line-height: 1; letter-spacing: -0.02em; }
  .ten { font-size: var(--fs-xl); color: var(--muted); font-weight: 500; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 16px; color: var(--muted); font-size: var(--fs-sm); }
  .sections { list-style: none; padding: 0; display: grid; gap: 12px; }
  .sections li { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; }
  .name { min-width: 0; overflow-wrap: anywhere; }
  .pct { color: var(--muted); }
  .bar { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--mark); transform-origin: left center; }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .actions > :global(:first-child) { grid-column: 1 / -1; }
  .home { grid-column: 1 / -1; margin-left: -12px; }
  h2 { font-size: var(--fs-lg); margin-top: 8px; }
  .wrong { list-style: none; padding: 0; display: grid; gap: 8px; }
  .wrong li {
    display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; padding: 12px 14px;
    background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-ctl); content-visibility: auto;
  }
  .n { font-weight: 600; color: var(--muted); }
  .text { min-width: 0; overflow-wrap: anywhere; line-height: 1.4; }
  .tag { grid-column: 2; font-size: var(--fs-xs); font-weight: 600; color: var(--bad); }
  .tag.part { color: var(--muted); }
  @media (min-width: 600px) { .actions { grid-template-columns: repeat(4, auto); justify-content: start; } .actions > :global(:first-child), .home { grid-column: auto; } }
</style>
