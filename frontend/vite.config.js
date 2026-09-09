import path from "node:path";
import { fileURLToPath } from "node:url";
// vitest/config re-exports vite's defineConfig plus the `test` field — build/dev
// are unaffected, we just get to declare test config in the same file.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // No prod sourcemaps — smaller output, no source disclosure.
    sourcemap: false,
    // Route-level splitting already lives in the router (React.lazy); this
    // additionally carves the heavy shared vendors into long-cache-friendly
    // chunks so a storefront visit doesn't ship firebase/tiptap it never uses.
    rollupOptions: {
      output: {
        manualChunks: process.env.VITE_NO_CHUNKS
          ? undefined
          : (id) => {
              if (!id.includes("node_modules")) return undefined;
              if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return "vendor-react";
              if (id.includes("firebase") || id.includes("@firebase")) return "vendor-firebase";
              if (id.includes("framer-motion")) return "vendor-motion";
              if (id.includes("@tanstack")) return "vendor-query";
              if (id.includes("radix-ui") || id.includes("lucide-react")) return "vendor-ui";
              return undefined;
            },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
  },
});
