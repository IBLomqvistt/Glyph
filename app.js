import {
  demoContent,
  findClaim,
  readinessSummary,
} from './src/demo-content.mjs'
import {
  parseAppLocation,
  routeHref,
  routes,
  workedExampleRoutes,
} from './src/routes.mjs'
import kimiEvidence from './fixtures/evidence/kimi-k3.json' with { type: 'json' }
import { resolveClaimEvidence } from './src/kimi-reader.mjs'
import { kimiPaper } from './src/models-catalog.mjs'
import { createAbstractPreview } from './packages/ingestion/src/abstract-preview.mjs'
import {
  calculateEditorialScore,
  calculateFinalScore,
} from './packages/recommendation/src/scoring.mjs'

const main = document.querySelector('#main-content')
const nav = document.querySelector('#primary-nav')
const menuToggle = document.querySelector('#menu-toggle')
const sidebar = document.querySelector('.sidebar')
const toastRegion = document.querySelector('#toast-region')
const fixturePill = document.querySelector('.fixture-pill')
const sidebarFooter = document.querySelector('.sidebar-footer')

const kimiEditorialScore = calculateEditorialScore(kimiPaper.editorialLabels)
const kimiFinalScore = calculateFinalScore({
  editorialScore: kimiEditorialScore.normalizedScore,
  ...kimiPaper.rankingInputs,
})
const state = {
  reportDepth: 'executive',
  selectedFeedback: null,
  activeKimiClaimId: 'claim-stable-latent-moe',
  kimiReaderView: 'evidence',
  kimiBookmarked: false,
  reviewReady: new Set(
    demoContent.review.filter((item) => item.ready).map((item) => item.id),
  ),
}

const motionTokens = {
  fast: 180,
  accordion: 220,
  stagger: 70,
  ease: 'cubic-bezier(.22, 1, .36, 1)',
}

