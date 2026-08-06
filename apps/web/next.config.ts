import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@life-community-os/ui",
    "@life-community-os/types",
    "@life-community-os/auth",
    "@life-community-os/database",
    "@life-community-os/design-tokens",
    "@life-community-os/tenant-life-panoramica",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
