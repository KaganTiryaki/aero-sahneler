import * as THREE from "three";
import type { Istasyon } from "@/components/yolculuk/istasyonlar";

/**
 * KİTABE — istasyonun metnini şaftın UÇ DUVARINA basan panel.
 *
 * Metin ekranın ortasında yüzen bir HTML katmanı değil; duvarda. Kol i'yi
 * çıkarken tam karşındaki uç duvara doğru yürüyorsun, yani kitabe yolun
 * ucunda: yaklaştıkça büyüyor, sahanlığa varınca göz hizasında, dönünce
 * arkanda kalıyor. Birinci şahıs.
 *
 * Sahanlıklar taraf değiştirdiği için (sahanlikYon) duvar da bir sağda bir
 * solda — sol/sağ dönüşümü mimariden geliyor, ayrıca kurulmuyor.
 *
 * Şaft koyu: mürekkep AÇIK. Doku alfa taşır, rengi malzeme verir.
 */

/*
 * PANEL DAR VE YÜKSEK — bir kitabe sütunu. Sebebi geometri, tercih değil:
 *
 * Uç duvar z ∈ [-4.2, 4.2], yani 8.4 geniş. Ama kol duvarın ORTASINA doğru
 * koşmuyor; z = ±3.4'te, kenara yakın. İkisi birden istenemiyor:
 *   · Paneli kolun hattına (3.4) koy + geniş tut → duvarın dışına taşar,
 *     harfler boşlukta kalır. (6.8 genişlikte %38'i taşıyordu: "ganizasyon".)
 *   · Paneli duvarın ortasına (0) koy → duvarda kalır ama 3.4 birim yanında,
 *     karşında değil.
 * Panel daraldıkça kolun hattına daha çok yaklaşabiliyor: 3.4 enle merkez
 * 2.3'e kadar gidiyor, bakış hattından yalnız 1.1 birim sapma kalıyor.
 * Dar sütun hem duvarda duruyor hem karşında.
 */
export const PANEL_EN = 3.4;
export const PANEL_BOY = 5.0;
/** Panelin duvar kenarına bırakacağı pay — taşmayı bu engelliyor. */
export const PANEL_PAY = 0.2;
/** Birim başına piksel. */
const PPB = 260;

const EN_PX = Math.round(PANEL_EN * PPB);
const BOY_PX = Math.round(PANEL_BOY * PPB);

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

function kitabeCiz(ist: Istasyon, f: Fontlar): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = EN_PX;
  c.height = BOY_PX;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  ctx.fillStyle = "#ffffff"; // kapsama; renk malzemeden
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const orta = EN_PX / 2;
  const maxEn = EN_PX * 0.88;
  const kahraman = ist.tur === "kahraman";

  type Parca = { metin: string; font: string; boy: number; alfa: number };
  const parcalar: Parca[] = [];

  if (ist.kicker) {
    parcalar.push({
      metin: ist.kicker,
      font: `500 ${Math.round(PPB * 0.15)}px ${f.mono}`,
      boy: PPB * 0.3,
      alfa: 0.55,
    });
  }

  /*
   * Başlık punto SABİT OLAMAZ: "Sirkülasyon", "Organizasyon" tek kelime —
   * satıra bölünemiyorlar ve sabit puntoda panelden taşıyorlar. En uzun kelime
   * sığana kadar küçült.
   */
  let bpx = PPB * (kahraman ? 0.62 : 0.5);
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
    parcalar.push({ metin: s, font: ctx.font, boy: bpx * 1.04, alfa: 1 });
  }

  if (ist.govde) {
    ctx.font = `400 ${Math.round(PPB * 0.15)}px ${f.govde}`;
    for (const s of satirla(ctx, ist.govde, maxEn)) {
      parcalar.push({ metin: s, font: ctx.font, boy: PPB * 0.23, alfa: 0.74 });
    }
  }

  if (ist.kunye) {
    parcalar.push({
      metin: ist.kunye,
      font: `500 ${Math.round(PPB * 0.14)}px ${f.mono}`,
      boy: PPB * 0.34,
      alfa: 0.9,
    });
  }

  // Panele sığmıyorsa sondan kır: taşan satır duvarın dışına akıyordu.
  let toplam = parcalar.reduce((t, p) => t + p.boy, 0);
  while (parcalar.length > 1 && toplam > BOY_PX * 0.92) {
    parcalar.pop();
    toplam = parcalar.reduce((t, p) => t + p.boy, 0);
  }

  let y = (BOY_PX - toplam) / 2;
  for (const p of parcalar) {
    ctx.font = p.font;
    ctx.globalAlpha = p.alfa;
    ctx.fillText(p.metin, orta, y + p.boy / 2);
    y += p.boy;
  }
  ctx.globalAlpha = 1;

  return c;
}

/**
 * ÖNCE document.fonts.ready beklenmeli: yüklenmemiş fontla çizersen yedek
 * fontla basar, Türkçe glifler (İ ı ş ğ) bozulur ve doku bir kez pişirildiği
 * için sonra düzelmez.
 */
export async function kitabeleriKur(
  duraklar: readonly Istasyon[],
  f: Fontlar,
): Promise<THREE.CanvasTexture[]> {
  if (document.fonts?.ready) await document.fonts.ready;

  return duraklar.map((ist) => {
    const t = new THREE.CanvasTexture(kitabeCiz(ist, f));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8; // duvara açılı yaklaşıyoruz
    /*
     * MIPMAP YOK. 1292×874 ikinin kuvveti değil; mipmap zinciri istendiğinde
     * doku "eksik" kalıp SESSİZCE boş örneklenir — alfa hep 0, duvarda hiçbir
     * yazı görünmez ve tsc/eslint/konsol üçü de temiz kalır. (Yedi Eşik'te
     * tam olarak bu tuzağa düşüldü.)
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
