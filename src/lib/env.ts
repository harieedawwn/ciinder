// Environment detection (docs/ARCH.md "In-app browsers").
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

export type InApp = 'zalo' | 'facebook' | 'instagram' | 'tiktok' | null

export const inApp: InApp = /Zalo/i.test(ua)
  ? 'zalo'
  : /FBAN|FBAV|FB_IAB|FB4A|Messenger/i.test(ua)
    ? 'facebook'
    : /Instagram/i.test(ua)
      ? 'instagram'
      : /musical_ly|TikTok|BytedanceWebview/i.test(ua)
        ? 'tiktok'
        : null

export const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)

export const coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
