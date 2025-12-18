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
        exclude: ['**/*.d.ts', 'node_modules/**', '*config.ts', 'index.ts', 'utils.ts', 'test/**', 'vite.*'],
    },
    // default environment is 'node' which works for server tests;
    // annotate client tests with `// @vitest-environment jsdom` if they need DOM.
    globals: true
  }
})
