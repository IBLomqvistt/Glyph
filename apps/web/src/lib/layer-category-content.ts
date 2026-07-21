import { featuredReport } from './featured-report'
import type { LayerSlug } from './layers'

export type LayerPreviewRecord = {
  id: string
  source: string
  sourceLogo?: string
  sourceMark?: string
  authors: string
  date: string
  title: string
  abstract: string
  concepts: readonly string[]
  relevance: string
  readerHref?: string
}

export type LayerCategoryContent = {
  description: string
  hero: {
    src: string
    width: number
    height: number
    layout: 'energy' | 'wide'
  }
  records: readonly LayerPreviewRecord[]
}

export const layerCategoryContent: Record<LayerSlug, LayerCategoryContent> = {
  energy: {
    description:
      'Powering the AI era—generation, cooling, grids, and energy systems.',
    hero: {
      src: '/assets/energy/energy-header-reference.png',
      width: 1505,
      height: 1045,
      layout: 'energy',
    },
    records: [],
  },
  'chips-compute': {
    description:
      'Powering AI performance—semiconductors, accelerators, memory, interconnects, and compute systems.',
    hero: {
      src: '/assets/layers/chips-compute-hero.png',
      width: 1907,
      height: 825,
      layout: 'wide',
    },
    records: [],
  },
  'cloud-infrastructure': {
    description:
      'Delivering AI at scale—data centers, orchestration, storage, networking, and distributed infrastructure.',
    hero: {
      src: '/assets/layers/cloud-infrastructure-hero.png',
      width: 1983,
      height: 793,
      layout: 'wide',
    },
    records: [],
  },
  models: {
    description:
      'Learning and reasoning—foundation models, training systems, evaluation, and model capabilities.',
    hero: {
      src: '/assets/layers/models-hero.png',
      width: 1823,
      height: 863,
      layout: 'wide',
    },
    records: [
      {
        id: 'kimi-k3-open-frontier-intelligence',
        source: featuredReport.provider,
        sourceLogo: '/assets/logos/kimi.png',
        authors: featuredReport.authors.join(', '),
        date: 'Jul 21, 2026',
        title: featuredReport.title,
        abstract: featuredReport.summary,
        concepts: featuredReport.topicLabels,
        relevance:
          'Connects Kimi K3 architecture claims to model-serving economics while keeping unresolved launch claims explicit.',
        readerHref: `/reader/${featuredReport.slug}`,
      },
    ],
  },
  applications: {
    description:
      'AI agents, copilots, workflows, and vertical applications creating real user value.',
    hero: {
      src: '/assets/layers/applications-hero.png',
      width: 1866,
      height: 843,
      layout: 'wide',
    },
    records: [],
  },
}
