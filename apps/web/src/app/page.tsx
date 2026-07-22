import Link from 'next/link'
import {
  Bookmark,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Database,
  FileText,
  Network,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

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

const glyphActions = [
  { icon: FileText, label: 'Explain the mechanism' },
  { icon: ChartNoAxesColumnIncreasing, label: 'Investor relevance' },
  { icon: CircleHelp, label: 'Challenge the claim' },
  { icon: Database, label: 'Evidence needed' },
] as const

function GlyphMascot({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? 'glyph-mascot is-compact' : 'glyph-mascot'}
      viewBox="0 0 96 112"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={compact ? 'glyph-body-compact' : 'glyph-body'}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#f7f4ff" />
          <stop offset="0.58" stopColor="#d9d7ff" />
          <stop offset="1" stopColor="#8e84ff" />
        </linearGradient>
        <linearGradient
          id={compact ? 'glyph-gem-compact' : 'glyph-gem'}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#83e7e4" />
          <stop offset="1" stopColor="#6c5ff5" />
        </linearGradient>
        <filter
          id={compact ? 'glyph-shadow-compact' : 'glyph-shadow'}
          x="-35%"
          y="-30%"
          width="170%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="5"
            floodColor="#4438b8"
            floodOpacity="0.22"
          />
        </filter>
      </defs>
      <ellipse cx="48" cy="103" rx="29" ry="5" fill="#6f65ec" opacity="0.15" />
      <g filter={`url(#${compact ? 'glyph-shadow-compact' : 'glyph-shadow'})`}>
        <path
          d="M48 3 60 25 48 36 36 25Z"
          fill={`url(#${compact ? 'glyph-gem-compact' : 'glyph-gem'})`}
          stroke="#7065ee"
          strokeWidth="2"
        />
        <path
          d="M32 29C18 33 12 47 14 63c2 19 15 31 34 31s32-12 34-31c2-16-4-30-18-34-10-4-22-4-32 0Z"
          fill={`url(#${compact ? 'glyph-body-compact' : 'glyph-body'})`}
          stroke="#7267ef"
          strokeWidth="2.2"
        />
        <path
          d="M18 48 4 57l13 8M78 48l14 9-13 8"
          fill="#c9c8ff"
          stroke="#7166ee"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m34 89-9 14 18-8M62 89l9 14-18-8"
          fill="#aaa5ff"
          stroke="#7166ee"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <ellipse cx="34" cy="57" rx="7" ry="9" fill="#1b1c55" />
        <ellipse cx="62" cy="57" rx="7" ry="9" fill="#1b1c55" />
        <circle cx="36" cy="54" r="2.4" fill="white" />
        <circle cx="64" cy="54" r="2.4" fill="white" />
        <circle cx="25" cy="70" r="4" fill="#9be5df" opacity="0.82" />
        <circle cx="71" cy="70" r="4" fill="#9be5df" opacity="0.82" />
        <path
          d="M42 72q6 6 12 0"
          fill="none"
          stroke="#272665"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path d="M48 38 43 47h10Z" fill="#ffffff" opacity="0.75" />
      </g>
    </svg>
  )
}

function FlowArrow(): React.JSX.Element {
  return (
    <svg className="public-flow-arrow" viewBox="0 0 54 20" aria-hidden="true">
      <path d="M2 10h42" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m39 4 10 6-10 6" fill="currentColor" />
    </svg>
  )
}

