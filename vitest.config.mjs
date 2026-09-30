import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['lib/test/**/*.spec.ts'],
		coverage: {
			include: ['lib/src/**'],
			reporter: ['text', 'cobertura'],
			reportsDirectory: './coverage',
			thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
		},
	},
});
