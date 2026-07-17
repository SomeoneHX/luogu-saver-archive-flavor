import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { copyFileSync, existsSync } from "node:fs";

export default defineConfig({
  base: process.env.NODE_ENV === "production"
    ? "/luogu-saver-archive-flavor/"
    : "/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-fallback",
      closeBundle() {
        const outDir = path.resolve(__dirname, "dist");
        const index = path.join(outDir, "index.html");
        if (existsSync(index)) {
          copyFileSync(index, path.join(outDir, "404.html"));
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: { outDir: "dist" },
});
