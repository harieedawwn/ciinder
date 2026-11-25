<script lang="ts">
  // Shell of the standalone HTML file: one set, start screen → play → result. No library, no editor.
  import { fade } from 'svelte/transition'
  import { fullscreenKeys } from '../../lib/fullscreen.svelte'
  import { preloadSounds, unlockAudio } from '../../lib/sound'
  import { router, viewTransitions } from '../../state/router.svelte'
  import { applySettings, motionReduced } from '../../state/settings.svelte'
  import Toast from '../../ui/Toast.svelte'
  import Play from '../Play/Play.svelte'
  import Result from '../Result/Result.svelte'
  import SettingsSheet from '../Settings/SettingsSheet.svelte'
  import TopBar from '../TopBar.svelte'
  import Start from './Start.svelte'

  let { id, title, subject, count }: { id: string; title: string; subject?: string; count: number } = $props()

  applySettings()

  let settingsOpen = $state(false)
  let warmed = false

  function gesture() {
    unlockAudio()
    if (!warmed) {
      warmed = true
      preloadSounds()
    }
  }
</script>

<svelte:window onpointerdown={gesture} onkeydown={fullscreenKeys} />

<TopBar onsettings={() => (settingsOpen = true)} />

{#key router.route}
  <main in:fade={{ duration: viewTransitions || motionReduced() ? 0 : 220 }}>
    {#if router.route.name === 'play' || router.route.name === 'review'}
      <Play {id} review={router.route.name === 'review'} />
    {:else if router.route.name === 'result'}
      <Result {id} />
    {:else}
      <Start {id} {title} {subject} {count} />
    {/if}
  </main>
{/key}

<SettingsSheet bind:open={settingsOpen} />
<Toast />
