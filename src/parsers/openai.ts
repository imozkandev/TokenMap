import type { ParsedConversation, Segment } from '../types';
import { detectRag } from './ragDetect';

/**
 * OpenAI sohbet formatını (API / ChatGPT export JSON) ayrıştırır.
 */
export function parseOpenAI(jsonObj: unknown): ParsedConversation {
  const segments: Segment[] = [];
  const warnings: string[] = [];

  let messages: unknown[] = [];

  if (Array.isArray(jsonObj)) {
    messages = jsonObj;
  } else if (typeof jsonObj === 'object' && jsonObj !== null) {
    const obj = jsonObj as Record<string, unknown>;
    if (Array.isArray(obj.messages)) {
      messages = obj.messages;
    } else {
      warnings.push('OpenAI JSON formatında "messages" dizisi bulunamadı.');
      return { format: 'chat_json', segments: [], warnings };
    }
  } else {
    warnings.push('Geçersiz OpenAI veri yapısı.');
    return { format: 'chat_json', segments: [], warnings };
  }

  let segmentIdCounter = 1;

  messages.forEach((msg, idx) => {
    if (typeof msg !== 'object' || msg === null) {
      warnings.push(`Mesaj #${idx + 1} geçerli bir nesne değil, atlandı.`);
      return;
    }

    const m = msg as Record<string, unknown>;
    const roleRaw = String(m.role || '').toLowerCase();
    const msgIndex = idx + 1;

    // 1. Content İşleme
    let textContent = '';
    let hasImagePart = false;

    if (typeof m.content === 'string') {
      textContent = m.content;
    } else if (Array.isArray(m.content)) {
      const textParts: string[] = [];
      for (const part of m.content) {
        if (typeof part === 'string') {
          textParts.push(part);
        } else if (typeof part === 'object' && part !== null) {
          const p = part as Record<string, unknown>;
          if (p.type === 'text' && typeof p.text === 'string') {
            textParts.push(p.text);
          } else if (p.type === 'image_url' || p.type === 'image') {
            hasImagePart = true;
          }
        }
      }
      textContent = textParts.join('\n');
    }

    if (hasImagePart) {
      warnings.push(`Mesaj #${msgIndex} içinde görsel içerik tespit edildi; metinsiz parçalar için 'other' segmenti eklendi.`);
      segments.push({
        id: `seg-${segmentIdCounter++}`,
        category: 'other',
        role: roleRaw,
        label: `Görsel İçerik (Mesaj #${msgIndex})`,
        text: '[görsel]',
        tokens: 0,
        messageIndex: msgIndex,
      });
    }

    // 2. Metin İçeriği Segmenti Oluşturma
    if (textContent.trim().length > 0) {
      if (roleRaw === 'system' || roleRaw === 'developer') {
        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category: 'system',
          role: roleRaw,
          label: 'Sistem Yönergesi',
          text: textContent,
          tokens: 0,
          messageIndex: msgIndex,
        });
      } else if (roleRaw === 'user') {
        const isRag = detectRag(textContent);
        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category: isRag ? 'rag' : 'user',
          role: 'user',
          label: isRag ? `Kullanıcı Mesajı #${msgIndex} (RAG olabilir)` : `Kullanıcı Mesajı #${msgIndex}`,
          text: textContent,
          tokens: 0,
          messageIndex: msgIndex,
        });
      } else if (roleRaw === 'assistant') {
        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category: 'assistant',
          role: 'assistant',
          label: `Asistan Yanıtı #${msgIndex}`,
          text: textContent,
          tokens: 0,
          messageIndex: msgIndex,
        });
      } else if (roleRaw === 'tool') {
        const toolCallId = String(m.tool_call_id || m.name || `tool-${msgIndex}`);
        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category: 'tool_result',
          role: 'tool',
          label: `sonuç: ${toolCallId}`,
          text: textContent,
          tokens: 0,
          messageIndex: msgIndex,
        });
      } else {
        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category: 'other',
          role: roleRaw || 'other',
          label: `Mesaj #${msgIndex} (${roleRaw || 'bilinmeyen'})`,
          text: textContent,
          tokens: 0,
          messageIndex: msgIndex,
        });
      }
    }

    // 3. Tool Calls (Assistant mesajları içinde)
    if (Array.isArray(m.tool_calls)) {
      for (const call of m.tool_calls) {
        if (typeof call === 'object' && call !== null) {
          const c = call as Record<string, unknown>;
          const fn = (c.function as Record<string, unknown>) || {};
          const fnName = String(fn.name || 'bilinmeyen_fonksiyon');
          const args = String(fn.arguments || '');
          const callText = `${fnName}(${args})`;

          segments.push({
            id: `seg-${segmentIdCounter++}`,
            category: 'tool_call',
            role: 'assistant',
            label: `çağrı: ${fnName}`,
            text: callText,
            tokens: 0,
            messageIndex: msgIndex,
          });
        }
      }
    }
  });

  return { format: 'chat_json', segments, warnings };
}
