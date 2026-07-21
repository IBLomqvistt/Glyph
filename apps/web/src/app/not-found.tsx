import Link from 'next/link'
import { Card } from '@glyph/ui'

export default function NotFound(): React.JSX.Element {
  return (
    <div className="page">
      <Card className="empty-state">
        <span className="eyebrow">Not found</span>
        <h1>This report is not available</h1>
        <p>
          Glyph will not fabricate a plausible report for an unknown source.
        </p>
        <Link href="/" className="button button-primary button-default">
          Return to inbox
        </Link>
      </Card>
    </div>
  )
}
