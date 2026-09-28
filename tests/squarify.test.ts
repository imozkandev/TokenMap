import { describe, it, expect } from 'vitest';
import { squarify, type Rect, type TreemapItem } from '../src/treemap/squarify';

describe('Squarified Treemap Module', () => {
  const container: Rect = { x: 0, y: 0, width: 800, height: 600 };

  it('1. Toplam yerleşim alanı, kapsayıcı alanına eşit olmalıdır (Alan Korunumu)', () => {
    const items: TreemapItem[] = [
      { id: 'a', value: 50 },
      { id: 'b', value: 30 },
      { id: 'c', value: 20 },
    ];

    const rects = squarify(items, container);
    expect(rects).toHaveLength(3);

    const totalCalculatedArea = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    const containerArea = container.width * container.height;

    expect(totalCalculatedArea).toBeCloseTo(containerArea, 2);
  });

  it('2. Girdi sıralamasından bağımsız olarak aynı yerleşimi vermelidir', () => {
    const items1: TreemapItem[] = [
      { id: 'c', value: 20 },
      { id: 'a', value: 50 },
      { id: 'b', value: 30 },
    ];
    const items2: TreemapItem[] = [
      { id: 'a', value: 50 },
      { id: 'b', value: 30 },
      { id: 'c', value: 20 },
    ];

    const rects1 = squarify(items1, container);
    const rects2 = squarify(items2, container);

    expect(rects1).toEqual(rects2);
  });

  it('3. Tek eleman durumunda tüm kapsayıcıyı doldurmalıdır', () => {
    const items: TreemapItem[] = [{ id: 'single', value: 100 }];
    const rects = squarify(items, container);

    expect(rects).toHaveLength(1);
    expect(rects[0]?.width).toBeCloseTo(container.width, 2);
    expect(rects[0]?.height).toBeCloseTo(container.height, 2);
  });

  it('4. Sıfır veya negatif değerli elemanları çıktıya dahil etmemelidir', () => {
    const items: TreemapItem[] = [
      { id: 'a', value: 40 },
      { id: 'zero', value: 0 },
      { id: 'neg', value: -10 },
      { id: 'b', value: 60 },
    ];

    const rects = squarify(items, container);
    expect(rects).toHaveLength(2);
    expect(rects.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('5. Çok küçük değerlerde çökmeden doğru hesap yapmalıdır', () => {
    const items: TreemapItem[] = [
      { id: 'big', value: 1000 },
      { id: 'tiny1', value: 0.001 },
      { id: 'tiny2', value: 0.002 },
    ];

    const rects = squarify(items, container);
    expect(rects).toHaveLength(3);
    const totalArea = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(totalArea).toBeCloseTo(container.width * container.height, 2);
  });

  it('6. Aşırı dengesiz değerlerde (1000 ve 1) stabil çalışmalıdır', () => {
    const items: TreemapItem[] = [
      { id: 'huge', value: 1000 },
      { id: 'small1', value: 1 },
      { id: 'small2', value: 1 },
      { id: 'small3', value: 1 },
    ];

    const rects = squarify(items, container);
    expect(rects).toHaveLength(4);
    const hugeRect = rects.find((r) => r.id === 'huge');
    expect(hugeRect).toBeDefined();
    expect(hugeRect!.width * hugeRect!.height).toBeGreaterThan(container.width * container.height * 0.95);
  });

  it('7. Boş girdi durumunda boş dizi döndürmelidir', () => {
    const rects = squarify([], container);
    expect(rects).toEqual([]);
  });
});
