import './style.css';
import { getState, setState, subscribe } from './state';
import type { WorkerPayload, WorkerResponse } from './worker/analyzer.worker';
import type { Segment } from './types';

// UI Bileşenleri
import { renderHeader } from './ui/header';
import { renderInputPanel } from './ui/inputPanel';
import { renderModelSelector } from './ui/modelSelector';
import { renderContextBar } from './ui/contextBar';
import { renderTreemap } from './treemap';
import { renderInsightsList } from './ui/insightsList';
import { renderSummaryTable } from './ui/summaryTable';
import { renderSegmentDetail } from './ui/segmentDetail';
import { renderWarningsBox } from './ui/warningsBox';
import { renderEmptyState } from './ui/emptyState';
import { renderExportBar } from './ui/exportBar';

import openaiSample from './samples/openai-agent.json?raw';

let treemapCleanup: (() => void) | null = null;
let activeWorker: Worker | null = null;

function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  // 1. Küresel Hata Yakalayıcı (Global Error Boundary)
  setupGlobalErrorHandler();

  // 2. Ana İskelet Kurulumu
  app.innerHTML = `
    <div class="app-container">
      <div id="header-root"></div>
      <div class="main-layout">
        <div class="col-left">
          <div id="input-panel-root"></div>
          <div id="model-selector-root"></div>
          <div id="global-error-root"></div>
          <div id="warnings-root"></div>
        </div>
        <div class="col-right">
          <div id="status-indicator" class="text-right mb-2 text-muted" style="min-height: 24px; font-size: 0.85rem;"></div>
          <div id="empty-state-root"></div>
          <div id="results-root" style="display: none;">
            <div id="export-bar-root"></div>
            <div id="context-bar-root"></div>
            <div class="card treemap-container-card">
              <h3 class="card-title mb-2">Token Haritası (Treemap)</h3>
              <div id="treemap-root" class="treemap-svg-wrapper"></div>
            </div>
            <div id="insights-root"></div>
            <div id="summary-table-root"></div>
            <div id="segment-detail-root"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 3. Tema Senkronizasyonu
  const updateTheme = () => {
    document.body.setAttribute('data-theme', getState().theme);
  };
  updateTheme();

  // State Dinleyicisi
  subscribe(() => {
    updateTheme();
    renderHeader(document.querySelector('#header-root')!);
  });

  // İlk Bileşen Çizimleri
  renderHeader(document.querySelector('#header-root')!);
  renderInputPanel(document.querySelector('#input-panel-root')!, runAnalysisPipeline);
  renderModelSelector(document.querySelector('#model-selector-root')!, runAnalysisPipeline);

  // İlk Analiz
  runAnalysisPipeline();
}

/**
 * Küresel Hata Yakalayıcılar
 */
function setupGlobalErrorHandler() {
  const showGlobalError = (msg: string) => {
    const root = document.querySelector<HTMLElement>('#global-error-root');
    if (root) {
      root.innerHTML = `
        <div class="alert alert-danger mb-3" role="alert">
          <div class="alert-title">⚠️ Bir şeyler ters gitti</div>
          <div>${escapeHtml(msg || 'Lütfen girdi verinizi ve formatınızı kontrol edin.')}</div>
        </div>
      `;
    }
  };

  window.addEventListener('error', (event) => {
    console.error('Küresel hata yakalandı:', event.error);
    showGlobalError('Analiz sırasında bir hata oluştu. Lütfen girdinizi kontrol edin.');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Yakalanmamış promise hatası:', event.reason);
    showGlobalError('İşlem sırasında beklenmeyen bir hata oluştu.');
  });
}

/**
 * Analizi Web Worker üzerinde çalıştırır (Arka Planda, UI Donmadan).
 */
function runAnalysisPipeline() {
  const state = getState();
  const rawText = state.rawInput.trim();

  const statusEl = document.querySelector<HTMLElement>('#status-indicator');
  const emptyStateRoot = document.querySelector<HTMLElement>('#empty-state-root');
  const resultsRoot = document.querySelector<HTMLElement>('#results-root');
  const globalErrorRoot = document.querySelector<HTMLElement>('#global-error-root');
  if (globalErrorRoot) globalErrorRoot.innerHTML = '';

  if (!rawText) {
    if (resultsRoot) resultsRoot.style.display = 'none';
    if (emptyStateRoot) {
      emptyStateRoot.style.display = 'block';
      renderEmptyState(emptyStateRoot, () => {
        setState({ rawInput: openaiSample, selectedSegmentId: null, categoryOverrides: {} });
        const textarea = document.querySelector<HTMLTextAreaElement>('#raw-input-textarea');
        if (textarea) textarea.value = openaiSample;
        runAnalysisPipeline();
      });
    }
    if (statusEl) statusEl.textContent = '';
    renderWarningsBox(document.querySelector('#warnings-root')!, []);
    return;
  }

  // Hesaplanıyor Durumu
  if (statusEl) statusEl.textContent = '⏳ Hesaplanıyor...';
  setState({ isCalculating: true });

  // Mevcut çalışan bir worker varsa sonlandır
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }

  // Vite destekli Web Worker oluştur
  activeWorker = new Worker(new URL('./worker/analyzer.worker.ts', import.meta.url), { type: 'module' });

  const payload: WorkerPayload = {
    rawText,
    selectedModelId: state.selectedModelId,
    customContextWindow: state.customContextWindow,
    categoryOverrides: state.categoryOverrides,
  };

  activeWorker.onmessage = (e: MessageEvent<WorkerResponse | { error: string }>) => {
    const data = e.data;

    if ('error' in data) {
      if (statusEl) statusEl.textContent = '❌ Hata oluştu';
      console.error('Worker hatası:', data.error);
      return;
    }

    const { parsedConversation, analysisResult, insights, durationMs } = data;

    setState({
      isCalculating: false,
      parsedConversation,
      analysisResult,
      insights,
    });

    // Durum Bilgisi ve a11y Duyurusu
    if (statusEl) statusEl.textContent = `⚡ Tamamlandı (${durationMs} ms)`;

    announceA11y(
      `Analiz tamamlandı. Toplam ${analysisResult.totalTokens.toLocaleString('tr-TR')} token, yüzde ${analysisResult.usagePercentage} doluluk.`
    );

    // Sonuç Ekranını Göster
    if (emptyStateRoot) emptyStateRoot.style.display = 'none';
    if (resultsRoot) resultsRoot.style.display = 'block';

    const selectedModel = analysisResult
      ? {
          id: state.selectedModelId,
          label: state.selectedModelId === 'custom' ? 'Özel Model' : state.selectedModelId,
          contextWindow: analysisResult.contextWindow,
          tokenizer: analysisResult.exact ? ('exact' as const) : ('approx' as const),
        }
      : null;

    renderExportBar(document.querySelector('#export-bar-root')!, analysisResult, selectedModel);
    renderWarningsBox(document.querySelector('#warnings-root')!, analysisResult.warnings);
    renderContextBar(document.querySelector('#context-bar-root')!, analysisResult);

    // Treemap Çizimi
    const treemapRoot = document.querySelector<HTMLElement>('#treemap-root');
    if (treemapRoot) {
      if (treemapCleanup) treemapCleanup();
      treemapCleanup = renderTreemap(treemapRoot, analysisResult, {
        selectedSegmentId: state.selectedSegmentId,
        onSelect: (segment: Segment) => {
          setState({ selectedSegmentId: segment.id });
          renderSegmentDetail(
            document.querySelector('#segment-detail-root')!,
            analysisResult,
            runAnalysisPipeline
          );
          runAnalysisPipeline();
        },
      });
    }

    renderInsightsList(document.querySelector('#insights-root')!, insights);
    renderSummaryTable(document.querySelector('#summary-table-root')!, analysisResult);
    renderSegmentDetail(
      document.querySelector('#segment-detail-root')!,
      analysisResult,
      runAnalysisPipeline
    );
  };

  activeWorker.postMessage(payload);
}

/**
 * Ekran okuyuculara duyuru gönderir (a11y)
 */
function announceA11y(message: string) {
  const announcer = document.querySelector('#a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', initApp);
