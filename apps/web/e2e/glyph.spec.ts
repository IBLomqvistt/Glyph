import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const screenshotDirectory = 'work/overnight/screenshots'

const dailyPaper = {
  title: 'Kimi K3: an enormous open model, engineered to be affordable to run',
  readerHref: '/reader/kimi-k3',
  categoryHref: '/layers/models',
} as const

async function expectNoSevereA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    ),
  ).toEqual([])
}

test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  await page.goto('/home')
  await expect(
    page.getByRole('heading', { name: 'What’s new today' }),
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('home previews today’s paper before opening its category', async ({
  page,
  isMobile,
}, testInfo) => {
  await expect(page.getByTestId('today-paper')).toHaveCount(1)
  await expect(page.locator('.architectural-cake')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'AI Architectural Cake' }),
  ).toHaveCount(0)
  if (!isMobile) {
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }).first(),
    ).not.toContainText('Featured report')
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }).first(),
    ).not.toContainText('Editor')
  }

  await page.screenshot({
    path: `${screenshotDirectory}/today-home-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.getByTestId('today-tag-models').click()
  await expect(
    page.getByRole('heading', { name: 'Layer 4: Models', level: 1 }),
  ).toBeVisible()
  await expect(page.locator('.category-paper-card')).toHaveCount(1)
  await expect(page.getByAltText('Moonshot AI logo')).toHaveAttribute(
    'src',
    /kimi\.png/,
  )

  await page.getByRole('button', { name: 'Go to previous page' }).click()
  await expect(
    page.getByRole('heading', { name: 'What’s new today' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Go to next page' }).click()
  await expect(
    page.getByRole('heading', { name: 'Layer 4: Models', level: 1 }),
  ).toBeVisible()
})

test('the real Kimi K3 pack uses the native reference-style reader', async ({
  page,
  isMobile,
}) => {
  await page.goto('/reader/agent-swarm-demo')
  await expect(page).toHaveURL('/reader/kimi-k3')

  await expect(
    page.getByRole('heading', {
      name: dailyPaper.title,
      level: 1,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Executive Summary' }),
  ).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Concepts' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Causal Evidence' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Full report/ })).toHaveAttribute(
    'href',
    '/reports/kimi-k3/report.html',
  )

  if (!isMobile) {
    await expect(
      page.getByRole('img', { name: 'Rendered source PDF page 1' }),
    ).toBeVisible()
    await expect(page.getByTestId('evidence-highlight')).toHaveCount(4)
    await expect(page.locator('.evidence-badge')).toHaveText('1')
    await page.getByRole('button', { name: 'Next page', exact: true }).click()
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '2')
    await page
      .getByRole('button', {
        name: /GLYPH SYNTHESIS · SOURCE PAGE 4/,
      })
      .click()
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '4')
    await expect(page.locator('.evidence-badge')).toHaveText('2')
    await expect(page.getByTestId('evidence-highlight')).toHaveCount(4)
    await expect(
      page.locator('.kimi-summary-card.is-evidence-active'),
    ).toContainText('Bottom line')
    await expect(page.locator('.kimi-finding-card')).not.toHaveClass(
      /is-evidence-active/,
    )
    await page.getByRole('tab', { name: 'Causal Evidence' }).click()
    await page
      .getByRole('button', {
        name: /Open exact source passage on page 4/,
      })
      .click()
    await expect(
      page.locator('.kimi-evidence-card.is-evidence-active'),
    ).toContainText('16 of 896 experts')
    await expect(
      page.getByText(/INSUFFICIENT_EVIDENCE.*no exact local passage mapped/),
    ).toBeVisible()
  } else {
    await page.getByRole('button', { name: 'Open source PDF' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByRole('dialog').getByRole('img', {
        name: 'Rendered source PDF page 1',
      }),
    ).toBeVisible()
  }
})

test('Glyph it returns a mapped answer and opens its exact citation', async ({
  page,
  isMobile,
}) => {
  await page.route('**/api/reports/kimi-k3/questions', async (route) => {
    const request = route.request()
    expect(request.method()).toBe('POST')
    expect(request.postDataJSON()).toEqual({
      question: 'What does the source claim about expert routing?',
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        outcome: 'ANSWER',
        answerText:
          'Moonshot claims K3 activates 16 of 896 experts and reports an approximate 2.5× scaling-efficiency improvement versus K2.',
        evidenceIds: ['evidence-routing'],
        model: 'gpt-5.6-sol',
        timestamp: '2026-07-22T00:00:00.000Z',
      }),
    })
  })

  await page.goto('/reader/kimi-k3')
  await page
    .getByLabel('Ask a question about the Kimi K3 source')
    .fill('What does the source claim about expert routing?')
  await page.getByRole('button', { name: 'Glyph it', exact: true }).click()
  await expect(page.getByText('Evidence-bound answer')).toBeVisible()
  await expect(
    page.getByText(/Moonshot claims K3 activates 16 of 896/),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Open cited source passage 2' })
    .click()

  if (isMobile) {
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByRole('dialog').getByTestId('pdf-page'),
    ).toHaveAttribute('data-page', '4')
    await expect(
      page.getByRole('dialog').locator('.evidence-badge'),
    ).toHaveText('2')
  } else {
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '4')
    await expect(
      page.getByTestId('pdf-page').locator('.evidence-badge'),
    ).toHaveText('2')
  }
})

test('public landing leads through explicit demo access to the product', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: /Those who understand frontier AI rarely trade it/,
    }),
  ).toBeVisible()
  await expect(page.getByText('Glyph closes the gap.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Create demo account' }),
  ).toHaveCount(0)

  const landingCopy = page.locator('.public-landing-copy')
  const digestPreview = page.getByRole('article', {
    name: 'Glyph Kimi K3 digest preview',
  })
  await expect(
    digestPreview.getByRole('heading', {
      name: '16 of 896: Sparse compute, industrial coordination',
    }),
  ).toBeVisible()
  await expect(
    digestPreview.locator('.public-expert-grid .is-selected'),
  ).toHaveCount(16)

  const copyBox = await landingCopy.boundingBox()
  const digestBox = await digestPreview.boundingBox()
  expect(copyBox).not.toBeNull()
  expect(digestBox).not.toBeNull()
  if ((page.viewportSize()?.width ?? 0) > 820) {
    expect(digestBox?.x).toBeGreaterThan(
      (copyBox?.x ?? 0) + (copyBox?.width ?? 0),
    )
  } else {
    expect(digestBox?.y).toBeGreaterThan(
      (copyBox?.y ?? 0) + (copyBox?.height ?? 0),
    )
  }

  await page.getByRole('link', { name: /Enter Glyph/ }).click()
  await expect(page).toHaveURL('/login')
  await expect(page.getByText(/local demo identity/)).toBeVisible()
  await page.getByRole('tab', { name: 'Sign up' }).click()
  await expect(
    page.getByRole('heading', { name: 'Create your demo access.' }),
  ).toBeVisible()
  await page.getByLabel('Work email').fill('demo@example.com')
  await page.getByRole('button', { name: /Create demo access/ }).click()
  await expect(page).toHaveURL('/home?demo=1')
  await expect(
    page.getByRole('heading', { name: 'What’s new today' }),
  ).toBeVisible()
})

test('home category navigation precedes the latest analysis', async ({
  page,
}) => {
  const categoryNav = page.getByRole('navigation', {
    name: 'Research categories',
  })
  await expect(categoryNav.getByRole('link')).toHaveCount(5)

  const categoryBox = await categoryNav.boundingBox()
  const latestBox = await page
    .getByRole('heading', { name: 'Today’s paper' })
    .boundingBox()
  expect(categoryBox).not.toBeNull()
  expect(latestBox).not.toBeNull()
  expect(categoryBox!.y).toBeLessThan(latestBox!.y)

  await page.getByTestId('category-link-chips-compute').click()
  await expect(page).toHaveURL('/layers/chips-compute')
  await expect(
    page.getByRole('heading', {
      name: 'Layer 2: Chips & Compute',
      level: 1,
    }),
  ).toBeVisible()
})

test('all category screens render their hero, active route, and previews', async ({
  page,
}) => {
  const categories = [
    ['energy', 'Layer 1: Energy'],
    ['chips-compute', 'Layer 2: Chips & Compute'],
    ['cloud-infrastructure', 'Layer 3: Cloud & Infrastructure'],
    ['models', 'Layer 4: Models'],
    ['applications', 'Layer 5: Applications'],
  ] as const

  for (const [slug, heading] of categories) {
    await page.goto(`/layers/${slug}`, { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: heading, level: 1 }),
    ).toBeVisible()
    await expect(page.locator('.category-hero-image')).toBeVisible()
    await expect(page.locator('.category-paper-card')).toHaveCount(
      slug === 'models' ? 1 : 0,
    )
    await expect(
      page.getByRole('navigation', {
        name: 'AI architecture categories',
      }),
    ).toContainText('Energy')
    await expect(page.getByTestId(`category-link-${slug}`)).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(
      page.getByText(
        /Only imported sources with reviewed local report material/,
      ),
    ).toBeVisible()
    if (slug !== 'models') {
      await expect(page.getByText('No imported papers yet')).toBeVisible()
    }
  }
})

test.describe('daily research home', () => {
  test('the paper title opens the evidence reader', async ({ page }) => {
    const title = page.getByTestId('today-paper-title')

    await expect(title).toHaveAttribute('href', dailyPaper.readerHref)
    await title.click()
    await expect(page).toHaveURL(dailyPaper.readerHref)
    await expect(
      page.getByRole('heading', { name: dailyPaper.title, level: 1 }),
    ).toBeVisible()
  })

  test('every content tag opens the matching category', async ({ page }) => {
    const tags = page
      .getByRole('navigation', {
        name: `Content tags for ${dailyPaper.title}`,
      })
      .getByRole('link')

    await expect(tags).toHaveCount(4)
    for (let index = 0; index < (await tags.count()); index += 1) {
      await expect(tags.nth(index)).toHaveAttribute(
        'href',
        dailyPaper.categoryHref,
      )
    }

    await tags.first().focus()
    await expect(tags.first()).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(dailyPaper.categoryHref)
  })

  test('mobile keeps both navigation choices visible and accessible', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile layout behavior')

    await expect(page.getByTestId('today-paper-title')).toBeVisible()
    await expect(page.getByTestId('today-paper-title')).toHaveAttribute(
      'href',
      dailyPaper.readerHref,
    )
    await expect(page.getByTestId('today-tag-models')).toBeVisible()
    await expect(page.getByTestId('today-tag-models')).toHaveAttribute(
      'href',
      dailyPaper.categoryHref,
    )
    const categoryNav = page.getByRole('navigation', {
      name: 'Research categories',
    })
    await expect(categoryNav.getByRole('link')).toHaveCount(5)
    await expect(page.getByTestId('category-link-models')).toHaveAttribute(
      'href',
      '/layers/models',
    )
  })
})

test.describe('desktop evidence reader', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop split-pane behavior')

  test('uses the requested report tabs and maps claims to exact pages', async ({
    page,
  }) => {
    await page.goto('/reader/synthetic-fixture')
    await expect(page.getByText('Glyph Digest')).toBeVisible()
    await expect(page.getByRole('search')).toBeVisible()
    await expect(
      page.getByRole('tab', { name: 'Technical concepts' }),
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Economics' })).toBeVisible()
    await expect(page.locator('.reader-disclosure')).toHaveCount(0)
    await expect(page.locator('.reader-byline time')).toHaveAttribute(
      'datetime',
      '2026-07-21',
    )
    await expect(
      page.getByRole('link', { name: 'Original source' }),
    ).toHaveAttribute('href', '/demo/glyph-agent-swarm-demo.pdf')
    await expect(
      page.getByRole('heading', {
        name: 'Background and current landscape',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Mechanism in plain English' }),
    ).toBeVisible()
    await expect(
      page.getByText('Why this matters for the AI frontier', { exact: true }),
    ).toBeVisible()

    const reportPane = page.locator('.report-pane')
    await reportPane.evaluate((element) => {
      element.scrollTop = 220
    })
    await expect
      .poll(() => reportPane.evaluate((element) => element.scrollTop))
      .toBe(220)
    const scrollBefore = await reportPane.evaluate(
      (element) => element.scrollTop,
    )

    await page
      .getByTestId('report-section-executive-summary')
      .getByTestId('citation-claim-decomposition-evidence-decompose')
      .click()
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '1')
    await expect(page.getByTestId('evidence-highlight')).toBeVisible()
    expect(await reportPane.evaluate((element) => element.scrollTop)).toBe(
      scrollBefore,
    )

    await page.getByRole('tab', { name: 'Economics' }).click()
    await expect(
      page.getByRole('heading', {
        name: 'From mechanism to conditional implications',
      }),
    ).toBeVisible()
    await page
      .getByTestId('citation-claim-no-trade-evidence-no-market')
      .last()
      .click()
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '3')

    await page.getByRole('tab', { name: 'Executive Summary' }).click()
    await page
      .getByTestId('report-section-mechanism')
      .getByTestId('citation-claim-cache-evidence-cache')
      .click()
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '2')

    const technicalEvidence = page.getByTestId(
      'report-section-technical-evidence',
    )
    await expect(technicalEvidence).not.toHaveAttribute('open')
    await technicalEvidence.locator('summary').click()
    await expect(technicalEvidence).toHaveAttribute('open', '')
  })

  test('collapses reader navigation without hiding report controls', async ({
    page,
  }) => {
    await page.goto('/reader/synthetic-fixture')
    await page
      .getByRole('button', { name: 'Collapse reader navigation' })
      .click()
    await expect(page.locator('.app-frame')).toHaveClass(/sidebar-collapsed/)
    await expect(
      page.getByRole('tab', { name: 'Executive Summary' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Expand reader navigation' }).click()
    await expect(page.locator('.app-frame')).not.toHaveClass(
      /sidebar-collapsed/,
    )
  })

  test('invalid and wrong-version evidence fail closed', async ({ page }) => {
    await page.goto('/reader/synthetic-fixture?evidence=evidence-cache')
    await expect(page.getByTestId('pdf-page')).toHaveAttribute('data-page', '2')
    await expect(page.getByTestId('evidence-highlight')).toBeVisible()

    await page.goto('/reader/synthetic-fixture?evidence=unknown-span')
    await expect(page.getByTestId('evidence-error')).toContainText('unknown')
    await expect(page.getByTestId('evidence-highlight')).toHaveCount(0)

    await page.goto('/reader/synthetic-fixture?evidence=__wrong_version_test__')
    await expect(page.getByTestId('evidence-error')).toContainText(
      'another paper version',
    )
    await expect(page.getByTestId('evidence-highlight')).toHaveCount(0)
  })

  test('normalized evidence remains aligned when PDF zoom changes', async ({
    page,
  }) => {
    await page.goto('/reader/synthetic-fixture?evidence=evidence-cache')
    const highlight = page.getByTestId('evidence-highlight').first()
    await expect(highlight).toBeVisible()
    const styleBefore = await highlight.getAttribute('style')
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(page.locator('.zoom-value')).toHaveText('100%')
    await expect(highlight).toBeVisible()
    expect(await highlight.getAttribute('style')).toBe(styleBefore)
  })

  test('PDF load failure is explicit and does not render a highlight', async ({
    page,
  }) => {
    await page.route('**/glyph-agent-swarm-pages/page-02.png', (route) =>
      route.abort(),
    )
    await page.goto('/reader/synthetic-fixture?evidence=evidence-cache')
    await expect(page.locator('.pdf-status.pdf-error')).toContainText(
      'PDF rendering failed',
    )
    await expect(page.getByTestId('evidence-highlight')).toHaveCount(0)
  })
})

test.describe('mobile evidence reader', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile sheet behavior')

  test('opens exact evidence in a sheet and restores trigger focus', async ({
    page,
  }) => {
    await page.goto('/reader/synthetic-fixture')
    await expect(
      page.getByRole('tab', { name: 'Executive Summary' }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: 'Technical concepts' }),
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Economics' })).toBeVisible()
    const trigger = page.getByRole('button', { name: 'Open evidence' }).first()
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('evidence-highlight')).toBeVisible()
    await dialog.getByRole('button', { name: 'Close panel' }).click()
    await expect(trigger).toBeFocused()
  })
})

test('library tabs, concept menu, and detail navigation work', async ({
  page,
}) => {
  await page.goto('/library')
  await expect(page.locator('.library-concept-card')).toHaveCount(5)
  await page
    .getByRole('link', { name: /Work packet/, exact: false })
    .first()
    .click()
  await expect(
    page.getByRole('heading', { name: 'Work packet', level: 1 }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to library' }).click()
  await page.getByRole('link', { name: /Reports/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Saved reports' }),
  ).toBeVisible()
  await page.getByRole('link', { name: /Monitoring/ }).click()
  await expect(page.getByText('No monitoring items')).toBeVisible()
})

test('subscriber archive is denied to visitors and allowed by server role', async ({
  page,
  context,
}) => {
  await page.goto('/reports/archive-preview')
  await expect(page.getByText('Subscriber permission required')).toBeVisible()
  await context.addCookies([
    {
      name: 'glyph-demo-role',
      value: 'SUBSCRIBER',
      url: 'http://127.0.0.1:3000',
    },
  ])
  await page.reload()
  await expect(page.getByText('Subscriber access confirmed')).toBeVisible()
})

test('editor and previews stay admin-only', async ({
  page,
  context,
  isMobile,
}) => {
  await page.goto('/editor')
  await expect(page.getByText('Editor permission required')).toBeVisible()
  if (isMobile) {
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }),
    ).toHaveCount(0)
  } else {
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }).first(),
    ).not.toContainText('Previews')
  }

  await context.addCookies([
    { name: 'glyph-demo-role', value: 'EDITOR', url: 'http://127.0.0.1:3000' },
  ])
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Agent Runs & Submissions' }),
  ).toBeVisible()
  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation' }).click()
  }
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).first(),
  ).toContainText('Previews')
  if (isMobile) {
    await page.getByRole('button', { name: 'Close panel' }).click()
  }
  await page.getByRole('button', { name: 'Accept paper' }).click()
  await expect(page.getByRole('button', { name: 'Accepted' })).toBeDisabled()
  await page.goto('/previews/newsletter')
  await expect(
    page.getByTestId('newsletter-bullets').locator('li'),
  ).toHaveCount(5)
  await expect(
    page.getByRole('button', { name: /Send newsletter/ }),
  ).toBeDisabled()
})

test('keyboard skip link and serious accessibility checks pass', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await expectNoSevereA11yViolations(page)
})

test('unknown report uses the explicit not-found state', async ({ page }) => {
  await page.goto('/reports/not-a-report')
  await expect(
    page.getByRole('heading', {
      name: 'This report is not available',
    }),
  ).toBeVisible()
  await expect(page.getByText(/will not fabricate/)).toBeVisible()
})
