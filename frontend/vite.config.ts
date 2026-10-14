/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/** robots.txt needs an absolute Sitemap URL, so it is generated from VITE_SITE_URL. */
function robotsTxt(siteUrl: string): Plugin {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\/$/, "")}/sitemap.xml\n`;
  return {
    name: "robots-txt",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: body });
    },
    configureServer(server) {
      server.middlewares.use("/robots.txt", (_req, res) => {
        res.setHeader("Content-Type", "text/plain");
        res.end(body);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    robotsTxt(loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL || "http://localhost:5173"),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
}));
