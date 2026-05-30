import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests E2E take longer due to actual browser interactions
    testTimeout: 60000,
    hookTimeout: 30000,
    globals: true,
    globalSetup: ["./src/utils/globalSetup.ts"],
    poolOptions: {
      threads: {
        singleThread: true, // Correr en serie para evitar conflictos en BD
      },
    },
  },
});
