<script lang="ts">
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'

  let { open = $bindable(false), left, label, onconfirm }: { open?: boolean; left: number; label: string; onconfirm: () => void } = $props()
</script>

<Sheet bind:open title={label}>
  <p class="num">Còn {left} câu chưa trả lời.</p>
  <div class="row">
    <Button onclick={() => (open = false)}>Tiếp tục</Button>
    <Button variant="primary" onclick={() => { open = false; onconfirm() }}>{label}</Button>
  </div>
</Sheet>

<style>
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
</style>
