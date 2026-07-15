import type { Metadata, Viewport } from "next";
import { site } from "@/lib/content";
import "./globals.css";

/**
 * Sade kök layout. aero_cal'daki eski koyu kimlik chrome'u (Preloader /
 * SiteBackground / SideRails / Cursor) burada YOK — her sahne kendi
 * atmosferini kendisi kuruyor, üstüne başka bir katman binmiyor.
 */
export const metadata: Metadata = {
  title: `${site.event} ${site.year} — Sahneler`,
  description:
    "AERO Sirkülasyon Çalıştayı '26 için WebGL hero sahneleri. Hepsi gerçek three.js.",
};

export const viewport: Viewport = {
  themeColor: "#0d707e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
