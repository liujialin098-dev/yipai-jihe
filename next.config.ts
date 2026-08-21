import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "26.26.26.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gmjtzmxuveoaqcdmuifr.supabase.co",
        pathname: "/storage/v1/object/sign/wardrobe-images/**",
      },
    ],
  },
};

export default nextConfig;
