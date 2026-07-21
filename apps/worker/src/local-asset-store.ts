import { readFile } from 'node:fs/promises'
import type { PaperAssetStore } from '@glyph/application'
import type { Id } from '@glyph/domain'

export class LocalFixtureAssetStore implements PaperAssetStore {
  readonly #assets: ReadonlyMap<Id, string>

  constructor(assets: ReadonlyMap<Id, string>) {
    this.#assets = assets
  }

  async getPdfBytes(paperVersionId: Id): Promise<Uint8Array | null> {
    const path = this.#assets.get(paperVersionId)
    if (!path) return null
    return readFile(path)
  }
}
