import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'frontend/vitest.config.ts',
      'backend/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        'tests/**',
        'frontend/src/middleware.ts',
        'frontend/src/test-utils/**',
        'backend/dist/**',
      ],
    },
  },
})
