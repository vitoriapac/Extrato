import { formatDecimal } from '../../core/format-number.js';
import { lazyMore } from '../lazy-more.js';
import { volumeLabel, priorityMinutesLabel, planMin } from './adherence-labels.js';
import { formatPeriodBR } from '../../core/format-date.js';
import { renderExecutionBreakdown } from './execution-breakdown-renderer.js';
import { renderSustainability } from './sustainability-renderer.js';
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }) as Record<
          string,
          string
        >
      )[char]
  );
const shown = (value: unknown) => (value == null ? '—' : formatDecimal(value));
export function renderWeeklyAdherence(
  frame: Record<string, any> | null | undefined,
  { historical = false }: any = {}
) {
  if (!frame?.model?.summary) return '';
  const { summary, priority } = frame.model,
    recurring = frame.recurring;
  const available = frame.assessment.status !== 'insufficient_data';
  const rows = (recurring?.items || [])
    .map(
      (row: any, index: any) =>
        `<li${index >= 5 ? ' hidden' : ''}><strong>${escape(row.topicName)}</strong><span>${escape(row.subjectName)} · prioridade abaixo de ${shown(frame.policy?.target || 80)}% em ${shown(row.periodCount)} períodos sem sobreposição.</span><p>${escape(row.executionPatternLabel || '')}</p><small>${shown(row.creditedMinutes)} de ${planMin(row.plannedMinutes)} creditados no período registrado; ${planMin(row.remainingMinutes)} pendentes.</small><details><summary>Conferir os períodos registrados</summary><ul>${row.periods.map((period: any) => `<li>${escape(formatPeriodBR(period.start, period.end))} · ${shown(period.creditedMinutes)} de ${planMin(period.plannedMinutes)}</li>`).join('')}</ul></details>${historical || !row.navigable ? '' : `<div class="recurring-priority-actions"><button type="button" class="btn ghost small" data-analysis-nav="metas" data-subject-id="${escape(row.subjectId)}" data-topic-id="${escape(row.topicId)}">Ver planejamento</button><button type="button" class="btn ghost small" data-analysis-nav="desempenho" data-subject-id="${escape(row.subjectId)}" data-topic-id="${escape(row.topicId)}">Ver desempenho do tópico</button></div>`}</li>`
    )
    .join('');
  return (
    renderSustainability(frame.sustainability, { historical }) +
    `<section class="weekly-adherence" aria-label="Aderência do fechamento"><p class="context-note">${escape(frame.assessment.label)}</p><p>Execução prioritária: <strong>${available ? shown(priority.adherence) + '%' : 'sem evidência'}</strong> · ${priorityMinutesLabel(priority.executedMinutes, priority.plannedMinutes, frame.model.period?.evaluatedEnd)} · classificação histórica ${shown(priority.classifiedCoverage)}%.</p>${renderExecutionBreakdown(frame.model)}<details><summary>Conferir o crédito da execução</summary><p>Crédito ao plano: ${planMin(summary.matchedMinutes)} de ${planMin(summary.plannedMinutes)}. Volume realizado: ${volumeLabel(summary.volumeRatio)}.</p><p>${planMin(summary.additionalMinutes)} adicionais · ${planMin(summary.excessLinkedMinutes)} excedentes vinculados · ${planMin(summary.incompatibleMinutes)} incompatíveis · ${planMin(summary.otherPeriodMinutes)} vinculados a outro período.</p><p>O crédito é limitado por atividade e usa a prioridade registrada no planejamento. Pouca classificação histórica impede conclusões estratégicas.</p></details><h5>Pendências recorrentes</h5>${rows ? `<ul class="recurring-priority-list">${rows}</ul><p>Revise a carga e os blocos que não couberam na rotina. Qualquer alteração continua exigindo prévia e confirmação.</p>${historical ? '' : '<button type="button" class="btn ghost small" data-delegated-click="openWeeklyAdherencePlanning()">Revisar planejamento</button>'}` : `<p>${recurring?.state === 'ready' ? 'Não há prioridade repetidamente pendente nos períodos comparáveis.' : recurring?.state === 'insufficient_data' ? 'A classificação histórica disponível não permite identificar pendências recorrentes. Novos planos registram as prioridades no momento da criação.' : historical ? 'Na data deste registro, ainda não havia fechamentos comparáveis para identificar recorrência.' : 'Salve fechamentos com classificação histórica suficiente para acompanhar a repetição de pendências.'}</p>`}</section>`
  );
}
const HISTORY_VISIBLE = 5;
export function renderAdherenceCloseHistory(rows: any[] = []) {
  if (!rows.length) return '';
  // Só os 5 retratos mais recentes entram no DOM; o corpo de cada um só renderiza ao abrir.
  const item = (row: any) => {
    const frame = row.adherence,
      summary = frame.model?.summary,
      priority = frame.model?.priority;
    return `<li><details><summary>${escape(formatPeriodBR(row.period.start, row.period.end))} · ${escape(frame.assessment?.label || 'Dados insuficientes')} · versão ${escape(row.revision)}</summary><template data-lazy>${`<p>Crédito ao plano: ${shown(summary?.temporalAdherence)}% · ${planMin(summary?.matchedMinutes)} de ${planMin(summary?.plannedMinutes)}. Prioridades: ${frame.assessment?.status === 'insufficient_data' ? 'sem evidência' : shown(priority?.adherence) + '%'}.</p>${frame.personalTarget ? `<p>Meta pessoal registrada: ${frame.personalTarget.enabled ? shown(frame.personalTarget.target) + '%' : 'desativada'}.</p>` : ''}${renderWeeklyAdherence(frame, { historical: true })}`}</template></details></li>`;
  };
  const rest = rows.slice(HISTORY_VISIBLE);
  return `<section class="weekly-adherence-history" aria-label="Histórico da aderência registrada"><h5>Aderência nos fechamentos salvos</h5><p>Valores e interpretações preservados na data do fechamento. Versões anteriores continuam nos registros.</p><ol>${rows.slice(0, HISTORY_VISIBLE).map(item).join('')}${lazyMore(rest.map(item).join(''), rest.length, { inList: true })}</ol></section>`;
}

