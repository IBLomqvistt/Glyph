import Stripe from 'stripe'
import type {
  EmailGateway,
  SocialDistributionGateway,
  SubscriptionGateway,
} from '@glyph/application'
import type { Id } from '@glyph/domain'

export class ExternalActionDisabledError extends Error {
  constructor(action: string) {
    super(`${action} is disabled in the synthetic demo.`)
    this.name = 'ExternalActionDisabledError'
  }
}

let stripe: Stripe | undefined

export function getStripeClient(): Stripe {
  if (process.env.GLYPH_ENABLE_LIVE_BILLING !== 'true') {
    throw new ExternalActionDisabledError('Stripe billing')
  }
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey)
    throw new Error('STRIPE_SECRET_KEY is required for live billing.')
  stripe ??= new Stripe(secretKey)
  return stripe
}

export class DemoSubscriptionGateway implements SubscriptionGateway {
  constructor(
    private readonly accessByUser: ReadonlyMap<
      Id,
      'PUBLIC' | 'SUBSCRIBER' | 'EDITOR'
    > = new Map(),
  ) {}

  accessForUser(userId: Id): Promise<'PUBLIC' | 'SUBSCRIBER' | 'EDITOR'> {
    return Promise.resolve(this.accessByUser.get(userId) ?? 'PUBLIC')
  }

  createCheckoutSession(): Promise<{ url: string }> {
    return Promise.reject(
      new ExternalActionDisabledError('Checkout session creation'),
    )
  }
}

export class StripeSubscriptionGateway implements SubscriptionGateway {
  accessForUser(): Promise<'PUBLIC' | 'SUBSCRIBER' | 'EDITOR'> {
    return Promise.resolve('PUBLIC')
  }

  createCheckoutSession(userId: Id): Promise<{ url: string }> {
    return Promise.resolve().then(() => {
      void userId
      getStripeClient()
      throw new ExternalActionDisabledError(
        'Live Stripe checkout session creation',
      )
    })
  }
}

export class PreviewOnlyDistributionGateway
  implements EmailGateway, SocialDistributionGateway
{
  previewNewsletter(reportId: Id): Promise<string> {
    return Promise.resolve(`Preview newsletter for ${reportId}`)
  }

  previewPost(reportId: Id): Promise<string> {
    return Promise.resolve(`Preview social post for ${reportId}`)
  }

  sendNewsletter(): Promise<never> {
    return Promise.reject(new ExternalActionDisabledError('Email sending'))
  }

  publishPost(): Promise<never> {
    return Promise.reject(new ExternalActionDisabledError('Social publishing'))
  }
}
