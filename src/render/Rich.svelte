<script lang="ts">
  // Renders untrusted content (markdown + math). The only place content goes through {@html}.
  import { untrack } from 'svelte'
  import { toHtml } from './rich.svelte'

  let {
    src,
    inline = false,
    kw = false,
    class: cls = '',
    el = $bindable(),
    onrender,
  }: {
    src: string
    inline?: boolean
    kw?: boolean
    class?: string
    el?: HTMLElement
    /** Called after the HTML is (re)placed in the DOM, e.g. once math has loaded. */
    onrender?: (el: HTMLElement) => void
  } = $props()

  const html = $derived(toHtml(src, { inline, kw }))

  $effect(() => {
    void html
    const node = el
    if (node && onrender) untrack(() => onrender(node))
  })
</script>

{#if inline}
  <span class="rich {cls}" bind:this={el}>{@html html}</span>
{:else}
  <div class="rich md {cls}" bind:this={el}>{@html html}</div>
{/if}
