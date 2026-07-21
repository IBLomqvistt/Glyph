'use client'

import { useTransition } from 'react'
import type { UserRole } from '@glyph/domain'
import { setDemoRole } from '@/server/demo-role-action'

const roles: readonly UserRole[] = ['VISITOR', 'SUBSCRIBER', 'EDITOR']

export function RoleSwitcher({ role }: { role: UserRole }): React.JSX.Element {
  const [pending, startTransition] = useTransition()
  return (
    <label className="role-switcher">
      <span>Demo role</span>
      <select
        aria-label="Demo role"
        value={role}
        disabled={pending}
        onChange={(event) => {
          const nextRole = event.target.value as UserRole
          startTransition(async () => {
            await setDemoRole(nextRole)
            window.location.reload()
          })
        }}
      >
        {roles.map((option) => (
          <option key={option} value={option}>
            {option.toLowerCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
