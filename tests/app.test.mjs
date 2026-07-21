import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  demoContent,
  findClaim,
  readinessSummary,
} from '../src/demo-content.mjs'
import kimiEvidence from '../fixtures/evidence/kimi-k3.json' with { type: 'json' }
import { createAbstractPreview } from '../packages/ingestion/src/abstract-preview.mjs'
import {
  calculateEditorialScore,
  calculateFinalScore,
} from '../packages/recommendation/src/scoring.mjs'
import { resolveClaimEvidence } from '../src/kimi-reader.mjs'
import { kimiPaper, modelsCatalog } from '../src/models-catalog.mjs'
import {
  defaultRoute,
  parseAppLocation,
  parseRoute,
  routeHref,
  routes,
} from '../src/routes.mjs'

test('the prototype exposes all eight PRD-facing views', () => {
  assert.equal(routes.length, 8)
  assert.deepEqual(
    routes.map((route) => route.id),
    [
      'discover',
      'paper',
      'report',
      'evidence',
      'concepts',
      'market',
      'review',
      'feedback',
    ],
  )
})

test('route parsing defaults safely and retains evidence query parameters', () => {
  assert.equal(parseRoute('').route, defaultRoute)
  assert.equal(parseRoute('#/not-a-route').route, defaultRoute)

  const parsed = parseRoute('#/evidence?claim=claim-compute')
  assert.equal(parsed.route, 'evidence')
  assert.equal(parsed.params.get('claim'), 'claim-compute')
  assert.equal(
    routeHref('evidence', { claim: 'claim-compute' }),
    '#/evidence?claim=claim-compute',
  )
})

test('worked-example paths resolve without changing the eight-view navigation', () => {
  assert.equal(parseAppLocation('/').route, 'landing')
  assert.equal(parseAppLocation('/login').route, 'login')
  assert.equal(parseAppLocation('/', '#/discover').route, 'discover')
  assert.equal(parseAppLocation('/layers/models').route, 'models')
  const reader = parseAppLocation(
    '/reader/kimi-k3-open-frontier-intelligence',
    '',
    '?claim=claim-stable-latent-moe',
  )
  assert.equal(reader.route, 'kimi-reader')
  assert.equal(reader.params.get('claim'), 'claim-stable-latent-moe')
})

test('the first-entry experience preserves the required Glyph narrative and handoff', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  assert.match(app, /Those who understand/)
  assert.match(app, /Glyph closes the gap/)
  assert.match(app, /Kimi K3: Efficiency at 2\.8T Parameters/)
  assert.match(app, /From frontier signals to decision clarity\./)
  assert.match(app, /Research[\s\S]+Context[\s\S]+Judgment/)
  assert.match(app, /Clarity[\s\S]+Confidence[\s\S]+Control/)
  assert.match(
    app,
    /class="enter-glyph[^>]+href="\$\{workedExampleRoutes\.login\}"/,
  )
  assert.match(app, /href="\$\{workedExampleRoutes\.product\}"/)
  assert.match(app, /window\.location\.assign\(workedExampleRoutes\.product\)/)
  assert.doesNotMatch(
    app,
    /class="enter-glyph[^>]+href="\/layers\/models"/,
  )
  assert.match(app, /prefers-reduced-motion|data-architecture/)
})

test('Kimi K3 is the first Models category record with canonical classification', () => {
  assert.equal(modelsCatalog[0].source.id, 'kimi-k3-open-frontier-intelligence')
  assert.equal(
    kimiPaper.source.canonicalUrl,
    'https://www.kimi.com/blog/kimi-k3',
  )
  assert.equal(kimiPaper.source.sourceType, 'FIRST_PARTY_TECHNICAL_LAUNCH_BLOG')
  assert.notEqual(kimiPaper.source.sourceType, 'TECHNICAL_REPORT')
  assert.equal(kimiPaper.source.primaryLayer, 'MODELS')
  assert.deepEqual(kimiPaper.source.secondaryLayers, [
    'CHIPS_COMPUTE',
    'CLOUD_INFRASTRUCTURE',
    'APPLICATIONS',
  ])
  assert.equal(kimiPaper.document.origin, 'ATTACHED_SOURCE_PRINTOUT')
  assert.equal(kimiPaper.document.attachedPrintoutAvailable, true)
  assert.equal(kimiPaper.document.pageCount, 21)
})

test('the attached PDF and supplied editorial report are preserved as real artifacts', async () => {
  const pdf = await readFile(
    new URL('../assets/kimi-k3/kimi-k3-canonical-print.pdf', import.meta.url),
  )
  assert.equal(
    createHash('sha256').update(pdf).digest('hex'),
    kimiPaper.document.sha256,
  )

  const report = await readFile(
    new URL('../assets/kimi-k3/kimi-k3-launch-analysis.html', import.meta.url),
    'utf8',
  )
  assert.match(report, /Glyph №1: Kimi K3 launch analysis/)
  assert.match(report, /Kimi K3 provisional launch analysis/)
  assert.equal(kimiPaper.report.status, 'PROVISIONAL_EDITORIAL_ANALYSIS')
  assert.equal(kimiPaper.report.independentlyValidated, false)
  assert.equal(kimiPaper.source.technicalReportAvailable, false)
})

