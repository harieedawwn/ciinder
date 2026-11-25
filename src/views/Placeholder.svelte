<script lang="ts">
  import { go } from '../state/router.svelte'
  import Button from '../ui/Button.svelte'

  let { title }: { title: string } = $props()
</script>

<section class="page">
  <h1>{title}</h1>
  <Button variant="secondary" icon="back" onclick={() => go('/')}>Thư viện</Button>
</section>

<style>
  .page { display: grid; gap: 20px; justify-items: start; padding: 24px max(16px, var(--safe-l)); max-width: 680px; margin: 0 auto; }
  h1 { font-size: var(--fs-2xl); }
</style>
