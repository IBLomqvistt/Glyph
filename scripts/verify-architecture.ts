import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

type Rule = {
  root: string
  description: string
  forbidden: RegExp[]
}

const rules: Rule[] = [
  {
    root: 'packages/domain',
    description: 'domain must not import application or infrastructure',
    forbidden: [
      /from ['"]@glyph\/(application|ai|database|diagrams|ui)['"]/,
      /from ['"].*apps\//,
    ],
  },
  {
    root: 'packages/ui',
    description: 'UI primitives must not import provider SDKs',
    forbidden: [
      /from ['"](openai|stripe|drizzle-orm|pg|postgres)['"]/,
      /from ['"]@glyph\/(ai|database)['"]/,
    ],
  },
  {
    root: 'packages/application',
    description: 'application may depend on domain but not infrastructure',
    forbidden: [
      /from ['"]@glyph\/(ai|database|diagrams|ui)['"]/,
      /from ['"](openai|stripe|drizzle-orm|pg|next)['"]/,
      /from ['"].*apps\//,
    ],
  },
]

async function sourceFiles(root: string): Promise<string[]> {
  const results: string[] = []

  async function walk(directory: string): Promise<void> {
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return
      }
      throw error
    }

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        ['node_modules', '.next', 'dist', 'coverage'].includes(entry.name)
      ) {
        continue
      }
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(target)
      } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
        results.push(target)
      }
    }
  }

  await walk(root)
  return results
}

const violations: string[] = []

for (const rule of rules) {
  for (const file of await sourceFiles(rule.root)) {
    const content = await readFile(file, 'utf8')
    for (const pattern of rule.forbidden) {
      if (pattern.test(content)) {
        violations.push(`${file}: ${rule.description} (${pattern.source})`)
      }
    }
  }
}

for (const file of await sourceFiles('apps/web')) {
  const content = await readFile(file, 'utf8')
  if (
    content.startsWith("'use client'") &&
    /from ['"](openai|stripe|drizzle-orm|pg|postgres)['"]/.test(content)
  ) {
    violations.push(`${file}: client component imports a provider SDK`)
  }
  if (
    content.startsWith("'use client'") &&
    /from ['"]@glyph\/(ai|database)['"]/.test(content)
  ) {
    violations.push(`${file}: client component imports infrastructure`)
  }
}

for (const root of [
  'packages/ai',
  'packages/database',
  'packages/diagrams',
  'packages/ui',
]) {
  for (const file of await sourceFiles(root)) {
    const content = await readFile(file, 'utf8')
    if (/from ['"].*apps\//.test(content)) {
      violations.push(`${file}: package imports an application entry point`)
    }
  }
}

if (violations.length > 0) {
  console.error('Glyph architecture verification failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exitCode = 1
} else {
  console.log('Glyph architecture verification passed.')
}
