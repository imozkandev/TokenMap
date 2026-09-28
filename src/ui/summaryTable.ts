import { i18n } from '../i18n';
import type { AnalysisResult } from '../types';
import { CATEGORY_COLORS } from '../treemap';

export function renderSummaryTable(container: HTMLElement, result: AnalysisResult | null): void {
  if (!result || result.categoryStats.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="summary-table-card card">
      <h3 class="card-title">${i18n.summaryTableTitle}</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.thCategory}</th>
              <th class="text-right">${i18n.thTokens}</th>
              <th class="text-right">${i18n.thPercentage}</th>
            </tr>
          </thead>
          <tbody>
            ${result.categoryStats
              .map((stat) => {
                const color = CATEGORY_COLORS[stat.category] || '#94a3b8';
                return `
                  <tr>
                    <td>
                      <span class="color-dot" style="background-color: ${color};"></span>
                      ${escapeHtml(stat.label)}
                    </td>
                    <td class="text-right font-mono">${stat.tokens.toLocaleString('tr-TR')}</td>
                    <td class="text-right font-mono">%${stat.percentage}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