export default function PublicLandingPage(): React.JSX.Element {
  return (
    <div className="public-landing">
      <section className="public-landing-hero" aria-labelledby="landing-title">
        <div className="public-landing-copy">
          <Link className="public-brand" href="/" aria-label="Glyph home">
            <span>Glyph</span>
            <GlyphMascot />
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
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="public-cta-row">
            <Link className="public-primary-cta" href="/login">
              <span>Enter Glyph</span>
              <GlyphMascot compact />
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
          <header className="public-demo-header">
            <div>
              <div className="public-demo-kicker">Glyph Digest</div>
              <h2>Kimi K3: Efficiency at 2.8T Parameters.</h2>
            </div>
            <div
              className="public-demo-actions"
              aria-label="Digest preview actions"
            >
              <button type="button" aria-label="Bookmark digest preview">
                <Bookmark aria-hidden="true" size={19} strokeWidth={1.65} />
              </button>
              <button type="button" aria-label="Share digest preview">
                <Share2 aria-hidden="true" size={19} strokeWidth={1.65} />
              </button>
            </div>
          </header>

          <div
            className="public-demo-tabs"
            aria-label="Digest preview sections"
          >
            <span className="is-active">3–5 minute brief</span>
            <span>Technical mechanisms</span>
            <span>Economic relevance</span>
          </div>

          <div className="public-demo-row">
            <strong>1. Overview</strong>
            <ChevronDown aria-hidden="true" size={16} />
          </div>

          <section
            className="public-demo-architecture"
            aria-labelledby="architecture-preview-title"
          >
            <div className="public-demo-row is-open">
              <strong>2. Architecture at a glance</strong>
              <ChevronUp aria-hidden="true" size={16} />
            </div>
            <div className="public-architecture-content">
              <h3 id="architecture-preview-title">
                16 of 896: Sparse compute, industrial coordination
              </h3>
              <p>
                <strong>Why it matters:</strong> the compute bill falls only if
                routing stays balanced. At this expert count, the network fabric
                becomes part of the model.
              </p>

              <figure className="public-expert-flow">
                <figcaption>
                  One token&apos;s journey through the expert pool
                </figcaption>
                <div
                  className="public-expert-flow-diagram"
                  role="img"
                  aria-label="One token is scored by a router and sent to 16 selected experts out of an 896 expert pool."
                >
                  <div className="public-flow-node public-flow-token">
                    Token
                  </div>
                  <FlowArrow />
                  <div className="public-flow-node public-flow-router">
                    <strong>Router</strong>
                    <span>scores all 896 experts</span>
                  </div>
                  <FlowArrow />
                  <div className="public-expert-pool">
                    <strong>Expert pool · 896 experts</strong>
                    <span className="public-pool-detail">
                      2.8T parameters total
                    </span>
                    <div className="public-expert-grid" aria-hidden="true">
                      {Array.from({ length: 32 }, (_, index) => (
                        <i
                          className={index < 16 ? 'is-selected' : undefined}
                          key={index}
                        />
                      ))}
                    </div>
                    <span>16 light up: mid-size compute, 2.8T capacity</span>
                  </div>
                </div>
              </figure>

              <div className="public-balancing-copy">
                <h4>The stability method, Quantile Balancing</h4>
                <p>
                  Standard approach: add a spread-the-load penalty to the
                  training loss, which distorts learning. K3 instead reads the
                  router&apos;s own score distribution and sets expert
                  allocation from its quantiles.
                </p>
                <p>
                  Routing instability is how trillion-scale training runs waste
                  months. The run finished; the specifics await the report.
                </p>
                <p>
                  <strong>Sparsity cuts arithmetic.</strong> What remains is
                  network traffic: every token travels to its 16 experts and
                  back on every expert layer.
                </p>
              </div>
            </div>
          </section>

          <section
            className="public-demo-technical"
            aria-labelledby="technical-preview-title"
          >
            <div className="public-demo-row">
              <strong id="technical-preview-title">
                3. Key technical point
              </strong>
              <ChevronDown aria-hidden="true" size={16} />
            </div>
            <div className="public-technical-layout">
              <p>
                MuonClip stabilizes attention logits while preserving sparse
                expert routing at scale.
              </p>
              <div
                className="public-glyph-menu"
                aria-label="Glyph it preview actions"
              >
                <div className="public-glyph-menu-label">
                  <Sparkles aria-hidden="true" size={14} /> Glyph it!
                </div>
                <div className="public-glyph-menu-items">
                  {glyphActions.map(({ icon: Icon, label }) => (
                    <span key={label}>
                      <Icon aria-hidden="true" size={13} /> {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="public-demo-row public-demo-source-row">
            <span>
              <strong>4. Supporting details</strong>
              <small>[Technical appendix]</small>
            </span>
            <ChevronDown aria-hidden="true" size={16} />
          </div>
          <div className="public-demo-row public-demo-source-row">
            <span>
              <strong>5. Source evidence</strong>
              <small>[K3 paper §3.2]</small>
            </span>
            <ChevronDown aria-hidden="true" size={16} />
          </div>
        </article>
      </section>
    </div>
  )
}
