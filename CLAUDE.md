# Token Haritası (TokenMap) - Proje Kuralları ve Rehberi

## AMAÇ
Kullanıcının yapıştırdığı LLM sohbet JSON'unu veya düz prompt metnini parçalara ayıran, her parçanın token sayısını tarayıcıda hesaplayan ve context penceresinin kullanımını kategori bazlı bir SVG treemap olarak görselleştiren bir web uygulamasıdır.

---

## KESİN KURALLAR

### 1. Mimari & Ağ Kısıtlamaları
- **Sıfır Backend:** Hiçbir sunucu veya API katmanı yok. Her şey derlenmiş statik dosyalar olarak çalışır.
- **Ağ İsteği Yasak:** `fetch`, `XHR`, `WebSocket`, analitik araçları ve CDN üzerinden dinamik font/script yüklemek kesinlikle yasaktır.
- **LLM API Bağımsızlığı:** Hiçbir LLM API'si çağrılmaz, API anahtarı istenmez.
- **Gizlilik:** Kullanıcı verisi hiçbir dış sunucuya gönderilmez. `localStorage` alanına kullanıcı verisi yazılmaz (yalnızca tema tercihi saklanabilir).

### 2. Teknoloji Yığını & Bağımlılıklar
- **Araçlar:** Vite + TypeScript (strict mode) + Vitest.
- **Framework Yok:** React, Vue, Svelte veya benzeri bir UI framework kullanılmayacak (Vanilla TS DOM manipulation).
- **Treemap Algoritması:** Treemap grafiği SVG ile ve kendi yazdığımız **squarified treemap** algoritmasıyla çizilecek. D3.js veya benzeri grafik kütüphanesi kullanılmayacak.
- **Tek Dış Çalışma Zamanı Bağımlılığı:** Yalnızca `gpt-tokenizer` paketi kullanılabilir. Başka herhangi bir runtime bağımlılığı eklenmeden önce onay alınmalıdır.

### 3. Kod Kalitesi & Tasarım
- **Okunabilirlik:** Modüler, küçük dosyalar, açık fonksiyon/değişken isimleri. Yalnızca gerektiği yerlerde kısa Türkçe açıklamalar/yorumlar.
- **Hata Toleransı (Parsers):** Ayrıştırıcılar asla exception fırlatarak uygulamayı çökertmeyecek. Bozuk veya geçersiz girdilerde kullanıcıya anlaşılır bir uyarı üretip otomatik olarak düz metin (plain text) moduna düşecek.
- **Erişilebilirlik (a11y):**
  - Klavye ile tam gezilebilirlik.
  - Yeterli renk kontrastı.
  - Renk körlüğüne uygun ve erişilebilir renk paleti.
  - Treemap kutucuklarında bilgilendirici `aria-label` nitelikleri.
- **Uluslararasılaştırma (i18n):** Arayüz varsayılan olarak Türkçe olacaktır. Ancak tüm arayüz metinleri `src/i18n.ts` dosyasında merkezi olarak tutulacak, böylece ileride İngilizce vb. diller kolayca eklenebilecektir.
- **Tokenizer Dürüstlüğü:** OpenAI modelleri için token sayımı kesindir. Diğer modeller için sayımlar yaklaşık kabul edilir. Yaklaşık sayımlar kullanıcı arayüzünde `~` sembolü ve "yaklaşık" etiketiyle açıkça gösterilmelidir.

---

## ADIM ADIM GELİŞTİRME SÜRECİ VE ONAY KURALI
Her geliştirme adımının sonunda şu format uygulanacaktır:
1. Ne yapıldığı iki cümleyle özetlenecektir.
2. Testler ve build komutları çalıştırılacaktır.
3. Hata varsa giderilecektir.
4. Kullanıcıya doğrulaması için çalıştırabileceği komut bildirilecek ve onay beklenmeden bir sonraki adıma geçilmeyecektir.
