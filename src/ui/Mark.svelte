<!-- Highlighter stroke behind inline text, drawn with a left→right wipe. docs/DESIGN.md "Layout v2" §3.
     <Mark on={bool}>text</Mark>. `strong` uses --mark-strong. `delay` in ms.
     Implemented as an inline background with box-decoration-break: clone, so text that wraps onto several lines gets
     one stroke per line (an absolutely positioned shape only covers the first line fragment). -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  let { on = true, strong = false, delay = 0, children }: { on?: boolean; strong?: boolean; delay?: number; children?: Snippet } = $props()
</script>

<span class="mark" class:on class:strong style="--d: {delay}ms">{@render children?.()}</span>

<style>
  .mark {
    --m: var(--mark);
    background-image: linear-gradient(var(--m), var(--m));
    background-repeat: no-repeat;
    background-position: 0 68%;
    background-size: 0% 62%;
    padding: 0 0.12em;
    margin: 0 -0.12em;
    border-radius: 0.35em 0.2em 0.4em 0.25em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    transition: background-size var(--t-large) var(--ease-out) var(--d);
  }
  .strong { --m: var(--mark-strong); }
  .on { background-size: 100% 62%; }
</style>
