import { describe, expect, it } from 'vitest'
import { groupTray, isAnswered, matchRights, orderStart } from './attempt'
import { gradeItem } from './grade'
import { parse } from './parse'
import type { GroupItem, MatchItem, OrderItem } from './types'

const SRC = `# T

--- match
Nối
A :: 1
B :: 2
:: 3

--- match shuffle=no
Nối
A :: 1
B :: 2

--- order
Xếp
- a
- b
- c

--- group
Nhóm
[X]
- x1
- x2
[Y]
- y1

--- flash
Mặt trước
>>>
Mặt sau
`
const items = parse(SRC).set.items
const [match, matchFixed, order, group] = items as [MatchItem, MatchItem, OrderItem, GroupItem]

describe('interactive kinds', () => {
  it('match rights include distractors and keep order with shuffle=no', () => {
    expect(matchRights(match, 7).slice().sort()).toEqual(['1', '2', '3'])
    expect(matchRights(match, 7)).toEqual(matchRights(match, 7))
    expect(matchRights(matchFixed, 7)).toEqual(['1', '2'])
  })

  it('order start is a non-identity permutation', () => {
    for (let seed = 0; seed < 50; seed++) {
      const seq = orderStart(order, seed)
      expect(seq.slice().sort()).toEqual([0, 1, 2])
      expect(seq).not.toEqual([0, 1, 2])
    }
  })

  it('group tray holds every item once', () => {
    const tray = groupTray(group, 3)
    expect(tray.map(([g, i]) => `${g}:${i}`).sort()).toEqual(['0:0', '0:1', '1:0'])
  })

  it('flash answers count as answered but are never scored', () => {
    const flash = items[4]
    expect(flash.kind).toBe('flash')
    expect(isAnswered({ kind: 'flash', rating: 'known' })).toBe(true)
    expect(gradeItem(flash, { kind: 'flash', rating: 'known' })).toBeNull()
  })
})
