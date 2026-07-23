import { createHash, randomUUID } from 'node:crypto'
import {
  parse,
  serialize,
  serializeOuter,
  type DefaultTreeAdapterMap,
} from 'parse5'
import {
  ReportPackageSchema,
  schemaVersion,
  type EvidenceSpan,
  type PaperVersion,
  type ReportImportDiagnostic,
  type ReportPackage,
  type ReportTabId,
} from '@glyph/domain'

type Node = DefaultTreeAdapterMap['node']
type ParentNode = DefaultTreeAdapterMap['parentNode']
type Element = DefaultTreeAdapterMap['element']

const tabLabels: Record<ReportTabId, string> = {
  summary: '3–5 minute brief',
  mechanism: 'Technical mechanisms',
  economics: 'Economic relevance',
}

const forbiddenElements = new Set([
  'applet',
  'audio',
  'base',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'object',
  'script',
  'source',
  'textarea',
  'video',
])

const forbiddenSvgElements = new Set([
  'animate',
  'animatemotion',
  'animatetransform',
  'discard',
  'foreignobject',
  'handler',
  'script',
  'set',
])

const unsafeCssPattern =
  /@import|@charset|url\s*\(|expression\s*\(|javascript\s*:|(?:^|[;{])\s*(?:behavior|-moz-binding)\s*:|\\00/iu

const safeIdPattern = /^[A-Za-z][A-Za-z0-9_.:-]*$/

export type ImportClaudeHtmlInput = {
  html: string
  originalFileName: string
  paperVersion: PaperVersion
  evidenceSpans: readonly EvidenceSpan[]
  now?: Date
  strictMarkers?: boolean
  metadata?: Partial<ReportPackage['metadata']> & { slug?: string }
}

export type ImportedClaudeReport = {
  reportPackage: ReportPackage
  htmlSha256: string
  extractedAssetSummary: {
    inlineSvgCount: number
    tableCount: number
    unresolvedExternalAssetCount: number
  }
}

export function importClaudeHtml(
  input: ImportClaudeHtmlInput,
): ImportedClaudeReport {
  const strictMarkers = input.strictMarkers ?? true
  const diagnostics: ReportImportDiagnostic[] = []
  const document = parse(input.html)
  const unresolvedExternalAssets = new Set<string>()

  sanitizeTree(
    document,
    diagnostics,
    unresolvedExternalAssets,
    new Set<string>(),
  )

  const title =
    input.metadata?.title ??
    textContent(findFirst(document, (element) => element.tagName === 'h1')) ??
    textContent(
      findFirst(document, (element) => element.tagName === 'title'),
    ) ??
    'Untitled Glyph report'
  const slug = normalizeSlug(input.metadata?.slug ?? title)
  const now = (input.now ?? new Date()).toISOString()
  const markedTabIds = findAll(
    document,
    (element) => getAttribute(element, 'data-glyph-tab') !== null,
  )
    .map((element) => normalizeTabId(getAttribute(element, 'data-glyph-tab')))
    .filter((tabId): tabId is ReportTabId => tabId !== null)
  for (const duplicateTabId of duplicateValues(markedTabIds)) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'DUPLICATE_TAB_ID',
        `Duplicate report tab ${duplicateTabId}.`,
        duplicateTabId,
      ),
    )
  }
  const tabs = findTabRoots(document)
  const isMarked = tabs.every((tab) => tab.marked)

  if (!isMarked && strictMarkers) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'LEGACY_HTML_REQUIRES_MARKERS',
        'Legacy tab structure was recovered, but approval requires data-glyph-tab markers.',
      ),
    )
  }
  for (const tabId of ['summary', 'mechanism', 'economics'] as const) {
    if (!tabs.some((tab) => tab.id === tabId)) {
      diagnostics.push(
        diagnostic(
          'BLOCKER',
          'MISSING_REQUIRED_TAB',
          `The report is missing the ${tabId} tab.`,
          tabId,
        ),
      )
    }
  }

  const evidenceById = new Map(
    input.evidenceSpans.map((evidence) => [evidence.id, evidence]),
  )
  const packageSections: ReportPackage['sections'] = []
  const packageClaims: ReportPackage['claims'] = []
  const packageConcepts: ReportPackage['concepts'] = []
  const packageVisuals: ReportPackage['visuals'] = []
  const packageSources: ReportPackage['sources'] = []
  const usedEvidenceIds = new Set<string>()

  for (const tab of tabs) {
    const markedSections = findAll(
      tab.element,
      (element) => getAttribute(element, 'data-glyph-section') !== null,
    )
    const sections = markedSections.length > 0 ? markedSections : [tab.element]
    if (strictMarkers && markedSections.length === 0) {
      diagnostics.push(
        diagnostic(
          'BLOCKER',
          'MISSING_SECTION_MARKERS',
          `The ${tab.id} tab needs stable data-glyph-section markers.`,
          tab.id,
        ),
      )
    }

    sections.forEach((section, sectionIndex) => {
      const sectionId = stableRecordId(
        getAttribute(section, 'data-glyph-section') ??
          getAttribute(section, 'id') ??
          `${tab.id}-section-${sectionIndex + 1}`,
      )
      if (packageSections.some((record) => record.id === sectionId)) {
        diagnostics.push(
          diagnostic(
            'BLOCKER',
            'DUPLICATE_SECTION_ID',
            `Duplicate report section ID ${sectionId}.`,
            sectionId,
          ),
        )
        return
      }
      const heading =
        getAttribute(section, 'data-glyph-heading') ??
        textContent(
          findFirst(
            section,
            (element) =>
              element !== section &&
              ['h1', 'h2', 'h3'].includes(element.tagName),
          ),
        ) ??
        tabLabels[tab.id]

      const claimIds: string[] = []
      for (const [claimIndex, claimElement] of findAll(
        section,
        (element) => getAttribute(element, 'data-glyph-claim') !== null,
      )
        .filter((element) => belongsToSection(element, section))
        .entries()) {
        const claimId = stableRecordId(
          getAttribute(claimElement, 'data-glyph-claim') ??
            `${sectionId}-claim-${claimIndex + 1}`,
        )
        if (packageClaims.some((record) => record.id === claimId)) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'DUPLICATE_CLAIM_ID',
              `Duplicate report claim ID ${claimId}.`,
              claimId,
            ),
          )
          continue
        }
        const classification = parseClassification(
          getAttribute(claimElement, 'data-glyph-claim-classification'),
          diagnostics,
          claimId,
        )
        const requestedEvidenceIds = parseIdList(
          getAttribute(claimElement, 'data-glyph-evidence-ids'),
        )
        const material =
          getAttribute(claimElement, 'data-glyph-material') !== 'false'
        validateEvidenceReferences({
          evidenceIds: requestedEvidenceIds,
          evidenceById,
          paperVersion: input.paperVersion,
          diagnostics,
          recordId: claimId,
        })
        const evidenceIds = requestedEvidenceIds.filter((id) =>
          evidenceById.has(id),
        )
        evidenceIds.forEach((id) => usedEvidenceIds.add(id))
        if (
          material &&
          classification !== 'INSUFFICIENT_EVIDENCE' &&
          evidenceIds.length === 0
        ) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'MATERIAL_CLAIM_WITHOUT_EVIDENCE',
              `Material claim ${claimId} has no evidence reference.`,
              claimId,
            ),
          )
        }
        packageClaims.push({
          id: claimId,
          sectionId,
          text: textContent(claimElement) ?? 'Untitled claim',
          classification,
          material,
          evidenceIds,
        })
        claimIds.push(claimId)
      }

      const conceptIds: string[] = []
      const conceptElements = findAll(section, (element) =>
        strictMarkers
          ? getAttribute(element, 'data-glyph-concept') !== null
          : getAttribute(element, 'data-glyph-concept') !== null ||
            hasClass(element, 'gcard'),
      ).filter((element) => belongsToSection(element, section))
      for (const [conceptIndex, conceptElement] of conceptElements.entries()) {
        const conceptId = stableRecordId(
          getAttribute(conceptElement, 'data-glyph-concept') ??
            `${sectionId}-concept-${conceptIndex + 1}`,
        )
        if (packageConcepts.some((record) => record.id === conceptId)) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'DUPLICATE_CONCEPT_ID',
              `Duplicate report concept ID ${conceptId}.`,
              conceptId,
            ),
          )
          continue
        }
        const name =
          getAttribute(conceptElement, 'data-glyph-concept-name') ??
          textContent(
            findFirst(
              conceptElement,
              (element) =>
                element !== conceptElement &&
                (hasClass(element, 'term') ||
                  ['h3', 'summary'].includes(element.tagName)),
            ),
          ) ??
          `Concept ${conceptIndex + 1}`
        packageConcepts.push({
          id: conceptId,
          sectionId,
          name,
          definition: textContent(conceptElement) ?? name,
        })
        conceptIds.push(conceptId)
      }

      const visualIds: string[] = []
      const visualElements = findAll(
        section,
        (element) =>
          element.tagName === 'figure' || element.tagName === 'table',
      ).filter(
        (element) =>
          belongsToSection(element, section) &&
          (element.tagName !== 'table' ||
            nearestAncestor(element, 'figure') === null),
      )
      visualElements.forEach((visualElement, visualIndex) => {
        const explicitId =
          getAttribute(visualElement, 'data-glyph-visual') ??
          getAttribute(visualElement, 'id')
        const visualId = stableRecordId(
          explicitId ?? `${sectionId}-visual-${visualIndex + 1}`,
        )
        if (packageVisuals.some((record) => record.id === visualId)) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'DUPLICATE_VISUAL_ID',
              `Duplicate report visual ID ${visualId}.`,
              visualId,
            ),
          )
          return
        }
        if (strictMarkers && explicitId === null) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'MISSING_VISUAL_ID',
              `A visual in ${sectionId} needs data-glyph-visual.`,
              visualId,
            ),
          )
        }
        const requestedEvidenceIds = parseIdList(
          getAttribute(visualElement, 'data-glyph-evidence-ids'),
        )
        validateEvidenceReferences({
          evidenceIds: requestedEvidenceIds,
          evidenceById,
          paperVersion: input.paperVersion,
          diagnostics,
          recordId: visualId,
        })
        const evidenceIds = requestedEvidenceIds.filter((id) =>
          evidenceById.has(id),
        )
        evidenceIds.forEach((id) => usedEvidenceIds.add(id))
        const figureCaption =
          visualElement.tagName === 'figure'
            ? textContent(
                findFirst(
                  visualElement,
                  (element) => element.tagName === 'figcaption',
                ),
              )
            : null
        packageVisuals.push({
          id: visualId,
          sectionId,
          kind:
            findFirst(visualElement, (element) => element.tagName === 'svg') !==
            null
              ? 'INLINE_SVG'
              : 'TABLE',
          html: serializeOuter(visualElement),
          caption: figureCaption,
          evidenceIds,
        })
        visualIds.push(visualId)
      })

      const evidenceIds = unique([
        ...packageClaims
          .filter((claim) => claim.sectionId === sectionId)
          .flatMap((claim) => claim.evidenceIds),
        ...packageVisuals
          .filter((visual) => visual.sectionId === sectionId)
          .flatMap((visual) => visual.evidenceIds),
      ])
      packageSections.push({
        id: sectionId,
        tabId: tab.id,
        heading,
        html: serialize(section),
        claimIds,
        conceptIds,
        visualIds,
        evidenceIds,
      })
    })
  }

  for (const sourceElement of findAll(
    document,
    (element) => getAttribute(element, 'data-glyph-source') !== null,
  )) {
    const id = stableRecordId(
      getAttribute(sourceElement, 'data-glyph-source') ?? randomUUID(),
    )
    if (packageSources.some((record) => record.id === id)) {
      diagnostics.push(
        diagnostic(
          'BLOCKER',
          'DUPLICATE_SOURCE_ID',
          `Duplicate report source ID ${id}.`,
          id,
        ),
      )
      continue
    }
    packageSources.push({
      id,
      label: textContent(sourceElement) ?? id,
      url: normalizeLink(getAttribute(sourceElement, 'href')),
    })
  }

  if (strictMarkers && packageClaims.length === 0) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'MISSING_CLAIM_MARKERS',
        'At least one classified data-glyph-claim is required.',
      ),
    )
  }
  if (strictMarkers && packageSources.length === 0) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'MISSING_SOURCE_MARKERS',
        'At least one stable data-glyph-source reference is required.',
      ),
    )
  }

  const themeCss = extractThemeCss(document, diagnostics)
  const evidenceReferences = [...usedEvidenceIds]
    .map((id) => evidenceById.get(id))
    .filter((evidence): evidence is EvidenceSpan => evidence !== undefined)
    .map((evidence) => ({
      id: evidence.id,
      paperVersionId: evidence.paperVersionId,
      pageNumber: evidence.pageNumber,
      exactText: evidence.exactText,
    }))
  const hasBlockers = diagnostics.some((item) => item.severity === 'BLOCKER')
  const description =
    input.metadata?.description ??
    textContent(
      findFirst(document, (element) => hasClass(element, 'kicker')),
    ) ??
    `Glyph analysis of ${title}`

  const reportPackage = ReportPackageSchema.parse({
    packageVersion: 1,
    id: `report-package-${slug}-${createHash('sha256').update(input.html).digest('hex').slice(0, 12)}`,
    slug,
    paperVersionId: input.paperVersion.id,
    status: hasBlockers ? 'BLOCKED' : 'DRAFT',
    metadata: {
      title,
      description,
      provider: input.metadata?.provider ?? 'Unknown provider',
      authors: input.metadata?.authors ?? ['Glyph Research'],
      publicationDate:
        input.metadata?.publicationDate ?? input.paperVersion.publicationDate,
      readingTimeMinutes: input.metadata?.readingTimeMinutes ?? 15,
      originalUrl: input.metadata?.originalUrl ?? null,
      sourceTitle: input.metadata?.sourceTitle ?? input.originalFileName,
    },
    themeCss,
    tabs: (['summary', 'mechanism', 'economics'] as const).map((tabId) => ({
      id: tabId,
      label: tabLabels[tabId],
      sectionIds: packageSections
        .filter((section) => section.tabId === tabId)
        .map((section) => section.id),
    })),
    sections: packageSections,
    claims: packageClaims,
    concepts: packageConcepts,
    visuals: packageVisuals,
    sources: packageSources,
    evidenceReferences,
    diagnostics,
    importedAt: now,
    approvedAt: null,
  })

  return {
    reportPackage,
    htmlSha256: createHash('sha256').update(input.html).digest('hex'),
    extractedAssetSummary: {
      inlineSvgCount: findAll(document, (element) => element.tagName === 'svg')
        .length,
      tableCount: findAll(document, (element) => element.tagName === 'table')
        .length,
      unresolvedExternalAssetCount: unresolvedExternalAssets.size,
    },
  }
}

