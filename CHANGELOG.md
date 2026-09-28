# Değişim Günlüğü (CHANGELOG)

Tüm önemli değişiklikler bu dosyada belgelenecektir.

## [v0.1.0] - 2026-09-28

### 🎉 İlk Sürüm (Initial Release)

#### 🚀 Özellikler
- **Sıfır Backend & %100 Yerel İşleme:** Veriler hiçbir dış sunucuya gönderilmez, tüm token sayımları ve analizler yerel olarak tarayıcıda çalışır.
- **Çoklu Format Ayrıştırma:**
  - OpenAI ChatGPT Export / API JSON (`messages` yapısı, `tool_calls` ve `tool` sonuçları desteği)
  - Anthropic Claude JSON (`system` prompt, `tool_use` ve `tool_result` desteği)
  - Düz Metin (Plain text) & otomatik RAG etiket tespiti (`<documents>`, `Context:`, `Kaynak:`).
- **Dürüst Token Sayım Motoru:**
  - OpenAI modelleri için `gpt-tokenizer` (BPE) ile kesin (exact) sayım.
  - Anthropic, Google Gemini ve Meta Llama modelleri için çarpan ölçeklemeli yaklaşık (`~`) sayım.
  - 2 milyon karakter üstündeki metinlerde tarayıcı kilitlenmesini önleyen korumalı hızlı tahmin.
- **Squarified Treemap Görselleştirme:**
  - Kütüphanesiz (D3 kullanmadan) Bruls, Huizing, van Wijk algoritması ile üretilen iki seviyeli SVG treemap.
  - Renk körlüğüne uygun Okabe-Ito renk paleti.
  - Sığma kontrolleri, klavye/aria erişilebilirliği (`tabindex="0"`) ve hover tooltip.
- **Kural Tabanlı Analiz ve Öneriler (Insights):**
  - Context doluluk seviyesi uyarıları (%70+ warn, %90+ critical).
  - Baskın kategori (>%50) ve büyük segment (>%25) tespitleri.
  - Tekrarlanan (mükerrer) içerik ve boşa harcanan token hesabı.
  - Geniş sistem yönergesi bildirimleri.
- **Çift Yerel Dışa Aktarma:**
  - **PNG Olarak İndir:** 1200x630 çözünürlükte paylaşıma uygun tema uyumlu görsel ihracı.
  - **Özet JSON İndir:** Hassas metin içeriklerini **silerek** sadece token sayılarını ve istatistikleri paylaşılabilir JSON olarak indirme.
- **Yüksek Performans & Web Worker:**
  - Analiz motoru Vite Web Worker (`analyzer.worker.ts`) üzerinde çalışarak ana arayüz donmalarını engeller.
- **Tema & Erişilebilirlik:**
  - WCAG AA uyumlu Koyu (Dark) ve Açık (Light) tema desteği.
  - Ekran okuyucular için `aria-live="polite"` duyuru bölgesi.
  - Dağıtım için GitHub Actions iş akışı (`deploy.yml`).
