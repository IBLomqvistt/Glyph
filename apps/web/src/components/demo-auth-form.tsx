'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function DemoAuthForm({
  initialMode,
}: {
  initialMode: 'login' | 'signup'
}): React.JSX.Element {
  const router = useRouter()
  const [mode, setMode] = useState(initialMode)

  return (
    <div className="demo-auth-page">
      <Link href="/" className="demo-auth-back">
        <ArrowLeft aria-hidden="true" size={17} /> Back to Glyph
      </Link>
      <section className="demo-auth-card" aria-labelledby="auth-title">
        <Link href="/" className="public-brand" aria-label="Glyph home">
          <span>Glyph</span>
          <i aria-hidden="true">G</i>
        </Link>
        <p className="public-eyebrow">Your research desk awaits</p>
        <h1 id="auth-title">
          {mode === 'login' ? 'Enter Glyph.' : 'Create your demo access.'}
        </h1>
        <p>
          This V1 uses a local demo identity. No production account is created
          and no credentials are sent to an identity provider.
        </p>
        <div className="demo-auth-tabs" role="tablist" aria-label="Access mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>
        <form
          className="demo-auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            router.push('/home?demo=1')
          }}
        >
          <label htmlFor="demo-email">Work email</label>
          <input
            id="demo-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
          <button type="submit">
            {mode === 'login' ? 'Continue to demo' : 'Create demo access'}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </form>
        <p className="demo-auth-note">
          Glyph provides source-linked research, not investment advice.
        </p>
      </section>
    </div>
  )
}
