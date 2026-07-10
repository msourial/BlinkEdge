import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { SwUpdateNotification } from "./components/SwUpdateNotification";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlinkEdge AR HUD",
  description: "Live Sports AR Analytics & Hedging",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#0a0a0f]">
      <body className="h-full min-h-screen bg-[#0a0a0f] text-white antialiased overflow-x-hidden m-0 p-0">
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
          <SwUpdateNotification />
        </SerwistProvider>
      </body>
    </html>
  );
}
