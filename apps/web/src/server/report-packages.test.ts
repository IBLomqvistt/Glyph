import { describe, expect, it } from 'vitest'
import { reportPackageBySlug } from './report-packages'

describe('built-in report packages', () => {
  it('loads Kimi through the sanitized reusable package renderer', async () => {
    const reportPackage = await reportPackageBySlug('kimi-k3')
    expect(reportPackage).not.toBeNull()
    expect(reportPackage?.status).toBe('APPROVED')
    expect(reportPackage?.tabs.map((tab) => tab.id)).toEqual([
      'summary',
      'mechanism',
      'economics',
    ])
    expect(reportPackage?.visuals.length).toBeGreaterThanOrEqual(8)
    expect(reportPackage?.concepts.length).toBeGreaterThanOrEqual(10)
    expect(reportPackage?.evidenceReferences.length).toBeGreaterThanOrEqual(5)
    expect(reportPackage?.themeCss.length).toBeGreaterThan(5_000)
    expect(reportPackage?.themeCss).toContain('--paper:#F5F0E6')
    expect(reportPackage?.themeCss).toContain('font-family:var(--body)')
    const content = reportPackage?.sections
      .map((section) => section.html)
      .join('\n')
    expect(content).not.toMatch(/2\.5x cheaper to build/iu)
    expect(content).not.toMatch(/hundreds of millions of dollars per run/iu)
    expect(content).toContain('overall scaling efficiency')
  })

  it('does not fabricate packages for unknown slugs', async () => {
    await expect(reportPackageBySlug('unknown-report')).resolves.toBeNull()
  })
})
