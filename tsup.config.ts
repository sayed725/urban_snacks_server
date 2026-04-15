import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "api",
  external: ["pg-native"],
  skipNodeModulesBundle: true, // Prevents bundling node_modules (Avoids Vercel crashes)
  shims: true, // Fixes __dirname and other ESM compatibility issues
  outExtension() {
    return { js: ".mjs" }; // Outputs server.mjs
  },
  clean: true, // Clears the api/ folder before every build
});