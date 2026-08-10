import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'oggmpexsscquyfwlbcwo.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cwoxuodcsfacvtojqjpz.supabase.co',
      },
    ],
  },
};

export default nextConfig;
