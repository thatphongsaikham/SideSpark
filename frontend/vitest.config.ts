import fs from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const frontendNodeModules = path.resolve(__dirname, './node_modules')

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function packageAlias(packageName: string, packagePath: string) {
  return {
    find: new RegExp(`^${escapeRegex(packageName)}(\\/.*)?$`),
    replacement: `${packagePath}$1`,
  }
}

const frontendPackageAliases = fs.existsSync(frontendNodeModules)
  ? fs.readdirSync(frontendNodeModules, { withFileTypes: true }).flatMap((entry) => {
      if (!entry.isDirectory() || entry.name === '.bin') {
        return []
      }

      if (entry.name.startsWith('@')) {
        const scopeDir = path.join(frontendNodeModules, entry.name)
        return fs.readdirSync(scopeDir, { withFileTypes: true })
          .filter((pkg) => pkg.isDirectory())
          .map((pkg) => packageAlias(`${entry.name}/${pkg.name}`, path.join(scopeDir, pkg.name)))
      }

      return [packageAlias(entry.name, path.join(frontendNodeModules, entry.name))]
    })
  : []

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    include: [
      '../tests/frontend/{unittest,integration,e2e}/**/*.test.ts',
      '../tests/frontend/{unittest,integration,e2e}/**/*.test.tsx',
      '../tests/frontend/{unittest,integration,e2e}/**/*.spec.ts',
      '../tests/frontend/{unittest,integration,e2e}/**/*.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/middleware.ts',
        'src/test-utils/**',
        '**/*.d.ts',
        '**/*.config.*',
        '../tests/frontend/**',
      ],
    },
  },
  resolve: {
    alias: [
      ...frontendPackageAliases,
      {
        find: /^@\/(.*)$/,
        replacement: `${path.resolve(__dirname, './src')}/$1`,
      },
    ],
  },
})
