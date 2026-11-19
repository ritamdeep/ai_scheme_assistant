import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Limit build concurrency to avoid Windows/OneDrive file locking on .next directories
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
