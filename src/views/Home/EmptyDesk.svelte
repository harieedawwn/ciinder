<script lang="ts">
  import { startWithClipboard, startWithFile } from '../../lib/ingest'
  import { go } from '../../state/router.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'

  let { hot = false }: { hot?: boolean } = $props()
</script>

<div class="wrap" class:hot>
  <IndexCard
    class="tilt"
    {hot}
    tabs={[
      { label: 'Hướng dẫn cho AI', primary: true, onclick: () => go('/guide') },
      { label: 'Mở tệp', onclick: () => void startWithFile() },
    ]}
  >
    <p class="title">Chưa có bộ câu hỏi nào.</p>
    <button class="paste press" onclick={() => void startWithClipboard()}>Dán nội dung vào đây</button>
  </IndexCard>
</div>

<style>
  .wrap { max-width: 560px; margin: 8vh auto 0; --tilt: -1deg; }
  .wrap.hot :global(.tilt) { transform: none; }
  .title { font-size: var(--fs-xl); font-weight: 600; line-height: 1.25; margin-bottom: 20px; }
  .paste {
    display: block; width: 100%; min-height: 160px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-ctl);
    color: var(--muted); font-size: var(--fs-md); text-align: left; background: var(--raised);
  }
  @media (hover: hover) { .paste:hover { border-color: var(--muted); } }
  @media (max-height: 500px) { .wrap { margin-top: 24px; } }
</style>
