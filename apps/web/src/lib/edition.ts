import editionJson from '../../../../fixtures/glyph-agent-swarm-demo/edition.json'
import {
  ClaimSchema,
  ConceptCardSchema,
  EvidenceSpanSchema,
  NewsletterSchema,
  PaperSchema,
  PaperVersionSchema,
  QuestionAnswerSchema,
  ReportSchema,
  ReportSectionSchema,
  VisualSpecSchema,
} from '@glyph/domain'

export const edition = {
  disclosure: editionJson.disclosure,
  paper: PaperSchema.parse(editionJson.paper),
  version: PaperVersionSchema.parse(editionJson.version),
  report: ReportSchema.parse(editionJson.report),
  sections: editionJson.sections.map((section) =>
    ReportSectionSchema.parse(section),
  ),
  claims: editionJson.claims.map((claim) => ClaimSchema.parse(claim)),
  evidenceSpans: editionJson.evidenceSpans.map((span) =>
    EvidenceSpanSchema.parse(span),
  ),
  concepts: editionJson.concepts.map((concept) =>
    ConceptCardSchema.parse(concept),
  ),
  visuals: editionJson.visuals.map((visual) => VisualSpecSchema.parse(visual)),
  newsletter: NewsletterSchema.parse(editionJson.newsletter),
  answers: editionJson.answers.map((answer) =>
    QuestionAnswerSchema.parse(answer),
  ),
  socialPreview: editionJson.socialPreview,
}

export function claimById(id: string) {
  return edition.claims.find((claim) => claim.id === id)
}

export function evidenceById(id: string) {
  return edition.evidenceSpans.find((span) => span.id === id)
}
