export default function Loading(): React.JSX.Element {
  return (
    <div className="page" aria-live="polite" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <span className="sr-only">Loading Glyph…</span>
    </div>
  )
}
