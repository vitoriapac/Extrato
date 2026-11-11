import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { renderIconSvg } from '../../ui/primitives/icon.js';

export function renderReplanProposal(
  model: Record<string, any>,
  {
    escapeHtml = defaultEscapeHtml,
    formatDate = (value: unknown) => value,
    formatMinutes = (value: unknown) => `${value} min`,
    subjectName = () => '',
    topicName = () => '',
  }: any = {}
) {
  const name = (item: Record<string, any>) =>
    [subjectName(item.subjectId), topicName(item.topicId)]
      .filter(Boolean)
      .map(escapeHtml)
      .join(' — ') || 'Atividade sem conteúdo identificado';
  const allocationRows = (model.allocations || [])
    .map(
      (item: any) =>
        `<article class="replan-detail-row"><div><strong>${name(item)}</strong><small>${escapeHtml(item.reason || 'atividade pendente')}</small></div><span><b>${formatMinutes(item.minutes)}</b><small>${formatDate(item.date)}</small></span></article>`
    )
    .join('');
  const retainedRows = (model.retainedItems || [])
    .map(
      (item: any) =>
        `<article class="replan-detail-row is-warning"><div><strong>${name(item)}</strong><small>${escapeHtml(item.reason || 'atividade pendente')}</small></div><span><b>${formatMinutes(item.unallocatedMinutes)}</b><small>sem nova data</small></span></article>`
    )
    .join('');
  const capacityRows = (model.capacityByDay || [])
    .map(
      (day: any) =>
        `<div class="replan-capacity-row"><strong>${formatDate(day.date)}</strong><span>${formatMinutes(day.allocatedMinutes)} usados · ${formatMinutes(day.remainingMinutes)} livres de ${formatMinutes(day.availableMinutes)}</span></div>`
    )
    .join('');

  const empathyHeader = `
    <div class="replan-empathy-header mb-3 p-3 rounded-lg bg-surface-subtle border border-border-default flex items-start gap-3">
      <div class="p-1.5 rounded bg-brand/10 dark:bg-accent/15 text-brand dark:text-accent shrink-0">
        ${renderIconSvg('heart-handshake', { size: 18 })}
      </div>
      <div>
        <h4 class="text-xs font-semibold text-content-primary m-0">Sua semana mudou? Reajuste sua capacidade sem culpa nem perda de histórico</h4>
        <p class="text-xs text-content-secondary mt-0.5 mb-0">Imprevistos acontecem. O plano redistribui o saldo de horas pendente respeitando seus limites diários futuros.</p>
      </div>
    </div>
  `;

  return `${empathyHeader}<div class="study-plan-summary"><div><strong>${formatMinutes(model.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatMinutes(model.executedMinutes)}</strong><span>Executado</span></div><div><strong>${formatMinutes(model.deficitMinutes)}</strong><span>A redistribuir</span></div><div><strong>${formatMinutes(model.redistributedMinutes)}</strong><span>Redistribuídas</span></div></div><section class="replan-detail"><h4>Movimentações propostas</h4>${allocationRows || '<div class="upcoming-empty">Nenhuma atividade coube nos próximos dias.</div>'}</section>${retainedRows ? `<section class="replan-detail"><h4>Excedente mantido para decisão posterior</h4>${retainedRows}</section>` : ''}<details class="replan-capacity"><summary>Conferir capacidade por dia</summary>${capacityRows || '<p>Nenhum dia futuro disponível nesta semana.</p>'}</details>${model.discardedMinutes ? `<div class="replan-group is-warning"><strong>Sem capacidade disponível</strong><span>${formatMinutes(model.discardedMinutes)} não cabem sem ultrapassar seus horários.</span></div>` : ''}`;
}
