import type { ParsedConversation } from '../types';
import { parseOpenAI } from './openai';
import { parseAnthropic } from './anthropic';
import { parsePlain } from './plain';

export { parseOpenAI, parseAnthropic, parsePlain };
export { detectRag } from './ragDetect';

/**
 * Kullanıcı girdisini (JSON sohbet verisi veya düz metin) otomatik algılayarak ayrıştırır.
 * Hiçbir zaman exception fırlatmaz.
 */
export function parseInput(raw: string): ParsedConversation {
  const trimmed = (raw || '').trim();

  if (!trimmed) {
    return parsePlain('');
  }

  let parsedJson: unknown = null;
  let isJson = false;

  try {
    parsedJson = JSON.parse(trimmed);
    isJson = true;
  } catch {
    isJson = false;
  }

  if (!isJson) {
    const res = parsePlain(trimmed);
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      res.warnings.unshift('Geçerli JSON değil, düz metin olarak işlendi');
    }
    return res;
  }

  // JSON format tespiti (Anthropic vs OpenAI)
  try {
    if (isAnthropicFormat(parsedJson)) {
      return parseAnthropic(parsedJson);
    }
    return parseOpenAI(parsedJson);
  } catch (err) {
    const res = parsePlain(trimmed);
    res.warnings.push(`JSON ayrıştırma sırasında beklenmeyen hata oluştu: ${String(err)}`);
    return res;
  }
}

/**
 * JSON verisinin Anthropic formatında olup olmadığını kontrol eder.
 */
function isAnthropicFormat(jsonObj: unknown): boolean {
  if (typeof jsonObj !== 'object' || jsonObj === null) return false;
  const obj = jsonObj as Record<string, unknown>;

  // Kökte "system" prompt varsa
  if ('system' in obj && obj.system) {
    return true;
  }

  // Content blokları içinde tool_use veya tool_result varsa
  if (Array.isArray(obj.messages)) {
    for (const msg of obj.messages) {
      if (typeof msg === 'object' && msg !== null && 'content' in msg) {
        const content = (msg as Record<string, unknown>).content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (typeof block === 'object' && block !== null && 'type' in block) {
              const type = (block as Record<string, unknown>).type;
              if (type === 'tool_use' || type === 'tool_result') {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}
