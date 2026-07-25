import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./vitest.setup.ts"],
		environment: "node",
		globals: true,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts"],
			thresholds: { lines: 70 },
		},
	},
});
