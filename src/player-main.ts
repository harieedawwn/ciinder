// Entry of the standalone offline player (player.html): the set source is embedded by the exporter.
import { mount } from 'svelte'
import './styles/fonts-lite.css'
import './styles/tokens.css'
import './styles/motion.css'
import './styles/desk.css'
import './styles/base.css'
import './styles/feedback.css'
import './styles/rich.css'
import { set } from 'idb-keyval'
import { readEmbedded, sourceId } from './core/export'
import { parse } from './core/parse'
import PlayerApp from './views/Standalone/PlayerApp.svelte'
import { loadSettings } from './state/settings.svelte'

const source = readEmbedded(document.getElementById('ciinder-src')?.textContent)
const target = document.getElementById('app')!

if (!source) {
  target.textContent = 'Tệp này không có nội dung. Hãy tải lại tệp từ ciinder.'
} else {
  const { set: quiz } = parse(source)
  const id = sourceId(source)
  const now = Date.now()
  document.title = quiz.title
  void set(`set:${id}`, { id, title: quiz.title, source, createdAt: now, updatedAt: now })
  void loadSettings().finally(() => mount(PlayerApp, { target, props: { id, title: quiz.title, subject: quiz.meta.subject, count: quiz.items.length } }))
}