function sanitizeTree(
  parent: ParentNode,
  diagnostics: ReportImportDiagnostic[],
  unresolvedExternalAssets: Set<string>,
  seenIds: Set<string>,
): void {
  for (const node of [...parent.childNodes]) {
    if (!isElement(node)) continue
    const tagName = node.tagName.toLowerCase()
    if (forbiddenElements.has(tagName) || forbiddenSvgElements.has(tagName)) {
      removeNode(parent, node)
      diagnostics.push(
        diagnostic(
          'BLOCKER',
          tagName === 'script' ? 'UNSAFE_SCRIPT' : 'UNSAFE_EMBED',
          `Removed unsafe <${tagName}> element.`,
          getAttribute(node, 'id'),
        ),
      )
      continue
    }
    if (
      tagName === 'link' &&
      getAttribute(node, 'rel')?.toLowerCase() === 'stylesheet'
    ) {
      removeNode(parent, node)
      diagnostics.push(
        diagnostic(
          'BLOCKER',
          'EXTERNAL_CSS',
          'External stylesheets are not allowed.',
        ),
      )
      continue
    }

    for (const attribute of [...node.attrs]) {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on')) {
        removeAttribute(node, attribute.name)
        diagnostics.push(
          diagnostic(
            'BLOCKER',
            'EXECUTABLE_ATTRIBUTE',
            `Removed executable attribute ${attribute.name}.`,
            getAttribute(node, 'id'),
          ),
        )
        continue
      }
      if (name === 'style' && unsafeCssPattern.test(attribute.value)) {
        removeAttribute(node, attribute.name)
        diagnostics.push(
          diagnostic(
            'BLOCKER',
            'UNSAFE_INLINE_CSS',
            'Removed an unsafe inline style.',
            getAttribute(node, 'id'),
          ),
        )
        continue
      }
      if (name === 'id') {
        if (!safeIdPattern.test(attribute.value)) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'INVALID_ID',
              `Invalid HTML ID ${attribute.value}.`,
              attribute.value,
            ),
          )
        } else if (seenIds.has(attribute.value)) {
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'DUPLICATE_ID',
              `Duplicate HTML ID ${attribute.value}.`,
              attribute.value,
            ),
          )
        } else {
          seenIds.add(attribute.value)
        }
      }
      if (name === 'href' || name === 'xlink:href') {
        if (isWithinSvg(node)) {
          if (!attribute.value.startsWith('#')) {
            removeAttribute(node, attribute.name)
            diagnostics.push(
              diagnostic(
                'BLOCKER',
                'EXTERNAL_SVG_RESOURCE',
                'SVG references must remain inside the same inline SVG.',
                getAttribute(node, 'id'),
              ),
            )
          }
        } else if (!isSafeNavigationUrl(attribute.value)) {
          removeAttribute(node, attribute.name)
          diagnostics.push(
            diagnostic(
              'BLOCKER',
              'UNSAFE_URL',
              'Removed an unsafe navigation URL.',
              getAttribute(node, 'id'),
            ),
          )
        }
      }
      if (name === 'src') {
        unresolvedExternalAssets.add(attribute.value)
        removeAttribute(node, attribute.name)
        node.attrs.push({
          name: 'data-glyph-unresolved-src',
          value: attribute.value,
        })
        diagnostics.push(
          diagnostic(
            'BLOCKER',
            'UNRESOLVED_EXTERNAL_ASSET',
            `External asset ${attribute.value} was not fetched.`,
            getAttribute(node, 'id'),
          ),
        )
      }
    }

    if (tagName === 'svg') validateSvg(node, diagnostics)
    sanitizeTree(node, diagnostics, unresolvedExternalAssets, seenIds)
  }
}

