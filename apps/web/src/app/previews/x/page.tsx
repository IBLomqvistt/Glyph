import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Share2 } from 'lucide-react'
import { Badge, Button, Card } from '@glyph/ui'
import { Diagram } from '@/components/diagram'
import { edition } from '@/lib/edition'
import { DemoAuthGateway } from '@/server/demo-auth'

export default async function SocialPreviewPage(): Promise<React.JSX.Element> {
  const user = await new DemoAuthGateway().currentUser()
  if (user.role !== 'EDITOR') notFound()
  const hero = edition.visuals.find((visual) => visual.id === 'visual-hero')
  return (
    <div className="page preview-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Distribution preview</span>
          <h1>X post</h1>
          <p>Canonical demo links and uncertainty remain visible.</p>
        </div>
        <Badge tone="violet">Preview only</Badge>
      </header>
      <Card className="social-card">
        <div className="social-profile">
          <span className="brand-mark">G</span>
          <div>
            <strong>Glyph</strong>
            <span>@glyph_demo · synthetic</span>
          </div>
        </div>
        <p className="social-hook">{edition.socialPreview.hook}</p>
        {hero ? <Diagram spec={hero} /> : null}
        <ol>
          {edition.socialPreview.observations.map((observation) => (
            <li key={observation}>{observation}</li>
          ))}
        </ol>
        <p>
          <a href={edition.socialPreview.sourcePath}>Synthetic source PDF</a> ·{' '}
          <Link href={edition.socialPreview.reportPath}>Glyph report</Link>
        </p>
        <p className="disclaimer">{edition.socialPreview.disclaimer}</p>
        <Button disabled>
          <Share2 aria-hidden="true" size={15} /> Post — disabled
        </Button>
      </Card>
      <Link href="/previews/newsletter" className="text-link">
        Back to newsletter <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </div>
  )
}
