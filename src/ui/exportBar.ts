import type { AnalysisResult, ModelInfo } from '../types';
import { getState } from '../state';
import { buildSummaryJson, downloadSummaryJson, exportTreemapPng } from '../utils/export';

export function renderExportBar(
  container: HTMLElement,
  result: AnalysisResult | null,
  model: ModelInfo | null
): void {
  const hasData = result && result.totalTokens > 0 && model;

  container.innerHTML = `
    <div class="export-bar card mb-3">
      <div class="export-bar-content">
        <span class="font-bold text-muted" style="font-size: 0.875rem;">Dışa Aktar:</span>
        <div class="export-actions">
          <button id="export-png-btn" class="btn btn-secondary btn-sm" ${!hasData ? 'disabled' : ''}>
            🖼️ PNG Olarak İndir (Görsel)
          </button>
          <button id="export-json-btn" class="btn btn-secondary btn-sm" ${!hasData ? 'disabled' : ''}>
            📄 Özet JSON İndir (Gizli Metinsiz)
          </button>
        </div>
      </div>
    </div>
  `;

  if (!hasData || !result || !model) return;

  const pngBtn = container.querySelector<HTMLButtonElement>('#export-png-btn');
  const jsonBtn = container.querySelector<HTMLButtonElement>('#export-json-btn');

  pngBtn?.addEventListener('click', async () => {
    const svgEl = document.querySelector<SVGElement>('#treemap-root svg');
    if (svgEl) {
      pngBtn.disabled = true;
      const originalText = pngBtn.textContent;
      pngBtn.textContent = '⏳ Hazırlanıyor...';
      try {
        await exportTreemapPng(svgEl, result, model, getState().theme);
      } catch (err) {
        console.error('PNG dışa aktarım hatası:', err);
      } finally {
        pngBtn.disabled = false;
        pngBtn.textContent = originalText;
      }
    }
  });

  jsonBtn?.addEventListener('click', () => {
    const summaryData = buildSummaryJson(result, model);
    // Include insights in summary export
    summaryData.insights = getState().insights.map((i) => ({
      severity: i.severity,
      title: i.title,
      detail: i.detail,
    }));
    downloadSummaryJson(summaryData);
  });
}
