import { describe, it, expect } from 'vitest';
import { countTokens, models } from '../src/tokenizer';
import type { ModelInfo } from '../src/types';

describe('Tokenizer Module', () => {
  const exactModel: ModelInfo = models.find((m) => m.tokenizer === 'exact') || {
    id: 'gpt-4o',
    label: 'GPT-4o',
    contextWindow: 128000,
    tokenizer: 'exact',
  };

  const approxModel: ModelInfo = models.find((m) => m.tokenizer === 'approx') || {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    tokenizer: 'approx',
    approxFactor: 1.05,
  };

  it('boş metin için 0 token döndürmelidir', () => {
    const resultExact = countTokens('', exactModel);
    expect(resultExact.tokens).toBe(0);
    expect(resultExact.exact).toBe(true);

    const resultApprox = countTokens('', approxModel);
    expect(resultApprox.tokens).toBe(0);
    expect(resultApprox.exact).toBe(false);
  });

  it('kısa İngilizce cümle için doğru token sayısı ve exact:true döndürmelidir', () => {
    const text = 'Hello world, this is a test prompt.';
    const result = countTokens(text, exactModel);
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.exact).toBe(true);
  });

  it('Türkçe cümle için token hesabı yapmalıdır', () => {
    const text = 'Merhaba dünya, bu bir Türkçe token sayım testidir.';
    const result = countTokens(text, exactModel);
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.exact).toBe(true);
  });

  it('emoji içeren metinleri doğru şekilde tokenize etmelidir', () => {
    const text = '🚀 Token Haritası 📊 🎉';
    const result = countTokens(text, exactModel);
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.exact).toBe(true);
  });

  it('approx model için exact:false döndürmeli ve approxFactor uygulamalıdır', () => {
    const text = 'This is a sample sentence to test approx models.';
    const exactResult = countTokens(text, exactModel);
    const approxResult = countTokens(text, approxModel);

    expect(approxResult.exact).toBe(false);
    expect(approxResult.tokens).toBe(Math.round(exactResult.tokens * (approxModel.approxFactor ?? 1.0)));
  });

  it('2 milyon karakter üstündeki metinlerde hızlı yedek tahmine geçmelidir', () => {
    // 2.000.005 karakterlik büyük metin simülasyonu
    const largeText = 'a'.repeat(2_000_005);
    const result = countTokens(largeText, exactModel);

    expect(result.exact).toBe(false);
    expect(result.tokens).toBe(Math.round(2_000_005 / 4));
  });
});
