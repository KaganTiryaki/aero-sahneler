import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { site, hero, nav, disciplines } from "@/lib/content";
import { istasyonlariKur } from "@/components/yolculuk/istasyonlar";
import { Cekirdek } from "./Cekirdek";

// latin-ext ZORUNLU: İ ı ş ğ ç ö ü. Yoksa tofu.
const baslik = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-baslik",
  display: "swap",
});

const govde = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-govde",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `Sirkülasyon Çekirdeği · ${site.event} ${site.year}`,
};

/** Türkçe büyütme: i→İ, ı→I. Düz toUpperCase() bunu bozar. */
const trBuyuk = (s: string) => s.toLocaleUpperCase("tr");

export default function SirkulasyonCekirdegiSayfasi() {
  // Duraklar Yedi Eşik ile aynı kaynaktan: bir şaft katı = bir durak.
  const duraklar = istasyonlariKur();

  return (
    <div className={`${baslik.variable} ${govde.variable} ${mono.variable}`}>
      <Cekirdek
        marka={site.school}
        cta={hero.cta}
        ctaHref={site.applyUrl}
        navLinkleri={nav.links}
        disiplinler={disciplines.map((d) => trBuyuk(d.name))}
        duraklar={duraklar}
      />
    </div>
  );
}
