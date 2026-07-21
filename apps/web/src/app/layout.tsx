import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { DemoAuthGateway } from '@/server/demo-auth'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Glyph — Understand the mechanism',
    template: '%s · Glyph',
  },
  description: 'Evidence-linked technical research and AI economics analysis.',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.JSX.Element> {
  const user = await new DemoAuthGateway().currentUser()
  return (
    <html lang="en">
      <body>
        <AppShell role={user.role}>{children}</AppShell>
      </body>
    </html>
  )
}
