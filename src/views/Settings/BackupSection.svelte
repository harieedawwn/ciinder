<script lang="ts">
  import { pickFile } from '../../lib/clipboard'
  import { ingestText } from '../../lib/ingest'
  import { exportBackup } from '../../state/backup.svelte'
  import Button from '../../ui/Button.svelte'
  import { toast } from '../../ui/toast.svelte'

  let { onclose }: { onclose: () => void } = $props()

  async function exportAll() {
    if (!(await exportBackup())) toast('Thư viện đang trống.')
  }

  async function importFile() {
    const file = await pickFile('.json,application/json')
    if (!file) return
    onclose()
    await ingestText(await file.text())
  }
</script>

<section>
  <h3>Sao lưu</h3>
  <div class="row">
    <Button icon="file" onclick={exportAll}>Tải về</Button>
    <Button icon="paste" onclick={importFile}>Mở tệp</Button>
  </div>
</section>

<style>
  section { padding: 12px 0; border-top: 1px solid var(--line); }
  h3 { font-size: var(--fs-sm); font-weight: 600; color: var(--muted); margin-bottom: 12px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
