<script lang="ts">
  import Icon from '../../ui/Icon.svelte'

  let { endsAt, onexpire }: { endsAt: number; onexpire: () => void } = $props()

  let now = $state(Date.now())
  const left = $derived(Math.max(0, Math.ceil((endsAt - now) / 1000)))
  const text = $derived(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`)

  $effect(() => {
    let fired = false
    const tick = () => {
      now = Date.now()
      if (now >= endsAt && !fired) {
        fired = true
        onexpire()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  })
</script>

<span class="timer num" class:low={left <= 60} role="timer" aria-label="Thời gian còn lại {text}">
  <Icon name="clock" size={18} />{text}
</span>

<style>
  .timer { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 600; color: var(--muted); }
  .low { color: var(--bad); }
</style>
