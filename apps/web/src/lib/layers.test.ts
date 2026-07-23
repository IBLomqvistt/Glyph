import { describe, expect, it } from 'vitest'
import { layerCategoryContent } from './layer-category-content'
import { layerBySlug, layers } from './layers'

describe('AI architecture layers', () => {
  it('keeps the five-layer order stable from foundation to value', () => {
    expect(layers.map((layer) => layer.slug)).toEqual([
      'energy',
      'chips-compute',
      'cloud-infrastructure',
      'models',
      'applications',
    ])
    expect(layers.map((layer) => layer.number)).toEqual([1, 2, 3, 4, 5])
  })

  it('fails closed for an unknown layer', () => {
    expect(layerBySlug('fabricated-layer')).toBeUndefined()
  })

  it('provides every category hero without inventing paper records', () => {
    for (const layer of layers) {
      const category = layerCategoryContent[layer.slug]

      expect(category.hero.src).toMatch(/^\/assets\//)
      expect(category.records).toHaveLength(layer.slug === 'models' ? 1 : 0)
    }
  })

  it('only links records backed by an imported local source and report', () => {
    const linkedRecords = Object.values(layerCategoryContent).flatMap(
      (category) =>
        category.records.filter((record) => Boolean(record.readerHref)),
    )

    expect(linkedRecords).toHaveLength(1)
    expect(linkedRecords[0]?.readerHref).toBe('/reports/kimi-k3')
    expect(linkedRecords[0]?.sourceLogo).toBe('/assets/logos/kimi.png')
  })
})
