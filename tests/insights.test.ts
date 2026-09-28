import { describe, it, expect } from 'vitest';
import { generateInsights, checkDuplicateContent } from '../src/analysis/insights';
import type { AnalysisResult } from '../src/types';

describe('Insights Analysis Module', () => {
  const baseResult: AnalysisResult = {
    totalTokens: 100,
    exact: true,
    contextWindow: 1000,
    usagePercentage: 10,
    remainingTokens: 900,
    categoryStats: [
      { category: 'user', label: 'Kullanıcı', tokens: 60, percentage: 60 },
      { category: 'assistant', label: 'Asistan', tokens: 40, percentage: 40 },
    ],
    segments: [
      { id: '1', category: 'user', label: 'Kullanıcı 1', text: 'Mesaj 1 text', tokens: 60 },
      { id: '2', category: 'assistant', label: 'Asistan 1', text: 'Mesaj 2 text', tokens: 40 },
    ],
    warnings: [],
  };

  it('1. Doluluk sınırı %90 üstünde ise critical, %70 üstünde warn uyarısı vermelidir', () => {
    const res95: AnalysisResult = { ...baseResult, usagePercentage: 95 };
    const insights95 = generateInsights(res95);
    expect(insights95.some((i) => i.severity === 'critical')).toBe(true);

    const res75: AnalysisResult = { ...baseResult, usagePercentage: 75 };
    const insights75 = generateInsights(res75);
    expect(insights75.some((i) => i.severity === 'warn' && i.title.includes('%70+'))).toBe(true);
  });

  it('2. Baskın bir kategori (%50+) için öneri üretmelidir', () => {
    const resTool: AnalysisResult = {
      ...baseResult,
      categoryStats: [
        { category: 'tool_result', label: 'Araç Çıktıları', tokens: 60, percentage: 60 },
        { category: 'user', label: 'Kullanıcı', tokens: 40, percentage: 40 },
      ],
    };

    const insights = generateInsights(resTool);
    expect(insights.some((i) => i.title.includes('Araç Çıktıları Baskın'))).toBe(true);
  });

  it('3. %25 üzerinde paya sahip tekil segment için uyarı vermelidir', () => {
    const resSegment: AnalysisResult = {
      ...baseResult,
      segments: [
        { id: '1', category: 'user', label: 'Büyük Kullanıcı Mesajı', text: 'Çok uzun metin...', tokens: 80 },
        { id: '2', category: 'assistant', label: 'Küçük Yanıt', text: 'Kısa metin', tokens: 20 },
      ],
    };

    const insights = generateInsights(resSegment);
    expect(insights.some((i) => i.title.includes('Büyük Segment Uyarısı'))).toBe(true);
  });

  it('4. Mükerrer/Tekrarlanan içerikleri tespit edip boşa giden tokenı hesaplamalıdır', () => {
    const duplicateText = 'Bu metin tam olarak aynı kelimeleri içeren ve tekrar eden uzun bir metindir.';
    const resDuplicate: AnalysisResult = {
      ...baseResult,
      segments: [
        { id: '1', category: 'user', label: 'Mesaj 1', text: duplicateText, tokens: 50 },
        { id: '2', category: 'user', label: 'Mesaj 2', text: duplicateText, tokens: 50 },
      ],
    };

    const insight = checkDuplicateContent(resDuplicate);
    expect(insight).not.toBeNull();
    expect(insight?.title).toBe('Tekrarlanan İçerik Tespiti');
    expect(insight?.detail).toContain('50 token boşa harcanıyor');
  });

  it('5. Approx tokenizer kullanıldığında bilgilendirme notu eklemelidir', () => {
    const resApprox: AnalysisResult = { ...baseResult, exact: false };
    const insights = generateInsights(resApprox);
    expect(insights.some((i) => i.title.includes('Yaklaşık Token Sayımı'))).toBe(true);
  });
});
