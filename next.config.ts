import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
    ],
  },
  output: "standalone",
};

export default nextConfig;
