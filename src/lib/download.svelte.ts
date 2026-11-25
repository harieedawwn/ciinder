// Download with an in-app browser fallback (docs/ARCH.md): Zalo/Facebook webviews usually ignore <a download>,
// so there we open a sheet that offers to copy the content or the page link instead.
import { downloadText } from './clipboard'
import { inApp } from './env'

export const fallback = $state({ open: false, name: '', text: '' })

/** Offer a text file. `text` is also what the fallback sheet can copy ("" when it is too large to be useful). */
export function saveText(name: string, content: string, type: string, copyable = true): void {
  if (inApp) {
    fallback.name = name
    fallback.text = copyable ? content : ''
    fallback.open = true
    return
  }
  downloadText(name, content, type)
}
