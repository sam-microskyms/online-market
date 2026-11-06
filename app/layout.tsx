import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Noto_Sans_Bengali, Outfit } from "next/font/google";
import { MarketProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["500", "600"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Online Market — demo",
    template: "%s — Online Market demo",
  },
  description:
    "Interactive demo of a Bangladesh-first multi-seller marketplace. No real payments, accounts, or orders.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F3EEE6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${bengali.variable}`}>
      <body>
        <MarketProvider>
          <Shell>{children}</Shell>
        </MarketProvider>
      </body>
    </html>
  );
}
