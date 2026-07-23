import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Network,
  ShieldCheck,
} from 'lucide-react'

const methodSteps = [
  {
    icon: Network,
    number: '01',
    title: 'Understand the mechanism',
    body: 'See what changed inside the model, how it works, and which constraints still matter.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Test the evidence',
    body: 'Move from the conclusion to the exact source passage, benchmark condition, and unresolved question.',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    number: '03',
    title: 'Map the economic relevance',
    body: 'Trace technical change through compute, infrastructure, model providers, and application demand.',
  },
] as const

const evidencePrinciples = [
  {
    label: 'Author claim',
    body: 'What the paper or model provider says happened.',
  },
  {
    label: 'Independent evidence',
    body: 'What third-party measurements and comparable data support.',
  },
  {
    label: 'Glyph interpretation',
    body: 'What the technical change could mean, with conditions and counterforces visible.',
  },
] as const

export default function PublicLandingPage(): React.JSX.Element {
  return (
    <div className="public-landing">
      <header className="public-site-header">
        <Link className="public-nav-brand" href="/" aria-label="Glyph home">
          <Image
            src="/assets/glyph/glyph-mascot-v2.png"
            alt=""
            width={46}
            height={46}
            priority
          />
          <span>Glyph</span>
        </Link>

        <nav
          className="public-header-navigation"
          aria-label="Landing navigation"
        >
          <div className="public-site-nav">
            <Link href="#sample-report">Sample report</Link>
            <Link href="#how-it-works">How it works</Link>
          </div>
          <div className="public-nav-actions">
            <Link className="public-nav-cta" href="/login">
              Enter Glyph
            </Link>
          </div>
        </nav>
      </header>

      <main className="public-landing-main">
        <section
          className="public-landing-hero"
          aria-labelledby="landing-title"
        >
          <p className="public-eyebrow">Frontier AI research for investors</p>
          <h1 id="landing-title">
            Those who understand frontier AI rarely trade it. Those who trade it
            rarely understand it.
          </h1>
          <h2>Glyph closes the gap.</h2>
          <p className="public-landing-description">
            Glyph turns frontier research into clear technical mechanisms,
            source-linked evidence, and conditional investment relevance without
            flattening the science or inventing a trade.
          </p>
          <div className="public-hero-actions">
            <Link className="public-primary-cta" href="/login">
              Enter Glyph
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </Link>
            <Link className="public-secondary-cta" href="#sample-report">
              See the product
            </Link>
          </div>
          <p className="public-hero-note">
            Technical mechanism first. Evidence before implication.
          </p>
        </section>

        <section
          className="public-product-section"
          id="sample-report"
          aria-labelledby="product-title"
        >
          <header className="public-section-heading public-product-heading">
            <div>
              <p className="public-section-kicker">Inside Glyph</p>
              <h2 id="product-title">
                A frontier paper becomes an investor-grade brief.
              </h2>
            </div>
            <p>
              Start with the five-minute view. Go deeper into the mechanism,
              source evidence, and economic relevance when it matters.
            </p>
          </header>

          <Link
            className="public-product-frame"
            href="/reports/kimi-k3"
            aria-label="Open the Kimi K3 report"
          >
            <span className="public-browser-bar" aria-hidden="true">
              <span className="public-browser-dots">
                <i />
                <i />
                <i />
              </span>
              <span>Glyph / Kimi K3</span>
              <span className="public-browser-status">Sample report</span>
            </span>
            <Image
              className="public-product-image"
              src="/assets/glyph/kimi-k3-report-preview.png"
              alt="Kimi K3 report in Glyph showing the technical brief, source evidence, and investor analysis"
              width={1800}
              height={1125}
              sizes="(max-width: 1280px) 94vw, 1200px"
              priority
            />
          </Link>
          <p className="public-product-caption">
            Kimi K3: Efficiency at 2.8T Parameters. Read the mechanism, inspect
            the evidence, then test the economic relevance.
          </p>
        </section>

        <section
          className="public-method-section"
          id="how-it-works"
          aria-labelledby="method-title"
        >
          <header className="public-section-heading">
            <div>
              <p className="public-section-kicker">How Glyph works</p>
              <h2 id="method-title">
                From architecture to investable context.
              </h2>
            </div>
            <p>
              Each report follows the same sequence so technical novelty does
              not become an unsupported market conclusion.
            </p>
          </header>

          <div className="public-method-grid">
            {methodSteps.map(({ icon: Icon, number, title, body }) => (
              <article key={title}>
                <div className="public-method-meta">
                  <span>{number}</span>
                  <Icon aria-hidden="true" size={22} strokeWidth={1.55} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="public-evidence-section"
          aria-labelledby="evidence-title"
        >
          <div className="public-evidence-intro">
            <p className="public-section-kicker">Evidence discipline</p>
            <h2 id="evidence-title">No forced trade.</h2>
            <p>
              A technically important paper can still have no direct trade
              implication. Glyph says so when the evidence does not support one.
            </p>
          </div>

          <div className="public-evidence-principles">
            {evidencePrinciples.map(({ label, body }) => (
              <article key={label}>
                <h3>{label}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-closing-section" aria-labelledby="cta-title">
          <p className="public-section-kicker">Your frontier research desk</p>
          <h2 id="cta-title">
            Understand what changed before deciding what it means.
          </h2>
          <div className="public-hero-actions">
            <Link className="public-primary-cta" href="/login">
              Enter Glyph
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </Link>
            <Link className="public-secondary-cta" href="/reports/kimi-k3">
              Read the Kimi K3 report
            </Link>
          </div>
        </section>
      </main>

      <footer className="public-site-footer">
        <Link className="public-footer-brand" href="/" aria-label="Glyph home">
          <Image
            src="/assets/glyph/glyph-mascot-v2.png"
            alt=""
            width={32}
            height={32}
          />
          <span>Glyph</span>
        </Link>
        <p>Frontier AI research for investors.</p>
        <p>Research, not investment advice.</p>
      </footer>
    </div>
  )
}
