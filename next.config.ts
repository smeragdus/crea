import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  agentRules: false,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
