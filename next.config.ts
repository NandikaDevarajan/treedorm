import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Listing photos are served (and resized) by Cloudinary.
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  // The sign-in email embeds this image inline; make sure it ships with the route on Vercel.
  outputFileTracingIncludes: {
    "/api/auth/start": ["./public/assets/characters/hedgehog-email.png"],
  },
};

export default nextConfig;
