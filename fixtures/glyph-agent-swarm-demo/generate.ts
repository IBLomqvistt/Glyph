import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'prettier'
import { buildSyntheticEdition, buildSyntheticPdf } from './source'

const fixtureDirectory = dirname(fileURLToPath(import.meta.url))
const webAssetDirectory = resolve(
  fixtureDirectory,
  '../../apps/web/public/demo',
)
await mkdir(webAssetDirectory, { recursive: true })

const [{ bytes }, edition] = await Promise.all([
  buildSyntheticPdf(),
  buildSyntheticEdition(),
])
const editionJson = await format(JSON.stringify(edition), { parser: 'json' })

await Promise.all([
  writeFile(resolve(fixtureDirectory, 'paper.pdf'), bytes),
  writeFile(resolve(fixtureDirectory, 'edition.json'), editionJson, 'utf8'),
  writeFile(resolve(webAssetDirectory, 'glyph-agent-swarm-demo.pdf'), bytes),
])

process.stdout.write(
  `Generated deterministic fixture ${edition.version.checksumSha256}\n`,
)
