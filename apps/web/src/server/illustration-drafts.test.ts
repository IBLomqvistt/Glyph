import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  AuthGateway,
  IllustrationDraft,
  IllustrationGenerationGateway,
} from '@glyph/application'
import type { UserProfile } from '@glyph/domain'
import {
  LocalIllustrationGenerationDisabledError,
  generateNonSemanticIllustrationDraft,
} from './illustration-drafts'

const editor: UserProfile = {
  schemaVersion: 1,
  id: 'editor-1',
  role: 'EDITOR',
  preferences: {},
  savedConceptIds: [],
}

const pendingDraft: IllustrationDraft = {
  paperVersionId: 'version-1',
  purpose: 'VISUAL_ABSTRACT',
  model: 'test-image-model',
  promptVersion: 'test-prompt-v1',
  generatedAt: '2026-07-21T00:00:00.000Z',
  mimeType: 'image/png',
  imageBase64: 'c3ludGhldGljLWltYWdl',
  reviewStatus: 'PENDING_HUMAN_REVIEW',
  semanticUseAllowed: false,
}

afterEach(() => {
  delete process.env.GLYPH_ENABLE_LIVE_IMAGE_GENERATION
})

describe('local illustration draft boundary', () => {
  it('stays disabled independently of the general AI flag', async () => {
    const generateDraft = vi.fn(() => Promise.resolve(pendingDraft))
    await expect(
      generateNonSemanticIllustrationDraft(
        {
          paperVersionId: 'version-1',
          purpose: 'VISUAL_ABSTRACT',
          brief: 'A calm abstract violet field for the report header.',
          editorConfirmedNonSemanticUse: true,
        },
        {
          authGateway: editorAuthGateway(),
          generationGateway: { generateDraft },
        },
      ),
    ).rejects.toThrow(LocalIllustrationGenerationDisabledError)
    expect(generateDraft).not.toHaveBeenCalled()
  })

  it('requires the editor role before an enabled request can run', async () => {
    process.env.GLYPH_ENABLE_LIVE_IMAGE_GENERATION = 'true'
    const visitorAuth: AuthGateway = {
      currentUser: () => Promise.resolve({ ...editor, role: 'VISITOR' }),
      requireRole: () =>
        Promise.reject(new Error('PERMISSION_DENIED: EDITOR role required')),
    }
    await expect(
      generateNonSemanticIllustrationDraft(
        {
          paperVersionId: 'version-1',
          purpose: 'VISUAL_ABSTRACT',
          brief: 'A calm abstract violet field for the report header.',
          editorConfirmedNonSemanticUse: true,
        },
        {
          authGateway: visitorAuth,
          generationGateway: {
            generateDraft: () => Promise.resolve(pendingDraft),
          },
        },
      ),
    ).rejects.toThrow('PERMISSION_DENIED')
  })

  it('returns a pending draft after role, flag, and confirmation gates', async () => {
    process.env.GLYPH_ENABLE_LIVE_IMAGE_GENERATION = 'true'
    const gateway: IllustrationGenerationGateway = {
      generateDraft: () => Promise.resolve(pendingDraft),
    }
    await expect(
      generateNonSemanticIllustrationDraft(
        {
          paperVersionId: 'version-1',
          purpose: 'VISUAL_ABSTRACT',
          brief: 'A calm abstract violet field for the report header.',
          editorConfirmedNonSemanticUse: true,
        },
        {
          authGateway: editorAuthGateway(),
          generationGateway: gateway,
        },
      ),
    ).resolves.toEqual(pendingDraft)
  })
})

function editorAuthGateway(): AuthGateway {
  return {
    currentUser: () => Promise.resolve(editor),
    requireRole: () => Promise.resolve(editor),
  }
}
