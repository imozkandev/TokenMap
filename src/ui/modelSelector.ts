import { i18n } from '../i18n';
import { models } from '../tokenizer';
import { getState, setState } from '../state';

export function renderModelSelector(container: HTMLElement, onModelChanged: () => void): void {
  const state = getState();
  const isCustom = state.selectedModelId === 'custom';

  container.innerHTML = `
    <div class="model-selector-card card">
      <div class="form-group row align-items-center">
        <div class="col-auto">
          <label for="model-select" class="form-label font-bold mb-0">${i18n.modelSelectLabel}</label>
        </div>
        <div class="col">
          <select id="model-select" class="form-select">
            ${models
              .map(
                (m) => `
              <option value="${m.id}" ${m.id === state.selectedModelId ? 'selected' : ''}>
                ${m.label} (${m.contextWindow.toLocaleString('tr-TR')} tk - ${m.tokenizer === 'exact' ? 'Kesin' : 'Yaklaşık ~'})
              </option>
            `
              )
              .join('')}
          </select>
        </div>
        ${
          isCustom
            ? `
          <div class="col-auto custom-context-container">
            <label for="custom-context-input" class="form-label font-bold mb-0">${i18n.customModelLabel}</label>
            <input
              type="number"
              id="custom-context-input"
              class="form-control form-control-inline"
              value="${state.customContextWindow}"
              min="1000"
              max="10000000"
              step="1000"
            />
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  const modelSelect = container.querySelector<HTMLSelectElement>('#model-select')!;
  modelSelect.addEventListener('change', () => {
    setState({ selectedModelId: modelSelect.value });
    onModelChanged();
  });

  if (isCustom) {
    const customInput = container.querySelector<HTMLInputElement>('#custom-context-input');
    customInput?.addEventListener('input', () => {
      const val = parseInt(customInput.value, 10);
      if (!isNaN(val) && val > 0) {
        setState({ customContextWindow: val });
        onModelChanged();
      }
    });
  }
}