test('Kimi scores and preview are calculated through shared services', () => {
  const preview = createAbstractPreview(kimiPaper.introduction)
  assert.equal(
    preview,
    'Today, we are introducing Kimi K3 — our most capable model. Kimi K3 is a 2.8T-parameter model built on our...',
  )
  assert.equal(preview.replace(/\.\.\.$/, '').split(/\s+/).length, 20)

  const editorial = calculateEditorialScore(kimiPaper.editorialLabels)
  const final = calculateFinalScore({
    editorialScore: editorial.normalizedScore,
    ...kimiPaper.rankingInputs,
  })
  assert.ok(Math.abs(editorial.score - 93.4) < 0.05)
  assert.ok(Math.abs(final.score - 87.6) < 0.05)
})

test('the Stable LatentMoE claim resolves to exact PDF evidence', () => {
  const resolved = resolveClaimEvidence(
    kimiPaper,
    kimiEvidence,
    'claim-stable-latent-moe',
  )
  assert.equal(resolved.evidence[0].pageNumber, 4)
  assert.equal(resolved.evidence[0].sectionTitle, 'An Open 3T-Class Model')
  assert.match(resolved.evidence[0].text, /16 out of 896 experts/)
  assert.ok(resolved.evidence[0].boundingBoxes.length > 0)
})

test('later evidence uses the attached 21-page printout pagination', () => {
  const quantization = resolveClaimEvidence(
    kimiPaper,
    kimiEvidence,
    'claim-quantization',
  )
  const limitations = resolveClaimEvidence(
    kimiPaper,
    kimiEvidence,
    'claim-limitations',
  )
  assert.equal(quantization.evidence[0].pageNumber, 16)
  assert.equal(limitations.evidence[0].pageNumber, 20)
  assert.equal(kimiEvidence.sourceAssetOrigin, 'ATTACHED_SOURCE_PRINTOUT')
})

test('the Models card uses the canonical external link and hides processing states', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  const modelsRenderer = app.slice(
    app.indexOf('function renderModels()'),
    app.indexOf('function activeKimiEvidence()'),
  )
  assert.match(modelsRenderer, /source\.canonicalUrl/)
  assert.match(modelsRenderer, /target="_blank"/)
  assert.doesNotMatch(
    modelsRenderer,
    /agent|processing|running|queued|parsing/i,
  )
  assert.match(modelsRenderer, /model-card selected/)
  assert.match(modelsRenderer, /details-panel/)
})

test('every supported or limited claim has inspectable evidence coordinates', () => {
  const inspectable = demoContent.claims.filter(
    (claim) => claim.status !== 'insufficient',
  )
  assert.ok(inspectable.length > 0)

  for (const claim of inspectable) {
    assert.ok(claim.evidenceText.length > 30, `${claim.id} needs evidence text`)
    assert.ok(
      Number.isInteger(claim.page) && claim.page > 0,
      `${claim.id} needs a page`,
    )
    assert.equal(claim.bbox.length, 4, `${claim.id} needs a normalized box`)
    assert.ok(
      claim.bbox.every((value) => value >= 0 && value <= 1),
      `${claim.id} box must be normalized`,
    )
  }
})

test('insufficient claims cannot masquerade as cited claims', () => {
  const insufficient = demoContent.claims.filter(
    (claim) => claim.status === 'insufficient',
  )
  assert.ok(insufficient.length > 0)

  for (const claim of insufficient) {
    assert.equal(claim.page, null)
    assert.equal(claim.bbox, null)
    assert.match(claim.explanation, /does not|not establish|insufficient/i)
  }
})

test('unknown claim links resolve to a known inspectable claim', () => {
  assert.equal(findClaim('missing').id, demoContent.claims[0].id)
})

test('editorial readiness remains blocked while the paper handoff is missing', () => {
  const summary = readinessSummary()
  assert.equal(summary.publishable, false)
  assert.ok(summary.complete < summary.total)
})

test('fixture identity is explicit in both data and the application shell', async () => {
  assert.equal(demoContent.meta.fixture, true)
  assert.match(demoContent.meta.fixtureLabel, /synthetic fixture/i)

  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(html, /Synthetic fixture/)
  assert.match(html, /id="main-content"/)
  assert.match(html, /id="primary-nav"/)
})

test('the client renderer includes a handler for every declared route', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  for (const route of routes) {
    assert.match(
      app,
      new RegExp(`${route.id}:`),
      `missing renderer for ${route.id}`,
    )
  }
})
