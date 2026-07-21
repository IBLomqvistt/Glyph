import { cookies } from 'next/headers'
import type { ConceptRepository } from '@glyph/application'
import type { ConceptCard, Id } from '@glyph/domain'
import { edition } from '@/lib/edition'

const savedCookie = 'glyph-saved-concepts'
const emptyMarker = '__empty__'

export class CookieConceptRepository implements ConceptRepository {
  async #ids(): Promise<Set<Id>> {
    const store = await cookies()
    const raw = store.get(savedCookie)?.value
    if (raw === undefined) {
      return new Set(edition.concepts.map((concept) => concept.id))
    }
    if (raw === emptyMarker) return new Set()
    return new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
  }

  async listSaved(): Promise<ConceptCard[]> {
    const ids = await this.#ids()
    return edition.concepts.filter((concept) => ids.has(concept.id))
  }

  async save(_userId: Id, conceptId: Id): Promise<void> {
    if (!edition.concepts.some((concept) => concept.id === conceptId)) {
      throw new Error(`Unknown concept: ${conceptId}`)
    }
    const ids = await this.#ids()
    ids.add(conceptId)
    const store = await cookies()
    store.set(savedCookie, [...ids].join(','), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  async unsave(_userId: Id, conceptId: Id): Promise<void> {
    const ids = await this.#ids()
    ids.delete(conceptId)
    const store = await cookies()
    store.set(savedCookie, ids.size > 0 ? [...ids].join(',') : emptyMarker, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }
}
