import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // This setting explicitly tells Turbopack the root of your monorepo.
    // It helps resolve the workspace's node_modules (fixing "next/link") 
    // and path aliases like `@/` (fixing "@/lib/api").
    root: __dirname + '/../..',
  },
};

export default nextConfig;
