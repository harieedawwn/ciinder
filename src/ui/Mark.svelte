<!-- Highlighter stroke behind inline text, drawn with a left→right wipe. docs/DESIGN.md "Layout v2" §3.
     <Mark on={bool}>text</Mark>. `strong` uses --mark-strong. `delay` in ms. -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  let { on = true, strong = false, delay = 0, children }: { on?: boolean; strong?: boolean; delay?: number; children?: Snippet } = $props()
</script>

<span class="mark" class:on class:strong style="--d: {delay}ms">
  <svg class="stroke" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
    <path d="M2 7 C 14 4, 40 5.5, 60 4.5 S 92 4, 98.5 6 L 97.5 15 C 80 16.5, 50 15, 30 16 S 6 16.5, 1.5 14.5 Z" />
  </svg>
  <span class="text">{@render children?.()}</span>
</span>

<style>
  .mark { position: relative; display: inline; isolation: isolate; }
  .text { position: relative; }
  .stroke {
    position: absolute; z-index: -1; left: -0.2em; right: -0.2em; top: 0.18em; bottom: -0.05em;
    width: calc(100% + 0.4em); height: calc(100% - 0.13em); fill: var(--mark);
    clip-path: inset(0 100% 0 0); transform: skewX(-6deg);
    transition: clip-path var(--t-large) var(--ease-out) var(--d);
  }
  .strong .stroke { fill: var(--mark-strong); }
  .on .stroke { clip-path: inset(0 0 0 0); }
</style>
