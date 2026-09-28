import { i18n } from '../i18n';
import type { AnalysisResult, Category } from '../types';
import { CATEGORY_COLORS } from '../treemap';
import { getState, setState } from '../state';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'system', label: 'Sistem Yönergesi (System)' },
  { value: 'user', label: 'Kullanıcı Mesajı (User)' },
  { value: 'assistant', label: 'Asistan Yanıtı (Assistant)' },
  { value: 'tool_call', label: 'Araç Çağrısı (Tool Call)' },
  { value: 'tool_result', label: 'Araç Çıktısı (Tool Result)' },
  { value: 'rag', label: 'RAG / Bağlam Belgesi (RAG)' },
  { value: 'other', label: 'Diğer / Medya (Other)' },
];

let isExpanded = false;

export function renderSegmentDetail(
  container: HTMLElement,
  result: AnalysisResult | null,
  onCategoryChanged: () => void
): void {
  const state = getState();
  const selectedSegment = result?.segments.find((s) => s.id === state.selectedSegmentId);

  if (!selectedSegment || !result) {
    container.innerHTML = `
      <div class="segment-detail-card card card-placeholder">
        <h3 class="card-title">${i18n.segmentDetailTitle}</h3>
        <p class="text-muted text-center py-4">${i18n.segmentSelectNotice}</p>
      </div>
    `;
    return;
  }

  const categoryColor = CATEGORY_COLORS[selectedSegment.category] || '#94a3b8';
  const segPercentage = ((selectedSegment.tokens / result.totalTokens) * 100).toFixed(1);
  const isLongText = selectedSegment.text.length > 5000;
  const displayText =
    isLongText && !isExpanded ? selectedSegment.text.slice(0, 5000) + '...\n\n[Devamı var]' : selectedSegment.text;

  container.innerHTML = `
    <div class="segment-detail-card card">
      <div class="card-header-with-actions">
        <h3 class="card-title">${i18n.segmentDetailTitle}</h3>
        <span class="badge" style="background-color: ${categoryColor}; color: #ffffff;">
          ${selectedSegment.category}
        </span>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">${i18n.segmentLabel}</span>
          <span class="detail-value font-bold">${escapeHtml(selectedSegment.label)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">${i18n.segmentTokens}</span>
          <span class="detail-value font-mono">${selectedSegment.tokens.toLocaleString('tr-TR')} tk (%${segPercentage})</span>
        </div>
        <div class="detail-item full-width">
          <label for="category-override-select" class="detail-label">${i18n.changeCategory}</label>
          <select id="category-override-select" class="form-select select-sm mt-1">
            ${CATEGORY_OPTIONS.map(
              (opt) => `
              <option value="${opt.value}" ${opt.value === selectedSegment.category ? 'selected' : ''}>
                ${opt.label}
              </option>
            `
            ).join('')}
          </select>
        </div>
      </div>

      <div class="segment-text-container">
        <div class="detail-label mb-1">Metin İçeriği (${selectedSegment.text.length.toLocaleString('tr-TR')} karakter):</div>
        <pre class="segment-text-box code-font">${escapeHtml(displayText)}</pre>
        ${
          isLongText
            ? `
          <button id="toggle-expand-btn" class="btn btn-secondary btn-sm mt-2">
            ${isExpanded ? i18n.showLess : i18n.showMore}
          </button>
        `
            : ''
        }
      </div>
    </div>
  `;

  // Kategori Değiştirme Dinleyicisi
  const overrideSelect = container.querySelector<HTMLSelectElement>('#category-override-select');
  overrideSelect?.addEventListener('change', () => {
    const newCategory = overrideSelect.value as Category;
    const currentOverrides = { ...getState().categoryOverrides };
    currentOverrides[selectedSegment.id] = newCategory;

    setState({ categoryOverrides: currentOverrides });
    onCategoryChanged();
  });

  // Metin Genişletme Dinleyicisi
  const toggleBtn = container.querySelector<HTMLButtonElement>('#toggle-expand-btn');
  toggleBtn?.addEventListener('click', () => {
    isExpanded = !isExpanded;
    renderSegmentDetail(container, result, onCategoryChanged);
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
