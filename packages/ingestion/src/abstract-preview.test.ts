import { describe, expect, it } from 'vitest'

import { createAbstractPreview } from './abstract-preview.mjs'

const introduction =
  'Today, we are introducing Kimi K3 — our most capable model. Kimi K3 is a 2.8T-parameter model built on our Kimi Delta Attention and Attention Residuals.'

describe('deterministic abstract preview', () => {
  it('uses at most 20 source words before truncation', () => {
    const preview = createAbstractPreview(introduction)
    expect(preview).toBe(
      'Today, we are introducing Kimi K3 — our most capable model. Kimi K3 is a 2.8T-parameter model built on our...',
    )
    expect(preview.replace(/\.\.\.$/, '').split(/\s+/)).toHaveLength(20)
  })
})
