'use client'

import { Button, Card } from '@glyph/ui'

export default function ErrorPage({
  reset,
}: {
  reset: () => void
}): React.JSX.Element {
  return (
    <div className="page">
      <Card className="error-state" role="alert">
        <span className="eyebrow">Explicit error</span>
        <h1>Glyph could not load this view</h1>
        <p>
          No fallback analysis or approximate evidence has been substituted.
        </p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  )
}
