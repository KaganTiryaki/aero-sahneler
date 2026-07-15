# AERO '26 — Seçilen Sahneler

AERO Sirkülasyon Çalıştayı '26 için üretilen 22 WebGL hero sahnesi arasından
seçilen yedisi. Hepsi gerçek three.js — CSS gradyanı değil.

## Sahneler

| Sahne | Fikir |
|---|---|
| **Yedi Eşik** | Birbirinin içinden geçen yedi kapı (enfilad). Her disiplin bir eşik. |
| **Sirkülasyon Çekirdeği** | Merdiven boşluğu. Mimarlıkta "sirkülasyon" zaten bir binanın merdiven çekirdeğinin adı — tema, terimin kendisi. |
| **Dört Kollu Kavşak** | Kesişen dört kol; yolların buluştuğu yer. |
| **Yürüyen Işık** | Revak; zeminde gün boyu yürüyen ışık lekesi. |
| **Sarnıç Akıntısı** | Sudan yükselen sütunlar, sis, yansımalar. |
| **Ödünç Fişi** | Kütüphane ödünç kartı. Kütüphanecilikte "sirkülasyon" ödünç verme sisteminin adı. |
| **Çekmece Odası** | Kart kataloğu çekmeceleriyle kaplı oda. |

## Nasıl üretildi

İki tur: her turda altı ajan farklı açılardan 36 fikir üretti, üç bağımsız jüri
(acımasız bir sanat yönetmeni, kıdemli bir WebGL mühendisi, hedef kitleden 16
yaşında bir öğrenci) hepsini puanladı, jenerik bulunanlar hiç kurulmadı,
kalanlar gerçek sahne olarak kuruldu ve ikinci bir ajan tarafından eleştirildi.
Toplam 62 ajan.

## Çalıştırma

```bash
npm install
npm run dev     # http://localhost:3000
```

## Kurallar

- Tüm metin `lib/content.ts`'ten gelir; bileşenlerde hardcode metin yok.
- Her `next/font` çağrısında `subsets: ["latin","latin-ext"]` — yoksa Türkçe
  glifler (İ ı ş ğ ç ö ü) tofu olur.
- Her sahne kendi paletini/atmosferini kendi CSS modülünde kurar; global tema yok.
- WebGL bileşenleri `next/dynamic` + `ssr: false` ile yüklenir (three ~150KB gzip).
- Zorunlu kapılar: DPR cap 2 · IntersectionObserver ile ekran dışında duraklat ·
  `visibilitychange`'de duraklat · `prefers-reduced-motion`'da tek statik kare ·
  cleanup'ta dispose.
