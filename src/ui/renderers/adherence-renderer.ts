import { renderWindowBadge } from '../performance/window-badge.js';
import { volumeLabel, priorityMinutesLabel, planMin } from './adherence-labels.js';
import { formatDecimal } from '../../core/format-number.js';
import { renderExecutionBreakdown } from './execution-breakdown-renderer.js';
import { renderAdherenceTarget } from './adherence-target-renderer.js';
import { renderAdherenceChangeExplanation } from './adherence-change-renderer.js';
import { renderDisclosure, renderContextualHelp } from '../components/analytical-presentation.js';
import {
  adherenceStatus,
  ADHERENCE_STATUS_POLICY,
} from '../../application/adherence/adherence-status.js';

type Row = Record<string, any>;
const shown = (value: number | null | undefined) => (value == null ? '—' : formatDecimal(value));
const percent = (value: number | null | undefined) => (value == null ? '—' : `${shown(value)}%`);
export function renderAdherenceMetrics(model: Row, { escapeHtml, windowLabel = '' }: any = {}) {
  if (!model?.summary) return '';
  const { summary, priority } = model,
    assessment = adherenceStatus(model);
  const supported =
    priority.classifiedCoverage >= ADHERENCE_STATUS_POLICY.minimumClassifiedCoverage &&
    priority.plannedMinutes > 0 &&
    !model.ambiguousItemCount;
  return `<section class="adherence-summary performance-summary" aria-label="Resumo de aderência" data-adherence-assessment="${assessment.status}"><header class="module-heading module-heading--compact"><h3 class="module-heading__title">Execução do plano ${renderWindowBadge('period', windowLabel)}</h3><p class="module-heading__description">${escapeHtml(assessment.label)}. Dois números: <strong>aderência</strong> é o tempo com crédito ao plano; <strong>volume</strong> é quanto do previsto foi estudado (pode passar de 100%).</p></header><section class="performance-kpis" aria-label="Indicadores de aderência">
    <article class="performance-kpi"><span>Aderência ao plano ${renderWindowBadge('period', windowLabel)}</span><strong>${percent(summary.temporalAdherence)}</strong><small>${planMin(summary.matchedMinutes)} com crédito compatível.${summary.volumeRatio != null && summary.temporalAdherence != null && Math.abs(summary.volumeRatio - summary.temporalAdherence) < 0.05 ? ' Igual ao volume: todo o estudo da semana teve crédito.' : ''}</small></article>
    <article class="performance-kpi"><span>Execução prioritária ${renderWindowBadge('period', windowLabel)}</span><strong>${supported ? percent(priority.adherence) : '—'}</strong><small>${supported ? `${priorityMinutesLabel(priority.executedMinutes, priority.plannedMinutes, model.period?.evaluatedEnd)}.` : 'Evidência histórica insuficiente para interpretar prioridades.'}</small></article>
    <article class="performance-kpi"><span>Carga planejada ${renderWindowBadge('period', windowLabel)}</span><strong>${planMin(summary.plannedMinutes)}</strong><small>Volume do plano: ${volumeLabel(summary.volumeRatio)}.</small></article>
    <article class="performance-kpi"><span>Tempo realizado ${renderWindowBadge('period', windowLabel)}</span><strong>${planMin(summary.executedMinutes)}</strong><small>Inclui estudo adicional.</small></article>
  </section>${renderContextualHelp('adherence', 'Entenda aderência')}${renderExecutionBreakdown(model)}${renderDisclosure({ title: 'Como interpretar a aderência', className: 'adherence-method', bodyClassName: 'adherence-method__body', contentHTML: `<p>Crédito exige vínculo seguro, disciplina, tópico e tipo compatíveis. Cada atividade recebe no máximo o tempo previsto. A execução prioritária usa a prioridade registrada quando o plano foi criado; atividades parciais recebem crédito proporcional.</p><p>Volume: ${volumeLabel(summary.volumeRatio)}. Classificação histórica: ${percent(priority.classifiedCoverage)}; ${planMin(priority.unknownPlannedMinutes)} sem classificação registrada.</p><p>${planMin(summary.additionalMinutes)} adicionais · ${planMin(summary.excessLinkedMinutes)} excedentes vinculados · ${planMin(summary.incompatibleMinutes)} com vínculo incompatível · ${planMin(summary.otherPeriodMinutes)} vinculados a outro período. Estudo adicional continua sendo estudo real.</p><p>${priority.completedActivities} de ${priority.plannedActivities} blocos prioritários completos; ${priority.partiallyExecutedActivities} parcialmente executados. Não são contagens de tópicos distintos.</p>` })}</section>`;
}

