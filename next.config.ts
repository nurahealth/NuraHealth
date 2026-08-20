import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project lives inside the Obsidian vault, so Turbopack's automatic root
  // detection walks too far up and misses node_modules. Pin it to this folder.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
