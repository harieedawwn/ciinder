<script lang="ts">
  // Che từ khóa: [[keywords]] are highlighter blocks; tap wipes one away. With "Gõ từ khóa", tap opens a small
  // input instead and a correct answer reveals it.
  import { tick } from 'svelte'
  import { matchesAnswer } from '../../core/normalize'
  import { buzz } from '../../lib/haptics'
  import { play } from '../../lib/sound'
  import Rich from '../../render/Rich.svelte'
  import Button from '../../ui/Button.svelte'
  import Switch from '../../ui/Switch.svelte'

  let { src, keywords, ondone }: { src: string; keywords: string[]; ondone: () => void } = $props()

  let marks: HTMLElement[] = []
  let count = $state(0)
  let open = $state<Set<number>>(new Set())
  let typing = $state(false)
  let active = $state<number | null>(null)
  let guess = $state('')
  let input = $state<HTMLInputElement>()
  let wrong = $state(false)

  function onrender(root: HTMLElement) {
    marks = [...root.querySelectorAll<HTMLElement>('mark.kw')]
    count = marks.length
    marks.forEach((m, i) => {
      m.tabIndex = 0
      m.setAttribute('role', 'button')
      m.classList.toggle('short', (m.textContent ?? '').length <= 24)
      sync(m, i)
    })
    if (!count) ondone()
  }

  function sync(m: HTMLElement, i: number) {
    const shown = open.has(i)
    m.classList.toggle('on', shown)
    m.classList.toggle('active', active === i)
    m.setAttribute('aria-label', shown ? (m.textContent ?? '') : `Từ khóa ${i + 1}`)
  }

  $effect(() => {
    void open.size
    void active
    marks.forEach(sync)
  })

  function reveal(i: number) {
    if (open.has(i)) return
    open = new Set(open).add(i)
    play('expand')
    if (active === i) active = null
    if (open.size === count) ondone()
  }

  function all() {
    open = new Set(marks.map((_, i) => i))
    active = null
    play('expand')
    ondone()
  }

  function pick(i: number) {
    if (open.has(i)) return
    if (!typing) return reveal(i)
    active = i
    guess = ''
    wrong = false
    void tick().then(() => input?.focus())
  }

  function target(e: Event): number | null {
    const m = (e.target as Element).closest<HTMLElement>('mark.kw')
    return m ? marks.indexOf(m) : null
  }
  function click(e: MouseEvent) {
    const i = target(e)
    if (i !== null && i >= 0) pick(i)
  }
  function key(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const i = target(e)
    if (i === null || i < 0) return
    e.preventDefault()
    pick(i)
  }

  function check(e: SubmitEvent) {
    e.preventDefault()
    if (active === null || !guess.trim()) return
    const answer = keywords[active] ?? marks[active]?.textContent ?? ''
    if (matchesAnswer(guess, [answer], { loose: true })) {
      play('check')
      buzz('good')
      reveal(active)
    } else {
      play('error')
      buzz('bad')
      wrong = false
      requestAnimationFrame(() => (wrong = true))
    }
  }
</script>

<div class="masks">
  <!-- Marks are focusable role=button elements inside the rendered HTML; events are delegated here. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="text" onclick={click} onkeydown={key}>
    <Rich {src} kw {onrender} />
  </div>
  {#if active !== null}
    <form class="guess" class:shake={wrong} onsubmit={check}>
      <input bind:this={input} bind:value={guess} aria-label="Từ khóa {active + 1}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" />
      <Button type="submit" variant="primary" sound={false}>Kiểm tra</Button>
      <Button variant="quiet" onclick={() => active !== null && reveal(active)}>Hiện</Button>
    </form>
  {/if}
  <div class="btns">
    <Switch bind:checked={typing} label="Gõ từ khóa" />
    <Button variant="secondary" disabled={open.size >= count} onclick={all}>Hiện tất cả</Button>
  </div>
</div>

<style>
  .masks { display: grid; gap: 16px; }
  .text :global(mark.kw) { cursor: pointer; border-radius: 4px; outline-offset: 2px; }
  .text :global(mark.kw.short) { white-space: nowrap; }
  .text :global(mark.kw::after) {
    content: ''; position: absolute; inset: -1px -3px; z-index: 1; border-radius: 4px; background: var(--mark);
    clip-path: inset(0 0 0 0 round 4px); transition: clip-path var(--t-large) var(--ease-out);
  }
  .text :global(mark.kw.on) { cursor: default; }
  .text :global(mark.kw.on::after) { clip-path: inset(0 0 0 100% round 4px); }
  .text :global(mark.kw.active::after) { box-shadow: inset 0 -2px 0 0 var(--accent); }
  :global([data-motion='reduce']) .text :global(mark.kw::after) { transition: opacity var(--t-micro) linear; }
  :global([data-motion='reduce']) .text :global(mark.kw.on::after) { clip-path: inset(0 0 0 0 round 4px); opacity: 0; }
  .guess { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; }
  .guess input {
    min-width: 0; min-height: 44px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r-ctl);
    background: var(--surface); color: var(--ink); font: inherit;
  }
  .guess input:focus { border-color: var(--accent); outline: none; }
  .btns { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
</style>
