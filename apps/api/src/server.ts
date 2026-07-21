import {
  InMemoryGlyphRepository,
  createPostgresRepository,
} from '@glyph/database'

import { buildApp } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig()
const persistence =
  config.DATABASE_URL === undefined
    ? {
        repository: new InMemoryGlyphRepository(),
        close: () => Promise.resolve(),
      }
    : createPostgresRepository(config.DATABASE_URL)

const app = await buildApp({ config, repository: persistence.repository })

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down Glyph API')
  await app.close()
  await persistence.close()
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ host: config.HOST, port: config.PORT })
} catch (error) {
  app.log.error(error)
  await persistence.close()
  process.exitCode = 1
}
