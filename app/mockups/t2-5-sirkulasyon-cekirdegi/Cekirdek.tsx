"use client";

import dynamic from "next/dynamic";
import type { Istasyon } from "@/components/yolculuk/istasyonlar";
import { Yolculuk } from "@/components/yolculuk/Yolculuk";
import stil from "./cekirdek.module.css";

// three ~150KB gzip. İlk bundle'a girerse projenin <150KB bütçesini tek başına
// yer → ayrı chunk + yalnız istemci (ssr:false ZORUNLU: sahne document'e dokunur).
const CekirdekSahnesi = dynamic(
  () => import("./CekirdekSahnesi").then((m) => m.CekirdekSahnesi),
  { ssr: false },
);

type Props = {
  marka: string;
  cta: string;
  ctaHref: string;
  navLinkleri: readonly { label: string; href: string }[];
  disiplinler: readonly string[];
  duraklar: readonly Istasyon[];
};

export function Cekirdek({
  marka,
  cta,
  ctaHref,
  navLinkleri,
  disiplinler,
  duraklar,
}: Props) {
  return (
    <main className={stil.kok}>
      {/* Sahne UI'ın ARKASINDA yaşar ve kadrajın tamamını doldurur: metin
          sahnenin yanına kaçmıyor, şaftın dibinde duruyor. */}
      <CekirdekSahnesi
        sinif={stil.tuval}
        disiplinler={disiplinler}
        duraklar={duraklar}
      />
      <div className={stil.vinyet} aria-hidden="true" />
      <div className={stil.gren} aria-hidden="true" />

      <header className={stil.ust}>
        <div className={stil.marka}>
          <span className={stil.markaIsaret} aria-hidden="true" />
          {marka}
        </div>
        <nav className={stil.nav}>
          {navLinkleri.map((l) => (
            <a key={l.href} className={stil.navLink} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className={stil.ustCta} href={ctaHref}>
          {cta}
        </a>
      </header>

      {/*
        Sabit kahraman bloğu yerine yolculuk: scroll merdiveni tırmandırıyor,
        her durakta önümüze çıkan duvar bir sonraki bilgiyi taşıyor. Şaft koyu
        olduğu için mürekkep açık.
      */}
      {/*
        Metni artık 3B sahne taşıyor: her durak, kolun karşısındaki uç duvarda
        basılı. Duraklar DOM'da kalıyor (ekran okuyucu + JS'siz tarayıcı) ama
        çizilmiyor — yoksa aynı metin hem duvarda hem havada belirir.
        Scroll boşluğunu yine bu bileşen veriyor.
      */}
      <Yolculuk duraklar={duraklar} ton="acik" gorsel={false} />
    </main>
  );
}
