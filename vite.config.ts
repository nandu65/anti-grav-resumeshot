import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const root = fs.realpathSync(process.cwd());
  return {
    root,
    server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/docx/")) {
            return "vendor-docx";
          }
          if (id.includes("node_modules/jspdf/") || id.includes("node_modules/html2canvas/")) {
            return "vendor-pdf";
          }
          if (id.includes("node_modules/pdfjs-dist/")) {
            return "vendor-pdfjs";
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@radix-ui/") || id.includes("node_modules/lucide-react/")) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
        },
      },
    },
  },
};
});
