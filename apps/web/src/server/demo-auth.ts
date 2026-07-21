import { cookies } from 'next/headers'
import { UserRoleSchema, type UserProfile, type UserRole } from '@glyph/domain'
import type { AuthGateway } from '@glyph/application'

const roleCookie = 'glyph-demo-role'

export class DemoAuthGateway implements AuthGateway {
  async currentUser(): Promise<UserProfile> {
    const store = await cookies()
    const parsed = UserRoleSchema.safeParse(store.get(roleCookie)?.value)
    const role: UserRole = parsed.success ? parsed.data : 'VISITOR'
    return {
      schemaVersion: 1,
      id: `demo-${role.toLowerCase()}`,
      role,
      preferences: {},
      savedConceptIds: [],
    }
  }

  async requireRole(role: UserRole): Promise<UserProfile> {
    const user = await this.currentUser()
    if (user.role !== role) {
      throw new Error(`PERMISSION_DENIED: ${role} role required`)
    }
    return user
  }
}

export { roleCookie }
