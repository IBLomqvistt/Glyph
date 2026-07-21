import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'
import type { PaperRepository } from '@glyph/application'
import {
  PaperSchema,
  PaperVersionSchema,
  type Id,
  type Paper,
  type PaperVersion,
} from '@glyph/domain'
import * as schema from './schema'

let pool: Pool | undefined
let database: NodePgDatabase<typeof schema> | undefined

export function getDatabase(): NodePgDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for the PostgreSQL adapter.')
  }
  pool ??= new Pool({ connectionString })
  database ??= drizzle(pool, { schema })
  return database
}

export class PostgresPaperRepository implements PaperRepository {
  constructor(
    private readonly databaseProvider: () => NodePgDatabase<
      typeof schema
    > = getDatabase,
  ) {}

  async getPaper(id: Id): Promise<Paper | null> {
    const [row] = await this.databaseProvider()
      .select({ payload: schema.papers.payload })
      .from(schema.papers)
      .where(eq(schema.papers.id, id))
      .limit(1)
    return row ? PaperSchema.parse(row.payload) : null
  }

  async getVersion(id: Id): Promise<PaperVersion | null> {
    const [row] = await this.databaseProvider()
      .select({ payload: schema.paperVersions.payload })
      .from(schema.paperVersions)
      .where(eq(schema.paperVersions.id, id))
      .limit(1)
    return row ? PaperVersionSchema.parse(row.payload) : null
  }
}

export { schema }
