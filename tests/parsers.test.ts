import { describe, it, expect } from 'vitest';
import { parseInput, parseOpenAI, parseAnthropic, parsePlain, detectRag } from '../src/parsers';

describe('Parsers Module', () => {
  it('1. Basit OpenAI sohbetini doğru ayrıştırmalıdır', () => {
    const input = JSON.stringify({
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    });

    const parsed = parseInput(input);
    expect(parsed.format).toBe('chat_json');
    expect(parsed.segments).toHaveLength(3);
    expect(parsed.segments[0]?.category).toBe('system');
    expect(parsed.segments[1]?.category).toBe('user');
    expect(parsed.segments[2]?.category).toBe('assistant');
    expect(parsed.segments[0]?.tokens).toBe(0); // Tokenlar 0 olmalı
  });

  it('2. OpenAI tool_calls ve tool sonuçlarını doğru kategorize etmelidir', () => {
    const input = JSON.stringify({
      messages: [
        {
          role: 'assistant',
          content: 'Searching...',
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: { name: 'get_weather', arguments: '{"city":"Istanbul"}' },
            },
          ],
        },
        { role: 'tool', tool_call_id: 'call_123', content: '{"temp": 22}' },
      ],
    });

    const parsed = parseOpenAI(JSON.parse(input));
    expect(parsed.segments).toHaveLength(3); // Assistant text, tool_call, tool_result
    const toolCallSeg = parsed.segments.find((s) => s.category === 'tool_call');
    const toolResultSeg = parsed.segments.find((s) => s.category === 'tool_result');

    expect(toolCallSeg).toBeDefined();
    expect(toolCallSeg?.label).toBe('çağrı: get_weather');
    expect(toolResultSeg).toBeDefined();
    expect(toolResultSeg?.label).toBe('sonuç: call_123');
  });

  it('3. Anthropic system, tool_use ve tool_result yapılarını ayrıştırmalıdır', () => {
    const input = JSON.stringify({
      system: 'You are Claude.',
      messages: [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me check.' },
            { type: 'tool_use', id: 'toolu_1', name: 'search', input: { q: 'vitest' } },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'toolu_1', content: 'Found 10 results.' },
          ],
        },
      ],
    });

    const parsed = parseInput(input);
    expect(parsed.segments).toHaveLength(4); // system, assistant text, tool_call, tool_result
    expect(parsed.segments[0]?.category).toBe('system');
    expect(parsed.segments[2]?.category).toBe('tool_call');
    expect(parsed.segments[3]?.category).toBe('tool_result');
  });

  it('4. İçerik parça dizilerini (content array) ve görselleri işleyebilmelidir', () => {
    const input = {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Resme bak' },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } },
          ],
        },
      ],
    };

    const parsed = parseOpenAI(input);
    expect(parsed.segments.some((s) => s.category === 'other' && s.text === '[görsel]')).toBe(true);
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it('5. Bozuk JSON durumunda uyarı ekleyip düz metin moduna düşmelidir', () => {
    const brokenJson = '{ role: "user", content: "hello"'; // Eksik kapatma parantezi
    const parsed = parseInput(brokenJson);

    expect(parsed.format).toBe('plain_text');
    expect(parsed.warnings[0]).toContain('Geçerli JSON değil');
    expect(parsed.segments).toHaveLength(1);
  });

  it('6. Boş girdiyi güvenli şekilde ele almalıdır', () => {
    const parsed = parseInput('');
    expect(parsed.format).toBe('plain_text');
    expect(parsed.segments).toHaveLength(0);
    expect(parsed.warnings).toContain('Girdi metni boş.');
  });

  it('7. Düz metin ayrıştırıcısı büyük blokları ayrı segmentlere bölmelidir', () => {
    const block1 = 'A'.repeat(250);
    const block2 = 'B'.repeat(250);
    const block3 = 'C'.repeat(250);
    const text = `${block1}\n\n${block2}\n\n${block3}`;

    const parsed = parsePlain(text);
    expect(parsed.segments).toHaveLength(3);
    expect(parsed.segments[0]?.label).toBe('Blok 1');
    expect(parsed.segments[1]?.label).toBe('Blok 2');
    expect(parsed.segments[2]?.label).toBe('Blok 3');
  });

  it('8. RAG etiketlerini ve bağlam metinlerini doğru sezmelidir', () => {
    expect(detectRag('<documents><document>test</document></documents>')).toBe(true);
    expect(detectRag('Context: Bu bir bağlam bilgisidir.')).toBe(true);
    expect(detectRag('Normal kullanıcı sorusu')).toBe(false);

    const ragInput = JSON.stringify({
      messages: [{ role: 'user', content: '<context>RAG dokümanı</context> Soruma cevap ver.' }],
    });

    const parsed = parseInput(ragInput);
    expect(parsed.segments[0]?.category).toBe('rag');
    expect(parsed.segments[0]?.label).toContain('(RAG olabilir)');
  });

  it('9. Kök dizi formatındaki mesaj listelerini desteklemelidir', () => {
    const input = JSON.stringify([
      { role: 'user', content: 'Dizi sohbeti' },
      { role: 'assistant', content: 'Yanıt' },
    ]);

    const parsed = parseInput(input);
    expect(parsed.format).toBe('chat_json');
    expect(parsed.segments).toHaveLength(2);
  });
});
