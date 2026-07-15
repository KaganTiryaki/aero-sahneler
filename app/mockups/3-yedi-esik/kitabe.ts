import * as THREE from "three";
import type { Istasyon } from "@/components/yolculuk/istasyonlar";
import {
  DUVAR_ALT,
  DUVAR_EN,
  DUVAR_UST,
  YAZI_ALT,
  YAZI_DIS,
  YAZI_IC,
  YAZI_UST,
} from "./enfilad";

/**
 * KİTABE — istasyonun metnini duvarın YÜZÜNE yazan doku.
 *
 * Metin ekranın ortasında yüzen bir HTML katmanı değil; duvarın sıvasına
 * basılı. Perspektif bedavaya geliyor: duvar yaklaşınca yazı da yaklaşıyor,
 * eğiliyor, geçince arkada kalıyor. Okuma birinci şahıs.
 *
 * Yazı kapının ÜSTÜNDE değil YANINDA, ve duraklar boyunca DÖNÜŞÜMLÜ: çift
 * duraklar sol panele, tek duraklar sağa. Yürürken başını çevire çevire
 * okuyorsun; her duvarda bir yan dolu, öbürü boş.
 *
 * Doku duvarın TAM yüzünü kaplar (46 × 15.8). Kanal olarak sadece ALFA
 * kullanılır — mürekkebin rengi gölgeleyicideki uniform'dan gelir, yani doku
 * bir "kapsama haritası"dır.
 *
 * Türkçe: canvas fillText glifleri doğru basar AMA font yüklenmeden çizilirse
 * yedek fontla basar ve İ/ş/ğ bozulur. Bu yüzden document.fonts.ready
 * beklenmeden çağrılmamalı (bkz. kitabeleriKur).
 */

const DUVAR_BOY = DUVAR_UST - DUVAR_ALT; // 15.8
/** Birim başına piksel. */
const PPB = 64;

const EN_PX = Math.round(DUVAR_EN * PPB);
const BOY_PX = Math.round(DUVAR_BOY * PPB);

/** Duvar yerel x → canvas x. */
const xToPx = (x: number) => ((x + DUVAR_EN / 2) / DUVAR_EN) * EN_PX;
/** Duvar yerel y → canvas y (canvas yukarıdan aşağı, duvar aşağıdan yukarı). */
const yToPx = (y: number) => ((DUVAR_UST - y) / DUVAR_BOY) * BOY_PX;

export type Fontlar = { baslik: string; govde: string; mono: string };

function satirla(
  ctx: CanvasRenderingContext2D,
  metin: string,
  maxEn: number,
): string[] {
  const kelimeler = metin.split(/\s+/);
  const satirlar: string[] = [];
  let s = "";
  for (const k of kelimeler) {
    const deneme = s ? `${s} ${k}` : k;
    if (ctx.measureText(deneme).width > maxEn && s) {
      satirlar.push(s);
      s = k;
    } else {
      s = deneme;
    }
  }
  if (s) satirlar.push(s);
  return satirlar;
}

