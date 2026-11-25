// Offline support: register the service worker; a waiting new version is announced quietly, applied on request.
import { registerSW } from 'virtual:pwa-register'
import { toast } from '../ui/toast.svelte'

export function startPwa(): void {
  const update = registerSW({
    onNeedRefresh() {
      toast('Đã có bản mới', { ms: 15000, action: { label: 'Tải lại', run: () => void update(true) } })
    },
  })
}
