import { readdir, readFile } from 'node:fs/promises'

import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (connectionString === undefined || connectionString.trim().length === 0) {
  throw new Error('DATABASE_URL is required to run migrations')
}

const migrationsDirectory = new URL('../migrations/', import.meta.url)
const migrationNames = (await readdir(migrationsDirectory))
  .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
  .sort()
const pool = new Pool({ connectionString, max: 1 })
const client = await pool.connect()

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS glyph_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  for (const migrationName of migrationNames) {
    const existing = await client.query<{ name: string }>(
      'SELECT name FROM glyph_migrations WHERE name = $1',
      [migrationName],
    )
    if (existing.rowCount !== 0) {
      process.stdout.write(`${migrationName} already applied\n`)
      continue
    }
    const sql = await readFile(
      new URL(migrationName, migrationsDirectory),
      'utf8',
    )
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO glyph_migrations (name) VALUES ($1)', [
        migrationName,
      ])
      await client.query('COMMIT')
      process.stdout.write(`Applied ${migrationName}\n`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
} finally {
  client.release()
  await pool.end()
}
