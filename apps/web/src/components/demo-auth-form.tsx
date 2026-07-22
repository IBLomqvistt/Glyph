import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function DemoAuthForm(): React.JSX.Element {
  return (
    <div className="demo-auth-page">
      <Link href="/" className="demo-auth-back">
        <ArrowLeft aria-hidden="true" size={17} /> Back to Glyph
      </Link>
      <section className="demo-auth-card" aria-labelledby="auth-title">
        <Link href="/" className="public-brand" aria-label="Glyph home">
          <span>Glyph</span>
          <Image
            className="demo-auth-mascot"
            src="/assets/glyph/glyph-mascot-v2.png"
            alt=""
            width={44}
            height={44}
            priority
          />
        </Link>
        <p className="public-eyebrow">Your research desk awaits</p>
        <h1 id="auth-title">Enter Glyph.</h1>
        <p>
          This V1 opens directly into a local demo. No account or email address
          is required.
        </p>
        <Link className="demo-auth-continue" href="/home?demo=1">
          Continue to demo
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
        <p className="demo-auth-note">
          Glyph provides source-linked research, not investment advice.
        </p>
      </section>
    </div>
  )
}
