/* oxlint-disable no-unsafe-assignment, no-unsafe-call, no-unsafe-type-assertion -- Vite/esbuild config types not fully resolved */
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { build as esbuild } from "esbuild";
import vue from "@vitejs/plugin-vue";

const root = import.meta.dirname as string;

const buildExtensionScripts = (): Plugin => ({
  async closeBundle(): Promise<void> {
    await esbuild({
      bundle: true,
      entryPoints: [`${root}/src/background.ts`],
      format: "esm",
      outfile: `${root}/dist/background.js`,
      target: "chrome120",
    });
    await esbuild({
      bundle: true,
      entryPoints: [`${root}/src/content.ts`],
      format: "iife",
      outfile: `${root}/dist/content.js`,
      target: "chrome120",
    });
  },
  name: "build-extension-scripts",
});

// oxlint-disable-next-line import/no-default-export -- Required by Vite
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
  },
  plugins: [vue(), buildExtensionScripts()],
});
