// Clipboard + file helpers with fallbacks for in-app browsers (Zalo/Facebook) that block the async API.

/** Copy text; falls back to a hidden textarea + execCommand. Returns false when both fail. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

/** Read the clipboard; null when the browser refuses (permission, in-app browser). */
export async function readClipboard(): Promise<string | null> {
  try {
    const t = await navigator.clipboard.readText()
    return t || null
  } catch {
    return null
  }
}

/** Offer a text file as a download. */
export function downloadText(name: string, text: string, type = 'text/markdown'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Open the native file picker; resolves null when cancelled. */
export function pickFile(accept = '.txt,.md,.json,text/plain,text/markdown,application/json'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export const readFileText = (file: File): Promise<string> => file.text()
