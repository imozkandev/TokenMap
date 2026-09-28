import type { AnalysisResult, ModelInfo } from '../types';
import { CATEGORY_COLORS } from '../treemap';

export interface SummaryJsonExport {
  model: {
    id: string;
    label: string;
    contextWindow: number;
    tokenizer: string;
  };
  totalTokens: number;
  exact: boolean;
  usagePercentage: number;
  remainingTokens: number;
  categoryStats: {
    category: string;
    label: string;
    tokens: number;
    percentage: number;
  }[];
  segments: {
    id: string;
    category: string;
    label: string;
    tokens: number;
  }[];
  insights: {
    severity: string;
    title: string;
    detail: string;
  }[];
  exportedAt: string;
}

/**
 * Hassas metin İÇERMEYEN, paylaşılabilir özet JSON verisi üretir.
 */
export function buildSummaryJson(result: AnalysisResult, model: ModelInfo): SummaryJsonExport {
  const now = new Date().toISOString();

  return {
    model: {
      id: model.id,
      label: model.label,
      contextWindow: model.contextWindow,
      tokenizer: model.tokenizer,
    },
    totalTokens: result.totalTokens,
    exact: result.exact,
    usagePercentage: result.usagePercentage,
    remainingTokens: result.remainingTokens,
    categoryStats: result.categoryStats.map((c) => ({
      category: c.category,
      label: c.label,
      tokens: c.tokens,
      percentage: c.percentage,
    })),
    segments: result.segments.map((s) => ({
      id: s.id,
      category: s.category,
      label: s.label,
      tokens: s.tokens,
      // METİN İÇERMEZ (Gizlilik ilkesi)
    })),
    insights: (result.warnings || []).length > 0 ? [] : [], // Insights are built from result in pipeline
    exportedAt: now,
  };
}

/**
 * Üretilen özet JSON verisini dosya olarak indirir.
 */
export function downloadSummaryJson(summaryData: SummaryJsonExport): void {
  const jsonStr = JSON.stringify(summaryData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `tokenmap-ozet-${dateStr}.json`;

  triggerBlobDownload(blob, fileName);
}

/**
 * Canvas ve SVG birleştirmesi ile 1200x630 piksel boyutunda paylaşıma uygun PNG resmi üretip indirir.
 */
export async function exportTreemapPng(
  svgElement: SVGElement,
  result: AnalysisResult,
  model: ModelInfo,
  theme: 'dark' | 'light'
): Promise<void> {
  const width = 1200;
  const height = 630;

  const canvas = document.createElement('canvas');
  canvas.width = width * 2; // High DPI 2x
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(2, 2);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  // 1. Arka Plan
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Başlık Alanı
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Token Haritası', 30, 42);

  ctx.fillStyle = mutedColor;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Model: ${model.label}  |  Kapasite: ${model.contextWindow.toLocaleString('tr-TR')} tk`, 220, 42);

  // Özet Bilgi Rozetleri
  ctx.fillStyle = cardBg;
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(width - 320, 18, 290, 36, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`Toplam: ${result.totalTokens.toLocaleString('tr-TR')} tk  (%${result.usagePercentage})`, width - 305, 41);

  // 3. SVG Treemap Görselini Canvas'a Çizme
  const svgXml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Treemap Çerçevesi
      const tmX = 30;
      const tmY = 70;
      const tmW = width - 60;
      const tmH = 480;

      ctx.fillStyle = cardBg;
      ctx.fillRect(tmX, tmY, tmW, tmH);
      ctx.drawImage(img, tmX, tmY, tmW, tmH);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

  // 4. Kategori Alt Bar İstatistiği
  const barY = 565;
  let barX = 30;
  const barWidth = width - 60;

  ctx.fillStyle = cardBg;
  ctx.fillRect(barX, barY, barWidth, 30);

  result.categoryStats.forEach((cat) => {
    const color = CATEGORY_COLORS[cat.category] || '#94a3b8';
    ctx.fillStyle = color;
    ctx.fillRect(barX + 10, barY + 10, 10, 10);

    ctx.fillStyle = textColor;
    ctx.font = '12px system-ui, sans-serif';
    const text = `${cat.label}: %${cat.percentage}`;
    ctx.fillText(text, barX + 26, barY + 19);

    barX += ctx.measureText(text).width + 45;
  });

  // 5. İmza / Filigran
  ctx.fillStyle = mutedColor;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('tokenmap • github.com/username/tokenmap', width - 240, height - 12);

  // 6. Canvas -> PNG Blob İndirme
  canvas.toBlob((blob) => {
    if (blob) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `tokenmap-treemap-${dateStr}.png`;
      triggerBlobDownload(blob, fileName);
    }
  }, 'image/png');
}

/**
 * Güvenli Blob indirme bağlantısı tetikler.
 */
function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  }, 100);
}