function validateSvg(
  svg: Element,
  diagnostics: ReportImportDiagnostic[],
): void {
  const viewBox = getAttribute(svg, 'viewbox')
  const recordId = getAttribute(svg, 'id')
  if (viewBox === null) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'SVG_VIEWBOX_REQUIRED',
        'Every inline SVG requires a viewBox.',
        recordId,
      ),
    )
    return
  }
  const values = viewBox
    .trim()
    .split(/[\s,]+/u)
    .map((value) => Number(value))
  if (
    values.length !== 4 ||
    values.some((value) => !Number.isFinite(value)) ||
    (values[2] ?? 0) <= 0 ||
    (values[3] ?? 0) <= 0 ||
    (values[2] ?? 0) > 10_000 ||
    (values[3] ?? 0) > 10_000
  ) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'SVG_VIEWBOX_INVALID',
        `SVG viewBox ${viewBox} is invalid or unbounded.`,
        recordId,
      ),
    )
  }
}

function extractThemeCss(
  document: Node,
  diagnostics: ReportImportDiagnostic[],
): string {
  const css = findAll(document, (element) => element.tagName === 'style')
    .map(rawTextContent)
    .join('\n')
  if (!css) return ''
  if (unsafeCssPattern.test(css)) {
    diagnostics.push(
      diagnostic(
        'BLOCKER',
        'UNSAFE_CSS',
        'Report CSS contains an import, URL, expression, or executable binding.',
      ),
    )
    return ''
  }
  return css
}

