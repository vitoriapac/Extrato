import type { WeekSummary } from '../../application/performance/build-week-summary.js';
import { renderWindowBadge } from './window-badge.js';
import { escapePresentationText } from '../components/presentation.js';

/** Últimos 7 dias, aberto abaixo da Leitura: feito, sinal e ação, com a janela escrita. */
export function renderWeekSummary(
  summary: WeekSummary | null | undefined,
  { escapeHtml = escapePresentationText }: { escapeHtml?: (value: any) => string } = {}
): string {
  if (!summary) return '';
  return `<section class="performance-executive chart-card mb-4" id="bloco-resumo" data-week-summary="${summary.kind}" aria-label="Resumo dos últimos 7 dias"><header class="module-heading module-heading--compact mb-2"><div class="flex flex-wrap items-center gap-2"><h3 class="module-heading__title">Últimos 7 dias</h3>${renderWindowBadge('sevenDays', 'Sempre os últimos 7 dias, independente do filtro')}<span class="text-xs text-content-secondary">${escapeHtml(summary.periodLabel)}</span></div></header><div class="space-y-2">${summary.paragraphs.map(text => `<p class="m-0 text-sm text-content-primary leading-relaxed">${escapeHtml(text)}</p>`).join('')}</div></section>`;
}
