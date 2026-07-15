/**
 * YEDİ EŞİK — sahnenin ölçü ve renk sabitleri.
 *
 * Ölçek: 1 birim ≈ 0.40 m. Kapı ~4 m, tavan ~5.2 m, oda derinliği ~6.8 m →
 * saray enfiladı ölçeği. Göz hizası zeminden 1.56 m.
 */

/* ---- mimari ölçüler ---------------------------------------------------- */
export const ODA_ARALIK = 17; // iki eşik arası
export const DUVAR_SAYI = 7; // yedi eşik
export const PERIYOT = ODA_ARALIK * DUVAR_SAYI; // treadmill periyodu = 119

/**
 * Duvar/zemin/tavan kadrajı HER treadmill fazında taşmalı. 30 (yarı 15) iken
 * en yakın duvar ~d=26'yı geçtiğinde kenarlarda boşluk açılıyordu; portrede
 * dikey fov açılınca (TAN_YATAY_MIN) bu sınır daha da erken geliyor.
 */
export const DUVAR_EN = 46;
export const DUVAR_UST = 8.6; // tavanın üstüne gömülür
export const DUVAR_ALT = -7.2; // zeminin altına gömülür
/**
 * 7.0 → 4.2: yazı kapının ÜSTÜNE değil YANINA yazılıyor, o yüzden kapının
 * iki yanında okunur genişlikte panel kalmak zorunda. Ölçüldü: okuma
 * mesafesinde (17 birim) kadrajda duvarın yarı-eni 9.9 birim; kapı 7 iken
 * yana yalnız ~2.9 birim kalıyordu — hiçbir metin sığmaz. 4.2'de her iki
 * yanda 5.7 birim (~267 px) açılıyor.
 */
export const KAPI_YARI = 4.2;
export const KAPI_UST = 4.6;
export const KAPI_ALT = -6.5; // zeminin altında biter → eşik pahı görünmez

/* ---- kitabe: kapının YANINDAKİ panel (duvar yerel koordinatları) -------- */
/**
 * Kapının iç kenarından dışa doğru yazı sütunu. Sol ve sağ panel dönüşümlü
 * doluyor: bir duvarda sol, sonrakinde sağ — yürürken başını çevire çevire
 * okuyorsun.
 */
export const YAZI_IC = KAPI_YARI + 0.55;
export const YAZI_DIS = 9.7;
export const YAZI_ALT = -5.0;
export const YAZI_UST = 5.0;
export const KALINLIK = 0.62; // duvar kalınlığı = söve derinliği

export const ZEMIN_Y = -5.5;
export const TAVAN_Y = 7.5;
export const KAPAK_Z = -136; // koridoru kapatan karanlık düzlem

/* ---- kamera ------------------------------------------------------------ */
/**
 * 1.3 → 0: eksenden kaçık kamera söveleri gösteriyordu ama sol/sağ panelleri
 * ASİMETRİK yapıyordu — ölçüldü: solda 4.2 birim, sağda 1.6. Yazı dönüşümlü
 * olarak iki yana da yazıldığı için iki panel de aynı genişlikte olmak
 * zorunda. Simetriyi kıran iş artık yazının kendisinde: bir duvarda sol dolu,
 * sonrakinde sağ.
 */
export const KAM_X = 0;
export const KAM_Y = -1.6;
export const FOV_PENCERE = 40; // pencerenin gerçek dikey fov'u (yatay geniş ekranda)
export const SHIFT_M = 1.42; // shift-lens: tam kare / pencere yükseklik oranı
export const SHIFT_P = 0.62; // kaçış noktasının ekrandaki dikey oranı (0=üst)
/**
 * Dikey fov sabitlenirse yatay fov en-boy ile birlikte çöker: 390x844'te
 * 19° kalıyordu — kapı boşluğu kadrajdan 2.4 kat geniş olduğu için tek bir
 * söve/lento görünmüyor, koridor tanınmaz bir bulamaca dönüyordu. Portrede
 * dikeyi açarak yatay yarı-tanjantı bu tabanın altına düşürmüyoruz (Hor+).
 */
export const TAN_YATAY_MIN = 0.3; // ≈33° yatay fov tabanı

/* ---- ton --------------------------------------------------------------- */
export const UZAK = 122; // ton rampasının doyduğu derinlik
export const RAMPA_US = 2.4; // arkaya yüklü eğri: yakın odalar uzun süre soluk kalır

/* ---- hareket ----------------------------------------------------------- */
/**
 * 0.55 → 0: sabit yürüyüş, metin duvarlara yazılınca ARTIK ÇALIŞMIYOR. Kendi
 * başına akan treadmill istasyon eşlemesini kaydırıyordu — scroll 0'da en
 * yakın duvarda kahraman yerine ikinci durak beliriyordu. Koridor artık
 * yalnız scroll ile ilerliyor: hangi duvarı okuduğuna sen karar veriyorsun.
 */
export const TABAN_HIZ = 0;

/**
 * Yolculuk 17 durak: kahraman + vizyon + misyon + ekiplerimiz + 9 komite +
 * süreç + 2 SSS + kapanış. (istasyonlar.ts'ten geliyor; oradaki dizi değişirse
 * burası da değişmeli — senkron bozulursa metin ile mimari birbirinden kayar.
 * Tarayıcıda sayıldı: 17.)
 */
export const ISTASYON_SAYI = 17;

/**
 * BİR İSTASYON = BİR EŞİK. Scroll boyunca kat edilen yol, tam olarak
 * (durak-1) × oda aralığı: her 100svh'de kamera bir kapıdan geçiyor ve o
 * duvarın metni okunur konuma geliyor. Sabit bir sayı yazmak (eski hâli: 136)
 * bu senkronu bozuyordu.
 */
export const SCROLL_MESAFE = ODA_ARALIK * (ISTASYON_SAYI - 1);
export const TOZ_KUTU_Z = 164; // toz sarma aralığı

/* ---- palet: tek hue ailesi (koyu teal ↔ beyaz) + tek cyan kaldırma ----- */
export const KOYU_TEAL = "#073f49";
export const SIVA_BEYAZ = "#f7fbf9";
export const CYAN = "#35c8e6";
export const ZERRE = "#9fe6f2";
