import type { Metadata, Viewport } from "next";
import { Nunito, Sniglet } from "next/font/google";
import "./globals.css";

// Display face is a stand-in for Bloom Spring (see styles/tokens.css SPEC-NOTE).
const display = Sniglet({ variable: "--font-display-face", subsets: ["latin"], weight: ["400", "800"] });
const body = Nunito({ variable: "--font-body-face", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tree Dorm",
  description: "A campus marketplace where verified students run little treehouse shops.",
  appleWebApp: { capable: true, title: "Tree Dorm", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EADDCA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
