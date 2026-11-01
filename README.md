# 🇹🇷 Türkçe Kelime Quiz · Türkçe–Özbekçe

### 🔗 Canlı: **[zirvet.vercel.app](https://zirvet.vercel.app/)**

A1–A2 seviyesi Türkçe kelimelerini **ünite ünite**, rastgele ve **süreli** testlerle öğrenmek için yapılmış bir Next.js uygulaması. Kelimeler Word (`.docx`) dosyalarından çıkarılmıştır — toplam **1487 kelime, 12 ünite**.

> A1–A2 darajali turkcha so'zlarni **bo'lim-bo'lim**, tasodifiy va **vaqt belgilangan** testlar bilan o'rganish uchun Next.js ilovasi.

## ✨ Özellikler / Imkoniyatlar

- 📚 **Bölüm bölüm** — Tüm kelimeler ünitelere ve türlere (İsimler, Fiiller, Kalıp İfadeler) ayrılmıştır.
- 🎲 **Rastgele sorular** — Kaç soru çözeceğini sen seçersin; havuzdan rastgele seçilir.
- ✏️ **İki cevap şekli:**
  - **Çoktan seçmeli** — 4 şıktan doğru olanı işaretle.
  - **Yazarak** — cevabı klavyeden yaz. Eksik/yanlış harf varsa **doğru yazım harf harf vurgulanarak** gösterilir; tamamen yanlışsa doğru cevap gösterilir. Küçük yazım hataları (eksik harf, aksan) hoş görülür.
- ⏱️ **Süreli sorular** — Soru başına süre (5–30 sn veya süresiz) belirlenir; **süre bitince otomatik sonraki soruya geçer.**
- ✅ **İşaretleyince otomatik geçiş** — Cevapladığında doğru/yanlış gösterilir ve otomatik olarak sonraki soruya geçer.
- ⬅️➡️ **Üstte gezinme** — Üst çubuktaki oklarla önceki/sonraki soruya geçebilir veya geri dönebilirsin.
- 🔁 **Soru yönü** — Türkçe → Özbekçe, Özbekçe → Türkçe veya karışık.
- 📊 **Sonuç ekranı** — Puan, doğru/yanlış/süre doldu istatistikleri ve tüm cevapların incelemesi.
- 🌙 **Açık / koyu tema**, ⌨️ **klavye desteği** (1–4 / A–D şık seç, ← → gezin).
- 📱 Tamamen **responsive** ve [lucide](https://lucide.dev) ikonlarıyla tasarlanmış **Tailwind CSS** arayüzü.

## 🚀 Çalıştırma / Ishga tushirish

```bash
npm install
npm run dev     # http://localhost:3000
```

Production derlemesi için:

```bash
npm run build
npm run start
```

## 🧩 Teknolojiler

| | |
|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) |
| Stil | **Tailwind CSS** |
| İkonlar | **lucide-react** |
| Veri | Statik `data/vocab.json` (client-side) |

## 📁 Proje yapısı

```
app/
  layout.tsx        · kök layout, tema
  page.tsx          · ekran yönlendirici (setup → quiz → result)
components/
  SetupScreen.tsx   · ünite / tür / cevap şekli / soru sayısı / süre / yön
  QuizScreen.tsx    · soru kartı, süre halkası, üst gezinme, otomatik geçiş
  WritingAnswer.tsx · yazarak cevap + harf harf düzeltme gösterimi
  ResultScreen.tsx  · puan, istatistik, cevap incelemesi
  ThemeToggle.tsx   · açık/koyu tema
lib/
  vocab.ts          · kelime havuzu + test üretimi
  match.ts          · yazarak cevap eşleştirme + düzeltme (Levenshtein)
  types.ts          · tip tanımları
  utils.ts          · yardımcılar
data/
  vocab.json        · çıkarılmış kelimeler (1296)
vocabulary-source/  · kaynak Word (.docx) dosyaları
```

## 📝 Kelime verisi

Kelimeler `vocabulary-source/` klasöründeki `.docx` dosyalarından otomatik çıkarılıp `data/vocab.json` içine işlenmiştir. Yeni ünite eklemek için dosyayı bu klasöre koyup çıkarma betiğini yeniden çalıştırmak yeterlidir.

---

Türkçe öğrenenler için ❤️ ile yapıldı.
