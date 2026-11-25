import { describe, expect, it } from 'vitest'
import { jsonSources } from './importjson'

describe('jsonSources', () => {
  it('reads a single set with source', () => {
    expect(jsonSources('{"title":"A","source":"# A\\n--- mcq"}')).toEqual(['# A\n--- mcq'])
  })
  it('reads an array and skips junk', () => {
    expect(jsonSources('[{"source":"a"},{"x":1},{"source":"b"}]')).toEqual(['a', 'b'])
  })
  it('reads { sets: [...] }', () => {
    expect(jsonSources('{"sets":[{"source":"a"}]}')).toEqual(['a'])
  })
  it('returns null for plain text and [] for unusable JSON', () => {
    expect(jsonSources('# Title\n--- mcq')).toBeNull()
    expect(jsonSources('{"a":1}')).toEqual([])
  })
})
