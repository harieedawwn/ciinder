// Đọc dần: wraps every word of rendered content in a span so it can be shown one by one without layout change.
// Math, images and code blocks count as one word each.

export interface Words {
  els: HTMLElement[]
  /** Word counts at which a sentence (or block) ends, ascending, last = els.length. */
  ends: number[]
}

const UNIT = '.katex, .math-src, img, pre'
const BLOCK = new Set(['P', 'LI', 'TD', 'TH', 'BLOCKQUOTE', 'PRE', 'TR', 'UL', 'OL'])
const SENTENCE_END = /[.!?…;:]["'”’»)\]]*$/

export function wrapWords(root: HTMLElement): Words {
  const els: HTMLElement[] = []
  const ends: number[] = []
  const end = () => {
    if (els.length && ends[ends.length - 1] !== els.length) ends.push(els.length)
  }

  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? ''
        if (!text.trim()) continue
        const frag = document.createDocumentFragment()
        for (const part of text.split(/(\s+)/)) {
          if (!part) continue
          if (/^\s+$/.test(part)) {
            frag.append(part)
            continue
          }
          const w = document.createElement('span')
          w.className = 'w'
          w.textContent = part
          frag.append(w)
          els.push(w)
          if (SENTENCE_END.test(part)) end()
        }
        child.replaceWith(frag)
      } else if (child instanceof HTMLElement) {
        if (child.matches(UNIT)) {
          child.classList.add('w', 'u')
          els.push(child)
        } else walk(child)
        if (BLOCK.has(child.tagName) || child.classList.contains('math-block')) end()
      }
    }
  }
  walk(root)
  end()
  return { els, ends }
}

/** Shows words [0, n) and hides the rest, touching only the range that changed. */
export function showWords(els: HTMLElement[], from: number, to: number): void {
  const [a, b] = from < to ? [from, to] : [to, from]
  for (let i = a; i < b && i < els.length; i++) els[i].classList.toggle('on', i < to)
}
