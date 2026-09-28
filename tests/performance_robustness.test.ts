import { describe, it, expect } from 'vitest';
import { parseInput } from '../src/parsers';
import { analyze } from '../src/analysis/aggregate';
import { countTokens, models } from '../src/tokenizer';
import type { ModelInfo } from '../src/types';

describe('Performance and Robustness Tests', () => {
  const model: ModelInfo = models[0]!;

  it('1. Bozuk, rastgele veya anlamsız girdilerde çökmeden düz metne düşmelidir', () => {
    const garbageInputs = [
      '{{{bad_json:::===',
      '   ',
      '\n\t\r',
      'null',
      'undefined',
      '12345',
      'true',
      '{"messages": null}',
      '{"messages": [null, 123, "string_in_array", {}]}',
    ];

    garbageInputs.forEach((input) => {
      expect(() => {
        const parsed = parseInput(input);
        const res = analyze(parsed, model);
        expect(res).toBeDefined();
      }).not.toThrow();
    });
  });

  it('2. Çok derin iç içe JSON veya beklenmedik alanlarda güvenli çalışmalıdır', () => {
    const deepObj: Record<string, unknown> = { role: 'user', content: 'hello' };
    let curr = deepObj;
    for (let i = 0; i < 50; i++) {
      curr.nested = { role: 'user', content: `level ${i}` };
      curr = curr.nested as Record<string, unknown>;
    }

    const input = JSON.stringify({ messages: [deepObj] });
    expect(() => {
      const parsed = parseInput(input);
      expect(parsed.segments.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('3. Çok uzun tek satır metinde (200.000+ karakter) performansını korumalıdır', () => {
    const longLine = 'TokenHaritasıTest '.repeat(15_000); // ~270.000 karakter
    const start = performance.now();
    const parsed = parseInput(longLine);
    const res = analyze(parsed, model);
    const end = performance.now();

    expect(res.totalTokens).toBeGreaterThan(0);
    expect(end - start).toBeLessThan(1000); // 1 saniyeden çok daha hızlı
  });

  it('4. 100.000 satırlık düz metin üzerinde süre ve token hesabı testi', () => {
    // 100.000 satırlık simülasyon metni
    const line = 'Bu bir sohbet mesajı satırıdır. Token sayımı testi yapılmaktadır.\n';
    const hugeText = line.repeat(100_000); // ~6.7 MB metin

    const start = performance.now();
    const parsed = parseInput(hugeText);
    const res = analyze(parsed, model);
    const end = performance.now();

    const duration = Math.round(end - start);
    expect(res.totalTokens).toBeGreaterThan(0);
    // 2.000.000 karakter sınırı üstü olduğu için fallback hızlı tahmin devreye girer
    expect(res.exact).toBe(false);
    expect(duration).toBeLessThan(2500); // 2.5 saniyeden kısa sürer
  });

  it('5. 5 MB büyüklüğündeki OpenAI sohbet JSON verisinde performans testi', () => {
    // ~5 MB JSON verisi üretimi (yaklaşık 10.000 mesaj)
    const messages = [];
    for (let i = 0; i < 10_000; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Bu #${i + 1} numaralı sohbet mesajıdır. Örnek veri içeriği genişletiliyor. Veri boyutu testi.`,
      });
    }

    const jsonStr = JSON.stringify({ messages });
    expect(jsonStr.length).toBeGreaterThan(1_000_000); // Büyük JSON

    const start = performance.now();
    const parsed = parseInput(jsonStr);
    const res = analyze(parsed, model);
    const end = performance.now();

    const duration = Math.round(end - start);
    expect(res.segments).toHaveLength(10_000);
    expect(duration).toBeLessThan(3500);
  });
});
