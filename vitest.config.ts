import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@glyph/domain/runtime-agents': fromRoot(
        './packages/domain/src/runtime-agents.ts',
      ),
      '@glyph/domain': fromRoot('./packages/domain/src/index.ts'),
      '@glyph/application': fromRoot('./packages/application/src/index.ts'),
      '@glyph/database': fromRoot('./packages/database/src/index.ts'),
      '@glyph/openai': fromRoot('./packages/openai/src/index.ts'),
    },
  },
  test: {
    coverage: { reporter: ['text', 'json-summary'] },
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
  },
})
