import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'server/**/*.test.*',
      'client/**/*.test.*'
    ],
    coverage: {
        provider: 'v8',
        include: ['server/**/*.ts', 'client/**/*.ts'],
        exclude: ['**/*.d.ts', 'node_modules/**', '*config.ts', 'index.ts', 'utils.ts', 'test/**', 'vite.*', '*hooks/**'],
    },
    globals: true
  }
})
