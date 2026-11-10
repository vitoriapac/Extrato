import type {
  PreparationLink,
  PreparationReading,
} from '../../application/performance/build-preparation-reading.js';
import { escapePresentationText } from '../components/presentation.js';

const linkButton = (link: PreparationLink, escapeAttr: (value: any) => string, solid = false) => {
  const attrs =
    link.kind === 'section'
      ? `data-performance-investigate="${escapeAttr(link.target)}"${link.subjectId ? ` data-performance-subject-id="${escapeAttr(link.subjectId)}"` : ''}`
      : `data-performance-open="${escapeAttr(link.target)}"`;
  return `<button type="button" class="btn${solid ? '' : ' ghost'} small" ${attrs}>${escapeAttr(link.label)}</button>`;
};

/** Faixa de leitura no topo da Visão geral: como estou, o que puxa e o que fazer. */
export function renderPreparationReading(
  reading: PreparationReading | null | undefined,
  {
    escapeHtml = escapePresentationText,
    escapeAttr = escapePresentationText,
    rangeLabel = '',
  }: {
    escapeHtml?: (value: any) => string;
    escapeAttr?: (value: any) => string;
    rangeLabel?: string;
  } = {}
): string {
  if (!reading) return '';
  const { howAmI, pulling, whatToDo, evidence } = reading;
  const line = (text: string) => `<p class="m-0">${escapeHtml(text)}</p>`;

  const how =
    [
      howAmI.readiness
        ? `<p class="m-0"><strong class="performance-reading__figure">Prontidão ${escapeHtml(howAmI.readiness.value)}/100</strong>${howAmI.readiness.detail ? ` <span>${escapeHtml(howAmI.readiness.detail)}</span>` : ''}</p>`
        : '',
      howAmI.projection ? line(howAmI.projection.text) : '',
      howAmI.rhythm ? line(howAmI.rhythm.text) : '',
    ]
      .filter(Boolean)
      .join('') || line('Ainda não há dados suficientes para esta leitura.');

  const pull = pulling.length
    ? `<ol class="performance-reading__list">${pulling
        .map(
          item =>
            `<li><span>${escapeHtml(item.text)}</span>${item.link ? ` ${linkButton(item.link, escapeAttr)}` : ''}</li>`
        )
        .join('')}</ol>`
    : line('Nenhum ponto de atenção com evidência suficiente.');

  const todo = whatToDo.action
    ? `<p class="m-0" data-recommendation-id="${escapeAttr(whatToDo.action.recommendationId ?? '')}"><strong>${escapeHtml(whatToDo.action.label)}:</strong> ${escapeHtml(whatToDo.action.text)}</p>${line(whatToDo.action.planNote)}${whatToDo.deficit ? line(whatToDo.deficit) : ''}<div class="performance-reading__actions">${linkButton({ kind: 'tab', target: 'hoje', label: 'Abrir em Hoje' }, escapeAttr, true)}${linkButton({ kind: 'tab', target: 'metas', label: 'Ajustar plano' }, escapeAttr)}</div>`
    : `${line(whatToDo.reason || 'Nenhuma ação indicada agora.')}${whatToDo.deficit ? line(whatToDo.deficit) : ''}<div class="performance-reading__actions">${linkButton({ kind: 'tab', target: 'hoje', label: 'Abrir Hoje' }, escapeAttr, true)}</div>`;

  const evidenceHtml = evidence.length
    ? `<ul class="performance-reading__evidence analytics-note">${evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  return `<section class="performance-reading chart-card mb-4" id="bloco-leitura" aria-labelledby="performanceReadingTitle">
    <header class="module-heading module-heading--compact mb-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="module-heading__title" id="performanceReadingTitle">Leitura da preparação</h3>${rangeLabel ? `<span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(rangeLabel)}</span>` : ''}</div></header>
    <div class="performance-reading__grid">
      <section aria-labelledby="performanceReadingHow"><h4 id="performanceReadingHow">Como estou</h4>${how}</section>
      <section aria-labelledby="performanceReadingPull"><h4 id="performanceReadingPull">O que mais pesa</h4>${pull}</section>
      <section aria-labelledby="performanceReadingTodo"><h4 id="performanceReadingTodo">O que fazer</h4>${todo}</section>
    </div>${evidenceHtml}
  </section>`;
}
