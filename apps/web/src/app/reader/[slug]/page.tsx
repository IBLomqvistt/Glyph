import { notFound, redirect } from 'next/navigation'
import { FixtureCitedQuestionService } from '@glyph/application'
import { PackedReportReader } from '@/components/packed-report-reader'
import { ReaderExperience } from '@/components/reader-experience'
import { edition } from '@/lib/edition'
import { featuredReport } from '@/lib/featured-report'

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<React.JSX.Element> {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  if (slug === edition.report.slug) redirect(`/reader/${featuredReport.slug}`)
  if (slug === featuredReport.slug) {
    return (
      <div className="reader-page reader-page-kimi">
        <PackedReportReader {...featuredReport} />
      </div>
    )
  }
  if (slug !== 'synthetic-fixture') notFound()
  const initialEvidenceId =
    typeof query.evidence === 'string' ? query.evidence : undefined
  const evidenceSpans =
    initialEvidenceId === '__wrong_version_test__' && edition.evidenceSpans[0]
      ? [
          ...edition.evidenceSpans,
          {
            ...edition.evidenceSpans[0],
            id: '__wrong_version_test__',
            paperVersionId: 'test-only-other-version',
          },
        ]
      : edition.evidenceSpans
  const questionService = new FixtureCitedQuestionService(
    edition.answers,
    edition.evidenceSpans,
  )
  const answers = await Promise.all(
    edition.answers.map((answer) =>
      questionService.answerQuestion(edition.report.id, answer.question),
    ),
  )

  return (
    <div className="reader-page">
      <ReaderExperience
        slug={slug}
        title={edition.paper.title}
        authors={edition.paper.authors}
        publicationDate={edition.version.publicationDate}
        sourceLabel="Original source"
        originalUrl={edition.paper.canonicalUrl ?? edition.version.assetPath}
        pdfPath={edition.version.assetPath}
        paperVersionId={edition.version.id}
        pageCount={edition.version.pageCount}
        pageImageBasePath="/demo/glyph-agent-swarm-pages"
        sections={edition.sections}
        claims={edition.claims}
        evidenceSpans={evidenceSpans}
        concepts={edition.concepts}
        visuals={edition.visuals}
        answers={answers}
        {...(initialEvidenceId ? { initialEvidenceId } : {})}
      />
    </div>
  )
}
