import type { Metadata, Viewport } from "next";
import { National_Park } from "next/font/google";
import localFont from "next/font/local";
import { EntranceGlow } from "@/components/EntranceGlow";
import "./globals.css";

// SPEC §9.3: Bloom Spring for big headings only (page titles, section headings, treehouse names);
// National Park for all other text.
const display = localFont({
  src: "../public/assets/fonts/Bloom Spring.otf",
  variable: "--font-display",
  display: "swap",
});
// Next has no fallback metrics for National Park, so skip its size-adjusted fallback.
const body = National_Park({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

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
      {/* suppressHydrationWarning: extensions like Grammarly add attributes to <body> before React hydrates.
          body.className applies National Park directly, on top of the --font-body variable. */}
      <body className={`${body.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <EntranceGlow />
      </body>
    </html>
  );
}
