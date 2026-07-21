import Link from 'next/link'
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { Diagram } from '@/components/diagram'
import { kimiArchitectureVisual } from '@/lib/kimi-reader-content'

const benefits = [
  {
    icon: Network,
    text: 'Understand the architecture',
  },
  {
    icon: ShieldCheck,
    text: 'See what the evidence supports',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    text: 'Connect technical change to economic relevance',
  },
] as const

export default function PublicLandingPage(): React.JSX.Element {
  return (
    <div className="public-landing">
      <section className="public-landing-hero" aria-labelledby="landing-title">
        <div className="public-landing-copy">
          <Link className="public-brand" href="/" aria-label="Glyph home">
            <span>Glyph</span>
            <i aria-hidden="true">G</i>
          </Link>
          <p className="public-eyebrow">Frontier AI research for investors</p>
          <h1 id="landing-title">
            Those who understand frontier AI rarely trade it. Those who trade it
            rarely understand it.
          </h1>
          <h2>Glyph closes the gap.</h2>
          <p className="public-landing-description">
            Glyph turns frontier research into clear technical mechanisms,
            source-linked evidence, and conditional investment relevance,
            without flattening the science or inventing a trade.
          </p>
          <div className="public-benefits" aria-label="Glyph benefits">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text}>
                <span aria-hidden="true">
                  <Icon size={22} />
                </span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="public-cta-row">
            <Link className="public-primary-cta" href="/login">
              Enter Glyph <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <Link className="public-secondary-cta" href="/login?mode=signup">
              Create demo account
            </Link>
          </div>
          <p className="public-footnote">
            Built for investors who need to understand the frontier, not merely
            follow it.
          </p>
        </div>

        <article
          className="public-product-demo"
          aria-label="Glyph Kimi K3 digest preview"
        >
          <div className="public-demo-kicker">Glyph Digest</div>
          <h2>Kimi K3: Efficiency at 2.8T Parameters.</h2>
          <div className="public-demo-tabs" aria-hidden="true">
            <span>3–5 minute brief</span>
            <span>Technical mechanisms</span>
            <span>Economic relevance</span>
          </div>
          <div className="public-demo-section">
            <strong>1. Overview</strong>
          </div>
          <div className="public-demo-section is-open">
            <strong>2. Architecture at a glance</strong>
            <Diagram spec={kimiArchitectureVisual} />
          </div>
          <div className="public-demo-section is-open public-demo-finding">
            <strong>3. Key technical point</strong>
            <p>
              Kimi K3 combines linear attention, depth-wise retrieval, and
              sparse expert routing at 2.8T total parameters.
            </p>
          </div>
          <div className="public-demo-section">
            <strong>4. Supporting details</strong>
          </div>
          <div className="public-demo-section">
            <strong>5. Source evidence</strong>
          </div>
        </article>
      </section>
    </div>
  )
}
