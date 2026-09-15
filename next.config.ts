import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static material previews are served by the CDN, not bundled in the chat function.
  outputFileTracingExcludes: { '/api/chat': ['./public/materials/**/*'] },
};

export default nextConfig;