function icon(name, className = '') {
  const paths = {
    nodes:
      '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.8 7.1 10.8 16M16.2 7.1 13.2 16M8 6h8"/>',
    shield:
      '<path d="M12 3 20 6v5c0 5.1-3.4 8.6-8 10-4.6-1.4-8-4.9-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    chart:
      '<path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/><path d="M15 7h4v4"/>',
    bookmark:
      '<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.5L6 21V4.8Z"/>',
    share:
      '<circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="m8 11 7.8-4.7M8 13l7.8 4.7"/>',
    sparkle:
      '<path d="m12 3 1.1 4.2L17 9l-3.9 1.8L12 15l-1.1-4.2L7 9l3.9-1.8L12 3Z"/><path d="m18.5 14 .6 2.1 1.9.9-1.9.9-.6 2.1-.6-2.1L16 17l1.9-.9.6-2.1Z"/>',
    file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 12h5M10 16h4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.6 2.6 0 1 1 3.2 2.5c-.8.3-.8.9-.8 1.5M12 17h.01"/>',
    database:
      '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  }
  return `<svg class="glyph-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`
}

function renderMascot({ compact = false } = {}) {
  return `
    <span class="glyph-mascot ${compact ? 'compact' : ''}" aria-hidden="true">
      <span class="mascot-halo"></span>
      <span class="mascot-crown"></span>
      <span class="mascot-face"><i></i><i></i><b></b></span>
      <span class="mascot-body"></span>
    </span>
  `
}

function renderArchitectureDiagram() {
  return `
    <div class="architecture-wrap" data-architecture aria-label="Mixture-of-experts architecture showing sparse routing from input tokens through selected experts to output logits">
      <svg class="architecture-diagram" viewBox="0 0 920 300" role="img" aria-labelledby="arch-title arch-desc">
        <title id="arch-title">Kimi K3 sparse mixture-of-experts architecture</title>
        <desc id="arch-desc">Input tokens move through embeddings and RMS normalization to a top-K router, which selects experts and merges routed results into output projection, normalization and logits.</desc>
        <defs>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g class="arch-labels">
          <text x="460" y="21">EXPERT PARALLELISM (EP)</text>
          <text x="615" y="45" class="teal">SPARSE ROUTING · TOP-K</text>
        </g>
        <g class="main-flow">
          <path class="flow-line" pathLength="1" d="M65 134H150M202 134H275M326 134H383"/>
          <path class="flow-line" pathLength="1" d="M551 134H640M689 134H755M805 134H862"/>
        </g>
        <g class="route-flow">
          <path class="route-line selected" pathLength="1" d="M413 124C432 88 448 72 480 72H530C558 72 566 105 582 118 595 128 608 131 640 132"/>
          <path class="route-line selected" pathLength="1" d="M413 138C440 174 454 194 486 194H526C555 194 563 158 581 147 596 138 611 135 640 134"/>
          <path class="route-line muted" d="M413 131C449 132 470 132 510 132H640"/>
        </g>
        <g class="node input" transform="translate(22 99)"><rect width="54" height="54" rx="9"/><path d="M12 13h30v30H12zM12 23h30M22 13v30M32 13v30"/><text x="27" y="79">Input tokens</text><text x="27" y="94">(B, T)</text></g>
        <g class="node embedding" transform="translate(150 99)"><rect width="54" height="54" rx="9"/><rect x="8" y="8" width="16" height="16"/><rect x="29" y="8" width="16" height="16"/><rect x="8" y="29" width="16" height="16"/><rect x="29" y="29" width="16" height="16"/><text x="27" y="79">Token embedding</text><text x="27" y="94">(B, T, d)</text></g>
        <g class="node norm" transform="translate(274 108)"><polygon points="27,0 50,14 50,40 27,54 4,40 4,14"/><path d="M14 28h26M27 8v40"/><text x="27" y="70">RMSNorm</text></g>
        <g class="node router" transform="translate(370 99)"><polygon points="27,0 51,27 27,54 3,27"/><path d="M17 18 37 36M37 18 17 36"/><text x="27" y="79">Router (Top-K)</text><text x="27" y="94">K = 8</text></g>
        <g class="experts">
          <rect class="expert-frame" x="446" y="44" width="112" height="181" rx="16"/>
          <g class="expert selected-expert" transform="translate(470 52)"><polygon points="30,0 54,15 54,45 30,60 6,45 6,15"/><path d="m30 7 9 18 9 20H12l9-20 9-18Z"/><text x="30" y="80">Expert 1</text></g>
          <circle cx="501" cy="132" r="2"/><circle cx="501" cy="142" r="2"/><circle cx="501" cy="152" r="2"/>
          <g class="expert selected-expert second" transform="translate(470 161)"><polygon points="30,0 54,15 54,45 30,60 6,45 6,15"/><path d="M17 15h26v30H17zM17 25h26M30 15v30"/><text x="30" y="78">Expert N</text></g>
          <text x="502" y="218" class="expert-count">N = 1024</text>
        </g>
        <g class="merge" transform="translate(640 110)"><circle cx="25" cy="25" r="24"/><path d="M25 13v24M13 25h24"/></g>
        <g class="node output" transform="translate(750 99)"><rect width="54" height="54" rx="9"/><path d="M9 12h36v30H9zM18 12v30M30 12v30"/><text x="27" y="79">Output projection</text><text x="27" y="94">(B, T, d)</text></g>
        <g class="node logits" transform="translate(850 99)"><rect width="54" height="54" rx="9"/><path d="m12 35 10-13 8 7 12-17M12 42h30"/><text x="27" y="79">Output logits</text><text x="27" y="94">(B, T, V)</text></g>
        <g class="support-box" transform="translate(254 235)"><rect width="132" height="48" rx="8"/><text x="66" y="20">Router aux loss</text><text x="66" y="37">load balance + Z-loss</text></g>
        <g class="support-box" transform="translate(410 235)"><rect width="128" height="48" rx="8"/><text x="64" y="20">MuonClip</text><text x="64" y="37">attention logits · clip τ</text></g>
        <g class="support-box" transform="translate(571 235)"><rect width="118" height="48" rx="8"/><text x="59" y="20">KV cache</text><text x="59" y="37">FP8</text></g>
        <path class="aux-line" d="M397 151C390 203 344 199 327 235M397 151C402 207 445 204 468 235"/>
        <path class="cache-line" d="M516 225C530 241 551 244 571 253M630 235V164"/>
        <circle class="token-pulse purple p1" r="5"><animateMotion dur="4.8s" repeatCount="indefinite" path="M65 134H383C417 134 431 72 480 72H530C558 72 566 105 582 118 595 128 608 131 640 132H862"/></circle>
        <circle class="token-pulse purple p2" r="4"><animateMotion begin="1.6s" dur="4.8s" repeatCount="indefinite" path="M65 134H383C417 134 433 194 486 194H526C555 194 563 158 581 147 596 138 611 135 640 134H862"/></circle>
      </svg>
      <div class="diagram-legend" aria-hidden="true"><span><i class="purple-line"></i>Data flow</span><span><i class="dash-line"></i>Auxiliary / loss</span><span><i class="teal-line"></i>Routing path</span></div>
    </div>
  `
}

function accordionSection(id, number, title, content, open = false) {
  return `
    <section class="digest-accordion ${open ? 'is-open' : ''}" data-accordion="${id}">
      <h3><button type="button" aria-expanded="${open}" aria-controls="accordion-${id}" data-accordion-toggle><span>${number}. ${title}</span><b aria-hidden="true">⌄</b></button></h3>
      <div class="accordion-grid" id="accordion-${id}" ${open ? '' : 'inert'}><div class="accordion-inner">${content}</div></div>
    </section>
  `
}

function renderLanding() {
  const overview = `<div class="overview-copy"><p>Kimi K3 uses a 2.8T-parameter mixture-of-experts design while activating only a small expert set for each token.</p><span>Source boundary: first-party launch analysis</span></div>`
  const keyPoint = `<div class="claim-row"><button type="button" class="technical-claim" data-glyph-claim aria-expanded="false">MuonClip stabilizes attention logits while preserving sparse expert routing at scale.</button><div class="claim-action-anchor"><span class="claim-connector" aria-hidden="true"></span><button class="glyph-it-button" type="button" data-glyph-trigger aria-expanded="false">${icon('sparkle')} Glyph it!</button><div class="glyph-action-menu" data-glyph-menu role="menu"><button role="menuitem">${icon('file')}<span>Explain the mechanism</span></button><button role="menuitem">${icon('chart')}<span>Investor relevance</span></button><button role="menuitem">${icon('help')}<span>Challenge the claim</span></button><button role="menuitem">${icon('database')}<span>Evidence needed</span></button></div></div></div>`
  return `
    <div class="landing-page">
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="hero-copy">
          <a class="landing-brand entrance-item" href="/" aria-label="Glyph home"><span>Glyph</span>${renderMascot()}</a>
          <p class="landing-eyebrow entrance-item">Frontier AI research for investors</p>
          <h1 id="landing-title" class="entrance-item">Those who understand<br>frontier AI rarely trade it.<br>Those who trade it rarely<br>understand it.</h1>
          <h2 class="entrance-item">Glyph closes the gap.</h2>
          <p class="hero-description entrance-item">Glyph turns frontier research into clear technical mechanisms, source-linked evidence, and conditional investment relevance, without flattening the science or inventing a trade.</p>
          <div class="benefit-list entrance-item" aria-label="Glyph benefits">
            <div class="benefit-row"><span>${icon('nodes')}</span><p>Understand the architecture</p></div>
            <div class="benefit-row"><span>${icon('shield')}</span><p>See what the evidence supports</p></div>
            <div class="benefit-row"><span>${icon('chart')}</span><p>Connect technical change to economic relevance</p></div>
          </div>
          <a class="enter-glyph entrance-item" href="${workedExampleRoutes.product}"><span>Enter Glyph</span>${renderMascot({ compact: true })}<b aria-hidden="true">→</b></a>
          <p class="hero-footnote entrance-item">Built for investors who need to understand the frontier,<br>not merely follow it.</p>
        </div>
        <article class="product-demo" aria-labelledby="digest-title">
          <header class="digest-header">
            <div><span class="digest-label">Glyph Digest</span><h2 id="digest-title">Kimi K3: Efficiency at 2.8T Parameters.</h2></div>
            <div class="digest-actions"><button type="button" aria-label="Bookmark this digest" data-landing-bookmark aria-pressed="false">${icon('bookmark')}</button><button type="button" aria-label="Share this digest" data-landing-share>${icon('share')}</button></div>
          </header>
          <div class="digest-tabs" role="tablist" aria-label="Digest view">
            <span class="tab-indicator" aria-hidden="true"></span>
            <button type="button" role="tab" aria-selected="true" data-digest-tab="brief">3–5 minute brief</button>
            <button type="button" role="tab" aria-selected="false" data-digest-tab="technical">Technical mechanisms</button>
            <button type="button" role="tab" aria-selected="false" data-digest-tab="economic">Economic relevance</button>
          </div>
          <div class="digest-content" data-digest-content aria-live="polite">
            <p class="tab-summary"><strong>Brief:</strong> the mechanism, evidence boundary and conditional investment signal in one scan.</p>
          </div>
          <div class="digest-report">
            ${accordionSection('overview', '1', 'Overview', overview, false)}
            ${accordionSection('architecture', '2', 'Architecture at a glance', renderArchitectureDiagram(), true)}
            ${accordionSection('technical', '3', 'Key technical point', keyPoint, true)}
            ${accordionSection('supporting', '4', 'Supporting details', '<p class="appendix-copy">[Technical appendix] MuonClip, routing stability and expert load balance.</p>', false)}
            ${accordionSection('evidence', '5', 'Source evidence', '<p class="appendix-copy">[K3 paper §3.2] Exact passages remain linked to the underlying source.</p>', false)}
          </div>
        </article>
      </section>
    </div>
  `
}

function renderLogin() {
  return `
    <main class="login-page" aria-labelledby="login-title">
      <a class="login-brand" href="/" aria-label="Back to Glyph home"><span>Glyph</span>${renderMascot({ compact: true })}</a>
      <section class="login-card">
        <p class="landing-eyebrow">Your research desk awaits</p>
        <h1 id="login-title">Enter Glyph.</h1>
        <p>Sign in to continue to the investor research workspace.</p>
        <form class="login-form" data-login-form>
          <label for="login-email">Work email</label>
          <input id="login-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required>
          <button type="submit">Continue to Glyph <span aria-hidden="true">→</span></button>
        </form>
        <div class="login-divider"><span>or</span></div>
        <a class="demo-login" href="${workedExampleRoutes.product}">Explore the Glyph workspace</a>
        <p class="login-note">By continuing, you agree to use source-linked research responsibly. Glyph does not provide investment advice.</p>
      </section>
      <p class="login-back"><a href="/">← Back to the landing page</a></p>
    </main>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function fixtureBanner() {
  return `
    <div class="fixture-banner" role="note">
      <strong>${escapeHtml(demoContent.meta.fixtureLabel)}</strong>
      <span>The structure and interactions are real; the research content is synthetic until the gold paper is attached.</span>
    </div>
  `
}

function pageHeader({ eyebrow, title, description, stat, statLabel }) {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      ${stat ? `<div class="header-stat"><strong>${escapeHtml(stat)}</strong><span>${escapeHtml(statLabel)}</span></div>` : ''}
    </header>
  `
}

function renderNav(activeRoute) {
  nav.innerHTML = routes
    .map(
      (item) => `
        <a class="nav-link" href="/${routeHref(item.id)}" ${item.id === activeRoute ? 'aria-current="page"' : ''}>
          <span aria-hidden="true">${item.eyebrow}</span>
          <span>${escapeHtml(item.label)}</span>
        </a>
      `,
    )
    .join('')
}

function titleCaseLayer(layer) {
  return layer
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

function renderModels() {
  const source = kimiPaper.source
  const preview = createAbstractPreview(kimiPaper.introduction)
  return `
    ${pageHeader({
      eyebrow: 'Layer 4 · Models',
      title: 'Frontier models, ranked with receipts.',
      description:
        'Editorially selected model releases with clear source boundaries, technical labels, and inspectable evidence.',
      stat: '1',
      statLabel: 'worked example',
    })}
    <section class="models-layout">
      <div class="model-card-list" aria-label="Models">
        <article class="model-card selected" data-paper-id="${source.id}">
          <div class="model-card-topline">
            <div class="source-lockup">
              <img src="${kimiPaper.logoPath}" alt="Kimi logo" width="44" height="44" />
              <div>
                <strong>Moonshot AI</strong>
                <span>Jul 21, 2026 · ${escapeHtml(kimiPaper.artifactLabel)}</span>
              </div>
            </div>
            <a class="external-link" href="${source.canonicalUrl}" target="_blank" rel="noreferrer" aria-label="Open Kimi K3 canonical source">External source ↗</a>
          </div>
          <div class="model-card-body">
            <p class="eyebrow">First-party source · Report pending</p>
            <h2><a href="${workedExampleRoutes.reader}">${escapeHtml(source.canonicalTitle)}</a></h2>
            <p class="model-abstract"><span>Abstract</span>${escapeHtml(preview)}</p>
            <div class="tag-row" aria-label="Concepts">
              ${kimiPaper.concepts.map((concept) => `<button class="concept-tag" data-kimi-concept="${escapeHtml(concept)}">${escapeHtml(concept)}</button>`).join('')}
            </div>
          </div>
          <div class="model-card-footer">
            <div class="relevance-score" aria-label="Final relevance score ${kimiFinalScore.score}">
              <strong>${kimiFinalScore.score.toFixed(1)}</strong>
              <span>Very High relevance</span>
            </div>
            <div class="model-card-actions">
              <button class="bookmark-button" data-kimi-bookmark aria-pressed="${state.kimiBookmarked}" aria-label="Bookmark Kimi K3">${state.kimiBookmarked ? '★' : '☆'}</button>
              <a class="reader-arrow" href="${workedExampleRoutes.reader}" aria-label="Read Kimi K3">→</a>
            </div>
          </div>
        </article>
      </div>
      <aside class="details-panel" aria-label="Kimi K3 details">
        <div>
          <span class="label">Why it ranked highly</span>
          <p>${escapeHtml(kimiPaper.editorialRationale)}</p>
        </div>
        <dl>
          <div><dt>Source</dt><dd>Moonshot AI</dd></div>
          <div><dt>Artifact type</dt><dd>${escapeHtml(kimiPaper.artifactLabel)}</dd></div>
          <div><dt>Publication date</dt><dd>Jul 21, 2026</dd></div>
          <div><dt>Primary layer</dt><dd>${titleCaseLayer(source.primaryLayer)}</dd></div>
          <div><dt>Secondary layers</dt><dd>${source.secondaryLayers.map(titleCaseLayer).join(' · ')}</dd></div>
          <div><dt>Main uncertainty</dt><dd>${escapeHtml(kimiPaper.mainUncertainty)}</dd></div>
          <div><dt>Canonical source</dt><dd><a href="${source.canonicalUrl}" target="_blank" rel="noreferrer">kimi.com/blog/kimi-k3 ↗</a></dd></div>
        </dl>
      </aside>
    </section>
  `
}

function activeKimiEvidence() {
  const claimId = kimiPaper.claims.some(
    (item) => item.id === state.activeKimiClaimId,
  )
    ? state.activeKimiClaimId
    : kimiPaper.claims[0].id
  const resolved = resolveClaimEvidence(kimiPaper, kimiEvidence, claimId)
  return { claim: resolved.claim, evidence: resolved.evidence[0] }
}

function renderKimiEvidenceViewer() {
  const { claim, evidence } = activeKimiEvidence()
  const boxes = evidence.boundingBoxes
    .map(
      (box) =>
        `<span class="pdf-highlight" style="--box-x:${box.x * 100}%;--box-y:${box.y * 100}%;--box-width:${box.width * 100}%;--box-height:${box.height * 100}%"></span>`,
    )
    .join('')
  return `
    <article class="pdf-evidence-card" aria-live="polite">
      <div class="pdf-toolbar">
        <div><span class="label">Source printout</span><strong>Page ${evidence.pageNumber} · ${escapeHtml(evidence.sectionTitle)}</strong></div>
        <a href="${kimiEvidence.sourceAsset}#page=${evidence.pageNumber}" target="_blank" rel="noreferrer">Open PDF ↗</a>
      </div>
      <div class="pdf-page" aria-label="PDF page ${evidence.pageNumber} with highlighted evidence for ${escapeHtml(claim.text)}">
        <img src="/assets/kimi-k3/page-${evidence.pageNumber}.jpg" alt="Kimi K3 canonical print page ${evidence.pageNumber}" />
        ${boxes}
      </div>
      <blockquote>${escapeHtml(evidence.text)}</blockquote>
      <p class="evidence-location">Evidence span ${escapeHtml(evidence.id)} · Page ${evidence.pageNumber} · ${escapeHtml(evidence.sectionTitle)}</p>
    </article>
  `
}

function renderKimiEvidenceWorkspace() {
  return `
    <section class="reader-summary-grid section">
      <article class="score-breakdown card card-pad">
        <span class="label">Score breakdown</span>
        <div><strong>${kimiFinalScore.score.toFixed(1)}</strong><span>Final relevance · Very High</span></div>
        <dl>
          <div><dt>Editorial score</dt><dd>${kimiEditorialScore.score.toFixed(1)}</dd></div>
          <div><dt>Positive similarity</dt><dd>${kimiPaper.rankingInputs.positiveSimilarity.toFixed(3)}</dd></div>
          <div><dt>Source priority</dt><dd>${kimiPaper.rankingInputs.sourcePriority.toFixed(1)}</dd></div>
          <div><dt>Exploration value</dt><dd>${kimiPaper.rankingInputs.explorationValue.toFixed(1)}</dd></div>
          <div><dt>Negative similarity</dt><dd>−${kimiPaper.rankingInputs.negativeSimilarity.toFixed(3)}</dd></div>
        </dl>
      </article>
      <article class="card card-pad">
        <span class="label">Source boundary</span>
        <h2>Attached launch-blog printout, not the complete technical report.</h2>
        <p class="content-copy">The 21-page source printout is attached and evidence coordinates resolve against that exact artifact. The full technical report is announced but not attached, and architecture and evaluation statements remain first-party claims until independently checked.</p>
        <div class="tag-row">${kimiPaper.concepts.map((concept) => `<span class="chip">${escapeHtml(concept)}</span>`).join('')}</div>
      </article>
    </section>
    <section class="reader-evidence-layout section">
      <div>
        <div class="section-kicker"><span class="label">Typed claims</span></div>
        <div class="claim-list kimi-claim-list">
          ${kimiPaper.claims
            .map(
              (claim) => `
                <button class="claim-button ${claim.id === state.activeKimiClaimId ? 'active' : ''}" data-kimi-claim="${claim.id}">
                  <span class="status-chip supported">${escapeHtml(claim.kind.replaceAll('_', ' '))}</span>
                  <p>${escapeHtml(claim.text)}</p>
                </button>
              `,
            )
            .join('')}
        </div>
      </div>
      <div id="kimi-evidence-container">${renderKimiEvidenceViewer()}</div>
    </section>
  `
}

function renderKimiReportWorkspace() {
  return `
    <section class="report-artifact-intro card card-pad section">
      <div>
        <span class="label">Supplied editorial artifact</span>
        <h2>${escapeHtml(kimiPaper.report.title)}</h2>
        <p class="content-copy">This is the supplied provisional launch analysis, preserved as authored. It mixes cited facts, first-party claims, Glyph interpretations, and forward-looking hypotheses. The evidence view remains the canonical validation layer; the announced Kimi technical report is still not attached.</p>
      </div>
      <div class="report-artifact-actions">
        <span class="status-chip limited">Provisional · not independently validated</span>
        <a class="button secondary" href="${kimiPaper.report.assetPath}" target="_blank" rel="noreferrer">Open report ↗</a>
      </div>
    </section>
    <section class="report-frame-shell" aria-label="Embedded Kimi K3 launch analysis">
      <iframe
        class="report-frame"
        src="${kimiPaper.report.assetPath}"
        title="${escapeHtml(kimiPaper.report.title)}"
      ></iframe>
    </section>
  `
}

function renderKimiReaderWorkspace() {
  return state.kimiReaderView === 'report'
    ? renderKimiReportWorkspace()
    : renderKimiEvidenceWorkspace()
}

function renderKimiReader(params) {
  const requestedClaim = params.get('claim')
  if (kimiPaper.claims.some((claim) => claim.id === requestedClaim)) {
    state.activeKimiClaimId = requestedClaim
  }
  state.kimiReaderView = params.get('view') === 'report' ? 'report' : 'evidence'
  const source = kimiPaper.source
  return `
    <header class="reader-header">
      <div class="reader-source-line">
        <img src="${kimiPaper.logoPath}" alt="Kimi logo" width="40" height="40" />
        <span>Moonshot AI · ${escapeHtml(kimiPaper.artifactLabel)} · Jul 21, 2026</span>
      </div>
      <p class="eyebrow">Evidence reader</p>
      <h1>${escapeHtml(source.canonicalTitle)}</h1>
      <p>${escapeHtml(kimiPaper.editorialRationale)}</p>
      <div class="reader-header-actions">
        <a class="button secondary" href="${workedExampleRoutes.models}">Back to Models</a>
        <a class="button secondary" href="${source.canonicalUrl}" target="_blank" rel="noreferrer">Canonical source ↗</a>
      </div>
    </header>
    <nav class="reader-view-tabs section" aria-label="Reader view">
      <button data-kimi-reader-view="evidence" aria-selected="${state.kimiReaderView === 'evidence'}">Claims & evidence</button>
      <button data-kimi-reader-view="report" aria-selected="${state.kimiReaderView === 'report'}">Full launch analysis</button>
    </nav>
    <div id="kimi-reader-workspace">${renderKimiReaderWorkspace()}</div>
  `
}

function renderDiscover() {
  const candidates = demoContent.candidates
    .map(
      (candidate) => `
        <article class="candidate ${candidate.selected ? 'selected' : ''}">
          <div class="candidate-rank" aria-label="Rank ${candidate.rank}">${String(candidate.rank).padStart(2, '0')}</div>
          <div>
            <div class="tag-row"><span class="chip">${escapeHtml(candidate.signal)}</span>${candidate.selected ? '<span class="chip">Editor pick</span>' : ''}</div>
            <h2>${escapeHtml(candidate.title)}</h2>
            <p class="candidate-source">${escapeHtml(candidate.source)}</p>
            <p class="candidate-reason">${escapeHtml(candidate.reason)}</p>
            ${candidate.selected ? `<div class="button-row"><a class="button" href="${routeHref('paper')}">Open selected paper</a></div>` : ''}
          </div>
          <div class="score"><strong>${candidate.score}</strong><small>signal score</small></div>
        </article>
      `,
    )
    .join('')

  return `
    ${pageHeader({
      eyebrow: 'Daily research desk',
      title: 'Four papers. One decision.',
      description:
        'A deliberately small candidate set, ranked with reasons an editor can challenge before anything is published.',
      stat: '4',
      statLabel: 'candidates today',
    })}
    ${fixtureBanner()}
    <section class="candidate-list" aria-label="Ranked paper candidates">${candidates}</section>
  `
}

function renderPaper() {
  const paper = demoContent.paper
  return `
    ${fixtureBanner()}
    <section class="paper-hero">
      <p class="eyebrow">Selected paper · rank 01</p>
      <div class="tag-row">${paper.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}</div>
      <h1 class="hero-title">${escapeHtml(paper.title)}</h1>
      <div class="hero-meta">
        <span>${escapeHtml(paper.authors)}</span>
        <span>${escapeHtml(paper.venue)}</span>
        <span>${escapeHtml(paper.published)}</span>
      </div>
      <div class="button-row">
        <a class="button" href="${routeHref('report')}">Read the five-minute brief</a>
        <a class="button secondary" href="${routeHref('evidence', { claim: 'claim-routing' })}">Inspect evidence</a>
      </div>
    </section>

    <section class="section grid asymmetric">
      <div class="quote-card">
        <span class="label">Thesis</span>
        <p>${escapeHtml(paper.thesis)}</p>
      </div>
      <div class="card card-pad">
        <span class="label">Investor question</span>
        <p class="section-title">${escapeHtml(paper.investorQuestion)}</p>
      </div>
    </section>

    <section class="section grid two">
      <article class="card card-pad">
        <span class="label">Why it ranked</span>
        <h2 class="section-title">Mechanism over headline</h2>
        <p class="content-copy">${escapeHtml(demoContent.candidates[0].reason)}</p>
      </article>
      <article class="card card-pad">
        <span class="label">Why now</span>
        <h2 class="section-title">Inference is becoming an economic decision</h2>
        <p class="content-copy">${escapeHtml(paper.whyNow)}</p>
      </article>
    </section>
  `
}

function reportPanel(depth) {
  const report = demoContent.report[depth]
  return `
    <article class="card report-panel" id="report-panel" role="tabpanel" aria-labelledby="tab-${depth}" tabindex="-1">
      <span class="label">${escapeHtml(report.label)} layer</span>
      <p class="report-lead">${escapeHtml(report.summary)}</p>
      <div class="takeaway"><strong>Decision takeaway:</strong> ${escapeHtml(report.takeaway)}</div>
      <section class="section">
        <span class="label">Questions to carry forward</span>
        <ul class="question-list">${report.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}</ul>
      </section>
    </article>
  `
}

function renderReport() {
  return `
    ${pageHeader({
      eyebrow: 'Progressive report',
      title: 'Start with the decision. Earn the detail.',
      description:
        'Move from an executive reading to the mechanism and then the evidence without losing the original question.',
      stat: demoContent.meta.readingTime,
      statLabel: 'executive read',
    })}
    ${fixtureBanner()}
    <div class="tabs" role="tablist" aria-label="Report depth">
      ${Object.entries(demoContent.report)
        .map(
          ([id, report]) => `
            <button class="tab-button" id="tab-${id}" role="tab" aria-controls="report-panel" aria-selected="${state.reportDepth === id}" data-depth="${id}">
              ${escapeHtml(report.label)}
            </button>
          `,
        )
        .join('')}
    </div>
    <div class="section" id="report-container">${reportPanel(state.reportDepth)}</div>
    <div class="button-row">
      <a class="button" href="${routeHref('evidence', { claim: 'claim-compute' })}">Open a material claim</a>
      <a class="button secondary" href="${routeHref('concepts')}">Explain the concepts</a>
    </div>
  `
}

function evidenceSheet(claim) {
  const hasEvidence = claim.status !== 'insufficient'
  return `
    <article class="evidence-sheet" aria-live="polite">
      <div class="evidence-meta">
        <span>GLYPH · SOURCE VIEW</span>
        <span>${hasEvidence ? `PAGE ${claim.page}` : 'NO SUPPORTING PAGE'}</span>
      </div>
      <div class="paper-lines" aria-hidden="true">
        ${Array.from({ length: 6 }, () => '<span class="paper-line"></span>').join('')}
      </div>
      <blockquote class="evidence-highlight ${hasEvidence ? '' : 'evidence-empty'}">
        ${escapeHtml(claim.evidenceText)}
      </blockquote>
      <div class="paper-lines" aria-hidden="true">
        ${Array.from({ length: 7 }, () => '<span class="paper-line"></span>').join('')}
      </div>
      <div class="evidence-meta">
        <span>${hasEvidence ? `Normalized box ${claim.bbox.join(', ')}` : 'Claim blocked'}</span>
        <span>Synthetic fixture</span>
      </div>
    </article>
  `
}

function renderEvidence(params) {
  const activeClaim = findClaim(params.get('claim'))
  return `
    ${pageHeader({
      eyebrow: 'Claim-to-source trace',
      title: 'The sentence is not the proof.',
      description:
        'Select a claim to inspect its exact supporting passage—or see why Glyph refuses to overstate the source.',
      stat: `${demoContent.claims.length}/${demoContent.claims.length}`,
      statLabel: 'claims resolved',
    })}
    ${fixtureBanner()}
    <section class="grid asymmetric">
      <div>
        <div class="claim-list">
          ${demoContent.claims
            .map(
              (claim) => `
                <a class="claim-button ${claim.id === activeClaim.id ? 'active' : ''}" href="${routeHref('evidence', { claim: claim.id })}" data-claim="${claim.id}">
                  <span class="status-chip ${claim.status}">${escapeHtml(claim.label)}</span>
                  <p>${escapeHtml(claim.claim)}</p>
                </a>
              `,
            )
            .join('')}
        </div>
        <article class="card card-pad section">
          <span class="label">Editorial reasoning</span>
          <p class="content-copy">${escapeHtml(activeClaim.explanation)}</p>
        </article>
      </div>
      <div id="evidence-sheet-container">${evidenceSheet(activeClaim)}</div>
    </section>
  `
}

function renderConcepts() {
  return `
    ${pageHeader({
      eyebrow: 'Concept layer',
      title: 'Explain the mechanism without flattening it.',
      description:
        'Plain language first, technical detail on demand, and an analogy that helps without pretending to be the mechanism.',
      stat: String(demoContent.concepts.length),
      statLabel: 'concepts in this paper',
    })}
    ${fixtureBanner()}
    <section class="grid three">
      ${demoContent.concepts
        .map(
          (concept, index) => `
            <article class="card concept-card">
              <button aria-expanded="${index === 0}" aria-controls="concept-${concept.id}" data-concept="${concept.id}">
                <span class="label">Concept ${String(index + 1).padStart(2, '0')}</span>
                <h2>${escapeHtml(concept.name)}</h2>
                <p class="plain">${escapeHtml(concept.plain)}</p>
              </button>
              <div class="concept-detail" id="concept-${concept.id}" ${index === 0 ? '' : 'hidden'}>
                <p class="content-copy">${escapeHtml(concept.detail)}</p>
                <p class="analogy"><strong>Analogy:</strong> ${escapeHtml(concept.analogy)}</p>
              </div>
            </article>
          `,
        )
        .join('')}
    </section>
  `
}

function renderMarket() {
  const market = demoContent.market
  return `
    ${pageHeader({
      eyebrow: 'Market context',
      title: market.headline,
      description:
        'Glyph separates the mechanism the paper represents from the economic steps that still require outside evidence.',
      stat: '2/4',
      statLabel: 'causal links supported',
    })}
    ${fixtureBanner()}
    <section class="card card-pad">
      <span class="label">Causal chain</span>
      <ol class="causal-chain">${market.chain.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <p class="blocked-note section"><strong>Boundary:</strong> ${escapeHtml(market.caveat)}</p>
    </section>
    <section class="section grid asymmetric">
      <article class="card card-pad metric-card">
        <span class="label">${escapeHtml(market.metric.name)}</span>
        <strong class="metric-value">${escapeHtml(market.metric.value)}</strong>
        <p class="content-copy">${escapeHtml(market.metric.context)} · ${escapeHtml(market.metric.asOf)}</p>
      </article>
      <article class="card card-pad">
        <span class="label">Who might capture value?</span>
        <div class="company-list">
          ${market.companies.map((company) => `<div class="company-row"><strong>${escapeHtml(company.name)}</strong><span>${escapeHtml(company.note)}</span></div>`).join('')}
        </div>
      </article>
    </section>
  `
}

function currentReviewItems() {
  return demoContent.review.map((item) => ({
    ...item,
    ready: state.reviewReady.has(item.id),
  }))
}

function reviewContent() {
  const items = currentReviewItems()
  const summary = readinessSummary(items)
  return `
    <section class="grid asymmetric">
      <article class="card card-pad">
        <span class="label">Publication blockers</span>
        <div class="review-list">
          ${items
            .map(
              (item) => `
                <div class="review-row">
                  <span>${escapeHtml(item.label)}</span>
                  <button class="check-button ${item.ready ? 'checked' : ''}" data-review="${item.id}" aria-pressed="${item.ready}">
                    <span class="sr-only">${item.ready ? 'Mark incomplete' : 'Mark complete'}: ${escapeHtml(item.label)}</span>
                  </button>
                </div>
              `,
            )
            .join('')}
        </div>
      </article>
      <div>
        <div class="readiness-meter">
          <div><strong>${summary.complete}/${summary.total}</strong><span>${summary.publishable ? 'Ready to publish' : 'Publication blocked'}</span></div>
        </div>
        <p class="blocked-note">The demo intentionally starts blocked. The canonical source, real market evidence, and a human technical review cannot pass until the gold paper is attached.</p>
      </div>
    </section>
  `
}

function renderReview() {
  return `
    ${pageHeader({
      eyebrow: 'Editorial gate',
      title: 'Unsupported work does not publish.',
      description:
        'A compact readiness view makes missing evidence visible before a report reaches readers.',
      stat: 'BLOCKED',
      statLabel: 'until every gate passes',
    })}
    ${fixtureBanner()}
    <div id="review-container">${reviewContent()}</div>
  `
}

function renderFeedback() {
  const options = [
    {
      id: 'useful',
      name: 'Useful',
      note: 'This changed or clarified my decision.',
    },
    {
      id: 'too-basic',
      name: 'Too basic',
      note: 'I needed more mechanism or evidence.',
    },
    {
      id: 'too-technical',
      name: 'Too technical',
      note: 'The explanation assumed too much context.',
    },
    {
      id: 'weak-evidence',
      name: 'Weak evidence',
      note: 'The source did not justify the conclusion.',
    },
    {
      id: 'not-relevant',
      name: 'Not relevant',
      note: 'This did not match my current interests.',
    },
    {
      id: 'save',
      name: 'Save for later',
      note: 'Important, but not actionable today.',
    },
  ]

  return `
    ${pageHeader({
      eyebrow: 'Reader signal',
      title: 'Tell us what was useful—not just what you clicked.',
      description:
        'Explicit reasons create a better learning signal than passive engagement while preserving the global editorial baseline.',
      stat: '1 tap',
      statLabel: 'to record a reason',
    })}
    ${fixtureBanner()}
    <section class="card card-pad">
      <span class="label">Did this report help your decision?</span>
      <div class="feedback-grid">
        ${options
          .map(
            (option) => `
              <button class="feedback-button ${state.selectedFeedback === option.id ? 'selected' : ''}" data-feedback="${option.id}" aria-pressed="${state.selectedFeedback === option.id}">
                <strong>${escapeHtml(option.name)}</strong>
                <span>${escapeHtml(option.note)}</span>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>
    <section class="section grid two">
      <article class="card card-pad">
        <span class="label">What this changes</span>
        <h2 class="section-title">Explainable preference, not an opaque score</h2>
        <p class="content-copy">A future recommendation can say it appears because you asked for deeper mechanisms—not because an invisible profile guessed who you are.</p>
      </article>
      <article class="card card-pad">
        <span class="label">What this cannot change</span>
        <h2 class="section-title">The evidence standard stays global</h2>
        <p class="content-copy">Personalization may alter order and depth. It cannot make an unsupported claim publishable.</p>
      </article>
    </section>
  `
}

const renderers = {
  landing: () => renderLanding(),
  login: () => renderLogin(),
  models: () => renderModels(),
  'kimi-reader': (params) => renderKimiReader(params),
  discover: () => renderDiscover(),
  paper: () => renderPaper(),
  report: () => renderReport(),
  evidence: (params) => renderEvidence(params),
  concepts: () => renderConcepts(),
  market: () => renderMarket(),
  review: () => renderReview(),
  feedback: () => renderFeedback(),
}

function showToast(message) {
  toastRegion.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`
  window.setTimeout(() => {
    toastRegion.innerHTML = ''
  }, 2600)
}

function bindLandingInteractions() {
  const tabs = [...document.querySelectorAll('[data-digest-tab]')]
  const indicator = document.querySelector('.tab-indicator')
  const tabContent = document.querySelector('[data-digest-content]')
  const tabCopy = {
    brief:
      '<p class="tab-summary"><strong>Brief:</strong> the mechanism, evidence boundary and conditional investment signal in one scan.</p>',
    technical:
      '<p class="tab-summary"><strong>Mechanism:</strong> sparse Top-K routing activates a small expert set while MuonClip constrains attention-logit growth.</p>',
    economic:
      '<p class="tab-summary"><strong>Relevance:</strong> lower active compute may improve inference economics—conditional on measured utilisation and serving costs.</p>',
  }

  function selectTab(nextTab) {
    const index = tabs.indexOf(nextTab)
    tabs.forEach((tab) =>
      tab.setAttribute('aria-selected', String(tab === nextTab)),
    )
    indicator.style.transform = `translateX(${index * 100}%)`
    tabContent.classList.add('is-changing')
    window.setTimeout(() => {
      tabContent.innerHTML = tabCopy[nextTab.dataset.digestTab]
      tabContent.classList.remove('is-changing')
    }, motionTokens.fast / 2)
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab))
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
        return
      event.preventDefault()
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
              tabs.length
      tabs[nextIndex].focus()
      selectTab(tabs[nextIndex])
    })
  })

  document.querySelectorAll('[data-accordion-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.closest('[data-accordion]')
      const panel = section.querySelector('.accordion-grid')
      const open = section.classList.toggle('is-open')
      button.setAttribute('aria-expanded', String(open))
      if (open) panel.removeAttribute('inert')
      else panel.setAttribute('inert', '')
    })
  })

  const claim = document.querySelector('[data-glyph-claim]')
  const anchor = document.querySelector('.claim-action-anchor')
  const trigger = document.querySelector('[data-glyph-trigger]')
  const menu = document.querySelector('[data-glyph-menu]')
  function setGlyphMenu(open) {
    anchor?.classList.toggle('is-visible', open)
    menu?.classList.toggle('is-open', open)
    claim?.setAttribute('aria-expanded', String(open))
    trigger?.setAttribute('aria-expanded', String(open))
    if (open)
      window.setTimeout(() => menu?.querySelector('button')?.focus(), 180)
  }
  claim?.addEventListener('click', () => {
    anchor.classList.add('is-visible')
    claim.classList.add('is-active')
    window.setTimeout(() => setGlyphMenu(true), 140)
  })
  trigger?.addEventListener('click', (event) => {
    event.stopPropagation()
    setGlyphMenu(!menu.classList.contains('is-open'))
  })
  menu?.querySelectorAll('button').forEach((item) => {
    item.addEventListener('click', () => {
      showToast(`${item.textContent.trim()} added to your research question.`)
      setGlyphMenu(false)
    })
  })
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.claim-row')) setGlyphMenu(false)
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setGlyphMenu(false)
      trigger?.focus()
    }
  })

  document
    .querySelector('[data-landing-bookmark]')
    ?.addEventListener('click', (event) => {
      const pressed =
        event.currentTarget.getAttribute('aria-pressed') !== 'true'
      event.currentTarget.setAttribute('aria-pressed', String(pressed))
      showToast(
        pressed ? 'Digest saved to your reading list.' : 'Digest removed.',
      )
    })
  document
    .querySelector('[data-landing-share]')
    ?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        showToast('Landing page link copied.')
      } catch {
        showToast('Share link ready: glyph.ai')
      }
    })

  const architecture = document.querySelector('[data-architecture]')
  if ('IntersectionObserver' in window && architecture) {
    const observer = new IntersectionObserver(([entry]) => {
      architecture.classList.toggle('is-paused', !entry.isIntersecting)
    })
    observer.observe(architecture)
  }
  document.addEventListener('visibilitychange', () => {
    architecture?.classList.toggle('is-paused', document.hidden)
  })
}

