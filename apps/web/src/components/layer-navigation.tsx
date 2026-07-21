import Link from 'next/link'
import { LayerIcon } from '@/components/layer-icon'
import { layers, type LayerSlug } from '@/lib/layers'

interface LayerNavigationProps {
  activeSlug?: LayerSlug
  ariaLabel?: string
}

export function LayerNavigation({
  activeSlug,
  ariaLabel = 'AI architecture categories',
}: LayerNavigationProps): React.JSX.Element {
  return (
    <nav className="category-tabs" aria-label={ariaLabel}>
      {layers.map((layer) => (
        <Link
          key={layer.slug}
          href={`/layers/${layer.slug}`}
          className={layer.slug === activeSlug ? 'active' : undefined}
          aria-current={layer.slug === activeSlug ? 'page' : undefined}
          data-testid={`category-link-${layer.slug}`}
        >
          <LayerIcon layer={layer.slug} size={24} />
          <span>{layer.name}</span>
        </Link>
      ))}
    </nav>
  )
}
