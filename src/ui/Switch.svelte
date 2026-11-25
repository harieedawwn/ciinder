<script lang="ts">
  import { play } from '../lib/sound'
  let { checked = $bindable(false), label }: { checked?: boolean; label: string } = $props()

  function toggle() {
    checked = !checked
    play(checked ? 'toggle-on' : 'toggle-off')
  }
</script>

<button class="row" role="switch" aria-checked={checked} onclick={toggle}>
  <span>{label}</span>
  <span class="track" class:on={checked} aria-hidden="true"><span class="thumb"></span></span>
</button>

<style>
  .row { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 16px; min-height: 48px; text-align: left; }
  .track {
    position: relative; flex: none; width: 44px; height: 26px; border-radius: 13px;
    background: var(--line); transition: background-color var(--t-std) var(--ease-out);
  }
  .track.on { background: var(--accent); }
  .thumb {
    position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
    background: var(--raised); box-shadow: var(--shadow);
    transition: transform var(--t-std) var(--spring);
  }
  .on .thumb { transform: translateX(18px); background: var(--on-accent); }
</style>
