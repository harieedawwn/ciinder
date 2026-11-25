import { describe, expect, it } from 'vitest'
import { backupName, buildBackup, newSets, parseBackup } from './backup'

const set = (id: string) => ({ id, title: id, source: `# ${id}`, createdAt: 1, updatedAt: 2 })

describe('backup', () => {
  it('round-trips sets and progress', () => {
    const text = buildBackup([set('a'), set('b')], { a: { results: { q1: 1 } } }, 5)
    const b = parseBackup(text)!
    expect(b.sets.map((s) => s.id)).toEqual(['a', 'b'])
    expect(b.progress).toEqual({ a: { results: { q1: 1 } } })
    expect(b.exportedAt).toBe(5)
  })

  it('rejects other JSON and drops malformed sets', () => {
    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('[{"source":"# x"}]')).toBeNull()
    const b = parseBackup(JSON.stringify({ app: 'ciinder', sets: [set('a'), { id: 'x' }, { id: 'y', source: '  ' }, null] }))!
    expect(b.sets.map((s) => s.id)).toEqual(['a'])
    expect(b.progress).toEqual({})
  })

  it('skips ids already in the library or repeated in the file', () => {
    const b = parseBackup(buildBackup([set('a'), set('b'), set('b')], {}))!
    expect(newSets(b, ['a']).map((s) => s.id)).toEqual(['b'])
  })

  it('names the file by date', () => {
    expect(backupName(new Date('2026-11-25T10:00:00Z'))).toBe('ciinder-sao-luu-2026-11-25.json')
  })
})
