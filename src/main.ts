import { mount } from 'svelte'
import './styles/tokens.css'
import './styles/motion.css'
import './styles/base.css'
import App from './App.svelte'
import { loadSettings } from './state/settings.svelte'

// Load settings before first paint so the saved theme never flashes.
void loadSettings().finally(() => mount(App, { target: document.getElementById('app')! }))
