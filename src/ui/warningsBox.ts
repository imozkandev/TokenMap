import { i18n } from '../i18n';

export function renderWarningsBox(container: HTMLElement, warnings: string[]): void {
  if (!warnings || warnings.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="alert alert-warning" role="alert">
      <div class="alert-title">
        <span>⚠️ ${i18n.warningsTitle}</span>
      </div>
      <ul class="alert-list">
        ${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
      </ul>
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
