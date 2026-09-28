# Model Bilgileri ve Context Penceresi Notları

Bu belgedeki model ve context penceresi (context window) değerleri resmi dokümantasyonlardan doğrulanmalıdır.

- **Son Doğrulama Tarihi:** 28 Eylül 2026
- **Not:** Değerler varsayılan başlangıç tahminleridir ve güncellenebilir.

## Modeller ve Tahmini Context Pencereleri:

1. **OpenAI** (Exact tokenizer):
   - GPT-4o: 128,000 token
   - GPT-4o Mini: 128,000 token
   - GPT-4 Turbo: 128,000 token
   - GPT-3.5 Turbo: 16,385 token

2. **Anthropic** (Approximate tokenizer - gpt-tokenizer * factor):
   - Claude 3.5 Sonnet: 200,000 token (approxFactor: 1.05)
   - Claude 3 Opus: 200,000 token (approxFactor: 1.05)
   - Claude 3 Haiku: 200,000 token (approxFactor: 1.05)

3. **Google** (Approximate tokenizer):
   - Gemini 1.5 Pro: 2,000,000 token (approxFactor: 1.00)
   - Gemini 1.5 Flash: 1,000,000 token (approxFactor: 1.00)
   - Gemini 2.0 Flash: 1,000,000 token (approxFactor: 1.00)

4. **Meta Llama** (Approximate tokenizer):
   - Llama 3.3 70B: 128,000 token (approxFactor: 1.00)
   - Llama 3.1 405B: 128,000 token (approxFactor: 1.00)

5. **Özel (Custom)**:
   - Kullanıcı tanımlı / Diğer Model: 128,000 token (approxFactor: 1.00)
