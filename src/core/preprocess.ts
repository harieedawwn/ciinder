// Lenient pre-processing (docs/FORMAT.md §1). Line numbers always refer to the ORIGINAL text.
import { makeIssue } from './issues'
import type { Issue } from './types'

export interface Line {
  text: string
  no: number
}

const START = /^(#\s|##|@\w|---[ \t]+\S)/
const HEADER = /^---[ \t]+\S/

export function toLines(source: string): Line[] {
  const text = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/ /g, ' ')
  return text.split('\n').map((t, i) => ({ text: t.replace(/\s+$/, ''), no: i + 1 }))
}

function stripFence(lines: Line[], issues: Issue[]): Line[] {
  const first = lines.find((l) => l.text.trim() !== '')
  if (!first || START.test(first.text)) return lines
  let best: Line[] | null = null
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*```/.test(lines[i].text)) continue
    let j = i + 1
    while (j < lines.length && !/^\s*```\s*$/.test(lines[j].text)) j++
    const body = lines.slice(i + 1, j)
    if (body.some((l) => HEADER.test(l.text)) && (!best || body.length > best.length)) best = body
    i = j
  }
  if (!best) return lines
  issues.push(makeIssue('W_FENCE_STRIPPED', lines[0].no))
  return best
}

export function preprocess(source: string, issues: Issue[]): Line[] {
  let lines = stripFence(toLines(source), issues)
  const start = lines.findIndex((l) => START.test(l.text))
  if (start > 0) {
    if (lines.slice(0, start).some((l) => l.text.trim() !== '')) issues.push(makeIssue('W_PREAMBLE', lines[0].no))
    lines = lines.slice(start)
  }
  return lines.filter((l) => !l.text.startsWith('//'))
}
