import { i18n } from '../i18n';
import type { AnalysisResult } from '../types';
import { CATEGORY_COLORS } from '../treemap';

export function renderContextBar(container: HTMLElement, result: AnalysisResult | null): void {
  if (!result || result.totalTokens === 0) {
    container.innerHTML = '';
    return;
  }

  const isOverflow = result.usagePercentage > 100;
  const approxBadge = !result.exact ? ' <span class="badge badge-warning" title="Yaklaşık sayım">~ Yaklaşık</span>' : '';

  container.innerHTML = `
    <div class="context-bar-card card ${isOverflow ? 'border-danger' : ''}">
      <div class="context-bar-header">
        <span class="font-bold">${i18n.contextUsageTitle}${approxBadge}</span>
        <span class="context-numbers">
          <strong>${result.totalTokens.toLocaleString('tr-TR')}</strong> / ${result.contextWindow.toLocaleString('tr-TR')} tk 
          (<span class="${isOverflow ? 'text-danger font-bold' : ''}">%${result.usagePercentage}</span>)
        </span>
      </div>

      <div class="progress-bar-track" role="progressbar" aria-valuenow="${result.usagePercentage}" aria-valuemin="0" aria-valuemax="100">
        ${result.categoryStats
          .map((cat) => {
            const width = Math.min(100, (cat.tokens / result.contextWindow) * 100);
            const color = CATEGORY_COLORS[cat.category] || '#94a3b8';
            return `
              <div 
                class="progress-bar-segment" 
                style="width: ${width}%; background-color: ${color};" 
                title="${cat.label}: ${cat.tokens.toLocaleString('tr-TR')} token (%${cat.percentage})"
              ></div>
            `;
          })
          .join('')}
      </div>

      <div class="context-bar-footer">
        ${
          isOverflow
            ? `<span class="text-danger font-bold">⚠️ ${i18n.overflowWarning} Kapasite ${(result.totalTokens - result.contextWindow).toLocaleString('tr-TR')} token aşıldı!</span>`
            : `<span class="text-muted">${i18n.remainingTokens} ${result.remainingTokens.toLocaleString('tr-TR')} token</span>`
        }
      </div>
    </div>
  `;
}