function rawTextContent(node: Node): string {
  const chunks: string[] = []
  const visit = (current: Node): void => {
    if ('value' in current && typeof current.value === 'string') {
      chunks.push(current.value)
    }
    if ('childNodes' in current) current.childNodes.forEach(visit)
  }
  visit(node)
  return chunks.join('')
}

function validateEvidenceReferences(input: {
  evidenceIds: readonly string[]
  evidenceById: ReadonlyMap<string, EvidenceSpan>
  paperVersion: PaperVersion
  diagnostics: ReportImportDiagnostic[]
  recordId: string
}): void {
  for (const evidenceId of input.evidenceIds) {
    const evidence = input.evidenceById.get(evidenceId)
    if (!evidence) {
      input.diagnostics.push(
        diagnostic(
          'BLOCKER',
          'UNKNOWN_EVIDENCE',
          `Unknown evidence reference ${evidenceId}.`,
          input.recordId,
        ),
      )
      continue
    }
    if (evidence.paperVersionId !== input.paperVersion.id) {
      input.diagnostics.push(
        diagnostic(
          'BLOCKER',
          'EVIDENCE_VERSION_MISMATCH',
          `${evidenceId} belongs to another paper version.`,
          input.recordId,
        ),
      )
    }
    if (
      evidence.pageNumber < 1 ||
      evidence.pageNumber > input.paperVersion.pageCount
    ) {
      input.diagnostics.push(
        diagnostic(
          'BLOCKER',
          'EVIDENCE_PAGE_OUT_OF_RANGE',
          `${evidenceId} points outside the source page range.`,
          input.recordId,
        ),
      )
    }
    if (evidence.exactText.trim().length < 8) {
      input.diagnostics.push(
        diagnostic(
          'BLOCKER',
          'EVIDENCE_EXACT_TEXT_REQUIRED',
          `${evidenceId} does not contain verifiable exact text.`,
          input.recordId,
        ),
      )
    }
  }
}