export function renderAdherenceAnalysis(
  { model, weekly, goal }: { model: Row; weekly: Row; goal: Row },
  { formatDate, escapeHtml, windowLabel = '' }: any = {}
) {
  if (!model?.summary || !weekly?.current)
    return '<div class="empty-state empty-state--compact"><strong>Análise indisponível</strong><p>Configure uma data válida e registre atividades para acompanhar a aderência.</p></div>';
  const rows = [weekly.current, ...[...weekly.history].reverse()].filter(
    row => row.summary.plannedMinutes || row.summary.executedMinutes
  );
  const maximum = Math.max(
    1,
    ...rows.flatMap(row => [row.summary.plannedMinutes, row.summary.executedMinutes])
  );
  const weeks = rows
    .map((row, index) => {
      const { summary, priority, assessment } = row,
        supported = assessment.status !== 'insufficient_data';
      return `<li${index >= 5 ? ' hidden' : ''}><strong>${escapeHtml(formatDate(row.period.start))} a ${escapeHtml(formatDate(row.period.end))}${row.period.complete ? '' : ' · em andamento'}</strong><p>${escapeHtml(assessment.label)}</p><div class="performance-consistency-bars"><div><span>Plano</span><span class="performance-week-bar planned" aria-hidden="true" style="width:${Math.round((summary.plannedMinutes / maximum) * 100)}%"></span><b>${planMin(summary.plannedMinutes)}</b></div><div><span>Real</span><span class="performance-week-bar actual" aria-hidden="true" style="width:${Math.round((summary.executedMinutes / maximum) * 100)}%"></span><b>${planMin(summary.executedMinutes)}</b></div></div><small>Crédito ao plano: ${percent(summary.temporalAdherence)} · prioridades: ${supported ? percent(priority.adherence) : 'dados insuficientes'} · classificação: ${percent(priority.classifiedCoverage)}</small></li>`;
    })
    .join('');
  const subjects = model.subjects
    .map(
      (row: any, index: any) =>
        `<tr${index >= 5 ? ' hidden' : ''}><th scope="row">${escapeHtml(row.name)}</th><td>${planMin(row.plannedMinutes)}</td><td>${planMin(row.executedMinutes)}</td><td>${percent(row.temporalAdherence)}</td><td>${row.classifiedCoverage >= 80 ? percent(row.priorityAdherence) : 'Sem evidência'}</td></tr>`
    )
    .join('');
  // O planejado x realizado por disciplina fica na Comparação entre disciplinas (Desempenho > Por disciplina).
  const table = subjects
    ? `<div class="performance-table-scroll ui-data-table adherence-subjects" tabindex="0" role="region" aria-label="Aderência por disciplina"><table><caption>Tempo, crédito e prioridades por disciplina</caption><thead><tr><th scope="col">Disciplina</th><th scope="col">Plano</th><th scope="col">Real</th><th scope="col">Crédito</th><th scope="col">Prioridades</th></tr></thead><tbody>${subjects}</tbody></table></div>`
    : '<p>Distribua atividades por disciplina para obter esta comparação.</p>';
  return `${renderAdherenceMetrics(model, { escapeHtml, windowLabel })}${renderAdherenceTarget(goal, { escapeHtml })}${model.subjects.length ? '' : '<section class="performance-block adherence-distribution"><p>Crie um plano e registre sessões vinculadas para acompanhar a aderência por disciplina.</p><button type="button" class="btn ghost small" data-performance-open="metas">Abrir planejamento</button></section>'}${renderAdherenceChangeExplanation(weekly.changeExplanation, { escapeHtml })}<section class="performance-block adherence-trend"><header class="module-heading module-heading--compact"><h3 class="module-heading__title">Investigar a execução</h3><p class="module-heading__description">Semanas fechadas e a atual, independente do período do resumo.</p></header><label class="adherence-window">Histórico<select class="select-control" data-adherence-weeks>${[4, 8, 12].map(count => `<option value="${count}"${weekly.historyWeeks === count ? ' selected' : ''}>${count} semanas</option>`).join('')}</select></label><h4>Execução por semana</h4>${weeks ? `<ol class="performance-consistency-weeks adherence-week-list">${weeks}</ol>` : '<p>Registre planos e sessões para acompanhar as semanas.</p>'}<h4>Aderência por disciplina</h4>${table}</section>`;
}
