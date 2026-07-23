import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type {
  QuestionGenerationAuditRecord,
  QuestionGenerationAuditStore,
  QuestionQuotaDecision,
  QuestionQuotaGateway,
  QuestionQuotaReservation,
} from '@glyph/application'
import { resolveGlyphDataDirectory } from './local-report-import-store'

export const perSessionReportDailyLimit = 5
export const perIpDailyLimit = 30

type QuotaState = {
  sessionCounts: Map<string, number>
  ipCounts: Map<string, number>
  activeSessionIds: Set<string>
  reservations: Map<string, QuestionQuotaReservation>
}

const quotaStateKey = '__glyphQuestionQuotaState'

function sharedQuotaState(): QuotaState {
  const target = globalThis as typeof globalThis & {
    [quotaStateKey]?: QuotaState
  }
  target[quotaStateKey] ??= {
    sessionCounts: new Map(),
    ipCounts: new Map(),
    activeSessionIds: new Set(),
    reservations: new Map(),
  }
  return target[quotaStateKey]
}

export class InMemoryQuestionQuotaGateway implements QuestionQuotaGateway {
  constructor(private readonly state = sharedQuotaState()) {}

  reserve(input: {
    reportSlug: string
    sessionId: string
    ipAddress: string
    now: Date
  }): Promise<QuestionQuotaDecision> {
    const day = input.now.toISOString().slice(0, 10)
    const sessionKey = `${day}:${input.reportSlug}:${input.sessionId}`
    const ipKey = `${day}:${input.ipAddress}`
    const retryAfterSeconds = secondsUntilNextUtcDay(input.now)
    if (this.state.activeSessionIds.has(input.sessionId)) {
      return Promise.resolve({
        allowed: false,
        reason: 'REQUEST_IN_PROGRESS',
        retryAfterSeconds: 2,
      })
    }
    if (
      (this.state.sessionCounts.get(sessionKey) ?? 0) >=
      perSessionReportDailyLimit
    ) {
      return Promise.resolve({
        allowed: false,
        reason: 'SESSION_DAILY_LIMIT',
        retryAfterSeconds,
      })
    }
    if ((this.state.ipCounts.get(ipKey) ?? 0) >= perIpDailyLimit) {
      return Promise.resolve({
        allowed: false,
        reason: 'IP_DAILY_LIMIT',
        retryAfterSeconds,
      })
    }

    const reservation: QuestionQuotaReservation = {
      id: `question-reservation-${randomUUID()}`,
      reportSlug: input.reportSlug,
      sessionId: input.sessionId,
      ipAddress: input.ipAddress,
      day,
      reservedAt: input.now.toISOString(),
    }
    this.state.sessionCounts.set(
      sessionKey,
      (this.state.sessionCounts.get(sessionKey) ?? 0) + 1,
    )
    this.state.ipCounts.set(ipKey, (this.state.ipCounts.get(ipKey) ?? 0) + 1)
    this.state.activeSessionIds.add(input.sessionId)
    this.state.reservations.set(reservation.id, reservation)
    return Promise.resolve({ allowed: true, reservation })
  }

  complete(reservationId: string): Promise<void> {
    const reservation = this.state.reservations.get(reservationId)
    if (reservation) {
      this.state.activeSessionIds.delete(reservation.sessionId)
      this.state.reservations.delete(reservationId)
    }
    return Promise.resolve()
  }

  release(reservationId: string): Promise<void> {
    const reservation = this.state.reservations.get(reservationId)
    if (!reservation) return Promise.resolve()
    const sessionKey = `${reservation.day}:${reservation.reportSlug}:${reservation.sessionId}`
    const ipKey = `${reservation.day}:${reservation.ipAddress}`
    decrement(this.state.sessionCounts, sessionKey)
    decrement(this.state.ipCounts, ipKey)
    this.state.activeSessionIds.delete(reservation.sessionId)
    this.state.reservations.delete(reservationId)
    return Promise.resolve()
  }
}

export class LocalQuestionGenerationAuditStore implements QuestionGenerationAuditStore {
  constructor(
    private readonly directory = path.join(
      resolveGlyphDataDirectory(),
      'question-audit',
    ),
  ) {}

  async record(entry: QuestionGenerationAuditRecord): Promise<void> {
    await mkdir(this.directory, { recursive: true })
    const day = entry.generatedAt.slice(0, 10)
    await appendFile(
      path.join(this.directory, `${day}.jsonl`),
      `${JSON.stringify(entry)}\n`,
      'utf8',
    )
  }
}

export function localQuestionQuotaGateway(): QuestionQuotaGateway {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.GLYPH_ALLOW_VOLATILE_QUESTION_QUOTAS !== 'true'
  ) {
    throw new Error('DURABLE_QUESTION_QUOTA_REQUIRED')
  }
  return new InMemoryQuestionQuotaGateway()
}

function decrement(map: Map<string, number>, key: string): void {
  const next = Math.max(0, (map.get(key) ?? 0) - 1)
  if (next === 0) map.delete(key)
  else map.set(key, next)
}

function secondsUntilNextUtcDay(now: Date): number {
  const nextDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )
  return Math.max(1, Math.ceil((nextDay - now.getTime()) / 1000))
}
