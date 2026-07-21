import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Card } from '@glyph/ui'
import { LayerNavigation } from '@/components/layer-navigation'
import { layerCategoryContent } from '@/lib/layer-category-content'
import type { LayerDefinition } from '@/lib/layers'

interface LayerCategoryPageProps {
  layer: LayerDefinition
}

export function LayerCategoryPage({
  layer,
}: LayerCategoryPageProps): React.JSX.Element {
  const content = layerCategoryContent[layer.slug]

  return (
    <div className="page page-wide category-page">
      <header className={`category-hero category-hero-${layer.slug}`}>
        <Image
          className={`category-hero-image category-hero-image-${content.hero.layout}`}
          src={content.hero.src}
          alt=""
          aria-hidden="true"
          width={content.hero.width}
          height={content.hero.height}
          priority
          sizes="(max-width: 760px) 100vw, calc(100vw - 15rem)"
        />
        <div className="category-hero-wash" aria-hidden="true" />
        <div className="category-hero-copy">
          <h1>
            Layer {layer.number}: {layer.name}
          </h1>
          <p>{content.description}</p>
        </div>
      </header>

      <LayerNavigation activeSlug={layer.slug} />

      <p className="category-fixture-note" role="note">
        Only imported sources with reviewed local report material appear here.
      </p>

      {content.records.length > 0 ? (
        <section
          className="category-paper-list"
          aria-label={`${layer.name} research preview`}
        >
          {content.records.map((record) => (
            <Card className="category-paper-card" key={record.id}>
              <div className="category-source-logo">
                {record.sourceLogo ? (
                  <Image
                    src={record.sourceLogo}
                    width={52}
                    height={52}
                    alt={`${record.source} logo`}
                  />
                ) : (
                  <span className="category-source-mark" aria-hidden="true">
                    {record.sourceMark ?? record.source}
                  </span>
                )}
                <span>{record.source}</span>
              </div>
              <article>
                <div className="category-paper-meta">
                  <strong>{record.source}</strong>
                  <i aria-hidden="true" />
                  <span>{record.authors}</span>
                  <i aria-hidden="true" />
                  <span>{record.date}</span>
                  <span
                    className="category-external-mark"
                    title={
                      record.readerHref
                        ? 'Imported local source and reviewed report'
                        : 'External source unavailable for this unverified preview'
                    }
                    aria-label={
                      record.readerHref
                        ? 'Imported local source and reviewed report'
                        : 'External source unavailable for this unverified preview'
                    }
                  >
                    {record.readerHref ? 'Open report' : 'Unverified preview'}
                    <ExternalLink aria-hidden="true" size={13} />
                  </span>
                </div>

                {record.readerHref ? (
                  <Link
                    className="category-paper-title"
                    href={record.readerHref}
                  >
                    <h2>{record.title}</h2>
                  </Link>
                ) : (
                  <h2>{record.title}</h2>
                )}

                <p className="category-abstract">{record.abstract}</p>
                <div className="category-chip-row" aria-label="Content tags">
                  {record.concepts.map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
                <p className="category-relevance">
                  <strong>Why relevant:</strong> {record.relevance}
                </p>
              </article>

              {record.readerHref ? (
                <Link
                  className="category-card-arrow"
                  href={record.readerHref}
                  aria-label={`Read ${record.title}`}
                >
                  <ArrowRight aria-hidden="true" size={22} />
                </Link>
              ) : (
                <span className="category-card-arrow" aria-hidden="true">
                  <ArrowRight size={22} />
                </span>
              )}
            </Card>
          ))}
        </section>
      ) : (
        <Card className="category-empty-state" role="status">
          <span className="eyebrow">No imported papers yet</span>
          <h2>{layer.name} research is being reviewed</h2>
          <p>
            Glyph will show a paper here only after its source and report pack
            have been imported and checked. No placeholder record is displayed.
          </p>
        </Card>
      )}
    </div>
  )
}
