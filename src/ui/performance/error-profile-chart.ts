import { formatDecimal } from '../../core/format-number.js';

export interface ErrorCategoryRecord {
  label: string;
  count: number;
}

export interface ErrorProfileChartProps {
  categories: ErrorCategoryRecord[];
  uncategorizedCount?: number;
  totalErrors: number;
  escapeHtml: (text: string) => string;
}

export function renderErrorProfileChart({
  categories,
  uncategorizedCount = 0,
  totalErrors,
  escapeHtml,
}: ErrorProfileChartProps): string {
  if (!totalErrors) return '';

  const validCategories = categories.filter(c => c.count > 0);
  const allParts: Array<{ label: string; count: number; tone: string; color: string }> = [
    ...validCategories.map((c, i) => {
      const tones = [
        // Categorias são identidade, não estado: cores de disciplina (sem âmbar nem vermelho) e todas distintas.
        { tone: 'attention', color: 'var(--subject-2)' },
        { tone: 'secondary', color: 'var(--subject-1)' },
        { tone: 'primary', color: 'var(--subject-3)' },
        { tone: 'muted', color: 'var(--subject-4)' },
      ];
      const selected = tones[i % tones.length];
      return { label: c.label, count: c.count, tone: selected.tone, color: selected.color };
    }),
  ];

  if (uncategorizedCount > 0) {
    allParts.push({
      label: 'Sem categoria',
      count: uncategorizedCount,
      tone: 'neutral',
      color: 'currentColor',
    });
  }

  // Segmentos da barra empilhada superior
  let accumulated = 0;
  const segmentsSvg = allParts
    .map(part => {
      const share = (part.count / totalErrors) * 100;
      const x = accumulated;
      accumulated += share;
      const opacity = part.tone === 'neutral' ? '0.2' : '0.85';
      return `<rect x="${x.toFixed(2)}%" y="0" width="${share.toFixed(2)}%" height="100%" fill="${part.color}" fill-opacity="${opacity}" rx="0"><title>${escapeHtml(part.label)}: ${part.count} erros (${Math.round(share)}%)</title></rect>`;
    })
    .join('');

  // Linhas detalhadas de cada categoria
  const rowsHtml = allParts
    .map(part => {
      const share = Math.round((part.count / totalErrors) * 100);
      return `<div class="error-profile-row flex items-center justify-between text-xs py-1.5 border-b border-surface-subtle last:border-0">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${part.color}; opacity:${part.tone === 'neutral' ? '0.35' : '1'}"></span>
          <span class="font-medium text-content-primary">${escapeHtml(part.label)}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-content-secondary">${part.count} ${part.count === 1 ? 'erro' : 'erros'}</span>
          <span class="font-semibold text-content-primary w-10 text-right">${formatDecimal(share)}%</span>
        </div>
      </div>`;
    })
    .join('');

  return `<div class="error-profile-chart mt-2 space-y-3" role="region" aria-label="Distribuição do perfil de erros">
    <div class="w-full h-3 rounded overflow-hidden flex bg-surface-subtle/50" role="img" aria-label="Gráfico de distribuição de categorias de erro: ${allParts.map(p => `${escapeHtml(p.label)} ${Math.round((p.count / totalErrors) * 100)}%`).join(', ')}">
      <svg class="w-full h-full" preserveAspectRatio="none">
        ${segmentsSvg}
      </svg>
    </div>
    <div class="error-profile-legend space-y-1">
      ${rowsHtml}
    </div>
  </div>`;
}
