import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '../tests/backend/{unittest,integration,e2e}/**/*.test.ts',
      '../tests/backend/{unittest,integration,e2e}/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '../tests/backend/**',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
})