function kitabeCiz(ist: Istasyon, sira: number, f: Fontlar): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = EN_PX;
  c.height = BOY_PX;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  // Beyaz mürekkep = kapsama. Renk gölgeleyiciden gelir.
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";

  // Dönüşümlü yan: çift durak sol panel, tek durak sağ.
  const sol = sira % 2 === 0;
  // Metin kapıdan DIŞA doğru akar: solda sağa yaslı, sağda sola yaslı — iki
  // durumda da sütunun iç kenarı kapıya bakar, göz kapıdan metne kayar.
  ctx.textAlign = sol ? "right" : "left";
  const hiza = sol ? xToPx(-YAZI_IC) : xToPx(YAZI_IC);
  const maxEn = (YAZI_DIS - YAZI_IC) * PPB;

  const ustPx = yToPx(YAZI_UST);
  const altPx = yToPx(YAZI_ALT);
  const panelBoy = altPx - ustPx;

  const kahraman = ist.tur === "kahraman";

  // Blok panelin ortasına oturur: önce ölç, sonra çiz.
  type Parca = { metin: string; font: string; boy: string; alfa: number };
  const parcalar: Parca[] = [];

  if (ist.kicker) {
    parcalar.push({
      metin: ist.kicker,
      font: `500 ${Math.round(PPB * 0.3)}px ${f.mono}`,
      boy: `${PPB * 0.52}`,
      alfa: 0.5,
    });
  }

  /*
   * Başlık punto SABİT OLAMAZ. "Sirkülasyon" ve "Organizasyon" tek kelime —
   * satıra bölünemiyorlar, sabit puntoda panelden taşıp kadrajın dışına
   * çıkıyorlardı (RENDER'DA GÖRÜLDÜ: "…yon / …tayı" diye kırpılmış). En uzun
   * kelime panele sığana kadar küçült.
   */
  let bpx = PPB * (kahraman ? 1.05 : 0.8);
  const enUzun = ist.baslik
    .split(/\s+/)
    .reduce((a, b) => (a.length >= b.length ? a : b), "");
  for (let i = 0; i < 12; i++) {
    ctx.font = `400 ${Math.round(bpx)}px ${f.baslik}`;
    if (ctx.measureText(enUzun).width <= maxEn) break;
    bpx *= 0.9;
  }
  ctx.font = `400 ${Math.round(bpx)}px ${f.baslik}`;
  for (const s of satirla(ctx, ist.baslik, maxEn)) {
    parcalar.push({ metin: s, font: ctx.font, boy: `${bpx * 0.97}`, alfa: 1 });
  }

  if (ist.govde) {
    ctx.font = `400 ${Math.round(PPB * 0.3)}px ${f.govde}`;
    for (const s of satirla(ctx, ist.govde, maxEn)) {
      parcalar.push({ metin: s, font: ctx.font, boy: `${PPB * 0.44}`, alfa: 0.72 });
    }
  }

  if (ist.kunye) {
    parcalar.push({
      metin: ist.kunye,
      font: `500 ${Math.round(PPB * 0.28)}px ${f.mono}`,
      boy: `${PPB * 0.5}`,
      alfa: 0.88,
    });
  }

  const toplamBoy = parcalar.reduce((t, p) => t + Number(p.boy), 0);
  // Panele sığmıyorsa sondan kırp: taşan metin zemine/tavana akıyordu.
  while (parcalar.length > 1 && toplamBoy > panelBoy) parcalar.pop();

  let y = ustPx + (panelBoy - parcalar.reduce((t, p) => t + Number(p.boy), 0)) / 2;
  for (const p of parcalar) {
    ctx.font = p.font;
    ctx.globalAlpha = p.alfa;
    ctx.fillText(p.metin, hiza, y + Number(p.boy) / 2);
    y += Number(p.boy);
  }
  ctx.globalAlpha = 1;

  return c;
}

/**
 * Her istasyon için bir doku. ÖNCE document.fonts.ready beklenmeli: yüklenmemiş
 * fontla çizersen yedek fontla basar ve Türkçe glifler (İ ı ş ğ) bozulur —
 * üstelik doku bir kez pişirildiği için sonra düzelmez.
 */
export async function kitabeleriKur(
  duraklar: readonly Istasyon[],
  f: Fontlar,
): Promise<THREE.CanvasTexture[]> {
  if (document.fonts?.ready) await document.fonts.ready;

  return duraklar.map((ist, i) => {
    const t = new THREE.CanvasTexture(kitabeCiz(ist, i, f));
    /*
     * flipY VARSAYILAN OLARAK AÇIK: three dokuyu dikeyde çeviriyor, canvas'ın
     * tepesi v=1'e düşüyor. Gölgeleyicideki UV duvarın yerel y'sinden türediği
     * için (yukarı = v 0) kitabe baş aşağı basılıyordu.
     */
    t.flipY = false;
    t.colorSpace = THREE.LinearSRGBColorSpace; // alfa kanalı; renk dönüşümü yok
    t.anisotropy = 8; // yazıya açılı bakılıyor — yoksa uzakta bulanır
    /*
     * MIPMAP YOK. 2944×1011 ikinin kuvveti değil; mipmap zinciri istendiğinde
     * doku "eksik" kalıp SESSİZCE boş örnekleniyordu — alfa hep 0, yani duvara
     * hiçbir yazı düşmüyordu. tsc, eslint ve konsol üçü de temizdi.
     */
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  });
}
