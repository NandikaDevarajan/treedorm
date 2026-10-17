import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The sign-in email embeds this image inline; make sure it ships with the route on Vercel.
  outputFileTracingIncludes: {
    "/api/auth/start": ["./public/assets/characters/hedgehog-email.png"],
  },
};

export default nextConfig;
