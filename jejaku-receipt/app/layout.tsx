import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "./components/Providers";
import "./globals.css";

// Self-hosted (fonts/inter-*.woff2, latin subset, static weights 300-600
// pulled straight from Google Fonts' own CDN) rather than next/font/google
// — that fetches over the network at *build* time, which fails the whole
// Docker build outright if the build environment can't reach
// fonts.googleapis.com even momentarily. Self-hosting removes that
// dependency entirely; the font never changes, so there's nothing to stay
// "in sync" with by fetching it fresh each build.
const inter = localFont({
  variable: "--font-inter",
  src: [
    { path: "./fonts/inter-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Jejaku — Things I built while learning",
  description:
    "Personal projects, shared for free. No product, no pricing, just what I've built.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans ss01">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
