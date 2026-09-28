import { i18n } from '../i18n';
import type { Insight } from '../types';

export function renderInsightsList(container: HTMLElement, insights: Insight[]): void {
  if (insights.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="insights-card card">
      <h3 class="card-title">${i18n.insightsTitle}</h3>
      <div class="insights-list">
        ${insights
          .map((item) => {
            const badgeClass =
              item.severity === 'critical'
                ? 'badge-danger'
                : item.severity === 'warn'
                ? 'badge-warning'
                : 'badge-info';

            const badgeText =
              item.severity === 'critical'
                ? `🚨 ${i18n.severityCritical}`
                : item.severity === 'warn'
                ? `⚠️ ${i18n.severityWarn}`
                : `ℹ️ ${i18n.severityInfo}`;

            return `
              <div class="insight-item insight-${item.severity}">
                <div class="insight-header">
                  <span class="badge ${badgeClass}">${badgeText}</span>
                  <span class="insight-item-title">${escapeHtml(item.title)}</span>
                </div>
                <div class="insight-detail">${escapeHtml(item.detail)}</div>
              </div>
            `;
          })
          .join('')}
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
