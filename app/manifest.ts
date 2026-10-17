import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tree Dorm",
    short_name: "Tree Dorm",
    description: "A campus marketplace where verified students run little treehouse shops.",
    start_url: "/",
    display: "standalone",
    background_color: "#EADDCA",
    theme_color: "#EADDCA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
