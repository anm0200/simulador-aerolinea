import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests E2E take longer due to actual browser interactions
    testTimeout: 60000,
    hookTimeout: 60000,
    globals: true,
    globalSetup: ["./src/utils/globalSetup.ts"],
    fileParallelism: false, // Vitest v4: run test files sequentially
  },
});
