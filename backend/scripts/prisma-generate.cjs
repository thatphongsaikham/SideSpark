const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const backendDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(backendDir, '..')
const pnpmStoreDir = path.join(repoRoot, 'node_modules', '.pnpm')
const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma')

function resolveFromBackend(specifier) {
  return require.resolve(specifier, { paths: [backendDir] })
}

function findEngineFile(enginesDir, matcher) {
  return fs.readdirSync(enginesDir).find(matcher)
}

function findGeneratedClientDir() {
  const prismaClientPackageJson = resolveFromBackend('@prisma/client/package.json')
  const prismaClientDir = path.dirname(prismaClientPackageJson)

  return path.join(prismaClientDir, '..', '..', '.prisma', 'client')
}

function shouldSkipGenerate() {
  if (!fs.existsSync(schemaPath)) {
    return false
  }

  const generatedClientDir = findGeneratedClientDir()
  const generatedQueryEngine = fs.existsSync(generatedClientDir)
    ? findEngineFile(
        generatedClientDir,
        (file) =>
          /^(libquery_engine|query_engine)-.*\.(so\.node|dylib\.node|dll\.node)$/.test(file),
      )
    : null

  if (!generatedQueryEngine) {
    return false
  }

  const requiredGeneratedFiles = [
    path.join(generatedClientDir, 'default.js'),
    path.join(generatedClientDir, 'index.js'),
    path.join(generatedClientDir, 'schema.prisma'),
  ]

  if (!requiredGeneratedFiles.every((file) => fs.existsSync(file))) {
    return false
  }

  const schemaMtime = fs.statSync(schemaPath).mtimeMs

  return requiredGeneratedFiles.every(
    (file) => fs.statSync(file).mtimeMs >= schemaMtime,
  )
}

function findEnginesDir() {
  if (!fs.existsSync(pnpmStoreDir)) {
    return null
  }

  const prismaEnginesPackageDir = fs
    .readdirSync(pnpmStoreDir)
    .find((entry) => entry.startsWith('@prisma+engines@'))

  if (!prismaEnginesPackageDir) {
    return null
  }

  const enginesDir = path.join(
    pnpmStoreDir,
    prismaEnginesPackageDir,
    'node_modules',
    '@prisma',
    'engines',
  )

  return fs.existsSync(enginesDir) ? enginesDir : null
}

function applyOfflineEngineOverrides(env) {
  const enginesDir = findEnginesDir()
  if (!enginesDir) {
    return {
      ...env,
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING:
        env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING || '1',
    }
  }

  const schemaEngine = findEngineFile(enginesDir, (file) => file.startsWith('schema-engine-'))
  const queryEngineLibrary = findEngineFile(
    enginesDir,
    (file) =>
      /^(libquery_engine|query_engine)-.*\.(so\.node|dylib\.node|dll\.node)$/.test(file),
  )

  return {
    ...env,
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING:
      env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING || '1',
    ...(schemaEngine && !env.PRISMA_SCHEMA_ENGINE_BINARY
      ? { PRISMA_SCHEMA_ENGINE_BINARY: path.join(enginesDir, schemaEngine) }
      : {}),
    ...(queryEngineLibrary && !env.PRISMA_QUERY_ENGINE_LIBRARY
      ? { PRISMA_QUERY_ENGINE_LIBRARY: path.join(enginesDir, queryEngineLibrary) }
      : {}),
  }
}

if (shouldSkipGenerate()) {
  process.exit(0)
}

const prismaCli = resolveFromBackend('prisma/build/index.js')
const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
  cwd: backendDir,
  env: applyOfflineEngineOverrides(process.env),
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}

if ((result.status ?? 1) !== 0 && process.platform === 'win32') {
  console.error(
    '\nPrisma generate failed on Windows. Stop running Node.js processes that use Prisma and retry.',
  )
}

process.exit(result.status ?? 1)
