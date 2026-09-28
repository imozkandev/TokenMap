import type { ParsedConversation, Segment } from '../types';
import { detectRag } from './ragDetect';

/**
 * Düz metin (plain text) veya yapıştırılan prompt metinlerini ayrıştırır.
 */
export function parsePlain(raw: string): ParsedConversation {
  const warnings: string[] = [];
  const segments: Segment[] = [];

  const trimmed = raw.trim();
  if (!trimmed) {
    warnings.push('Girdi metni boş.');
    return { format: 'plain_text', segments: [], warnings };
  }

  // Boş satırlarla (iki veya daha fazla \n) ayrılmış bloklar
  const rawBlocks = trimmed.split(/\n\s*\n+/).map((b) => b.trim()).filter((b) => b.length > 0);

  // 3 veya daha fazla ve her biri en az 200 karakter olan büyük bloklar var mı?
  const largeBlocks = rawBlocks.filter((b) => b.length >= 200);

  if (rawBlocks.length >= 3 && largeBlocks.length >= 3) {
    let segmentIdCounter = 1;
    rawBlocks.forEach((blockText, idx) => {
      const isRag = detectRag(blockText);
      const category = isRag ? 'rag' : 'user';
      const label = isRag ? `Blok ${idx + 1} (RAG olabilir)` : `Blok ${idx + 1}`;

      segments.push({
        id: `seg-${segmentIdCounter++}`,
        category,
        role: 'user',
        label,
        text: blockText,
        tokens: 0,
        messageIndex: idx + 1,
      });
    });
  } else {
    // Tek ana segment olarak işle
    const isRag = detectRag(trimmed);
    const category = isRag ? 'rag' : 'user';
    const label = isRag ? 'Yapıştırılan metin (RAG olabilir)' : 'Yapıştırılan metin';

    segments.push({
      id: 'seg-1',
      category,
      role: 'user',
      label,
      text: trimmed,
      tokens: 0,
      messageIndex: 1,
    });
  }

  return { format: 'plain_text', segments, warnings };
}