function bindInteractions(route) {
  if (route === 'landing') bindLandingInteractions()

  if (route === 'login') {
    document
      .querySelector('[data-login-form]')
      ?.addEventListener('submit', (event) => {
        event.preventDefault()
        const email = new FormData(event.currentTarget).get('email')
        if (email)
          window.sessionStorage.setItem('glyph-demo-user', String(email))
        window.location.assign(workedExampleRoutes.product)
      })
  }

  if (route === 'models') {
    document
      .querySelector('.model-card')
      ?.addEventListener('click', (event) => {
        if (event.target.closest('a, button')) return
        window.location.assign(workedExampleRoutes.reader)
      })
    document
      .querySelector('[data-kimi-bookmark]')
      ?.addEventListener('click', (event) => {
        state.kimiBookmarked = !state.kimiBookmarked
        event.currentTarget.setAttribute(
          'aria-pressed',
          String(state.kimiBookmarked),
        )
        event.currentTarget.textContent = state.kimiBookmarked ? '★' : '☆'
        showToast(
          state.kimiBookmarked ? 'Kimi K3 bookmarked.' : 'Bookmark removed.',
        )
      })
    document.querySelectorAll('[data-kimi-concept]').forEach((button) => {
      button.addEventListener('click', () =>
        showToast(`Concept selected: ${button.dataset.kimiConcept}`),
      )
    })
  }

  if (route === 'kimi-reader') {
    document.querySelectorAll('[data-kimi-reader-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.kimiReaderView
        const query =
          view === 'report'
            ? '?view=report'
            : `?claim=${encodeURIComponent(state.activeKimiClaimId)}`
        window.history.replaceState(
          null,
          '',
          `${workedExampleRoutes.reader}${query}`,
        )
        renderApp({ moveFocus: true })
      })
    })
    document.querySelectorAll('[data-kimi-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeKimiClaimId = button.dataset.kimiClaim
        document
          .querySelectorAll('[data-kimi-claim]')
          .forEach((claimButton) =>
            claimButton.classList.toggle('active', claimButton === button),
          )
        document.querySelector('#kimi-evidence-container').innerHTML =
          renderKimiEvidenceViewer()
        window.history.replaceState(
          null,
          '',
          `${workedExampleRoutes.reader}?claim=${state.activeKimiClaimId}`,
        )
      })
    })
  }

  if (route === 'report') {
    document.querySelectorAll('[data-depth]').forEach((button) => {
      button.addEventListener('click', () => {
        state.reportDepth = button.dataset.depth
        document
          .querySelectorAll('[data-depth]')
          .forEach((tab) =>
            tab.setAttribute('aria-selected', String(tab === button)),
          )
        document.querySelector('#report-container').innerHTML = reportPanel(
          state.reportDepth,
        )
        document.querySelector('#report-panel').focus({ preventScroll: true })
      })
    })
  }

  if (route === 'concepts') {
    document.querySelectorAll('[data-concept]').forEach((button) => {
      button.addEventListener('click', () => {
        const detail = document.querySelector(
          `#concept-${button.dataset.concept}`,
        )
        const expanded = button.getAttribute('aria-expanded') === 'true'
        button.setAttribute('aria-expanded', String(!expanded))
        detail.hidden = expanded
      })
    })
  }

  if (route === 'review') {
    document.querySelectorAll('[data-review]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.review
        if (state.reviewReady.has(id)) state.reviewReady.delete(id)
        else state.reviewReady.add(id)
        document.querySelector('#review-container').innerHTML = reviewContent()
        bindInteractions('review')
      })
    })
  }

  if (route === 'feedback') {
    document.querySelectorAll('[data-feedback]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedFeedback = button.dataset.feedback
        document.querySelectorAll('[data-feedback]').forEach((option) => {
          const selected = option === button
          option.classList.toggle('selected', selected)
          option.setAttribute('aria-pressed', String(selected))
        })
        showToast('Feedback reason recorded on this device.')
      })
    })
  }
}

