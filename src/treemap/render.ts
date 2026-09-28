import type { AnalysisResult, Category, Segment } from '../types';
import { squarify, type TreemapItem } from './squarify';

export interface TreemapOptions {
  onSelect?: (segment: Segment) => void;
  selectedSegmentId?: string | null;
}

// Renk körlüğüne uygun Okabe-Ito Renk Paleti
export const CATEGORY_COLORS: Record<Category, string> = {
  system: '#E69F00',     // Turuncu
  user: '#0072B2',       // Mavi
  assistant: '#009E73',  // Yeşil
  tool_call: '#F0E442',  // Sarı
  tool_result: '#D55E00',// Koyu Kırmızı / Kiremit
  rag: '#56B4E9',        // Gök Mavisi
  other: '#CC79A7',      // Mor / Pembe
};

/**
 * İki seviyeli SVG Treemap bileşenini çizer ve dinamik yeniden boyutlandırmayı yönetir.
 */
export function renderTreemap(
  container: HTMLElement,
  result: AnalysisResult,
  options: TreemapOptions = {}
): () => void {
  // Temizleme: Eski SVG ve Tooltip öğelerini kaldır
  container.innerHTML = '';

  const tooltipEl = createTooltipElement(container);

  const draw = () => {
    const width = container.clientWidth || 800;
    const height = Math.max(container.clientHeight, 500);

    // Kök SVG oluşturma
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Token Haritası Treemap Grafiği. Toplam ${result.totalTokens} token.`);
    svg.style.display = 'block';
    svg.style.userSelect = 'none';

    if (result.totalTokens === 0) {
      const emptyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      emptyText.setAttribute('x', String(width / 2));
      emptyText.setAttribute('y', String(height / 2));
      emptyText.setAttribute('text-anchor', 'middle');
      emptyText.setAttribute('fill', '#94a3b8');
      emptyText.textContent = 'Görüntülenecek token verisi bulunamadı.';
      svg.appendChild(emptyText);
      container.replaceChildren(svg, tooltipEl);
      return;
    }

    // --- 1. Seviye: Kategoriler için Yerleşim ---
    const categoryItems: TreemapItem[] = result.categoryStats.map((stat) => ({
      id: stat.category,
      value: stat.tokens,
    }));

    const categoryRects = squarify(categoryItems, { x: 0, y: 0, width, height });

    categoryRects.forEach((catRect) => {
      const category = catRect.id as Category;
      const stat = result.categoryStats.find((s) => s.category === category);
      if (!stat || catRect.width < 10 || catRect.height < 10) return;

      const baseColor = CATEGORY_COLORS[category] || '#94a3b8';

      // Kategori Grup Öğesi
      const catGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      catGroup.setAttribute('class', `category-group category-${category}`);

      // Kategori Arka Plan Çerçevesi
      const catBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      catBackground.setAttribute('x', String(catRect.x));
      catBackground.setAttribute('y', String(catRect.y));
      catBackground.setAttribute('width', String(catRect.width));
      catBackground.setAttribute('height', String(catRect.height));
      catBackground.setAttribute('fill', baseColor);
      catBackground.setAttribute('fill-opacity', '0.15');
      catBackground.setAttribute('stroke', baseColor);
      catBackground.setAttribute('stroke-width', '2');
      catBackground.setAttribute('rx', '4');
      catGroup.appendChild(catBackground);

      // Kategori Başlık Yüksekliği Kontrolü
      const headerHeight = catRect.height > 40 ? 24 : 0;

      if (headerHeight > 0 && catRect.width > 60) {
        const catTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        catTitle.setAttribute('x', String(catRect.x + 6));
        catTitle.setAttribute('y', String(catRect.y + 16));
        catTitle.setAttribute('fill', '#f8fafc');
        catTitle.setAttribute('font-size', '12px');
        catTitle.setAttribute('font-weight', 'bold');
        catTitle.setAttribute('pointer-events', 'none');
        catTitle.textContent = `${stat.label} (%${stat.percentage})`;
        catGroup.appendChild(catTitle);
      }

      // --- 2. Seviye: Segmentler için Yerleşim ---
      const categorySegments = result.segments.filter((s) => s.category === category);
      const innerMargin = 3;
      const innerRect = {
        x: catRect.x + innerMargin,
        y: catRect.y + headerHeight + innerMargin,
        width: Math.max(0, catRect.width - innerMargin * 2),
        height: Math.max(0, catRect.height - headerHeight - innerMargin * 2),
      };

      if (innerRect.width > 5 && innerRect.height > 5) {
        const segmentItems: TreemapItem[] = categorySegments.map((seg) => ({
          id: seg.id,
          value: seg.tokens,
        }));

        const segmentRects = squarify(segmentItems, innerRect);

        segmentRects.forEach((segRect) => {
          const segment = categorySegments.find((s) => s.id === segRect.id);
          if (!segment) return;

          const isSelected = options.selectedSegmentId === segment.id;
          const segPercentage = ((segment.tokens / result.totalTokens) * 100).toFixed(1);

          // Segment Grubu (Erişilebilirlik ve Etkileşim)
          const segGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          segGroup.setAttribute('tabindex', '0');
          segGroup.setAttribute('role', 'button');
          segGroup.setAttribute(
            'aria-label',
            `${stat.label}, ${segment.label}, ${segment.tokens.toLocaleString('tr-TR')} token, yüzde ${segPercentage}`
          );
          segGroup.style.cursor = 'pointer';
          segGroup.style.outline = 'none';

          // Segment Kutusu Rect
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', String(segRect.x));
          rect.setAttribute('y', String(segRect.y));
          rect.setAttribute('width', String(segRect.width));
          rect.setAttribute('height', String(segRect.height));
          rect.setAttribute('fill', baseColor);
          rect.setAttribute('fill-opacity', isSelected ? '0.9' : '0.6');
          rect.setAttribute('stroke', isSelected ? '#ffffff' : baseColor);
          rect.setAttribute('stroke-width', isSelected ? '3' : '1');
          rect.setAttribute('rx', '3');
          rect.style.transition = 'fill-opacity 0.2s, stroke-width 0.2s';

          // Hover Efekti
          segGroup.addEventListener('mouseenter', () => {
            rect.setAttribute('fill-opacity', '0.95');
            showTooltip(tooltipEl, segment, stat.label, segPercentage, container);
          });
          segGroup.addEventListener('mousemove', (e) => {
            moveTooltip(tooltipEl, e, container);
          });
          segGroup.addEventListener('mouseleave', () => {
            rect.setAttribute('fill-opacity', isSelected ? '0.9' : '0.6');
            hideTooltip(tooltipEl);
          });

          // Klavye & Tıklama Etkileşimi
          const triggerSelect = () => {
            if (options.onSelect) {
              options.onSelect(segment);
            }
          };

          segGroup.addEventListener('click', triggerSelect);
          segGroup.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerSelect();
            }
          });

          segGroup.appendChild(rect);

          // Sığma Kontrolü ve Metin Etiketi
          if (segRect.width > 45 && segRect.height > 25) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(segRect.x + 4));
            text.setAttribute('y', String(segRect.y + 14));
            text.setAttribute('fill', '#ffffff');
            text.setAttribute('font-size', '11px');
            text.setAttribute('pointer-events', 'none');

            const truncatedLabel =
              segment.label.length > Math.floor(segRect.width / 8)
                ? segment.label.slice(0, Math.max(3, Math.floor(segRect.width / 8) - 2)) + '..'
                : segment.label;

            text.textContent = truncatedLabel;
            segGroup.appendChild(text);

            if (segRect.height > 40) {
              const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              subText.setAttribute('x', String(segRect.x + 4));
              subText.setAttribute('y', String(segRect.y + 28));
              subText.setAttribute('fill', '#e2e8f0');
              subText.setAttribute('font-size', '10px');
              subText.setAttribute('pointer-events', 'none');
              subText.textContent = `${segment.tokens.toLocaleString('tr-TR')} tk (%${segPercentage})`;
              segGroup.appendChild(subText);
            }
          }

          catGroup.appendChild(segGroup);
        });
      }

      svg.appendChild(catGroup);
    });

    container.replaceChildren(svg, tooltipEl);
  };

  // İlk çizim
  draw();

  // ResizeObserver ile responsive çizim
  const resizeObserver = new ResizeObserver(() => {
    draw();
  });
  resizeObserver.observe(container);

  return () => {
    resizeObserver.disconnect();
    container.innerHTML = '';
  };
}

// --- Tooltip Yardımcı Fonksiyonları ---

function createTooltipElement(container: HTMLElement): HTMLElement {
  let tooltip = container.querySelector<HTMLElement>('.treemap-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'treemap-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = '#1e293b';
    tooltip.style.color = '#f8fafc';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '12px';
    tooltip.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '300px';
    tooltip.style.border = '1px solid #475569';
    container.style.position = 'relative';
    container.appendChild(tooltip);
  }
  return tooltip;
}

function showTooltip(
  tooltip: HTMLElement,
  segment: Segment,
  categoryLabel: string,
  percentage: string,
  _container: HTMLElement
) {
  const snippet = segment.text.length > 200 ? segment.text.slice(0, 200) + '...' : segment.text;

  tooltip.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 2px;">
      ${escapeHtml(segment.label)}
    </div>
    <div><strong>Kategori:</strong> ${escapeHtml(categoryLabel)}</div>
    <div><strong>Token:</strong> ${segment.tokens.toLocaleString('tr-TR')} (%${percentage})</div>
    <div style="margin-top: 6px; font-style: italic; color: #cbd5e1; font-size: 11px; line-height: 1.3;">
      "${escapeHtml(snippet)}"
    </div>
  `;
  tooltip.style.display = 'block';
}

function moveTooltip(tooltip: HTMLElement, e: MouseEvent, container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left + 12;
  const y = e.clientY - rect.top + 12;

  tooltip.style.left = `${Math.min(x, rect.width - 280)}px`;
  tooltip.style.top = `${Math.min(y, rect.height - 120)}px`;
}

function hideTooltip(tooltip: HTMLElement) {
  tooltip.style.display = 'none';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
