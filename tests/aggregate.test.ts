import { describe, it, expect } from 'vitest';
import { analyze } from '../src/analysis/aggregate';
import type { ParsedConversation, ModelInfo } from '../src/types';

describe('Aggregate Analysis Module', () => {
  const mockModel: ModelInfo = {
    id: 'gpt-4o',
    label: 'GPT-4o',
    contextWindow: 1000,
    tokenizer: 'exact',
  };

  it('1. Boş bir sohbet için 0 değerleri üretmelidir', () => {
    const emptyConv: ParsedConversation = {
      format: 'chat_json',
      segments: [],
      warnings: [],
    };

    const res = analyze(emptyConv, mockModel);
    expect(res.totalTokens).toBe(0);
    expect(res.usagePercentage).toBe(0);
    expect(res.remainingTokens).toBe(1000);
    expect(res.categoryStats).toHaveLength(0);
  });

  it('2. Tek segmentli içeriği doğru analiz etmelidir', () => {
    const singleConv: ParsedConversation = {
      format: 'plain_text',
      segments: [
        {
          id: 'seg-1',
          category: 'user',
          label: 'Tek Mesaj',
          text: 'Hello world, this is a test text for single segment.',
          tokens: 0,
        },
      ],
      warnings: [],
    };

    const res = analyze(singleConv, mockModel);
    expect(res.totalTokens).toBeGreaterThan(0);
    expect(res.segments[0]?.tokens).toBe(res.totalTokens);
    expect(res.categoryStats).toHaveLength(1);
    expect(res.categoryStats[0]?.percentage).toBe(100);
  });

  it('3. Kategori yüzdelerinin toplamı yaklaşık %100 olmalıdır', () => {
    const multiConv: ParsedConversation = {
      format: 'chat_json',
      segments: [
        { id: '1', category: 'system', label: 'System', text: 'System prompt instructions here.', tokens: 0 },
        { id: '2', category: 'user', label: 'User 1', text: 'First user question.', tokens: 0 },
        { id: '3', category: 'assistant', label: 'Assistant 1', text: 'First assistant response.', tokens: 0 },
        { id: '4', category: 'tool_result', label: 'Tool 1', text: 'Some database output.', tokens: 0 },
      ],
      warnings: [],
    };

    const res = analyze(multiConv, mockModel);
    const sumPercentage = res.categoryStats.reduce((sum, cat) => sum + cat.percentage, 0);

    // Yuvarlama farkı nedeniyle 99.5 - 100.5 arasında olmalı
    expect(sumPercentage).toBeGreaterThanOrEqual(99.5);
    expect(sumPercentage).toBeLessThanOrEqual(100.5);
  });

  it('4. Context doluluk yüzdesini ve kalan tokenı doğru hesaplamalıdır', () => {
    const text = 'Sample sentence for token counting test.';
    const conv: ParsedConversation = {
      format: 'plain_text',
      segments: [{ id: '1', category: 'user', label: 'User', text, tokens: 0 }],
      warnings: [],
    };

    const res = analyze(conv, mockModel);
    expect(res.remainingTokens).toBe(mockModel.contextWindow - res.totalTokens);
    expect(res.usagePercentage).toBe(Number(((res.totalTokens / 1000) * 100).toFixed(1)));
  });
});
