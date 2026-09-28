import { parseInput } from '../parsers';
import { analyze } from '../analysis/aggregate';
import { generateInsights } from '../analysis/insights';
import { models } from '../tokenizer';
import type { ModelInfo, ParsedConversation, Segment } from '../types';

export interface WorkerPayload {
  rawText: string;
  selectedModelId: string;
  customContextWindow: number;
  categoryOverrides: Record<string, string>;
}

export interface WorkerResponse {
  parsedConversation: ParsedConversation;
  analysisResult: ReturnType<typeof analyze>;
  insights: ReturnType<typeof generateInsights>;
  durationMs: number;
}

self.onmessage = (event: MessageEvent<WorkerPayload>) => {
  const startTime = performance.now();
  const { rawText, selectedModelId, customContextWindow, categoryOverrides } = event.data;

  try {
    // 1. Girdi Ayrıştırma
    const parsed = parseInput(rawText);

    // 2. Kategori Değişikliklerini (Manuel Overrides) Uygula
    const overriddenSegments: Segment[] = parsed.segments.map((seg) => {
      const override = categoryOverrides[seg.id];
      return override ? { ...seg, category: override as Segment['category'] } : seg;
    });
    const finalParsed: ParsedConversation = { ...parsed, segments: overriddenSegments };

    // 3. Model Seçimi
    let selectedModel: ModelInfo;
    if (selectedModelId === 'custom') {
      selectedModel = {
        id: 'custom',
        label: 'Özel Model',
        contextWindow: customContextWindow || 128000,
        tokenizer: 'approx',
        approxFactor: 1.0,
      };
    } else {
      selectedModel =
        models.find((m) => m.id === selectedModelId) || models[0] || {
          id: 'gpt-4o',
          label: 'GPT-4o',
          contextWindow: 128000,
          tokenizer: 'exact',
        };
    }

    // 4. Analiz ve Öneri Üretimi
    const analysisRes = analyze(finalParsed, selectedModel);
    const insights = generateInsights(analysisRes);

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    const response: WorkerResponse = {
      parsedConversation: finalParsed,
      analysisResult: analysisRes,
      insights,
      durationMs,
    };

    self.postMessage(response);
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
