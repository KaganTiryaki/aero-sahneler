"use client";

import dynamic from "next/dynamic";
import type { Istasyon } from "./istasyonlar";
import { Yolculuk } from "./Yolculuk";
import styles from "./yedi.module.css";

/**
 * three ~150KB gzip. ssr:false ZORUNLU — ilk bundle'a girerse projenin
 * <150KB bütçesini tek başına yer.
 */
const EnfiladSahnesi = dynamic(
  () => import("./EnfiladSahnesi").then((m) => m.EnfiladSahnesi),
  { ssr: false },
);

export type Bag = { readonly label: string; readonly href: string };

export function Sahne({
  marka,
  baglar,
  instagram,
  instagramEtiket,
  isaret,
  duraklar,
}: {
  marka: string;
  baglar: readonly Bag[];
  instagram: string;
  instagramEtiket: string;
  isaret: string;
  duraklar: readonly Istasyon[];
}) {
  return (
    <div className={styles.root}>
      {/* Koridor: sabit, scroll'la bir oda ilerliyor. */}
      <div className={styles.sahne}>
        <EnfiladSahnesi />
      </div>

      <header className={styles.ust}>
        <span className={styles.marka}>{marka}</span>
        <nav className={styles.baglar}>
          {baglar.map((b) => (
            <a key={b.href} className={styles.bag} href={b.href}>
              {b.label}
            </a>
          ))}
        </nav>
      </header>

      <Yolculuk duraklar={duraklar} />

      {/*
        Scroll boşluğu: yolculuğun uzunluğu. Bir istasyon = bir eşik, yani
        her 100svh'de tam bir kapıdan geçiyorsun. Yolculuk canlıyken duraklar
        fixed olduğu için sayfa yüksekliğini taşıyan tek şey burası.
      */}
      <div
        className={styles.yol}
        style={{ height: `${duraklar.length * 100}svh` }}
        aria-hidden="true"
      />

      <div className={styles.alt}>
        <span>{isaret}</span>
        <a href={instagram} target="_blank" rel="noreferrer">
          {instagramEtiket}
        </a>
      </div>
    </div>
  );
}
