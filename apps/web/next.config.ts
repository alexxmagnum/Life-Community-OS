import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@life-community-os/ui",
    "@life-community-os/types",
    "@life-community-os/auth",
    "@life-community-os/database",
  ],
};

export default nextConfig;
