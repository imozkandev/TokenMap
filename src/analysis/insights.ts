import type { AnalysisResult, Insight } from '../types';

/**
 * Analiz sonuçlarını inceleyerek kural tabanlı öneriler ve uyarılar üretir.
 */
export function generateInsights(result: AnalysisResult): Insight[] {
  if (result.totalTokens === 0) {
    return [];
  }

  const insights: Insight[] = [];

  // Rule 1: Context Doluluk Seviyesi
  const usageInsight = checkContextUsage(result);
  if (usageInsight) insights.push(usageInsight);

  // Rule 2: Baskın Kategori (> %50)
  const categoryInsight = checkCategoryDominance(result);
  if (categoryInsight) insights.push(categoryInsight);

  // Rule 3: Baskın Tekil Segment (> %25)
  const segmentInsights = checkSegmentDominance(result);
  insights.push(...segmentInsights);

  // Rule 4: Mükerrer/Tekrarlanan İçerik
  const duplicateInsight = checkDuplicateContent(result);
  if (duplicateInsight) insights.push(duplicateInsight);

  // Rule 5: Büyük Sistem Promptu (> %30)
  const systemInsight = checkSystemPromptSize(result);
  if (systemInsight) insights.push(systemInsight);

  // Rule 6: Yaklaşık Sayım Bilgilendirmesi
  const approxInsight = checkApproximateTokenizer(result);
  if (approxInsight) insights.push(approxInsight);

  // Önem sırasına göre sıralama (critical -> warn -> info) ve en fazla 6 tane seçme
  const severityWeight = { critical: 3, warn: 2, info: 1 };
  return insights
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
    .slice(0, 6);
}

// --- Küçük İsimli Kural Fonksiyonları ---

export function checkContextUsage(result: AnalysisResult): Insight | null {
  if (result.usagePercentage >= 90) {
    return {
      severity: 'critical',
      title: 'Kritik Doluluk Seviyesi (%90+)',
      detail: `Context penceresi dolmak üzere (%${result.usagePercentage}). Model yanıt üretirken eski mesajları unutabilir veya bağlam sınırına takılabilir.`,
    };
  }
  if (result.usagePercentage >= 70) {
    return {
      severity: 'warn',
      title: 'Yüksek Doluluk Uyarısı (%70+)',
      detail: `Context penceresi yüksek dolulukta (%${result.usagePercentage}). Sohbet geçmişini özetlemek veya gereksiz bağlamı temizlemek faydalı olabilir.`,
    };
  }
  return null;
}

export function checkCategoryDominance(result: AnalysisResult): Insight | null {
  const dominant = result.categoryStats.find((cat) => cat.percentage > 50);
  if (!dominant) return null;

  switch (dominant.category) {
    case 'tool_result':
      return {
        severity: 'warn',
        title: `Araç Çıktıları Baskın (%${dominant.percentage})`,
        detail: 'Araç (tool) çıktıları alanın %50’sinden fazlasını kaplıyor. Büyük araç çıktılarını özetleyin veya sadece gerekli alanları döndürün.',
      };
    case 'rag':
      return {
        severity: 'warn',
        title: `RAG Belgeleri Baskın (%${dominant.percentage})`,
        detail: 'Getirilen bağlam belgeleri alanın %50’sinden fazlasını kaplıyor. Parça sayısını (top-k) azaltın veya daha kısa parçalar seçin.',
      };
    case 'system':
      return {
        severity: 'warn',
        title: `Sistem Yönergesi Baskın (%${dominant.percentage})`,
        detail: 'Sistem yönergesi toplam alanın %50’sinden fazlasını kaplıyor. Sistem prompt’unu sadeleştirmeyi veya modüler parçalara ayırmayı değerlendirin.',
      };
    case 'assistant':
    case 'user':
      return {
        severity: 'warn',
        title: `Sohbet Geçmişi Yüksek (%${dominant.percentage})`,
        detail: 'Sohbet geçmişi toplam alanın %50’sinden fazlasını kaplıyor. Önemli noktaları özetleyerek yeni bir oturum başlatmayı değerlendirin.',
      };
    default:
      return {
        severity: 'info',
        title: `${dominant.label} Kategorisi Baskın (%${dominant.percentage})`,
        detail: `${dominant.label} kategorisi toplam token kullanımının yarısından fazlasını oluşturuyor.`,
      };
  }
}

export function checkSegmentDominance(result: AnalysisResult): Insight[] {
  if (result.totalTokens === 0) return [];
  const insights: Insight[] = [];

  for (const seg of result.segments) {
    const segPercentage = Number(((seg.tokens / result.totalTokens) * 100).toFixed(1));
    if (segPercentage >= 25) {
      insights.push({
        severity: 'warn',
        title: `Büyük Segment Uyarısı (%${segPercentage})`,
        detail: `"${seg.label}" segmenti tek başına toplam alanın %${segPercentage}'ini (${seg.tokens} token) kaplıyor.`,
      });
    }
  }

  return insights;
}

export function checkDuplicateContent(result: AnalysisResult): Insight | null {
  const textMap = new Map<string, { count: number; totalTokens: number; singleTokens: number }>();

  for (const seg of result.segments) {
    const normalized = seg.text.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized.length < 20) continue; // Çok kısa tekrarları yok say

    const current = textMap.get(normalized);
    if (current) {
      current.count += 1;
      current.totalTokens += seg.tokens;
    } else {
      textMap.set(normalized, { count: 1, totalTokens: seg.tokens, singleTokens: seg.tokens });
    }
  }

  let wastedTokens = 0;
  let duplicateCount = 0;

  textMap.forEach((val) => {
    if (val.count >= 2) {
      duplicateCount += val.count - 1;
      wastedTokens += val.totalTokens - val.singleTokens;
    }
  });

  if (wastedTokens > 0) {
    return {
      severity: 'warn',
      title: 'Tekrarlanan İçerik Tespiti',
      detail: `${duplicateCount} adet mükerrer veya tekrar eden içerik tespit edildi. Yaklaşık ${wastedTokens} token boşa harcanıyor.`,
    };
  }

  return null;
}

export function checkSystemPromptSize(result: AnalysisResult): Insight | null {
  const systemStat = result.categoryStats.find((c) => c.category === 'system');
  if (systemStat && systemStat.percentage >= 30 && systemStat.percentage <= 50) {
    return {
      severity: 'info',
      title: 'Geniş Sistem Yönergesi (%30+)',
      detail: 'Sistem yönergesi toplam alanın %30’undan fazlasını kaplıyor.',
    };
  }
  return null;
}

export function checkApproximateTokenizer(result: AnalysisResult): Insight | null {
  if (!result.exact) {
    return {
      severity: 'info',
      title: 'Yaklaşık Token Sayımı (~)',
      detail: 'Bu model için sayım yaklaşık olarak hesaplanmıştır. Kategori oranları ve treemap dağılımı güvenilirdir, mutlak sayılar ±%10-15 sapabilir.',
    };
  }
  return null;
}
