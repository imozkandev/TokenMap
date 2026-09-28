import { i18n } from '../i18n';

export function renderEmptyState(container: HTMLElement, onLoadSample: () => void): void {
  container.innerHTML = `
    <div class="empty-state-card card text-center py-5">
      <div class="empty-state-icon">📊</div>
      <h2 class="empty-state-title mt-3">${i18n.emptyStateTitle}</h2>
      <p class="empty-state-desc text-muted max-w-lg mx-auto">
        ${i18n.emptyStateDesc}
      </p>
      <div class="empty-state-steps text-left my-4 max-w-md mx-auto">
        <div class="step-item">1. LLM Sohbet JSON'unuzu veya düz metni sol tarafa yapıştırın.</div>
        <div class="step-item">2. Kullanmak istediğiniz AI modelini seçin.</div>
        <div class="step-item">3. Treemap grafiği üzerinden hangi mesajın ne kadar token tükettiğini görün.</div>
      </div>
      <button id="load-sample-btn" class="btn btn-primary btn-lg mt-2">
        🚀 ${i18n.emptyStateAction}
      </button>
    </div>
  `;

  const btn = container.querySelector('#load-sample-btn');
  btn?.addEventListener('click', onLoadSample);
}
