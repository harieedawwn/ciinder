// Fullscreen API (+ webkit prefix) with a "focus mode" fallback (hide chrome, 100dvh) where it is missing.
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

const doc = document as FsDoc
const root = document.documentElement as FsEl

const nativeAvailable = !!(root.requestFullscreen || root.webkitRequestFullscreen) && document.fullscreenEnabled !== false

export const fullscreen = $state({ active: false, focusMode: false })

function nativeElement(): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

function sync(): void {
  fullscreen.active = !!nativeElement() || fullscreen.focusMode
  document.documentElement.toggleAttribute('data-focus', fullscreen.focusMode)
}

document.addEventListener('fullscreenchange', sync)
document.addEventListener('webkitfullscreenchange', sync)

export async function toggleFullscreen(): Promise<void> {
  if (fullscreen.active) {
    if (fullscreen.focusMode) fullscreen.focusMode = false
    else await Promise.resolve(doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.()).catch(() => {})
    sync()
    return
  }
  if (nativeAvailable) {
    try {
      await Promise.resolve(root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen?.())
      sync()
      if (nativeElement()) return
    } catch {
      // Denied (webview policy): fall through to focus mode.
    }
  }
  fullscreen.focusMode = true
  sync()
}

/** F toggles fullscreen, Esc leaves focus mode. Ignored while typing. */
export function fullscreenKeys(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault()
    void toggleFullscreen()
  } else if (e.key === 'Escape' && fullscreen.focusMode && !document.querySelector('[data-sheet-open]')) {
    fullscreen.focusMode = false
    sync()
  }
}
