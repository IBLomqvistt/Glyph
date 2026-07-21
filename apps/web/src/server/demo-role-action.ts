'use server'

import { cookies } from 'next/headers'
import { UserRoleSchema, type UserRole } from '@glyph/domain'
import { roleCookie } from './demo-auth'

export async function setDemoRole(role: UserRole): Promise<void> {
  const validated = UserRoleSchema.parse(role)
  const store = await cookies()
  store.set(roleCookie, validated, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}
