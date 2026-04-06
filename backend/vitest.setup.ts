import path from 'node:path'
import { URL } from 'node:url'
import dotenv from 'dotenv'

const envPath = path.resolve(__dirname, '.env.test')

dotenv.config({
  path: envPath,
  override: true,
})

process.env.NODE_ENV = 'test'

function getSchemaName(databaseUrl: string): string {
  const parsedUrl = new URL(databaseUrl)
  return parsedUrl.searchParams.get('schema')?.trim() || 'public'
}

function assertSafeTestDatabaseUrl(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error(`Missing DATABASE_URL for tests. Expected it in ${envPath}`)
  }

  const schemaName = getSchemaName(databaseUrl)

  if (schemaName === 'public') {
    throw new Error('Refusing to run backend tests against the public schema.')
  }

  if (!/test/i.test(schemaName)) {
    throw new Error(`Refusing to run backend tests against non-test schema "${schemaName}".`)
  }
}

assertSafeTestDatabaseUrl(process.env.DATABASE_URL)
