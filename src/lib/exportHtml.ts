// Builds the standalone HTML file for a set: fetch the built player.html and inject the source.
import { fileName, injectSource } from '../core/export'
import { saveText } from './download.svelte'

/** Returns false when the player template is unavailable (offline before first load, dev server). */
export async function downloadHtml(title: string, source: string): Promise<boolean> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}player.html`)
    if (!res.ok) return false
    const html = injectSource(await res.text(), source, title)
    if (!html) return false
    saveText(fileName(title, 'html'), html, 'text/html', false)
    return true
  } catch {
    return false
  }
}

export const downloadSource = (title: string, source: string): void => saveText(fileName(title, 'txt'), source, 'text/plain')
