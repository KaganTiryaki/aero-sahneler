"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CYAN,
  DUVAR_ALT,
  DUVAR_EN,
  DUVAR_SAYI,
  DUVAR_UST,
  FOV_PENCERE,
  KALINLIK,
  KAM_X,
  KAM_Y,
  KAPAK_Z,
  KAPI_ALT,
  KAPI_UST,
  KAPI_YARI,
  KOYU_TEAL,
  ODA_ARALIK,
  PERIYOT,
  SCROLL_MESAFE,
  SHIFT_M,
  SHIFT_P,
  SIVA_BEYAZ,

  TAN_YATAY_MIN,
  TAVAN_Y,
  TOZ_KUTU_Z,
  ZEMIN_Y,
  ZERRE,
} from "./enfilad";
import {
  sivaFragment,
  sivaVertex,
  tozFragment,
  tozVertex,
} from "./golgeleyiciler";
import type { Istasyon } from "@/components/yolculuk/istasyonlar";
import { kitabeleriKur } from "./kitabe";

/** Kitabe mürekkebi: sıva aydınlık, yazı koyu teal. */
const MUREKKEP = "#0b3f43";

const RAD = Math.PI / 180;
const TAN_YARIM = Math.tan((FOV_PENCERE / 2) * RAD); // 0.364

/**
 * Ham ShaderMaterial gl_FragColor'a doğrudan yazar; three'nin sRGB kodlama
 * parçacığı (colorspace_fragment) sadece kendi malzemelerine enjekte edilir.
 * Bu yüzden boru hattını baştan sona geçirgen tutuyoruz: renkler ColorManagement
 * tarafından linear'a çevrilmesin (setRGB + LinearSRGBColorSpace = dönüşüm yok),
 * çıkış da linear işaretlensin. Sonuç: gölgeleyicideki aritmetik = ekrandaki
 * sRGB değeri. Ton rampası elde hesaplanabilir kalır — sıva çamurlaşmaz.
 */
function sabitRenk(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Color().setRGB(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
    THREE.LinearSRGBColorSpace,
  );
}

/** Duvar: Shape + Path ile açılmış tam kenarlı dikdörtgen delik, extrude edilir. */
function duvarGeometrisi() {
  const s = new THREE.Shape();
  s.moveTo(-DUVAR_EN / 2, DUVAR_ALT);
  s.lineTo(DUVAR_EN / 2, DUVAR_ALT);
  s.lineTo(DUVAR_EN / 2, DUVAR_UST);
  s.lineTo(-DUVAR_EN / 2, DUVAR_UST);
  s.closePath();

  const delik = new THREE.Path();
  delik.moveTo(-KAPI_YARI, KAPI_ALT);
  delik.lineTo(-KAPI_YARI, KAPI_UST);
  delik.lineTo(KAPI_YARI, KAPI_UST);
  delik.lineTo(KAPI_YARI, KAPI_ALT);
  delik.closePath();
  s.holes.push(delik);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: KALINLIK,
    bevelEnabled: false,
    steps: 1,
  });
  // Extrude 0→depth arasında; ön yüzü mesh'in yerel z=0'ına çek ki
  // mesh.position.z doğrudan "duvarın yüzü nerede" demek olsun.
  g.translate(0, 0, -KALINLIK);
  // Non-indexed + düz normal: söve ile duvar yüzü arasındaki kenar keskin
  // kalsın, ortalanmış normalle yumuşayıp pah gibi bulanmasın.
  g.computeVertexNormals();
  return g;
}

/**
 * Pencerenin dikey yarı-tanjantı. Geniş ekranda FOV_PENCERE'nin ta kendisi;
 * portrede yatay fov çökmesin diye açılır (bkz. TAN_YATAY_MIN).
 * Shift-lens matematiği tanYarim'de ölçek-bağımsızdır: SHIFT_P (%62) ve
 * SHIFT_M oranları bu değer değişince de aynen geçerli kalır.
 */
function tanYarimHesapla(en: number, boy: number) {
  const ar = en / Math.max(boy, 1);
  return Math.max(TAN_YARIM, TAN_YATAY_MIN / Math.max(ar, 0.001));
}

/**
 * Bir duvarın ekrana TEK PİKSEL bile katkı vermediği uzaklık. Treadmill'de
 * duvar tam burada geri dönüştürülür — böylece "yok olma" hiç görünmez.
 * Bağlayıcı kısıt genelde sağ söve (kamera eksenden kaçık olduğu için).
 * tanYarim kadrajla değiştiği için buraya da AYNI değer girmeli; yoksa duvar
 * görünür alanın içinde geri dönüşür ve göz önünde "pat" diye kaybolur.
 */
