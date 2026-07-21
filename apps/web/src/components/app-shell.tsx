'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  ChartNoAxesColumnIncreasing,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
} from 'lucide-react'
import { Button, Sheet, SheetContent, SheetTrigger } from '@glyph/ui'
import type { UserRole } from '@glyph/domain'
import { RoleSwitcher } from './role-switcher'

const publicNavigation = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/reader/kimi-k3', label: 'Reader', icon: BookOpen },
  { href: '/library', label: 'Library', icon: Boxes },
] as const

const editorNavigation = [
  { href: '/editor', label: 'Editor', icon: ChartNoAxesColumnIncreasing },
  { href: '/previews/newsletter', label: 'Previews', icon: Send },
] as const

function Navigation({
  role,
  pathname,
}: {
  role: UserRole
  pathname: string
}): React.JSX.Element {
  const navigation =
    role === 'EDITOR'
      ? [...publicNavigation, ...editorNavigation]
      : publicNavigation

  return (
    <nav aria-label="Primary navigation" className="nav-list">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/home'
            ? pathname === '/home' || pathname.startsWith('/layers/')
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
            title={label}
          >
            <Icon aria-hidden="true" size={19} strokeWidth={1.65} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode
  role: UserRole
}): React.JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const publicEntryRoute = pathname === '/' || pathname === '/login'
  const readerRoute = pathname.startsWith('/reader/')
  const [readerNavigationCollapsed, setReaderNavigationCollapsed] =
    useState(false)

  if (publicEntryRoute) {
    return (
      <div className="public-entry-frame">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div
      className={`app-frame${readerRoute ? ' reader-shell' : ''}${readerRoute && readerNavigationCollapsed ? ' sidebar-collapsed' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-toolbar">
        <div className="history-controls" aria-label="Page history">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Go to previous page"
            onClick={() => router.back()}
          >
            <ArrowLeft aria-hidden="true" size={19} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Go to next page"
            onClick={() => window.history.forward()}
          >
            <ArrowRight aria-hidden="true" size={19} />
          </Button>
          {readerRoute ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="reader-nav-toggle"
              aria-label={
                readerNavigationCollapsed
                  ? 'Expand reader navigation'
                  : 'Collapse reader navigation'
              }
              onClick={() =>
                setReaderNavigationCollapsed((collapsed) => !collapsed)
              }
            >
              {readerNavigationCollapsed ? (
                <PanelLeftOpen aria-hidden="true" size={19} />
              ) : (
                <PanelLeftClose aria-hidden="true" size={19} />
              )}
            </Button>
          ) : null}
        </div>
        <Link href="/home" className="toolbar-brand" aria-label="Glyph home">
          <span className="glyph-sigil" aria-hidden="true">
            ◇
          </span>
          Glyph
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="mobile-menu-trigger"
            >
              <Menu aria-hidden="true" size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent title="Glyph" description="Navigation and demo role">
            <Navigation role={role} pathname={pathname} />
            <RoleSwitcher role={role} />
          </SheetContent>
        </Sheet>
      </header>
      <aside className="desktop-sidebar">
        <Link href="/home" className="brand" aria-label="Glyph home">
          <span className="brand-mark">G</span>
          <span>Glyph</span>
        </Link>
        <Navigation role={role} pathname={pathname} />
        <div className="sidebar-foot">
          <RoleSwitcher role={role} />
          <p>Kimi K3 report · local preview</p>
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
