import { describe, expect, it } from 'vitest'
import {
  DemoSubscriptionGateway,
  ExternalActionDisabledError,
  PreviewOnlyDistributionGateway,
  StripeSubscriptionGateway,
  getStripeClient,
} from './providers'

describe('external side-effect safety', () => {
  it('cannot initialize Stripe by default', () => {
    delete process.env.GLYPH_ENABLE_LIVE_BILLING
    expect(() => getStripeClient()).toThrow(ExternalActionDisabledError)
  })

  it('cannot create a checkout session in demo mode', async () => {
    await expect(
      new DemoSubscriptionGateway().createCheckoutSession(),
    ).rejects.toThrow(ExternalActionDisabledError)
  })

  it('models demo access without trusting unknown users', async () => {
    const gateway = new DemoSubscriptionGateway(
      new Map([['known-user', 'SUBSCRIBER']]),
    )
    await expect(gateway.accessForUser('known-user')).resolves.toBe(
      'SUBSCRIBER',
    )
    await expect(gateway.accessForUser('unknown-user')).resolves.toBe('PUBLIC')
  })

  it('keeps the Stripe adapter shell disabled by default', async () => {
    delete process.env.GLYPH_ENABLE_LIVE_BILLING
    await expect(
      new StripeSubscriptionGateway().createCheckoutSession('demo-user'),
    ).rejects.toThrow(ExternalActionDisabledError)
  })

  it('cannot send or post distribution output', async () => {
    const gateway = new PreviewOnlyDistributionGateway()
    await expect(gateway.sendNewsletter()).rejects.toThrow(
      ExternalActionDisabledError,
    )
    await expect(gateway.publishPost()).rejects.toThrow(
      ExternalActionDisabledError,
    )
  })
})
