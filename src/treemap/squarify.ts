export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TreemapItem {
  id: string;
  value: number;
}

export interface PositionedRect extends Rect {
  id: string;
  value: number;
}

/**
 * Squarified Treemap Algoritması (Bruls, Huizing, van Wijk)
 * Dikdörtgen alanlarını verilen değerlerle orantılı olarak kareye en yakın oranlarda böler.
 */
export function squarify(items: TreemapItem[], container: Rect): PositionedRect[] {
  // 1. Sıfır veya negatif değerli öğeleri filtrele
  const validItems = items.filter((item) => item.value > 0);

  if (validItems.length === 0 || container.width <= 0 || container.height <= 0) {
    return [];
  }

  // 2. Büyükten küçüğe sırala (girdi sırasından bağımsız kılmak için)
  const sortedItems = [...validItems].sort((a, b) => b.value - a.value);

  // 3. Değerleri kapsayıcı alanına oranla ölçekle
  const totalValue = sortedItems.reduce((sum, item) => sum + item.value, 0);
  const containerArea = container.width * container.height;

  const scaledItems = sortedItems.map((item) => ({
    ...item,
    area: (item.value / totalValue) * containerArea,
  }));

  const results: PositionedRect[] = [];
  let currentRect: Rect = { ...container };
  let currentRow: typeof scaledItems = [];

  for (const item of scaledItems) {
    if (currentRow.length === 0) {
      currentRow.push(item);
    } else {
      const currentShortestEdge = Math.min(currentRect.width, currentRect.height);
      const currentWorst = worst(currentRow, currentShortestEdge);
      const nextWorst = worst([...currentRow, item], currentShortestEdge);

      if (nextWorst <= currentWorst) {
        currentRow.push(item);
      } else {
        // Mevcut satırı yerleştir ve kalan alanı güncelle
        currentRect = layoutRow(currentRow, currentRect, results);
        currentRow = [item];
      }
    }
  }

  // Kalan son satırı yerleştir
  if (currentRow.length > 0) {
    layoutRow(currentRow, currentRect, results);
  }

  return results;
}

/**
 * Bir satırdaki öğelerin verilen kenar uzunluğu (w) karşısındaki en kötü en/boy oranını hesaplar.
 */
function worst(row: { area: number }[], w: number): number {
  if (row.length === 0 || w <= 0) return Infinity;

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const item of row) {
    sum += item.area;
    if (item.area < min) min = item.area;
    if (item.area > max) max = item.area;
  }

  if (sum === 0 || min === 0) return Infinity;

  const w2 = w * w;
  const s2 = sum * sum;

  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

/**
 * Satırdaki öğeleri mevcut dikdörtgenin kısa kenarı boyunca yerleştirir ve kalan dikdörtgeni döndürür.
 */
function layoutRow(
  row: { id: string; value: number; area: number }[],
  rect: Rect,
  results: PositionedRect[]
): Rect {
  const rowArea = row.reduce((sum, item) => sum + item.area, 0);

  // Yerleşimin genişlik boyunca mı yoksa yükseklik boyunca mı yapılacağını belirle
  const vertical = rect.width >= rect.height;
  const rowThickness = vertical ? rowArea / rect.height : rowArea / rect.width;

  let currentOffset = vertical ? rect.y : rect.x;

  for (const item of row) {
    const itemLength = rowThickness > 0 ? item.area / rowThickness : 0;

    if (vertical) {
      results.push({
        id: item.id,
        value: item.value,
        x: rect.x,
        y: currentOffset,
        width: rowThickness,
        height: itemLength,
      });
      currentOffset += itemLength;
    } else {
      results.push({
        id: item.id,
        value: currentOffset,
        x: currentOffset,
        y: rect.y,
        width: itemLength,
        height: rowThickness,
      });
      currentOffset += itemLength;
    }
  }

  // Kalan dikdörtgen alanını güncelle
  if (vertical) {
    return {
      x: rect.x + rowThickness,
      y: rect.y,
      width: Math.max(0, rect.width - rowThickness),
      height: rect.height,
    };
  } else {
    return {
      x: rect.x,
      y: rect.y + rowThickness,
      width: rect.width,
      height: Math.max(0, rect.height - rowThickness),
    };
  }
}
