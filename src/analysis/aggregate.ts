import type { ParsedConversation, ModelInfo, AnalysisResult, CategoryStat, Category, Segment } from '../types';
import { countTokens } from '../tokenizer';

const CATEGORY_LABELS: Record<Category, string> = {
  system: 'Sistem Yönergesi',
  user: 'Kullanıcı Mesajları',
  assistant: 'Asistan Yanıtları',
  tool_call: 'Araç Çağrıları',
  tool_result: 'Araç Çıktıları',
  rag: 'RAG / Bağlam Belgeleri',
  other: 'Diğer / Medya',
};

/**
 * Ayrıştırılmış sohbet verilerini ve seçilen modeli alarak token sayımlarını ve kategori istatistiklerini hesaplar.
 */
export function analyze(conversation: ParsedConversation, model: ModelInfo): AnalysisResult {
  let isAllExact = model.tokenizer === 'exact';
  let totalTokens = 0;

  // Segment tokenlarını tek merkezden hesapla
  const updatedSegments: Segment[] = conversation.segments.map((segment) => {
    const { tokens, exact } = countTokens(segment.text, model);
    if (!exact) {
      isAllExact = false;
    }
    totalTokens += tokens;
    return {
      ...segment,
      tokens,
    };
  });

  // Kategori bazlı gruplama ve hesaplama
  const categoryMap = new Map<Category, number>();

  updatedSegments.forEach((segment) => {
    const current = categoryMap.get(segment.category) || 0;
    categoryMap.set(segment.category, current + segment.tokens);
  });

  const categoryStats: CategoryStat[] = Array.from(categoryMap.entries())
    .map(([category, catTokens]) => {
      const percentage = totalTokens > 0 ? Number(((catTokens / totalTokens) * 100).toFixed(1)) : 0;
      return {
        category,
        label: CATEGORY_LABELS[category] || category,
        tokens: catTokens,
        percentage,
      };
    })
    .sort((a, b) => b.tokens - a.tokens);

  const usagePercentage = Number(((totalTokens / model.contextWindow) * 100).toFixed(1));
  const remainingTokens = Math.max(0, model.contextWindow - totalTokens);

  return {
    totalTokens,
    exact: isAllExact,
    contextWindow: model.contextWindow,
    usagePercentage,
    remainingTokens,
    categoryStats,
    segments: updatedSegments,
    warnings: [...conversation.warnings],
  };
}
