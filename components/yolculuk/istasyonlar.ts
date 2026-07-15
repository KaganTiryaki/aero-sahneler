import {
  site,
  hero,
  vision,
  mission,
  teams,
  process,
  faqs,
  contact,
} from "@/lib/content";

/**
 * YOLCULUK — koridordaki duraklar.
 *
 * Bir istasyon = bir eşik. Aşağı kaydırdıkça kamera bir oda ilerliyor, önündeki
 * duvarda o istasyonun içeriği duruyor; geçince duvar arkada kalıyor ve bir
 * sonraki duvar yeni bilgiyi getiriyor. Dokuz komitenin her biri KENDİ
 * duvarında — okuyup geçiyorsun.
 *
 * İçerik burada üretilmiyor, yalnız lib/content.ts'ten diziliyor.
 */

export type Istasyon = {
  /** Duvarın üstündeki küçük etiket (mono). */
  kicker?: string;
  baslik: string;
  /** Başlığın yanına küçük düşen yıl — yalnız kahraman duvarında. */
  yil?: string;
  govde?: string;
  /** Madde listesi: komite görevleri, süreç adımları. */
  satirlar?: readonly string[];
  /** Duvarın altındaki künye: komite başkanları vb. */
  kunye?: string;
  cta?: { readonly label: string; readonly href: string; readonly not?: string };
  /** Kahraman duvarı tipografik olarak daha iri. */
  tur: "kahraman" | "metin" | "komite" | "kapanis";
};

const kisalt = (s: string, n: number) =>
  s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n))}…`;

export function istasyonlariKur(): Istasyon[] {
  const duraklar: Istasyon[] = [
    {
      tur: "kahraman",
      kicker: hero.status,
      baslik: site.event,
      yil: site.year,
      govde: teams.intro,
      cta: { label: hero.cta, href: site.applyUrl, not: hero.ctaNote },
    },
    {
      tur: "metin",
      kicker: vision.label,
      baslik: "Neden buradayız",
      // Duvar bir paragraf taşır, sayfa değil: uzun gövde kırpılıyor.
      govde: kisalt(vision.body, 300),
    },
    {
      tur: "metin",
      kicker: mission.label,
      baslik: "Ne yapıyoruz",
      govde: kisalt(mission.body, 300),
    },
    {
      tur: "metin",
      kicker: teams.eyebrow,
      baslik: teams.title,
      govde: teams.intro,
    },
  ];

  // Dokuz komite, dokuz duvar.
  teams.committees.forEach((k, i) => {
    duraklar.push({
      tur: "komite",
      kicker: `${String(i + 1).padStart(2, "0")} / ${teams.committees.length}`,
      baslik: k.name,
      govde: k.blurb,
      satirlar: k.tasks,
      kunye: k.lead,
    });
  });

  duraklar.push(
    {
      tur: "metin",
      kicker: process.eyebrow,
      baslik: process.title,
      govde: process.intro,
      satirlar: process.steps.map((a, i) => `${i + 1}. ${a.title}`),
    },
    // İlk iki SSS duvara çıkıyor; cevaplar birer paragraf olduğu için kırpılıyor.
    ...faqs.slice(0, 2).map(
      (s): Istasyon => ({
        tur: "metin",
        kicker: "Sıkça sorulanlar",
        baslik: s.q,
        govde: kisalt(s.a, 260),
      }),
    ),
    {
      tur: "kapanis",
      kicker: contact.label,
      baslik: "Son eşik",
      govde: contact.intro,
      kunye: site.socials.email,
      cta: { label: hero.cta, href: site.applyUrl, not: hero.ctaNote },
    },
  );

  return duraklar;
}
