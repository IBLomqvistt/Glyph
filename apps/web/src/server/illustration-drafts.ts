import { OpenAiImageGateway } from '@glyph/ai'
import {
  GenerateIllustrationDraftService,
  type AuthGateway,
  type IllustrationDraft,
  type IllustrationGenerationGateway,
  type IllustrationPurpose,
} from '@glyph/application'
import type { Id } from '@glyph/domain'
import { DemoAuthGateway } from './demo-auth'

const liveImageFlag = 'GLYPH_ENABLE_LIVE_IMAGE_GENERATION'

export class LocalIllustrationGenerationDisabledError extends Error {
  constructor() {
    super(
      `Live image generation is disabled. Set ${liveImageFlag}=true only for an approved local draft request.`,
    )
    this.name = 'LocalIllustrationGenerationDisabledError'
  }
}

type IllustrationDraftDependencies = {
  authGateway: AuthGateway
  generationGateway: IllustrationGenerationGateway
}

export async function generateNonSemanticIllustrationDraft(
  input: {
    paperVersionId: Id
    purpose: IllustrationPurpose
    brief: string
    editorConfirmedNonSemanticUse: boolean
  },
  dependencies: IllustrationDraftDependencies = {
    authGateway: new DemoAuthGateway(),
    generationGateway: new OpenAiImageGateway(),
  },
): Promise<IllustrationDraft> {
  await dependencies.authGateway.requireRole('EDITOR')
  if (process.env[liveImageFlag] !== 'true') {
    throw new LocalIllustrationGenerationDisabledError()
  }

  return new GenerateIllustrationDraftService(
    dependencies.generationGateway,
  ).execute(input)
}
