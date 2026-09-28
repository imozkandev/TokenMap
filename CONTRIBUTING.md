# Katkıda Bulunma Rehberi (CONTRIBUTING)

Token Haritası'na katkıda bulunmak istediğiniz için teşekkür ederiz! Projeyi temiz, modüler ve güvenli tutmak için lütfen aşağıdaki rehberi takip edin.

---

## 📐 Genel Geliştirme Kuralları

1. **Çerçeve (Framework) Kullanılmaz:** Proje Vanilla TypeScript ile yazılmıştır. React, Vue veya Svelte eklenmez.
2. **Sıfır Backend & Sıfır Ağ İsteği:** Hiçbir dış API çağrısı veya analitik servisi eklenemez.
3. **Tek Runtime Bağımlılığı:** Projenin tek dış çalışma zamanı bağımlılığı `gpt-tokenizer` paketidir. Başka bir çalışma zamanı kütüphanesi eklenmeden önce konu açılmalıdır.

---

## 🛠️ Yeni Özellik Ekleme Rehberleri

### 1. Yeni Bir Sohbet / Format Ayrıştırıcısı (Parser) Ekleme

Yeni bir LLM veya mesaj formatı eklemek için:

1. `src/parsers/` dizini altında yeni bir `.ts` dosyası oluşturun (örneğin `src/parsers/gemini.ts`).
2. Ayrıştırıcınızın imzası `(jsonObj: unknown) => ParsedConversation` olmalıdır.
3. **Önemli Kural:** Ayrıştırıcı içinde token sayımı **YAPMAYIN**. `segment.tokens` değerini `0` olarak bırakın (Token sayımı `src/analysis/aggregate.ts` tarafından tek merkezden yapılır).
4. **Hata Toleransı:** Ayrıştırıcılar **asla exception fırlatmamalıdır**. Beklenmeyen bir yapıda hatayı yutup `warnings` dizisine anlaşılır bir mesaj ekleyin.
5. `src/parsers/index.ts` içindeki `parseInput` fonksiyonuna format algılama mantığınızı entegre edin.
6. `tests/parsers.test.ts` dosyasına yeni formatınız için kapsamlı birim testler yazın.

---

### 2. Yeni Bir Analiz Öneri Kuralı (Insight Rule) Ekleme

Analiz motoruna kural tabanlı yeni bir öneri eklemek için:

1. `src/analysis/insights.ts` dosyasına gidin.
2. `(result: AnalysisResult) => Insight | null` veya `Insight[]` döndüren **küçük, isimli bir kural fonksiyonu** yazın (örneğin `checkLongToolCalls`).
3. Fonksiyonunuzu `generateInsights` ana işlevine ekleyin.
4. `tests/insights.test.ts` dosyasına yeni kuralınızın doğru çalıştığını doğrulayan bir test ekleyin.

---

### 3. Yeni Bir LLM Modeli Ekleme

Model listesine yeni bir yapay zeka modeli eklemek için:

1. `src/tokenizer/models.json` dosyasına model nesnesini ekleyin:
   ```json
   {
     "id": "model-id",
     "label": "Model Sağlayıcı - Model Adı",
     "contextWindow": 128000,
     "tokenizer": "exact veya approx",
     "approxFactor": 1.0
   }
   ```
2. **Kaynak Doğrulama Zorunluluğu:** `src/tokenizer/MODELS_README.md` dosyasını açın. Eklediğiniz modelin resmi context penceresi dokümantasyon bağlantısını ve son doğrulama tarihini belgeye kaydedin.

---

## ✅ Pull Request (PR) Kontrol Listesi

PR göndermeden önce lütfen terminalde şu komutu çalıştırıp tüm adımların yeşil olduğunu doğrulayın:

```bash
npm run typecheck && npm run test && npm run build
```

- [ ] Tip hatası yok (`tsc --noEmit` hatasız).
- [ ] Tüm birim testler geçiyor (`vitest run` hatasız).
- [ ] Statik derleme başarılı (`vite build` hatasız).
- [ ] Yeni özellikler için birim testler eklendi.
- [ ] Kod tarzına ve gizlilik kurallarına (sıfır ağ isteği) uyuldu.
