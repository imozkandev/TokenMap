import { describe, it, expect } from 'vitest';
import { buildSummaryJson } from '../src/utils/export';
import type { AnalysisResult, ModelInfo } from '../src/types';

describe('Export Module', () => {
  const mockModel: ModelInfo = {
    id: 'gpt-4o',
    label: 'GPT-4o',
    contextWindow: 128000,
    tokenizer: 'exact',
  };

  const mockResult: AnalysisResult = {
    totalTokens: 1500,
    exact: true,
    contextWindow: 128000,
    usagePercentage: 1.2,
    remainingTokens: 126500,
    categoryStats: [
      { category: 'user', label: 'Kullanıcı', tokens: 1000, percentage: 66.7 },
      { category: 'assistant', label: 'Asistan', tokens: 500, percentage: 33.3 },
    ],
    segments: [
      { id: 'seg-1', category: 'user', label: 'Kullanıcı 1', text: 'BU HASSAS VE GİZLİ MÜŞTERİ BİLGİSİDİR!', tokens: 1000 },
      { id: 'seg-2', category: 'assistant', label: 'Asistan 1', text: 'BU DA ASİSTAN YANITIDIR.', tokens: 500 },
    ],
    warnings: [],
  };

  it('1. Özet JSON yapısında hassas ham metin (text) bulunmamalıdır', () => {
    const summary = buildSummaryJson(mockResult, mockModel);

    expect(summary.totalTokens).toBe(1500);
    expect(summary.model.id).toBe('gpt-4o');
    expect(summary.segments).toHaveLength(2);

    // Segment nesnelerinde "text" alanının silinmiş olduğunu doğrula
    summary.segments.forEach((seg) => {
      expect(seg).toHaveProperty('id');
      expect(seg).toHaveProperty('category');
      expect(seg).toHaveProperty('label');
      expect(seg).toHaveProperty('tokens');
      expect(seg).not.toHaveProperty('text');
    });

    const jsonString = JSON.stringify(summary);
    expect(jsonString).not.toContain('BU HASSAS VE GİZLİ MÜŞTERİ BİLGİSİDİR');
  });

  it('2. İhraç edilen tarih ISO formatında olmalıdır', () => {
    const summary = buildSummaryJson(mockResult, mockModel);
    expect(new Date(summary.exportedAt).toISOString()).toBe(summary.exportedAt);
  });
});
