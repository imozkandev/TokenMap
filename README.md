# 🗺️ Token Haritası (TokenMap)

> **LLM sohbet verilerinizi ve promptlarınızı %100 yerel olarak analiz eden, context penceresi kullanımını kategori bazlı interaktif bir treemap ile görselleştiren araç.**

[![Lisans: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Gizlilik: %100 Yerel](https://img.shields.io/badge/Gizlilik-%25100_Yerel-success.svg)](#gizlilik)
[![Canlı Demo](https://img.shields.io/badge/Canlı_Demo-GitHub_Pages-brightgreen.svg)](https://username.github.io/tokenmap/)

[English Documentation (README.en.md)](README.en.md)

---

## 🖼️ Ekran Görüntüsü

![Token Haritası Arayüzü](docs/screenshot.png)
*(Görselinizi eklemek için `docs/screenshot.png` yolunu kullanabilirsiniz.)*

---

## 🤔 Neden Token Haritası?

Büyük Dil Modelleri (LLM) ile çalışırken **context penceresinin (context window)** tam olarak neye harcandığını görmek zordur. Sistem yönergeleri (system prompt), kullanıcı mesajları, RAG (doküman arama) çıktıları ve araç (tool call/result) sonuçları context penceresini hızla tüketir.

**Token Haritası**, metinlerinizi kategorilere ayırarak hangi bileşenin ne kadar alan kapladığını interaktif kare treemap grafiği ile anında gösterir ve bağlam optimizasyonu için öneriler sunar.

---

## 🚀 Nasıl Kullanılır? (3 Adımda)

1. **Girdiyi Yapıştırın veya Yükleyin:** LLM sohbet JSON verinizi (OpenAI veya Anthropic) ya da düz metninizi yapıştırın (veya `.json`/`.txt` dosyanızı sürükleyip bırakın).
2. **Modelinizi Seçin:** Açılır listeden hedef LLM modelini (GPT-4o, Claude 3.5, Gemini vb.) seçin.
3. **Analizi İnceleyin:** Treemap grafiği ve kural tabanlı öneriler ile bağlam alanınızı en çok tüketen parçaları tespit edin.

---

## 🔒 Gizlilik Güvencesi (%100 Yerel İşleme)

Token Haritası tamamen **istemci tarafında (browser-only)** çalışacak şekilde tasarlanmıştır:

- **Sıfır Ağ İsteği:** Hiçbir veri sunuculara veya dış API'lere gönderilmez.
- **CSP Kısıtlaması:** `connect-src 'none'` Content Security Policy meta etiketi ile tarayıcı seviyesinde tüm dış istekler engellenir.
- **LocalStorage Kullanımı:** Metinleriniz veya kişisel verileriniz `localStorage` alanına yazılmaz (yalnızca koyu/açık tema tercihiniz saklanır).

> 💡 **Nasıl Doğrulanır?**
> Tarayıcınızda `F12` tuşuna basarak **Geliştirici Araçları (DevTools)** -> **Network (Ağ)** sekmesini açın. Metin yapıştırdığınızda veya analiz çalıştırdığınızda tek bir ağ isteğinin bile oluşmadığını gözlemleyebilirsiniz.

---

## 🎯 Tokenizer Doğruluğu

Farklı LLM aileleri farklı tokenizer (bpe) algoritmaları kullanır. Uygulama tokenizer dürüstlüğü ilkesiyle çalışır:

| Model Ailesi | Sayım Yöntemi | Doğruluk Durumu | Açıklama |
| :--- | :--- | :--- | :--- |
| **OpenAI** (GPT-4o, GPT-4 Turbo vb.) | `gpt-tokenizer` BPE | Kesin (Exact) | Birebir kesin token hesabı yapılır. |
| **Anthropic** (Claude 3.5 Sonnet vb.) | Yaklaşık Tahmin (Approx) | Yaklaşık (`~`) | `gpt-tokenizer` sonucu çarpan ölçeklemesi ile hesaplanır (sapma ±%10-15). |
| **Google** (Gemini 1.5 Pro vb.) | Yaklaşık Tahmin (Approx) | Yaklaşık (`~`) | `gpt-tokenizer` sonucu baz alınarak yaklaşık gösterilir. |
| **Meta** (Llama 3.3 vb.) | Yaklaşık Tahmin (Approx) | Yaklaşık (`~`) | `gpt-tokenizer` sonucu baz alınarak yaklaşık gösterilir. |

---

## 📋 Desteklenen Girdi Formatları

| Format | Format Tanımı | Örnek Yapı |
| :--- | :--- | :--- |
| **OpenAI JSON** | ChatGPT export veya API mesaj dizisi | `{"messages": [{"role": "user", "content": "..."}]}` |
| **Anthropic JSON** | Claude API sohbet yapısı | `{"system": "...", "messages": [{"role": "user", "content": [...]}]}` |
| **Düz Metin (Plain)** | Düz prompt veya bloklu metinler | Yapıştırılan standart metinler ve bloklar |

---

## 💻 Yerelde Çalıştırma

Projeyi bilgisayarınızda geliştirmek veya çalıştırmak için:

```bash
# 1. Repoyu klonlayın
git clone https://github.com/username/tokenmap.git
cd tokenmap

# 2. Bağımlılıkları yükleyin
npm install

# 3. Geliştirme sunucusunu başlatın
npm run dev

# 4. Birim testleri çalıştırın
npm run test

# 5. Üretim sürümünü derleyin
npm run build
```

---

## 🤝 Katkıda Bulunma, Yol Haritası ve Lisans

- **Katkıda Bulunma:** Yeni ayrıştırıcı, model veya analiz kuralı eklemek için [CONTRIBUTING.md](CONTRIBUTING.md) belgesini inceleyin.
- **Lisans:** Bu proje [MIT Lisansı](LICENSE) altında açık kaynak olarak sunulmaktadır.
