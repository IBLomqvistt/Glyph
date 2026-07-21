import { timingSafeEqual } from 'node:crypto'

import type { FastifyRequest } from 'fastify'

import { ApplicationError } from '@glyph/application'

export type EditorIdentity = { actorId: string }

export function requireEditor(
  request: FastifyRequest,
  expectedToken: string,
): EditorIdentity {
  const authorization = request.headers.authorization
  const actorHeader = request.headers['x-glyph-actor-id']
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  if (!secureEquals(token, expectedToken)) {
    throw new ApplicationError(
      'UNAUTHORIZED',
      'Editor authorization required',
      401,
    )
  }
  if (typeof actorHeader !== 'string' || actorHeader.trim().length === 0) {
    throw new ApplicationError(
      'ACTOR_ID_REQUIRED',
      'x-glyph-actor-id is required for audited editor operations',
      400,
    )
  }
  return { actorId: actorHeader.trim() }
}

function secureEquals(value: string, expected: string): boolean {
  const left = Buffer.from(value)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}
