import { Badge } from '@glyph/ui'

export function SyntheticBanner({
  disclosure,
}: {
  disclosure: string
}): React.JSX.Element {
  return (
    <div className="synthetic-banner" role="note">
      <Badge tone="violet">Synthetic demo</Badge>
      <span>{disclosure}</span>
    </div>
  )
}
