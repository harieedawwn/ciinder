// One toast at a time; an optional action (e.g. Hoàn tác) and an onExpire callback.
export interface ToastData {
  id: number
  text: string
  action?: { label: string; run: () => void }
  onExpire?: () => void
}

export const toastState = $state({ current: null as ToastData | null })

let seq = 0
let timer = 0

export function toast(text: string, opts: Omit<ToastData, 'id' | 'text'> & { ms?: number } = {}): void {
  dismiss(true)
  const { ms = opts.action ? 5000 : 2600, ...rest } = opts
  toastState.current = { id: ++seq, text, ...rest }
  timer = window.setTimeout(() => dismiss(true), ms)
}

/** expire=true runs onExpire (the action was not taken). */
export function dismiss(expire: boolean): void {
  clearTimeout(timer)
  const t = toastState.current
  toastState.current = null
  if (t && expire) t.onExpire?.()
}

export function runToastAction(): void {
  const t = toastState.current
  if (!t?.action) return
  dismiss(false)
  t.action.run()
}
