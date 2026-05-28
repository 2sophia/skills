import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // image can run `node server.js` without node_modules. Required by the
  // multi-stage Dockerfile + docker-entrypoint.sh `--frontend` path.
  output: "standalone",
  async rewrites() {
    return [
      {
        // Let the browser hit /health and have it answer from the backend.
        source: "/health",
        destination: `${process.env.FASTAPI_URL || "http://localhost:8000"}/health`,
      },
    ];
  },
};

export default nextConfig;
