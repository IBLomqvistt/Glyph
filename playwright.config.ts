import { defineConfig, devices } from '@playwright/test'

const testPort = process.env.GLYPH_TEST_PORT ?? '3000'
const baseURL = `http://127.0.0.1:${testPort}`

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  timeout: 60_000,
  workers: 2,
  forbidOnly: true,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `pnpm --filter @glyph/web exec next start -p ${testPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
