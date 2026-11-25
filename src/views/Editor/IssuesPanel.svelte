<script lang="ts">
  import { isError, issuesReport, type Issue } from '../../core/issues'
  import { copyText } from '../../lib/clipboard'
  import Button from '../../ui/Button.svelte'
  import { toast } from '../../ui/toast.svelte'

  let { issues, source, onjump }: { issues: Issue[]; source: string; onjump: (line: number) => void } = $props()

  const errors = $derived(issues.filter(isError))
  const warnings = $derived(issues.filter((i) => !isError(i) && i.code !== 'W_NO_EXPLAIN'))
  const report = $derived(issuesReport(issues, source))
  let warnOpen = $state(false)

  async function copyReport() {
    toast((await copyText(report)) ? 'Đã sao chép báo cáo lỗi' : 'Không sao chép được. Hãy thử lại.')
  }
</script>

{#if errors.length || warnings.length}
  <section class="issues" aria-label="Kiểm tra nội dung">
    {#if errors.length}
      <ul>
        {#each errors as i, k (k)}
          <li>
            <button onclick={() => onjump(i.line)}>
              <b class="num">{i.line > 0 ? `Dòng ${i.line}` : 'Toàn bộ'}</b>
              <span>{i.message_vi}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if warnings.length}
      <button class="warn" aria-expanded={warnOpen} onclick={() => (warnOpen = !warnOpen)}>{warnings.length} cảnh báo</button>
      {#if warnOpen}
        <ul class="w">
          {#each warnings as i, k (k)}
            <li>
              <button onclick={() => onjump(i.line)}>
                <b class="num">{i.line > 0 ? `Dòng ${i.line}` : 'Toàn bộ'}</b>
                <span>{i.message_vi}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
    <Button icon="copy" onclick={copyReport}>Sao chép báo cáo lỗi</Button>
  </section>
{/if}

<style>
  .issues { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-ctl); max-height: 40vh; overflow-y: auto; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; }
  li button { display: flex; gap: 10px; width: 100%; min-height: 40px; align-items: baseline; text-align: left; padding: 8px; border-radius: var(--r-chip); font-size: var(--fs-sm); }
  li b { flex: none; color: var(--bad); font-weight: 600; }
  .w b { color: var(--muted); }
  @media (hover: hover) { li button:hover { background: var(--accent-soft); } }
  .warn { text-align: left; min-height: 40px; padding: 0 8px; font-size: var(--fs-sm); color: var(--muted); }
  .issues > :global(.btn) { justify-self: start; }
</style>
