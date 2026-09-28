import { encode } from 'gpt-tokenizer';
import type { ModelInfo } from '../types';
import defaultModels from './models.json';

export const models: ModelInfo[] = defaultModels as ModelInfo[];

const MAX_CHAR_THRESHOLD = 2_000_000;

/**
 * Metnin token sayısını hesaplar.
 * OpenAI modelleri için kesin (exact: true), diğer modeller için yaklaşıktır (exact: false).
 * 2 milyon karakteri aşan durumlarda tarayıcı performansını korumak için hızlı tahmine geçer.
 */
export function countTokens(text: string, model: ModelInfo): { tokens: number; exact: boolean } {
  const isModelExact = model.tokenizer === 'exact';

  // Boş metin durumu
  if (!text || text.length === 0) {
    return { tokens: 0, exact: isModelExact };
  }

  // Aşırı büyük metinler için yedek yol (tarayıcı dondurmama)
  if (text.length > MAX_CHAR_THRESHOLD) {
    return {
      tokens: Math.round(text.length / 4),
      exact: false,
    };
  }

  // Tokenizer ile sayım
  const rawTokenCount = encode(text).length;

  if (isModelExact) {
    return {
      tokens: rawTokenCount,
      exact: true,
    };
  }

  // Yaklaşık model sayımı (approxFactor ile ölçekleme)
  const factor = model.approxFactor ?? 1.0;
  const approxTokens = Math.round(rawTokenCount * factor);

  return {
    tokens: approxTokens,
    exact: false,
  };
}
