import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A stray lockfile in the parent dir otherwise makes Next pick the wrong workspace root.
  turbopack: { root: __dirname },
};

export default nextConfig;
