import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BROWSER_DEMO:
      process.env.VERCEL === "1" || process.env.BROWSER_DEMO === "1"
        ? "true"
        : "false",
  },
  /* config options here */
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
