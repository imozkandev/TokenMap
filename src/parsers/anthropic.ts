import type { ParsedConversation, Segment } from '../types';
import { detectRag } from './ragDetect';

/**
 * Anthropic Claude API / Chat formatını ayrıştırır.
 */
export function parseAnthropic(jsonObj: unknown): ParsedConversation {
  const segments: Segment[] = [];
  const warnings: string[] = [];

  if (typeof jsonObj !== 'object' || jsonObj === null) {
    warnings.push('Geçersiz Anthropic veri yapısı.');
    return { format: 'chat_json', segments: [], warnings };
  }

  const obj = jsonObj as Record<string, unknown>;
  let segmentIdCounter = 1;

  // 1. Kökteki System Prompt
  if (obj.system) {
    let systemText = '';
    if (typeof obj.system === 'string') {
      systemText = obj.system;
    } else if (Array.isArray(obj.system)) {
      systemText = obj.system
        .map((b) => (typeof b === 'object' && b !== null && 'text' in b ? String(b.text) : ''))
        .filter(Boolean)
        .join('\n');
    }

    if (systemText.trim().length > 0) {
      segments.push({
        id: `seg-${segmentIdCounter++}`,
        category: 'system',
        role: 'system',
        label: 'Sistem Yönergesi',
        text: systemText,
        tokens: 0,
        messageIndex: 0,
      });
    }
  }

  // 2. Messages Dizisi
  const messages = Array.isArray(obj.messages) ? obj.messages : [];
  if (!obj.system && messages.length === 0) {
    warnings.push('Anthropic formatında "messages" veya "system" alanı bulunamadı.');
    return { format: 'chat_json', segments: [], warnings };
  }

  messages.forEach((msg, idx) => {
    if (typeof msg !== 'object' || msg === null) {
      warnings.push(`Mesaj #${idx + 1} geçerli bir nesne değil, atlandı.`);
      return;
    }

    const m = msg as Record<string, unknown>;
    const roleRaw = String(m.role || '').toLowerCase();
    const msgIndex = idx + 1;

    if (typeof m.content === 'string') {
      const text = m.content;
      if (text.trim().length > 0) {
        const isUser = roleRaw === 'user';
        const isRag = isUser && detectRag(text);
        const category = isUser ? (isRag ? 'rag' : 'user') : roleRaw === 'assistant' ? 'assistant' : 'other';
        const label = isUser
          ? isRag
            ? `Kullanıcı Mesajı #${msgIndex} (RAG olabilir)`
            : `Kullanıcı Mesajı #${msgIndex}`
          : `Asistan Yanıtı #${msgIndex}`;

        segments.push({
          id: `seg-${segmentIdCounter++}`,
          category,
          role: roleRaw,
          label,
          text,
          tokens: 0,
          messageIndex: msgIndex,
        });
      }
    } else if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (typeof block !== 'object' || block === null) continue;
        const b = block as Record<string, unknown>;
        const type = String(b.type || '');

        if (type === 'text' && typeof b.text === 'string') {
          const text = b.text;
          if (text.trim().length > 0) {
            const isUser = roleRaw === 'user';
            const isRag = isUser && detectRag(text);
            const category = isUser ? (isRag ? 'rag' : 'user') : roleRaw === 'assistant' ? 'assistant' : 'other';
            const label = isUser
              ? isRag
                ? `Kullanıcı Mesajı #${msgIndex} (RAG olabilir)`
                : `Kullanıcı Mesajı #${msgIndex}`
              : `Asistan Yanıtı #${msgIndex}`;

            segments.push({
              id: `seg-${segmentIdCounter++}`,
              category,
              role: roleRaw,
              label,
              text,
              tokens: 0,
              messageIndex: msgIndex,
            });
          }
        } else if (type === 'tool_use') {
          const toolName = String(b.name || 'bilinmeyen_tool');
          const inputStr = JSON.stringify(b.input || {});
          segments.push({
            id: `seg-${segmentIdCounter++}`,
            category: 'tool_call',
            role: 'assistant',
            label: `çağrı: ${toolName}`,
            text: `${toolName} ${inputStr}`,
            tokens: 0,
            messageIndex: msgIndex,
          });
        } else if (type === 'tool_result') {
          const toolUseId = String(b.tool_use_id || `tool-${msgIndex}`);
          let resultText = '';
          if (typeof b.content === 'string') {
            resultText = b.content;
          } else if (Array.isArray(b.content)) {
            resultText = b.content
              .map((c) => (typeof c === 'object' && c !== null && 'text' in c ? String((c as Record<string, unknown>).text) : JSON.stringify(c)))
              .join('\n');
          } else if (b.content) {
            resultText = JSON.stringify(b.content);
          }

          segments.push({
            id: `seg-${segmentIdCounter++}`,
            category: 'tool_result',
            role: 'user',
            label: `sonuç: ${toolUseId}`,
            text: resultText,
            tokens: 0,
            messageIndex: msgIndex,
          });
        } else if (type === 'image' || type === 'document') {
          warnings.push(`Mesaj #${msgIndex} içinde '${type}' bloğu tespit edildi; 'other' kategorisine eklendi.`);
          segments.push({
            id: `seg-${segmentIdCounter++}`,
            category: 'other',
            role: roleRaw,
            label: `Medya/Doküman Bloğu (Mesaj #${msgIndex})`,
            text: `[${type}]`,
            tokens: 0,
            messageIndex: msgIndex,
          });
        }
      }
    }
  });

  return { format: 'chat_json', segments, warnings };
}
