import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Load .env.development in dev and .env.production in build
  const env = loadEnv(mode, process.cwd(), "");

  // Replit cartographer plugin only in Replit + non-prod
  const maybeCartographer =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? (await import("@replit/vite-plugin-cartographer")).cartographer()
      : null;

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(maybeCartographer ? [maybeCartographer] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    // 🔑 Dynamic base: dev=/, GitHub Pages=/ander/
    base: env.VITE_BASE || "/",

    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    optimizeDeps: {
      include: ["@supabase/supabase-js"],
    },
  };
});
