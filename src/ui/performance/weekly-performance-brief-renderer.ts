import type {
  WeeklyBriefChartMetric,
  WeeklyBriefLink,
  WeeklyPerformanceBriefViewModel,
} from '../../application/performance/build-weekly-performance-brief.js';
import { escapePresentationText } from '../components/presentation.js';
import { renderIconSvg } from '../primitives/icon.js';

export interface RenderWeeklyPerformanceBriefOptions {
  escapeHtml?: (value: any) => string;
  escapeAttr?: (value: any) => string;
}

function renderMiniComparisonChart(
  metrics: WeeklyBriefChartMetric[],
  escapeHtml: (value: any) => string
): string {
  const rowsHtml = metrics
    .map(metric => {
      const trendToneClass =
        metric.trend === 'up'
          ? 'text-green bg-green-subtle'
          : metric.trend === 'down'
            ? 'text-amber bg-amber-subtle'
            : 'text-content-secondary bg-surface-card';
      const trendIcon =
        metric.trend === 'up'
          ? 'trending-up'
          : metric.trend === 'down'
            ? 'trending-down'
            : 'minus';

      const currentWidth = Math.max(0, Math.min(100, metric.currentBarPct));
      const prevWidth = Math.max(0, Math.min(100, metric.previousBarPct));
      const currentBarFill =
        metric.trend === 'down'
          ? 'var(--chart-series-secondary)'
          : 'var(--chart-series-primary, var(--color-primary, currentColor))';
      const prevMarkerX = ((prevWidth / 100) * 150).toFixed(1);

      return `<div class="weekly-brief-chart__item space-y-1" role="group" aria-label="${escapeHtml(`${metric.label}: ${metric.currentFormatted} nos últimos 7 dias contra ${metric.previousFormatted} na semana passada (${metric.deltaFormatted})`)}">
        <div class="flex items-baseline justify-between gap-2 text-xs">
          <span class="font-medium text-content-primary">${escapeHtml(metric.label)}</span>
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${trendToneClass}">
            ${renderIconSvg(trendIcon, { size: 12, className: 'shrink-0' })}
            <span>${escapeHtml(metric.deltaFormatted)}</span>
          </span>
        </div>
        <svg viewBox="0 0 220 28" class="w-full h-7 overflow-visible" role="img" aria-label="${escapeHtml(`Gráfico de barras de ${metric.label}: atual ${metric.currentFormatted}, semana passada ${metric.previousFormatted}`)}">
          <g>
            <rect x="0" y="2" width="150" height="10" rx="2" fill="currentColor" fill-opacity="0.08"></rect>
            <rect x="0" y="2" width="${((currentWidth / 100) * 150).toFixed(1)}" height="10" rx="2" fill="${currentBarFill}"></rect>
            ${prevWidth > 0 ? `<line x1="${prevMarkerX}" y1="0.5" x2="${prevMarkerX}" y2="13.5" stroke="var(--chart-series-secondary)" stroke-width="1.5"/>` : ''}
            <text x="156" y="10.5" font-size="10" font-weight="600" fill="currentColor">${escapeHtml(metric.currentFormatted)}</text>
          </g>
          <g>
            <rect x="0" y="16" width="150" height="8" rx="2" fill="currentColor" fill-opacity="0.08"></rect>
            <rect x="0" y="16" width="${prevMarkerX}" height="8" rx="2" fill="currentColor" fill-opacity="0.32"></rect>
            <text x="156" y="23" font-size="9.5" fill="currentColor" opacity="0.72">ant.: ${escapeHtml(metric.previousFormatted)}</text>
          </g>
        </svg>
      </div>`;
    })
    .join('');

  return `<aside class="weekly-brief-chart bg-surface-subtle/50 border border-border-subtle rounded-default p-3.5 space-y-3" aria-label="Comparativo visual com a semana passada">
    <div class="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
      <h4 class="text-xs font-semibold text-content-primary m-0">Últimos 7 dias × semana anterior</h4>
      <div class="flex items-center gap-2 text-xs text-content-secondary" aria-hidden="true">
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-primary"></span>Atual</span>
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-warning-emphasis"></span>Destaque</span>
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-content-primary/25"></span>Anterior</span>
      </div>
    </div>
    <div class="space-y-2.5">
      ${rowsHtml}
    </div>
  </aside>`;
}

function renderBriefLinkButton(
  link: WeeklyBriefLink,
  escapeHtml: (value: any) => string,
  escapeAttr: (value: any) => string
): string {
  const attrs =
    link.kind === 'section'
      ? `data-performance-investigate="${escapeAttr(link.target)}"${
          link.subjectId ? ` data-performance-subject-id="${escapeAttr(link.subjectId)}"` : ''
        }`
      : `data-performance-open="${escapeAttr(link.target)}"`;

  return `<button type="button" class="btn ghost small inline-flex items-center gap-1.5" ${attrs}>${renderIconSvg(
    link.icon,
    { size: 14, className: 'shrink-0' }
  )}<span>${escapeHtml(link.label)}</span></button>`;
}

export function renderWeeklyPerformanceBriefCard(
  brief: WeeklyPerformanceBriefViewModel | null | undefined,
  options: RenderWeeklyPerformanceBriefOptions = {}
): string {
  if (!brief) return '';
  const escapeHtml = options.escapeHtml || escapePresentationText;
  const escapeAttr = options.escapeAttr || escapeHtml;

  const paragraphsHtml = brief.detailedParagraphs
    .map(
      paragraph =>
        `<p class="text-sm text-content-primary leading-relaxed m-0">${escapeHtml(paragraph)}</p>`
    )
    .join('');

  const linksHtml = brief.links.length
    ? `<nav class="ui-filter-bar flex flex-wrap gap-2 pt-1" aria-label="Atalhos da semana">${brief.links
        .map(link => renderBriefLinkButton(link, escapeHtml, escapeAttr))
        .join('')}</nav>`
    : '';

  const chartHtml = renderMiniComparisonChart(brief.chartMetrics, escapeHtml);

  return `<section class="performance-weekly-brief chart-card mb-4" aria-label="Seu resumo da última semana">
    <header class="module-heading module-heading--compact mb-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="module-heading__eyebrow">Leitura rápida · Últimos 7 dias</span>
          <h3 class="module-heading__title">Seu resumo da última semana</h3>
        </div>
        <span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(brief.periodLabel)}</span>
      </div>
    </header>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div class="lg:col-span-8 space-y-2.5">
        ${paragraphsHtml}
        ${linksHtml}
      </div>
      <div class="lg:col-span-4 w-full">
        ${chartHtml}
      </div>
    </div>
  </section>`;
}
