import { describe, expect, it } from 'vitest'
import { embedSource, fileName, injectSource, readEmbedded, sourceId } from './export'

const TEMPLATE = '<html><head><title>ciinder</title></head><body><script type="text/plain" id="ciinder-src"></script><script>var x=1</script></body></html>'

describe('embedded source', () => {
  it('round-trips hostile content', () => {
    const src = '# Bộ\n</script><script>alert(1)</script><!-- x --> $& $1   "q" \\n'
    const html = injectSource(TEMPLATE, src, 'T')!
    const m = /<script type="text\/plain" id="ciinder-src">([\s\S]*?)<\/script>/.exec(html)!
    expect(m[1]).not.toContain('<')
    expect(readEmbedded(m[1])).toBe(src)
    expect(html.match(/<\/script>/g)).toHaveLength(2)
  })

  it('escapes the title and keeps the rest of the page', () => {
    const html = injectSource(TEMPLATE, 'x', 'A <b> & "c"')!
    expect(html).toContain('<title>A &lt;b&gt; &amp; "c"</title>')
    expect(html).toContain('<script>var x=1</script>')
  })

  it('returns null without a slot and for damaged data', () => {
    expect(injectSource('<html></html>', 'x', 't')).toBeNull()
    expect(readEmbedded('')).toBeNull()
    expect(readEmbedded('{oops')).toBeNull()
    expect(readEmbedded(embedSource('  '))).toBeNull()
  })
})

describe('names and ids', () => {
  it('cleans file names', () => {
    expect(fileName('Sinh học: chương 1/2? Đề', 'html')).toBe('Sinh hoc chuong 1 2 De.html')
    expect(fileName('  ', 'txt')).toBe('ciinder.txt')
  })

  it('derives a stable id from the source', () => {
    expect(sourceId('abc')).toBe(sourceId('abc'))
    expect(sourceId('abc')).not.toBe(sourceId('abd'))
  })
})
