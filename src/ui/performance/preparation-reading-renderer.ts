import { renderCopyBlockLink } from './block-link.js';
import type {
  PreparationLink,
  PreparationReading,
} from '../../application/performance/build-preparation-reading.js';
import { escapePresentationText } from '../components/presentation.js';

const linkButton = (link: PreparationLink, escapeAttr: (value: any) => string, solid = false) => {
  const attrs =
    link.kind === 'section'
      ? `data-performance-investigate="${escapeAttr(link.target)}"${link.subjectId ? ` data-performance-subject-id="${escapeAttr(link.subjectId)}"` : ''}`
      : link.kind === 'reveal'
        ? `data-performance-reveal="${escapeAttr(link.target)}"`
        : link.kind === 'plan-adjust'
          ? 'data-performance-adjust-plan'
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
        ? `<p class="m-0"><strong class="performance-reading__figure">Prontidão ${escapeHtml(howAmI.readiness.value)}/100</strong> <span>calculada agora</span></p>${howAmI.readiness.detail ? line(howAmI.readiness.detail) : ''}`
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
    ? `<p class="m-0" data-recommendation-id="${escapeAttr(whatToDo.action.recommendationId ?? '')}"><strong>${escapeHtml(whatToDo.action.label)}:</strong> ${escapeHtml(whatToDo.action.text)}</p>${line(whatToDo.action.planNote)}${whatToDo.deficit ? line(whatToDo.deficit) : ''}<div class="performance-reading__actions">${linkButton({ kind: 'tab', target: 'hoje', label: 'Abrir em Hoje' }, escapeAttr, true)}${linkButton({ kind: 'plan-adjust', target: 'metas', label: 'Ajustar plano' }, escapeAttr)}${whatToDo.recovery ? linkButton({ kind: 'reveal', target: 'trajectory', label: 'Ver plano de recuperação' }, escapeAttr) : ''}</div>`
    : `${line(whatToDo.reason || 'Nenhuma ação indicada agora.')}${whatToDo.deficit ? line(whatToDo.deficit) : ''}<div class="performance-reading__actions">${linkButton({ kind: 'tab', target: 'hoje', label: 'Abrir Hoje' }, escapeAttr, true)}</div>`;

  const evidenceHtml = evidence.length
    ? `<ul class="performance-reading__evidence analytics-note">${evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  return `<section class="performance-reading chart-card mb-4" id="bloco-leitura" aria-labelledby="performanceReadingTitle">
    <header class="module-heading module-heading--compact mb-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="module-heading__title" id="performanceReadingTitle">Leitura da preparação</h3>${renderCopyBlockLink('leitura')}${rangeLabel ? `<span class="text-xs font-medium text-content-secondary bg-surface-subtle px-2.5 py-1 rounded-xs">${escapeHtml(rangeLabel)}</span>` : ''}</div></header>
    <div class="performance-reading__grid">
      <section aria-labelledby="performanceReadingHow"><h4 id="performanceReadingHow">Como estou</h4>${how}</section>
      <section aria-labelledby="performanceReadingPull"><h4 id="performanceReadingPull">O que mais pesa</h4>${pull}</section>
      <section aria-labelledby="performanceReadingTodo"><h4 id="performanceReadingTodo">O que fazer</h4>${todo}</section>
    </div>${evidenceHtml}
  </section>`;
}

const STATE_LABEL: Record<string, string> = {
  positive: 'Evidência de melhora',
  neutral: 'Sem melhora observável · estável',
  negative: 'Sem melhora observável · piora',
};

/** O que mudou depois das recomendações já medidas. Só observação: nenhuma causa é afirmada. */
export function renderRecommendationFollowupSummary(
  rows: Array<Record<string, any>> | null | undefined,
  { escapeHtml = escapePresentationText }: { escapeHtml?: (value: any) => string } = {}
): string {
  const measured = (rows || []).filter(row => STATE_LABEL[row.state]).slice(0, 3);
  if (!measured.length) return '';
  const items = measured
    .map(row => {
      const metric = (row.metrics || []).find(
        (item: Record<string, any>) => item.before != null && item.after != null
      );
      const change = metric ? ` · ${metric.label} de ${metric.before} para ${metric.after}` : '';
      return `<li><strong>${escapeHtml(row.topicName)}</strong> (${escapeHtml(row.action)}): ${escapeHtml(STATE_LABEL[row.state])}${escapeHtml(change)}.</li>`;
    })
    .join('');
  return `<section class="performance-followup chart-card mb-4" id="bloco-recomendacoes" aria-labelledby="performanceFollowupTitle"><header class="module-heading module-heading--compact mb-3"><h3 class="module-heading__title" id="performanceFollowupTitle">O que mudou depois das recomendações</h3></header><ul class="performance-reading__list">${items}</ul><p class="analytics-note m-0">Medição depois de recomendações concluídas. É uma observação: não indica que a recomendação causou a mudança.</p></section>`;
}
