import { i18n } from '../i18n';
import { getState, setState } from '../state';

import openaiSample from '../samples/openai-agent.json?raw';
import anthropicSample from '../samples/anthropic-rag.json?raw';
import plainSample from '../samples/plain.txt?raw';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function renderInputPanel(container: HTMLElement, onInputChanged: () => void): void {
  const state = getState();

  container.innerHTML = `
    <div class="input-panel-card card">
      <div class="input-toolbar">
        <label for="raw-input-textarea" class="form-label font-bold">${i18n.appTitle} - Girdi Metni</label>
        <div class="toolbar-actions">
          <label class="btn btn-secondary btn-sm file-upload-label">
            📁 ${i18n.selectFile}
            <input type="file" id="file-input" accept=".json,.txt" style="display: none;" />
          </label>
          <select id="sample-select" class="form-select select-sm">
            <option value="" selected disabled>${i18n.loadSamplePrompt}</option>
            <option value="openai">${i18n.sampleOpenAIAgent}</option>
            <option value="anthropic">${i18n.sampleAnthropicRAG}</option>
            <option value="plain">${i18n.samplePlainText}</option>
          </select>
          <button id="clear-btn" class="btn btn-danger-outline btn-sm">${i18n.clearInput}</button>
        </div>
      </div>

      <div class="textarea-wrapper" id="drop-zone">
        <textarea
          id="raw-input-textarea"
          class="form-control code-font"
          rows="12"
          placeholder="${i18n.inputPlaceholder}"
        >${escapeHtml(state.rawInput)}</textarea>
        <div class="drop-overlay">${i18n.dragDropNotice}</div>
      </div>
    </div>
  `;

  const textarea = container.querySelector<HTMLTextAreaElement>('#raw-input-textarea')!;
  const fileInput = container.querySelector<HTMLInputElement>('#file-input')!;
  const sampleSelect = container.querySelector<HTMLSelectElement>('#sample-select')!;
  const clearBtn = container.querySelector<HTMLButtonElement>('#clear-btn')!;
  const dropZone = container.querySelector<HTMLElement>('#drop-zone')!;

  // 1. Textarea Değişimi (Debounce 300ms)
  textarea.addEventListener('input', () => {
    setState({ rawInput: textarea.value });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onInputChanged();
    }, 300);
  });

  // 2. Dosya Yükleme
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = String(evt.target?.result || '');
        textarea.value = text;
        setState({ rawInput: text, selectedSegmentId: null, categoryOverrides: {} });
        onInputChanged();
      };
      reader.readAsText(file);
    }
  });

  // 3. Örnek Yükleme
  sampleSelect.addEventListener('change', () => {
    const selected = sampleSelect.value;
    let textToLoad = '';
    if (selected === 'openai') textToLoad = openaiSample;
    else if (selected === 'anthropic') textToLoad = anthropicSample;
    else if (selected === 'plain') textToLoad = plainSample;

    if (textToLoad) {
      textarea.value = textToLoad;
      sampleSelect.value = '';
      setState({ rawInput: textToLoad, selectedSegmentId: null, categoryOverrides: {} });
      onInputChanged();
    }
  });

  // 4. Temizle
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    setState({ rawInput: '', selectedSegmentId: null, categoryOverrides: {} });
    onInputChanged();
  });

  // 5. Sürükle-Bırak (Drag & Drop)
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = String(evt.target?.result || '');
        textarea.value = text;
        setState({ rawInput: text, selectedSegmentId: null, categoryOverrides: {} });
        onInputChanged();
      };
      reader.readAsText(file);
    }
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
