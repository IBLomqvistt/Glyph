import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Mail } from 'lucide-react'
import { Badge, Button, Card } from '@glyph/ui'
import { edition } from '@/lib/edition'
import { DemoAuthGateway } from '@/server/demo-auth'

export default async function NewsletterPreviewPage(): Promise<React.JSX.Element> {
  const user = await new DemoAuthGateway().currentUser()
  if (user.role !== 'EDITOR') notFound()
  return (
    <div className="page preview-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Distribution preview</span>
          <h1>Glyph Daily Brief</h1>
          <p>Exactly five editorial bullets. Sending is disabled.</p>
        </div>
        <Badge tone="violet">Preview only</Badge>
      </header>
      <Card className="newsletter-card">
        <Mail aria-hidden="true" className="preview-icon" />
        <span className="eyebrow">Featured synthetic report</span>
        <h2>{edition.paper.title}</h2>
        <ol data-testid="newsletter-bullets">
          {edition.newsletter.bullets.map((bullet, index) => (
            <li key={bullet}>
              <span>{index + 1}</span>
              {bullet}
            </li>
          ))}
        </ol>
        <Link
          href={`/reports/${edition.report.slug}`}
          className="button button-primary button-default"
        >
          Read full report <ArrowRight aria-hidden="true" size={15} />
        </Link>
        <Button disabled title="Email adapter disabled">
          Send newsletter — disabled
        </Button>
      </Card>
      <Link href="/previews/x" className="text-link">
        View X preview <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </div>
  )
}
