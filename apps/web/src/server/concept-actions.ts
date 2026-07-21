'use server'

import type { ConceptRepository } from '@glyph/application'
import { CookieConceptRepository } from './concepts'

export async function toggleConcept(input: FormData): Promise<void> {
  const rawConceptId = input.get('conceptId')
  const conceptId = typeof rawConceptId === 'string' ? rawConceptId : ''
  const intent = input.get('intent') === 'unsave' ? 'unsave' : 'save'
  const repository: ConceptRepository = new CookieConceptRepository()
  if (intent === 'save') {
    await repository.save('demo-user', conceptId)
  } else {
    await repository.unsave('demo-user', conceptId)
  }
}
