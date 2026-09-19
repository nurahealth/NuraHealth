import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// ── Background-removal model files ───────────────────────────────────────────
// @imgly/background-removal-node loads its ONNX model from its own dist folder
// at runtime (file:// reads the tracer can't see), so the files have to be
// listed explicitly for the server functions that process images. Only the
// model packshot.ts uses (BG_MODEL) is shipped — the package carries two, and
// both together push a function toward Vercel's size limit.
const BG_MODEL = "medium";
const IMGLY_DIST = "node_modules/@imgly/background-removal-node/dist";
function bgModelFiles(): string[] {
  try {
    const resources = JSON.parse(
      fs.readFileSync(path.join(__dirname, IMGLY_DIST, "resources.json"), "utf8")
    ) as Record<string, { chunks: { hash: string }[] }>;
    const chunks = resources[`/models/${BG_MODEL}`]?.chunks ?? [];
    return [`./${IMGLY_DIST}/resources.json`, ...chunks.map((c) => `./${IMGLY_DIST}/${c.hash}`)];
  } catch {
    return [];
  }
}
// Every route that can call storePackshot.
const IMAGE_ROUTES = [
  "/api/admin/catalog/products/bulk",
  "/api/admin/catalog/import/off-bulk",
  "/api/admin/catalog/images/backfill",
];

const nextConfig: NextConfig = {
  // The project lives inside the Obsidian vault, so Turbopack's automatic root
  // detection walks too far up and misses node_modules. Pin it to this folder.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Native ONNX runtime + model loader: required at runtime from node_modules,
  // never bundled. (onnxruntime-node is already on Next's built-in list.)
  serverExternalPackages: ["@imgly/background-removal-node"],
  outputFileTracingIncludes: Object.fromEntries(IMAGE_ROUTES.map((r) => [r, bgModelFiles()])),
  // Deploys run on Linux: drop the macOS and Windows ONNX runtimes (~100 MB).
  outputFileTracingExcludes: Object.fromEntries(
    IMAGE_ROUTES.map((r) => [
      r,
      [
        "./node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*",
        "./node_modules/onnxruntime-node/bin/napi-v3/win32/**/*",
      ],
    ])
  ),
};

export default nextConfig;
