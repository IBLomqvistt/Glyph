import { describe, expect, it } from 'vitest'
import { InMemoryQuestionQuotaGateway } from './question-quota'

function gateway(): InMemoryQuestionQuotaGateway {
  return new InMemoryQuestionQuotaGateway({
    sessionCounts: new Map(),
    ipCounts: new Map(),
    activeSessionIds: new Set(),
    reservations: new Map(),
  })
}

const now = new Date('2026-07-22T12:00:00.000Z')

describe('InMemoryQuestionQuotaGateway', () => {
  it('allows five completed questions per session, report, and day', async () => {
    const quota = gateway()
    for (let index = 0; index < 5; index += 1) {
      const decision = await quota.reserve({
        reportSlug: 'kimi-k3',
        sessionId: 'session-one',
        ipAddress: '203.0.113.10',
        now,
      })
      expect(decision.allowed).toBe(true)
      if (decision.allowed) await quota.complete(decision.reservation.id)
    }
    const denied = await quota.reserve({
      reportSlug: 'kimi-k3',
      sessionId: 'session-one',
      ipAddress: '203.0.113.10',
      now,
    })
    expect(denied).toMatchObject({
      allowed: false,
      reason: 'SESSION_DAILY_LIMIT',
    })
  })

  it('allows only one active request per session', async () => {
    const quota = gateway()
    const first = await quota.reserve({
      reportSlug: 'kimi-k3',
      sessionId: 'session-one',
      ipAddress: '203.0.113.10',
      now,
    })
    expect(first.allowed).toBe(true)
    expect(
      await quota.reserve({
        reportSlug: 'kimi-k3',
        sessionId: 'session-one',
        ipAddress: '203.0.113.10',
        now,
      }),
    ).toMatchObject({ allowed: false, reason: 'REQUEST_IN_PROGRESS' })
  })

  it('releases failed reservations without consuming quota', async () => {
    const quota = gateway()
    const first = await quota.reserve({
      reportSlug: 'kimi-k3',
      sessionId: 'session-one',
      ipAddress: '203.0.113.10',
      now,
    })
    expect(first.allowed).toBe(true)
    if (first.allowed) await quota.release(first.reservation.id)
    const replacement = await quota.reserve({
      reportSlug: 'kimi-k3',
      sessionId: 'session-one',
      ipAddress: '203.0.113.10',
      now,
    })
    expect(replacement.allowed).toBe(true)
  })

  it('enforces thirty questions per IP across sessions', async () => {
    const quota = gateway()
    for (let index = 0; index < 30; index += 1) {
      const decision = await quota.reserve({
        reportSlug: 'kimi-k3',
        sessionId: `session-${index}`,
        ipAddress: '203.0.113.10',
        now,
      })
      expect(decision.allowed).toBe(true)
      if (decision.allowed) await quota.complete(decision.reservation.id)
    }
    expect(
      await quota.reserve({
        reportSlug: 'kimi-k3',
        sessionId: 'session-31',
        ipAddress: '203.0.113.10',
        now,
      }),
    ).toMatchObject({ allowed: false, reason: 'IP_DAILY_LIMIT' })
  })
})