function renderApp({ moveFocus = false } = {}) {
  const { route, params } = parseAppLocation(
    window.location.pathname,
    window.location.hash,
    window.location.search,
  )
  const isEntrySurface = route === 'landing' || route === 'login'
  document.body.dataset.surface = isEntrySurface ? route : 'product'
  document.documentElement.style.setProperty(
    '--motion-fast',
    `${motionTokens.fast}ms`,
  )
  document.documentElement.style.setProperty(
    '--motion-accordion',
    `${motionTokens.accordion}ms`,
  )
  document.documentElement.style.setProperty('--motion-ease', motionTokens.ease)
  renderNav(route)
  const workedExample = route === 'models' || route === 'kimi-reader'
  fixturePill.textContent = workedExample
    ? 'Kimi K3 worked example'
    : 'Synthetic fixture'
  sidebarFooter.innerHTML = workedExample
    ? '<span class="status-dot verified" aria-hidden="true"></span><span>First-party source<br /><small>Technical report pending</small></span>'
    : '<span class="status-dot" aria-hidden="true"></span><span>Demo structure ready<br /><small>Gold paper pending</small></span>'
  const routeLabel =
    route === 'landing'
      ? 'Frontier AI research for investors'
      : route === 'login'
        ? 'Sign in'
        : route === 'models'
          ? 'Models'
          : route === 'kimi-reader'
            ? 'Kimi K3 Reader'
            : routes.find((item) => item.id === route).label
  document.title = `${routeLabel} · Glyph`
  main.innerHTML = renderers[route](params)
  bindInteractions(route)
  sidebar.classList.remove('open')
  menuToggle.setAttribute('aria-expanded', 'false')
  if (moveFocus) main.focus({ preventScroll: true })
  window.scrollTo({ top: 0, behavior: 'auto' })
}

menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open')
  menuToggle.setAttribute('aria-expanded', String(isOpen))
})

nav.addEventListener('click', () => {
  sidebar.classList.remove('open')
  menuToggle.setAttribute('aria-expanded', 'false')
})

window.addEventListener('hashchange', () => renderApp({ moveFocus: true }))

renderApp()
