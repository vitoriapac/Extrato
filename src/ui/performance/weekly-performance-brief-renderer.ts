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
  embedded?: boolean;
}

export function renderMiniComparisonChart(
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
        metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus';

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
        <div class="flex items-center gap-3">
          <svg viewBox="0 0 150 28" class="h-7 min-w-0 flex-1 overflow-visible" role="img" aria-label="${escapeHtml(`Gráfico de barras de ${metric.label}: atual ${metric.currentFormatted}, semana passada ${metric.previousFormatted}`)}">
            <rect x="0" y="2" width="150" height="10" rx="2" fill="currentColor" fill-opacity="0.08"></rect>
            <rect x="0" y="2" width="${((currentWidth / 100) * 150).toFixed(1)}" height="10" rx="2" fill="${currentBarFill}"></rect>
            ${prevWidth > 0 ? `<line x1="${prevMarkerX}" y1="0.5" x2="${prevMarkerX}" y2="13.5" stroke="var(--chart-series-secondary)" stroke-width="1.5"/>` : ''}
            <rect x="0" y="16" width="150" height="8" rx="2" fill="currentColor" fill-opacity="0.08"></rect>
            <rect x="0" y="16" width="${prevMarkerX}" height="8" rx="2" fill="currentColor" fill-opacity="0.32"></rect>
          </svg>
          <div class="shrink-0 text-xs font-data leading-tight text-right">
            <div class="font-semibold text-content-primary">${escapeHtml(metric.currentFormatted)}</div>
            <div class="text-content-secondary">ant.: ${escapeHtml(metric.previousFormatted)}</div>
          </div>
        </div>
      </div>`;
    })
    .join('');

  return `<aside class="weekly-brief-chart bg-surface-subtle/50 border border-border-subtle rounded-default p-3.5 space-y-3" aria-label="Comparativo visual com a semana passada">
    <div class="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
      <p class="text-xs font-semibold text-content-primary m-0">Últimos 7 dias × semana anterior</p>
      <div class="flex items-center gap-2 text-xs text-content-secondary" aria-hidden="true">
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-primary"></span>Atual</span>
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-warning-emphasis"></span>Em queda</span>
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
  primary: boolean,
  escapeHtml: (value: any) => string,
  escapeAttr: (value: any) => string
): string {
  const attrs =
    link.kind === 'section'
      ? `data-performance-investigate="${escapeAttr(link.target)}"${
          link.subjectId ? ` data-performance-subject-id="${escapeAttr(link.subjectId)}"` : ''
        }`
      : `data-performance-open="${escapeAttr(link.target)}"`;

  return `<button type="button" class="btn${primary ? '' : ' ghost'} small inline-flex items-center gap-1.5" ${attrs}>${renderIconSvg(
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

  const paragraph = (text: string) =>
    `<p class="text-sm text-content-primary leading-relaxed m-0">${escapeHtml(text)}</p>`;
  // Só o primeiro parágrafo abre a leitura; o restante fica a um toque, para a Visão geral ter um foco só.
  const [firstParagraph = '', ...otherParagraphs] = brief.detailedParagraphs;
  const paragraphsHtml =
    paragraph(firstParagraph) +
    (otherParagraphs.length
      ? `<details class="performance-more"><summary>Ler o resumo completo</summary><div class="space-y-2.5 mt-2">${otherParagraphs.map(paragraph).join('')}</div></details>`
      : '');

  const linksHtml = brief.links.length
    ? `<nav class="ui-filter-bar flex flex-wrap gap-2 pt-1" aria-label="Atalhos da semana">${brief.links
        .map((link, index) => renderBriefLinkButton(link, index === 0, escapeHtml, escapeAttr))
        .join('')}</nav>`
    : '';

  const tipList = (title: string, items: string[]) =>
    items.length
      ? `<div class="space-y-1"><h4 class="text-xs font-semibold text-content-primary m-0">${escapeHtml(title)}</h4><ul class="text-xs text-content-secondary leading-relaxed m-0 pl-4 space-y-1">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
      : '';
  const tipsBody =
    tipList('Como ler', brief.readingTips) + tipList('Para manter o resumo útil', brief.keepTips);
  const tipsHtml = tipsBody
    ? `<details class="performance-more performance-weekly-brief__tips"><summary>Como ler este resumo</summary><div class="space-y-3 mt-2">${tipsBody}</div></details>`
    : '';

  const inner = `<div class="space-y-2.5">
      ${paragraphsHtml}
      ${linksHtml}
      ${tipsHtml}
    </div>`;
  if (options.embedded)
    return `<div class="performance-executive__week" aria-label="Seu resumo da última semana"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h4 class="module-heading__title">Últimos 7 dias</h4><span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(brief.periodLabel)}</span></div>${inner}</div>`;
  return `<section class="performance-weekly-brief chart-card mb-4" aria-label="Seu resumo da última semana">
    <header class="module-heading module-heading--compact mb-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="module-heading__title">Seu resumo da última semana</h3>
        <span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(brief.periodLabel)}</span>
      </div>
    </header>
    <div class="space-y-2.5">
      ${paragraphsHtml}
      ${linksHtml}
      ${tipsHtml}
    </div>
  </section>`;
}
