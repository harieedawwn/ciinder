<script lang="ts">
  import type { Component } from 'svelte'
  import { fade } from 'svelte/transition'
  import { fullscreenKeys } from './lib/fullscreen.svelte'
  import { preloadSounds, unlockAudio } from './lib/sound'
  import { loadLibrary } from './state/library.svelte'
  import { router, viewTransitions } from './state/router.svelte'
  import { applySettings, motionReduced } from './state/settings.svelte'
  import Toast from './ui/Toast.svelte'
  import Home from './views/Home/Home.svelte'
  import Placeholder from './views/Placeholder.svelte'
  import SettingsSheet from './views/Settings/SettingsSheet.svelte'
  import TopBar from './views/TopBar.svelte'

  applySettings()
  void loadLibrary()

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

  const TITLES = {
    play: 'Bắt đầu',
    result: 'Xem lại',
    shared: 'Bộ được chia sẻ',
  } as const
</script>

<svelte:window onpointerdown={gesture} onkeydown={fullscreenKeys} />

<TopBar onsettings={() => (settingsOpen = true)} />

{#key router.route}
  <main in:fade={{ duration: viewTransitions || motionReduced() ? 0 : 220 }}>
    {#if router.route.name === 'home' || router.route.name === 'guide'}
      <Home />
    {:else if router.route.name === 'new' || router.route.name === 'edit'}
      {#if Editor}<Editor id={router.route.name === 'edit' ? router.route.id : undefined} />{/if}
    {:else}
      <Placeholder title={TITLES[router.route.name]} />
    {/if}
  </main>
{/key}

<SettingsSheet bind:open={settingsOpen} />
<Toast />
