<script lang="ts">
  import type { Component } from 'svelte'
  import { fade } from 'svelte/transition'
  import { fullscreenKeys } from './lib/fullscreen.svelte'
  import { startPwa } from './lib/pwa'
  import { preloadSounds, unlockAudio } from './lib/sound'
  import { loadLibrary } from './state/library.svelte'
  import { router, viewTransitions } from './state/router.svelte'
  import { applySettings, motionReduced } from './state/settings.svelte'
  import Toast from './ui/Toast.svelte'
  import Home from './views/Home/Home.svelte'
  import Play from './views/Play/Play.svelte'
  import Result from './views/Result/Result.svelte'
  import FallbackSheet from './views/Share/FallbackSheet.svelte'
  import BackupSection from './views/Settings/BackupSection.svelte'
  import Shared from './views/Shared/Shared.svelte'
  import SettingsSheet from './views/Settings/SettingsSheet.svelte'
  import TopBar from './views/TopBar.svelte'

  applySettings()
  void loadLibrary()
  if (import.meta.env.PROD) startPwa()

  let settingsOpen = $state(false)
  let warmed = false

  function gesture() {
    unlockAudio()
    if (!warmed) {
      warmed = true
      preloadSounds()
    }
  }

  let Editor = $state<Component<{ id?: string }> | null>(null)
  $effect(() => {
    if ((router.route.name === 'new' || router.route.name === 'edit') && !Editor) void import('./views/Editor/Editor.svelte').then((m) => (Editor = m.default))
  })

</script>

<svelte:window onpointerdown={gesture} onkeydown={fullscreenKeys} />

<TopBar onsettings={() => (settingsOpen = true)} railed={router.route.name === 'home' || router.route.name === 'guide'} />

{#key router.route}
  <main in:fade={{ duration: viewTransitions || motionReduced() ? 0 : 220 }}>
    {#if router.route.name === 'home' || router.route.name === 'guide'}
      <Home onsettings={() => (settingsOpen = true)} />
    {:else if router.route.name === 'new' || router.route.name === 'edit'}
      {#if Editor}<Editor id={router.route.name === 'edit' ? router.route.id : undefined} />{/if}
    {:else if router.route.name === 'play' || router.route.name === 'review'}
      <Play id={router.route.id} review={router.route.name === 'review'} />
    {:else if router.route.name === 'result'}
      <Result id={router.route.id} />
    {:else}
      <Shared />
    {/if}
  </main>
{/key}

<SettingsSheet bind:open={settingsOpen}>
  {#snippet extra()}<BackupSection onclose={() => (settingsOpen = false)} />{/snippet}
</SettingsSheet>
<FallbackSheet />
<Toast />
