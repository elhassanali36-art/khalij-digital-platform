import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/khalij-digital-platform",
  assetPrefix: "/khalij-digital-platform",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
