import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    exclude: ['test/integration/**', '**/node_modules/**', '**/dist/**'],
    coverage: { reporter: ['text', 'json-summary'], include: ['src/**/*.ts'] },
  },
});
