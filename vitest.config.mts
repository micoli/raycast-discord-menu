import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The raycast api only runs inside raycast
    alias: { "@raycast/api": fileURLToPath(new URL("tests/stubs/raycast-api.ts", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
