import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // setup.js seeds fake-but-valid env vars so config/env.js passes its boot-time
    // validation without depending on a real .env — keeps the suite self-contained
    // and CI-ready. dotenv won't override values already set here.
    setupFiles: ["./test/setup.js"],
    include: ["test/**/*.test.js"],
  },
});
