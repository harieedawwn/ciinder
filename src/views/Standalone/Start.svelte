<script lang="ts">
  import StartPanel from '../Home/StartPanel.svelte'

  let { id, title, subject, count }: { id: string; title: string; subject?: string; count: number } = $props()
</script>

<section class="start">
  <h1>{title}</h1>
  <StartPanel entry={{ id, subject, count }} />
</section>

<style>
  .start { display: grid; gap: 16px; max-width: 480px; margin: 0 auto; padding: 8px max(16px, var(--safe-r)) calc(32px + var(--safe-b)) max(16px, var(--safe-l)); }
  h1 { font-size: var(--fs-2xl); overflow-wrap: anywhere; }
</style>
