import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/test/e2e/resumeBuilder.test.ts", "node_modules/**"],
  },
  resolve: {
    preserveSymlinks: true,
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