type TabRoot = { id: ReportTabId; element: Element; marked: boolean }

function findTabRoots(document: Node): TabRoot[] {
  const marked = findAll(
    document,
    (element) => getAttribute(element, 'data-glyph-tab') !== null,
  )
    .map((element) => {
      const id = normalizeTabId(getAttribute(element, 'data-glyph-tab'))
      return id ? { id, element, marked: true } : null
    })
    .filter((tab): tab is TabRoot => tab !== null)
  if (marked.length > 0) return uniqueTabs(marked)

  const legacyIds: Record<string, ReportTabId> = {
    'pane-summary': 'summary',
    'pane-mechanisms': 'mechanism',
    'pane-mechanism': 'mechanism',
    'pane-economics': 'economics',
  }
  return uniqueTabs(
    findAll(document, (element) => {
      const id = getAttribute(element, 'id')
      return id !== null && legacyIds[id] !== undefined
    }).map((element) => ({
      id: legacyIds[getAttribute(element, 'id') ?? ''] ?? 'summary',
      element,
      marked: false,
    })),
  )
}

function uniqueTabs(tabs: readonly TabRoot[]): TabRoot[] {
  const seen = new Set<ReportTabId>()
  return tabs.filter((tab) => {
    if (seen.has(tab.id)) return false
    seen.add(tab.id)
    return true
  })
}

