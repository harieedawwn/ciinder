// Line roles inside a block (docs/FORMAT.md §3).
import type { Kind } from './types'

export type Role = 'plain' | 'explain' | 'hint' | 'sep' | 'plus' | 'minus' | 'check' | 'eq' | 'group' | 'pair' | 'num'

export interface Tok {
  role: Role
  text: string
  /** pair: right side; check: '1' when ticked */
  extra?: string
  indented: boolean
}

export function tokenize(raw: string, kind: Kind, afterSep: boolean): Tok {
  const indented = /^\s{2,}\S/.test(raw)
  const t = (role: Role, text: string, extra?: string): Tok => ({ role, text, extra, indented })
  const exp = /^\?\?(?:\s?(.*))?$/.exec(raw)
  if (exp && kind !== 'note') return t('explain', (exp[1] ?? '').trim())
  const hint = /^!!(?:\s?(.*))?$/.exec(raw)
  if (hint && kind !== 'note') return t('hint', (hint[1] ?? '').trim())
  if (afterSep) return t('plain', raw)
  if (/^\\[+\-=?!\[:>/]/.test(raw)) return t('plain', raw.slice(1))
  if (kind === 'note') return t('plain', raw)
  if ((kind === 'essay' || kind === 'flash') && raw.trim() === '>>>') return t('sep', '')
  let m: RegExpExecArray | null
  if (kind === 'mcq' || kind === 'tf') {
    if ((m = /^\[( |x|X)\]\s+(.*)$/.exec(raw))) return t('check', m[2].trim(), m[1] === ' ' ? '' : '1')
    if ((m = /^([+-])\s+(.*)$/.exec(raw))) return t(m[1] === '+' ? 'plus' : 'minus', m[2].trim())
  }
  if (kind === 'short' && (m = /^=\s*(\S.*)$/.exec(raw))) return t('eq', m[1].trim())
  if ((kind === 'cloze' || kind === 'order' || kind === 'group') && (m = /^-\s+(.*)$/.exec(raw))) return t('minus', m[1].trim())
  if (kind === 'order' && (m = /^\d+[.)]\s+(.*)$/.exec(raw))) return t('num', m[1].trim())
  if (kind === 'group' && (m = /^\[([^\]]+)\]$/.exec(raw.trim()))) return t('group', m[1].trim())
  if (kind === 'match' && raw.includes('::')) {
    const i = raw.indexOf('::')
    return t('pair', raw.slice(0, i).trim(), raw.slice(i + 2).trim())
  }
  return t('plain', raw)
}
