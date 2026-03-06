import type { NextConfig } from "next";

const internalApiUrl =
  process.env.INTERNAL_API_URL?.replace(/\/$/, "") ?? "http://lnu_api:3000"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig;