function olumMesafesi(en: number, boy: number, tanYarim: number) {
  const ar = en / boy;
  const yatay = tanYarim * ar;
  const sagSove = (KAPI_YARI - KAM_X) / yatay;
  const solSove = (KAPI_YARI + KAM_X) / yatay;
  const lento = (KAPI_UST - KAM_Y) / (2 * tanYarim * SHIFT_P);
  const zeminCizgisi = (KAM_Y - ZEMIN_Y) / (2 * tanYarim * (1 - SHIFT_P));
  return Math.max(4, Math.min(sagSove, solSove, lento, zeminCizgisi) - 0.4);
}

export function EnfiladSahnesi({
  duraklar,
}: {
  duraklar: readonly Istasyon[];
}) {
  const kapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;

    // Kitabeler font yüklendikten SONRA pişer (bkz. kitabe.ts); o ana kadar
    // duvarlar boş sıva. iptal: efekt sökülürse geç gelen dokuları çöpe at.
    let iptal = false;
    let kitabeler: THREE.CanvasTexture[] = [];
    const bosDoku = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 0]),
      1,
      1,
      THREE.RGBAFormat,
    );
    bosDoku.needsUpdate = true;

    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    const kabaIsaret = window.matchMedia("(pointer: coarse)");
    const statik = azHareket.matches;

    const sahne = new THREE.Scene();

    const kamera = new THREE.PerspectiveCamera(1, 1, 0.5, 400);
    kamera.position.set(KAM_X, KAM_Y, 0);

    /**
     * WebGL her zaman vardır diye varsayılamaz: GPU kara listesi, sürücü çökmesi,
     * sekmede bağlam sınırının dolması (tarayıcı ~16 canlı bağlamda yenisini
     * reddeder) veya donanım hızlandırmanın kapalı olması hâlinde WebGLRenderer
     * KURUCUDA fırlatır. O fırlatma bu bileşeni değil, TÜM AĞACI düşürür:
     * sayfa "Application error" ekranına iner ve sayfanın tek işi olan
     * başvuru CTA'sı da ekrandan silinir. Sahne dekoratif (aria-hidden);
     * yokluğu sessizce tolere edilmeli. Kanvas basılmazsa .root'un --kagit
     * zemini olduğu gibi kalır: metin zaten koyu teal, okunur.
     */
    let cizer: THREE.WebGLRenderer;
    try {
      cizer = new THREE.WebGLRenderer({
        antialias: !kabaIsaret.matches,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    cizer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR cap
    cizer.outputColorSpace = THREE.LinearSRGBColorSpace; // geçirgen: bkz. sabitRenk
    cizer.setClearColor(sabitRenk(KOYU_TEAL), 1);
    kap.appendChild(cizer.domElement);

    /* ---- malzeme: duvar / zemin / tavan / kapak hepsi aynı --------------- */
    const sivaMat = new THREE.ShaderMaterial({
      vertexShader: sivaVertex,
      fragmentShader: sivaFragment,
      uniforms: {
        uDerin: { value: sabitRenk(KOYU_TEAL) },
        uBeyaz: { value: sabitRenk(SIVA_BEYAZ) },
        uCyan: { value: sabitRenk(CYAN) },
        uAkis: { value: 0 },
      },
    });

    /*
     * ---- yedi duvar -------------------------------------------------------
     * Treadmill'de duvarlar geri dönüşüyor, yani duvarın kalıcı bir kimliği
     * YOK. Kitabeyi bağlamak için her duvara bir istasyon sayacı taşıtıyoruz:
     * başlangıçta i, her sarmada +DUVAR_SAYI. Böylece yürüdükçe aynı yedi mesh
     * sırayla 0,1,2… istasyonlarını taşıyor ve metin mimariyle senkron kalıyor.
     *
     * Malzeme artık PAYLAŞILMIYOR: her duvarın kendi kitabesi var, dolayısıyla
     * kendi uYazi uniform'u olmalı.
     */
    const duvarGeo = duvarGeometrisi();
    const duvarlar: THREE.Mesh[] = [];
    const duvarMatler: THREE.ShaderMaterial[] = [];
    const duvarIst: number[] = [];
    for (let i = 0; i < DUVAR_SAYI; i++) {
      const mat = sivaMat.clone();
      mat.uniforms.uYazi = { value: bosDoku };
      mat.uniforms.uYaziVar = { value: 0 };
      mat.uniforms.uMurekkep = { value: sabitRenk(MUREKKEP) };
      const m = new THREE.Mesh(duvarGeo, mat);
      m.position.z = -(ODA_ARALIK * (i + 1));
      sahne.add(m);
      duvarlar.push(m);
      duvarMatler.push(mat);
      /*
       * i DEĞİL i-1: okunan duvar bir oda İLERİDE (~34 birim).
       * 17 birimdeki duvarın yüzü kadrajı taşıyor, kitabesi okunmuyor; 34'teki
       * ise tam oturuyor — RENDER'DA ÖLÇÜLDÜ. Böylece durak N'yi hep rahat
       * mesafede okuyorsun, en yakın duvar ise az önce okuyup geçtiğin eşik.
       */
      duvarIst.push(i);
    }

    /** Duvara o an taşıdığı istasyonun kitabesini giydirir. */
    const kitabeGiydir = (i: number) => {
      const ist = duvarIst[i];
      const dok = ist >= 0 && ist < kitabeler.length ? kitabeler[ist] : null;
      duvarMatler[i].uniforms.uYazi.value = dok ?? bosDoku;
      duvarMatler[i].uniforms.uYaziVar.value = dok ? 1 : 0;
    };

    /*
     * Fontlar CSS değişkenlerinden okunuyor: next/font hash'li aile adları
     * üretiyor, elle yazılamaz. Doku fontlar HAZIR olduktan sonra pişer —
     * erken pişerse Türkçe glifler yedek fontla basılır ve bir daha düzelmez.
     */
    const cs = getComputedStyle(kap);
    const fontlar = {
      baslik: cs.getPropertyValue("--font-baslik").trim() || "Georgia, serif",
      govde: cs.getPropertyValue("--font-govde").trim() || "system-ui",
      mono: cs.getPropertyValue("--font-mono").trim() || "monospace",
    };
    void kitabeleriKur(duraklar, fontlar).then((d) => {
      if (iptal) {
        d.forEach((t) => t.dispose());
        return;
      }
      kitabeler = d;
      duvarlar.forEach((_, i) => kitabeGiydir(i));
      // reduced-motion'da rAF hiç çalışmıyor: kitabe geç geldiği için tek kare
      // yeniden çizilmeli, yoksa duvarlar sonsuza dek boş sıva kalır.
      if (statik) cizer.render(sahne, kamera);
    });

    /* ---- zemin + tavan: koridoru gerçek bir mekân yapan yakınsayan çizgiler */
    // 34 (yarı 17) kadraja yetmiyordu: d>29'da zemin/tavan kenarı görünüyor,
    // koridor "beyaz boşlukta duran kutu" gibi okunuyordu. DUVAR_EN ile eşitle.
    const dyGeo = new THREE.PlaneGeometry(DUVAR_EN, 190);
    const zemin = new THREE.Mesh(dyGeo, sivaMat);
    zemin.rotation.x = -Math.PI / 2;
    zemin.position.set(0, ZEMIN_Y, -90);
    sahne.add(zemin);

    const tavan = new THREE.Mesh(dyGeo, sivaMat);
    tavan.rotation.x = Math.PI / 2;
    tavan.position.set(0, TAVAN_Y, -90);
    sahne.add(tavan);

    /* ---- kapak: rampanın doyduğu yerin ötesinde → dikişsiz karanlık ------ */
    const kapakGeo = new THREE.PlaneGeometry(40, 26);
    const kapak = new THREE.Mesh(kapakGeo, sivaMat);
    kapak.position.set(0, 1, KAPAK_Z);
    sahne.add(kapak);

    /* ---- toz ------------------------------------------------------------ */
    const N = kabaIsaret.matches ? 900 : 2600;
    const tozGeo = new THREE.BufferGeometry();
    const poz = new Float32Array(N * 3);
    const ofs = new Float32Array(N);
    const boy = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      poz[i * 3] = (Math.random() - 0.5) * 17;
      poz[i * 3 + 1] = -0.9 + (Math.random() - 0.5) * 13;
      poz[i * 3 + 2] = -158 + Math.random() * TOZ_KUTU_Z;
      ofs[i] = Math.random();
      boy[i] = 1.1 + Math.random() * 2.4;
    }
    tozGeo.setAttribute("position", new THREE.BufferAttribute(poz, 3));
    tozGeo.setAttribute("aOfs", new THREE.BufferAttribute(ofs, 1));
    tozGeo.setAttribute("aBoy", new THREE.BufferAttribute(boy, 1));

    const tozMat = new THREE.ShaderMaterial({
      vertexShader: tozVertex,
      fragmentShader: tozFragment,
      uniforms: {
        uZaman: { value: 0 },
        uAkis: { value: 0 },
        uZerre: { value: sabitRenk(ZERRE) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    const toz = new THREE.Points(tozGeo, tozMat);
    toz.frustumCulled = false;
    sahne.add(toz);

    /* ---- shift-lens: dikeyler dik kalsın, kaçış noktası %62'ye insin ---- */
    let olum = 9;
    const boyutla = () => {
      const en = kap.clientWidth;
      const bo = kap.clientHeight;
      if (!en || !bo) return;
      const tanYarim = tanYarimHesapla(en, bo);
      kamera.fov = 2 * Math.atan(SHIFT_M * tanYarim) * (180 / Math.PI);
      // setViewOffset aspect'i fullWidth/fullHeight olarak kendi kurar.
      kamera.setViewOffset(en, bo * SHIFT_M, 0, bo * (SHIFT_M / 2 - SHIFT_P), en, bo);
      kamera.updateProjectionMatrix();
      cizer.setSize(en, bo);
      olum = olumMesafesi(en, bo, tanYarim);
      if (statik) cizer.render(sahne, kamera);
    };
    boyutla();

    /* ---- treadmill + scroll --------------------------------------------- */
    let yumusak = 0;

    /*
     * Duvarın yeri ve taşıdığı istasyon, YÜRÜNEN YOLDAN doğrudan türetilir —
     * sarma geçmişi biriktirilmez.
     *
     * Önceki hâl akis'i kare kare biriktirip sarmalarda duvarIst'i ±7
     * kaydırıyordu. Tarayıcının scroll restorasyonu ile yarışınca akis
     * NEGATİFE düşüyor (ölçüldü: -32) ve sayaç da onunla birlikte bozulup
     * istasyonları -3'e indiriyordu: bütün duvarlar sessizce boşalıyordu.
     * Durumsuz hesap bu sınıf hatayı tümüyle kaldırıyor.
     */
    const konumla = (yol: number) => {

      duvarlar.forEach((d, i) => {
        const sarmasiz = -(ODA_ARALIK * (i + 1)) + yol;
        const sarma = Math.floor((sarmasiz + olum) / PERIYOT) + 1;
        d.position.z = sarmasiz - sarma * PERIYOT;
        // Kitabe EN YAKIN duvarda okunur: yandaki panel ancak orada açık kalır,
        // arka duvarların yanları öndeki duvarın kapı boşluğunca kırpılıyor.
        const ist = i + sarma * DUVAR_SAYI;
        if (ist !== duvarIst[i]) {
          duvarIst[i] = ist;
          kitabeGiydir(i);
        }
        duvarMatler[i].uniforms.uAkis.value = yol;
      });
      tozMat.uniforms.uAkis.value = yol;
    };

    const scrollAkisi = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      return Math.min(1, Math.max(0, window.scrollY / max)) * SCROLL_MESAFE;
    };

    /* ---- döngü: IO + visibilitychange ile duraklat ----------------------- */
    let id = 0;
    let gorunur = true;
    let calisiyor = false;
    const saat = new THREE.Clock();

    const ciz = () => {
      const dt = Math.min(saat.getDelta(), 0.05);
      tozMat.uniforms.uZaman.value = saat.elapsedTime;

      // yumusak MUTLAK yol (0…SCROLL_MESAFE), fark biriktirilmiyor.
      yumusak += (scrollAkisi() - yumusak) * Math.min(1, 6 * dt);
      konumla(yumusak);

      cizer.render(sahne, kamera);
      id = requestAnimationFrame(ciz);
    };

    const basla = () => {
      if (calisiyor || statik) return;
      calisiyor = true;
      saat.getDelta();
      yumusak = scrollAkisi();
      konumla(yumusak);
      id = requestAnimationFrame(ciz);
    };
    const dur = () => {
      calisiyor = false;
      cancelAnimationFrame(id);
    };

    // reduced-motion BASE katman: rAF hiç başlamaz, tek statik kare kalır.
    if (statik) cizer.render(sahne, kamera);

    const io = new IntersectionObserver(
      ([g]) => {
        gorunur = g.isIntersecting;
        if (gorunur && !document.hidden) basla();
        else dur();
      },
      { threshold: 0 },
    );
    io.observe(kap);

    const gorunurluk = () => {
      if (document.hidden) dur();
      else if (gorunur) basla();
    };
    document.addEventListener("visibilitychange", gorunurluk);

    const ro = new ResizeObserver(boyutla);
    ro.observe(kap);

    return () => {
      // Kitabeler asenkron pişiyor: sökülmüş sahneye geç doku yazılmasın.
      iptal = true;
      dur();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", gorunurluk);
      duvarGeo.dispose();
      dyGeo.dispose();
      kapakGeo.dispose();
      tozGeo.dispose();
      sivaMat.dispose();
      duvarMatler.forEach((m) => m.dispose());
      kitabeler.forEach((t) => t.dispose());
      bosDoku.dispose();
      tozMat.dispose();
      cizer.dispose();
      cizer.domElement.remove();
    };
  }, [duraklar]);

  return (
    <div
      ref={kapRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  );
}

export default EnfiladSahnesi;
