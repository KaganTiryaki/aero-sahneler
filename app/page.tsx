import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Archivo, IBM_Plex_Mono } from "next/font/google";
import styles from "./index.module.css";

// latin-ext ZORUNLU: İ ı ş ğ ç ö ü.
const display = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});
const body = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AERO '26 — Seçilen Sahneler",
};

type Sahne = {
  slug: string;
  isim: string;
  fikir: string;
  durum: string;
};

/** Kağan'ın 22 sahne arasından seçtiği yedisi. Notlar onun geri bildirimi. */
const SAHNELER: Sahne[] = [
  {
    slug: "3-yedi-esik",
    isim: "Yedi Eşik",
    fikir:
      "Birbirinin içinden geçen yedi kapı. Enfilad: her disiplin bir eşik, hepsi aynı bakışta.",
    durum:
      "ÖNCELİK. Scroll ile ilerleyeceğiz; komiteler duvarda yazacak, kaydırdıkça o duvar arkaya gidip bir sonraki duvar yeni bilgiyi getirecek.",
  },
  {
    slug: "t2-5-sirkulasyon-cekirdegi",
    isim: "Sirkülasyon Çekirdeği",
    fikir:
      "Merdiven boşluğunun dibinden yukarı bakış; yedi sahanlık sola-sağa geçerek kaçıyor. Mimarlıkta 'sirkülasyon' zaten bir binanın merdiven çekirdeğinin adı.",
    durum:
      "Şu an kaydırılamıyor. Olması gereken: merdivende ilerlerken önümüze çıkan duvarlardan bilgi almak.",
  },
  {
    slug: "t2-5-dort-kollu-kavsak",
    isim: "Dört Kollu Kavşak",
    fikir: "Kesişen dört kol; yolların buluştuğu yer.",
    durum: "Yedi Eşik'teki scroll/duvar kurgusunun aynısı buraya da gelecek.",
  },
  {
    slug: "t2-5-yuruyen-isik",
    isim: "Yürüyen Işık",
    fikir: "Revak; zeminde gün boyu yürüyen bir ışık lekesi.",
    durum: "Kilise/revak hissi tutuyor. Ne olacağı henüz açık.",
  },
  {
    slug: "3-sarnic-akintisi",
    isim: "Sarnıç Akıntısı",
    fikir: "Sudan yükselen sütunlar, sis, yansımalar.",
    durum:
      "Sahnenin kendisi tutmadı. Değerli olan tek şey: kolonların altında süzülen desen. O desen ayrı bir branch'te Yedi Eşik'e taşınacak.",
  },
  {
    slug: "2-odunc-fisi",
    isim: "Ödünç Fişi",
    fikir:
      "Kütüphane ödünç kartı ve damgalar. Kütüphanecilikte 'sirkülasyon' zaten ödünç verme sisteminin adı.",
    durum: "Fikir arşivde duruyor.",
  },
  {
    slug: "3-cekmece-odasi",
    isim: "Çekmece Odası",
    fikir: "Kart kataloğu çekmeceleriyle kaplı oda.",
    durum: "Fikir arşivde duruyor.",
  },
];

export default function SahnelerIndex() {
  return (
    <main
      className={`${styles.root} ${display.variable} ${body.variable} ${mono.variable}`}
    >
      <header className={styles.ust}>
        <span className={styles.kicker}>AERO · SİRKÜLASYON ÇALIŞTAYI ’26</span>
        <h1 className={styles.baslik}>Seçilen Sahneler</h1>
        <p className={styles.alt}>
          Yirmi iki WebGL sahnesi arasından seçilen yedisi. Hepsi gerçek
          three.js; hepsi GPU’da açılıp görüldü.
        </p>
      </header>

      <ol className={styles.liste}>
        {SAHNELER.map((s, i) => (
          <li key={s.slug} className={styles.oge}>
            <span className={styles.sira}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.govde}>
              <h2 className={styles.isim}>{s.isim}</h2>
              <p className={styles.fikir}>{s.fikir}</p>
              <p className={styles.durum}>{s.durum}</p>
              <Link className={styles.link} href={`/mockups/${s.slug}`}>
                Aç →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
