export const layerSlugs = [
  'energy',
  'chips-compute',
  'cloud-infrastructure',
  'models',
  'applications',
] as const

export type LayerSlug = (typeof layerSlugs)[number]

export type LayerDefinition = {
  slug: LayerSlug
  number: number
  name: string
  strapline: string
  summary: string
  features: readonly string[]
  illustration: 'grid' | 'chip' | 'servers' | 'network' | 'apps'
}

export const layers: readonly LayerDefinition[] = [
  {
    slug: 'energy',
    number: 1,
    name: 'Energy',
    strapline: 'The foundation',
    summary: 'Power generation, cooling systems, and grid infrastructure.',
    features: ['Sustainability', '24/7 uptime', 'Resilience'],
    illustration: 'grid',
  },
  {
    slug: 'chips-compute',
    number: 2,
    name: 'Chips & Compute',
    strapline: 'The engine',
    summary: 'Accelerators, memory, interconnects, and compute systems.',
    features: ['Parallel processing', 'Memory bandwidth', 'Throughput'],
    illustration: 'chip',
  },
  {
    slug: 'cloud-infrastructure',
    number: 3,
    name: 'Cloud & Infrastructure',
    strapline: 'The scale',
    summary: 'Data centers, orchestration, storage, and distributed systems.',
    features: ['Elasticity', 'Low latency', 'High availability'],
    illustration: 'servers',
  },
  {
    slug: 'models',
    number: 4,
    name: 'Models',
    strapline: 'The intelligence',
    summary: 'Foundation models, training systems, evaluation, and MLOps.',
    features: ['Parameters', 'Multimodality', 'Training efficiency'],
    illustration: 'network',
  },
  {
    slug: 'applications',
    number: 5,
    name: 'Applications',
    strapline: 'The value',
    summary: 'AI agents, copilots, vertical applications, and user workflows.',
    features: ['User experience', 'Context awareness', 'Personalization'],
    illustration: 'apps',
  },
] as const

export function layerBySlug(slug: string): LayerDefinition | undefined {
  return layers.find((layer) => layer.slug === slug)
}
