import { mount } from 'svelte'
import './styles/fonts-ui.css'
import './styles/fonts-lora.css'
import './styles/tokens.css'
import './styles/motion.css'
import './styles/desk.css'
import './styles/base.css'
import './styles/feedback.css'
import './styles/rich.css'
import App from './App.svelte'
import { loadSettings } from './state/settings.svelte'

// Load settings before first paint so the saved theme never flashes.
void loadSettings().finally(() => mount(App, { target: document.getElementById('app')! }))