function normalizeTabId(value: string | null): ReportTabId | null {
  if (value === 'summary') return 'summary'
  if (value === 'mechanism' || value === 'mechanisms') return 'mechanism'
  if (value === 'economics') return 'economics'
  return null
}

function parseClassification(
  value: string | null,
  diagnostics: ReportImportDiagnostic[],
  claimId: string,
): ReportPackage['claims'][number]['classification'] {
  const normalized = value?.trim().toUpperCase().replace(/[ -]+/gu, '_')
  if (
    normalized === 'AUTHOR_CLAIM' ||
    normalized === 'INDEPENDENT_EVIDENCE' ||
    normalized === 'GLYPH_INTERPRETATION' ||
    normalized === 'INSUFFICIENT_EVIDENCE'
  ) {
    return normalized
  }
  diagnostics.push(
    diagnostic(
      'BLOCKER',
      'CLAIM_CLASSIFICATION_REQUIRED',
      `Claim ${claimId} needs a supported classification.`,
      claimId,
    ),
  )
  return 'INSUFFICIENT_EVIDENCE'
}

function diagnostic(
  severity: ReportImportDiagnostic['severity'],
  code: string,
  message: string,
  recordId: string | null = null,
): ReportImportDiagnostic {
  return { severity, code, message, recordId }
}

function normalizeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/gu, '')
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '')
      .slice(0, 80) || 'untitled-report'
  )
}

function stableRecordId(value: string): string {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9_.:-]+/gu, '-')
      .replace(/^-|-$/gu, '') || `record-${randomUUID()}`
  )
}

function parseIdList(value: string | null): string[] {
  if (!value) return []
  return unique(
    value
      .split(/[\s,]+/u)
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function duplicateValues<T>(values: readonly T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    else seen.add(value)
  }
  return [...duplicates]
}

function isElement(node: Node): node is Element {
  return 'tagName' in node && 'attrs' in node
}

function findAll(
  root: Node,
  predicate: (element: Element) => boolean,
): Element[] {
  const results: Element[] = []
  const visit = (node: Node): void => {
    if (isElement(node) && predicate(node)) results.push(node)
    if ('childNodes' in node) node.childNodes.forEach(visit)
  }
  visit(root)
  return results
}

function findFirst(
  root: Node,
  predicate: (element: Element) => boolean,
): Element | null {
  let result: Element | null = null
  const visit = (node: Node): void => {
    if (result) return
    if (isElement(node) && predicate(node)) {
      result = node
      return
    }
    if ('childNodes' in node) node.childNodes.forEach(visit)
  }
  visit(root)
  return result
}

function textContent(node: Node | null): string | null {
  if (!node) return null
  const chunks: string[] = []
  const visit = (current: Node): void => {
    if ('value' in current && typeof current.value === 'string') {
      chunks.push(current.value)
    }
    if ('childNodes' in current) current.childNodes.forEach(visit)
  }
  visit(node)
  const value = chunks.join(' ').replace(/\s+/gu, ' ').trim()
  return value || null
}

function getAttribute(element: Element, name: string): string | null {
  const normalized = name.toLowerCase()
  return (
    element.attrs.find(
      (attribute) => attribute.name.toLowerCase() === normalized,
    )?.value ?? null
  )
}

function removeAttribute(element: Element, name: string): void {
  const normalized = name.toLowerCase()
  element.attrs = element.attrs.filter(
    (attribute) => attribute.name.toLowerCase() !== normalized,
  )
}

function hasClass(element: Element, className: string): boolean {
  return (getAttribute(element, 'class') ?? '')
    .split(/\s+/u)
    .includes(className)
}

function removeNode(parent: ParentNode, node: Element): void {
  const index = parent.childNodes.indexOf(node)
  if (index >= 0) parent.childNodes.splice(index, 1)
}

function nearestAncestor(element: Element, tagName: string): Element | null {
  let current = element.parentNode
  while (current) {
    if (isElement(current) && current.tagName === tagName) return current
    current = 'parentNode' in current ? current.parentNode : null
  }
  return null
}

function belongsToSection(element: Element, section: Element): boolean {
  let current = element.parentNode
  while (current) {
    if (current === section) return true
    if (
      isElement(current) &&
      getAttribute(current, 'data-glyph-section') !== null
    ) {
      return false
    }
    current = 'parentNode' in current ? current.parentNode : null
  }
  return false
}

function isWithinSvg(element: Element): boolean {
  return element.tagName === 'svg' || nearestAncestor(element, 'svg') !== null
}

function isSafeNavigationUrl(value: string): boolean {
  if (value.startsWith('#') || value.startsWith('/')) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}

function normalizeLink(value: string | null): string | null {
  if (!value || value.startsWith('#') || value.startsWith('/')) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export const reportImporterSchemaVersion = schemaVersion
