import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@life-community-os/ui",
    "@life-community-os/types",
    "@life-community-os/auth",
    "@life-community-os/database",
    "@life-community-os/design-tokens",
    "@life-community-os/tenant-life-panoramica",
    "@life-community-os/tenant-life-valley",
    "@life-community-os/tenant-life-ocean-hills",
    "@life-community-os/assets",
    "@life-community-os/life-map-renderer",
    "@life-community-os/life-map-renderer-maplibre",
    "@life-community-os/life-map-renderer-3d-layer",
    "@life-community-os/life-map-renderer-three",
    "@life-community-os/life-map-provider-osm",
    "@life-community-os/address-geocoder",
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
