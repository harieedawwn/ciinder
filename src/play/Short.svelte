<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import type { ShortItem } from '../core/types'
  import { wipe } from '../lib/wipe'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, locked, reveal, score }: KindProps<ShortItem> = $props()

  const text = $derived(answer?.kind === 'short' ? answer.text : '')
  const right = $derived(score === 1)
</script>

<label class="field" class:good={reveal && right} class:bad={reveal && !right} class:shake={reveal && !right}>
  <span class="sr-only">Câu trả lời</span>
  <input
    value={text}
    readonly={locked}
    inputmode={item.numeric ? 'decimal' : 'text'}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="done"
    placeholder={item.numeric ? '0' : ''}
    oninput={(e) => onanswer({ kind: 'short', text: e.currentTarget.value })}
  />
</label>
{#if reveal && !right}
  <p class="answer"><span class="hl" use:wipe><Rich inline src={item.answers.join(' / ')} /></span></p>
{/if}

<style>
  .field { display: block; }
  input {
    width: 100%; min-height: 48px; padding: 10px 14px; border-radius: var(--r-ctl);
    border: 1px solid var(--line); background: var(--raised); font-size: var(--fs-lg);
    transition: border-color var(--t-std) var(--ease-out);
  }
  input:focus { border-color: var(--accent); outline: none; }
  input[readonly] { cursor: default; }
  .good input { border-color: var(--good); background: var(--good-soft); }
  .bad input { border-color: var(--bad); text-decoration: line-through; text-decoration-color: var(--bad); }
  .answer { font-size: var(--fs-lg); padding: 4px 4px 0; overflow-wrap: anywhere; }
</style>
