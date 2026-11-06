import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Noto_Sans_Bengali, Outfit } from "next/font/google";
import { RetailHeader, SiteFooter } from "@/components/retail-header";
import { getViewer } from "@/lib/commerce/session";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["500", "600"], variable: "--font-bengali", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Online Market", template: "%s — Online Market" },
  description: "A Bangladesh-first multi-seller shop. Product reels are the way to browse. Checkout opens only when the shop is configured.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F3EEE6" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${bengali.variable}`}>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <RetailHeader viewer={viewer} />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
