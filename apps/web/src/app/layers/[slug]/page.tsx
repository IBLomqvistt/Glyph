import { notFound } from 'next/navigation'
import { LayerCategoryPage } from '@/components/layer-category-page'
import { layerBySlug, layers } from '@/lib/layers'

export function generateStaticParams(): Array<{ slug: string }> {
  return layers.map((layer) => ({ slug: layer.slug }))
}

export default async function LayerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<React.JSX.Element> {
  const { slug } = await params
  const layer = layerBySlug(slug)
  if (!layer) notFound()

  return <LayerCategoryPage layer={layer} />
}
