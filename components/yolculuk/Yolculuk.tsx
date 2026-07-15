"use client";

import { useEffect, useRef } from "react";
import type { Istasyon } from "./istasyonlar";
import styles from "./yolculuk.module.css";

/**
 * Duvar yolculuğu: her istasyon koridorun ilerisindeki bir duvarda duruyor.
 *
 * Kaydırdıkça duvar UZAKTAN yaklaşıyor (küçük+soluk → okunur → üstünden geçip
 * büyüyerek dağılıyor) ve bir sonraki duvar arkasından beliriyor. Bir istasyon
 * = bir eşik: 3B sahnedeki treadmill de aynı scroll'la tam bir oda ilerliyor,
 * yani metin ile mimari senkron.
 *
 * Sadece transform + opacity. Yerleşim animasyonu yok.
 *
 * reduced-motion / JS yok: base katman düz bir belge — bütün duraklar alt alta,
 * tam okunur. Hiçbir şey opacity:0'da takılı kalmaz.
 */

/*
 * d = konum - i : duvara olan uzaklık. d<0 duvar ileride, d=0 duvardayız
 * (okuma anı), d>0 duvarı geçtik.
 *
 * Ölçek DOĞRUSAL değil üstel: doğrusalken uzaktaki duvar %67'de kalıyor ve
 * okunan metnin üstüne biniyordu — iki istasyon aynı anda okunuyordu. Üstel
 * rampa gerçek perspektif gibi davranıyor: d=-1'de %45, yani net biçimde
 * "koridorun ilerisinde".
 */
const UZAK_UC = -1.0; // duvarın belirdiği yer
const YAKIN_UC = 0.57; // duvarın dağıldığı yer
const PERSPEKTIF = 2.15; // ölçek tabanı: pow(2.15, d)

/** Metin bloğunu kapı boşluğunun üstündeki aydınlık sıvaya çeken taban kayma. */
const SIVA_KAYMASI = -142;

/**
 * ton: sahnenin duvarı hangi değerde?
 *  · "koyu"  → aydınlık sıva üstünde koyu teal mürekkep (Yedi Eşik koridoru)
 *  · "acik"  → koyu şaft/taş üstünde açık mürekkep (Sirkülasyon Çekirdeği)
 * Yanlış ton = metin duvarda kaybolur; sahneye göre seçilmek ZORUNDA.
 */
export function Yolculuk({
  duraklar,
  ton = "koyu",
  gorsel = true,
}: {
  duraklar: readonly Istasyon[];
  ton?: "koyu" | "acik";
  /**
   * false: metni 3B sahne taşıyor (duvarların yüzüne basılı). Duraklar DOM'da
   * kalır — ekran okuyucu ve JS'siz tarayıcı okumaya devam eder — ama görsel
   * olarak çizilmez; yoksa aynı metin hem duvarda hem havada belirir.
   * Scroll boşluğunu yine bu bileşen verir, çünkü sahne scroll'a bağlı.
   */
  gorsel?: boolean;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const yolRef = useRef<HTMLDivElement>(null);
  const ogeRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const kap = kapRef.current;
    const yol = yolRef.current;
    if (!kap || !yol) return;
    // reduced-motion: base katman düz bir belge. Yolculuk açılmaz, dolayısıyla
    // scroll boşluğu da yükseklik almaz — yoksa okunur metnin altında 1700svh
    // boşluk kalırdı.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    kap.dataset.canli = "1";
    // Metni 3B sahne taşıyorsa duraklar DOM'da kalır ama çizilmez.
    if (!gorsel) kap.dataset.gizli = "1";
    // Bir istasyon = bir eşik = 100svh.
    yol.style.height = `${duraklar.length * 100}svh`;

    let id = 0;
    let bekliyor = false;

    const ciz = () => {
      bekliyor = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      // Kaç istasyon ilerledik: 0 → duraklar.length-1
      const konum = p * (duraklar.length - 1);

      ogeRef.current.forEach((el, i) => {
        if (!el) return;
        // d < 0: duvar hâlâ ileride. d > 0: duvarı geçtik.
        const d = konum - i;

        if (d < UZAK_UC || d > YAKIN_UC) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          return;
        }
        el.style.visibility = "visible";

        const olcek = Math.pow(PERSPEKTIF, d);
        /*
         * Metin, kapı boşluğunun ÜSTÜNDEKİ sıvaya oturur. Kadrajın ortasına
         * bırakılınca gövde ve CTA notu koyu deliğin üstüne düşüp okunmuyordu;
         * çözüm perde koymak değil, metni duvarın aydınlık kısmına taşımak.
         * Delik kadrajın merkez-altında, sıva üstte ve yanlarda.
         */
        const kaydir = SIVA_KAYMASI + d * -34;

        // Aynı anda TEK duvar okunur: uzaktaki soluk, geçilen dağılmış.
        let opaklik: number;
        if (d < -0.5) opaklik = (d - UZAK_UC) / 0.5; // beliriyor
        else if (d <= 0.12) opaklik = 1; // okuma penceresi
        else opaklik = 1 - (d - 0.12) / (YAKIN_UC - 0.12); // dağılıyor

        el.style.opacity = String(Math.max(0, Math.min(1, opaklik)));
        el.style.transform = `translate3d(0, ${kaydir.toFixed(2)}px, 0) scale(${olcek.toFixed(3)})`;
        // Yalnız okunan duvar tıklanabilir.
        el.style.pointerEvents = d > -0.5 && d < 0.12 ? "auto" : "none";
      });
    };

    const kaydirildi = () => {
      if (bekliyor) return;
      bekliyor = true;
      id = requestAnimationFrame(ciz);
    };

    ciz();
    window.addEventListener("scroll", kaydirildi, { passive: true });
    window.addEventListener("resize", kaydirildi);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", kaydirildi);
      window.removeEventListener("resize", kaydirildi);
      delete kap.dataset.canli;
      delete kap.dataset.gizli;
      yol.style.height = "";
    };
  }, [duraklar.length, gorsel]);

  return (
    <>
      <div ref={kapRef} className={styles.kap}>
      {duraklar.map((d, i) => (
        <article
          key={`${d.baslik}-${i}`}
          ref={(el) => {
            ogeRef.current[i] = el;
          }}
          className={`${styles.duvar} ${styles[d.tur]} ${styles[ton]}`}
        >
          {d.kicker && <p className={styles.kicker}>{d.kicker}</p>}

          <h2 className={styles.baslik}>
            {d.baslik}
            {d.yil && <span className={styles.yil}>{d.yil}</span>}
          </h2>

          {d.govde && <p className={styles.govde}>{d.govde}</p>}

          {d.satirlar && (
            <ul className={styles.satirlar}>
              {d.satirlar.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}

          {d.kunye && <p className={styles.kunye}>{d.kunye}</p>}

          {d.cta && (
            <span className={styles.ctaSar}>
              <a
                className={styles.cta}
                href={d.cta.href}
                target="_blank"
                rel="noreferrer"
              >
                {d.cta.label}
                <span aria-hidden="true"> →</span>
              </a>
              {d.cta.not && <span className={styles.ctaNot}>{d.cta.not}</span>}
            </span>
          )}
        </article>
      ))}
      </div>

      {/*
        Yolculuğun uzunluğu. Duraklar canlıyken fixed olduğu için sayfaya
        yüksekliği veren tek şey burası; yüksekliği effect veriyor, yani
        reduced-motion'da 0 kalıyor.
      */}
      <div ref={yolRef} className={styles.yol} aria-hidden="true" />
    </>
  );
}
