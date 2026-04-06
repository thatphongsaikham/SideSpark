const path = require('node:path')
const { URL } = require('node:url')
const { spawnSync } = require('node:child_process')
const dotenv = require('dotenv')

const backendDir = path.resolve(__dirname, '..')
const envPath = path.join(backendDir, '.env.test')

dotenv.config({
  path: envPath,
  override: true,
})

process.env.NODE_ENV = 'test'

function getSchemaName(databaseUrl) {
  const parsedUrl = new URL(databaseUrl)
  return parsedUrl.searchParams.get('schema')?.trim() || 'public'
}

function assertSafeTestDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error(`Missing DATABASE_URL for tests. Expected it in ${envPath}`)
  }

  const schemaName = getSchemaName(databaseUrl)

  if (schemaName === 'public') {
    throw new Error(
      `Refusing to run backend tests against the public schema. Use a dedicated test schema in ${envPath}.`,
    )
  }

  if (!/test/i.test(schemaName)) {
    throw new Error(
      `Refusing to run backend tests against non-test schema "${schemaName}".`,
    )
  }
}

assertSafeTestDatabaseUrl(process.env.DATABASE_URL)

const prismaCli = require.resolve('prisma/build/index.js', { paths: [backendDir] })
const result = spawnSync(
  process.execPath,
  [prismaCli, 'db', 'push', '--skip-generate', '--accept-data-loss'],
  {
    cwd: backendDir,
    env: process.env,
    stdio: 'inherit',
  },
)

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
