<script lang="ts">
  // Tự nhớ: the answer stays hidden while the learner recalls it (optionally writing it out), then Hiện đáp án.
  import { play } from '../../lib/sound'
  import Rich from '../../render/Rich.svelte'
  import Button from '../../ui/Button.svelte'

  let { src, ondone }: { src: string; ondone: () => void } = $props()

  let shown = $state(false)
  let draft = $state('')

  function show() {
    shown = true
    play('expand')
    ondone()
  }
</script>

<div class="recall">
  <textarea bind:value={draft} rows="4" aria-label="Bài viết của bạn" readonly={shown}></textarea>
  {#if shown}
    <div class="answer"><Rich {src} kw /></div>
  {:else}
    <Button variant="secondary" icon="eye" sound={false} onclick={show}>Hiện đáp án</Button>
  {/if}
</div>

<style>
  .recall { display: grid; gap: 16px; }
  textarea {
    width: 100%; min-height: 112px; padding: 12px 14px; resize: vertical;
    border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--surface); color: var(--ink);
    font: inherit; line-height: 1.55;
  }
  textarea:focus { border-color: var(--accent); outline: none; }
  .answer { padding-top: 16px; border-top: 1px solid var(--line); }
</style>
