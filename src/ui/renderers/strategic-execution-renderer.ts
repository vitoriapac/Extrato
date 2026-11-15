import { formatPlanMinutes } from '../../core/format-duration.js';
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
const fmt = (value: unknown) => formatPlanMinutes(Number(value) || 0);

export function renderStrategicExecution(model: Record<string, any>, periodLabel = 'esta semana') {
  if (!model) return '';
  const hasPriorityPlan = Number(model.priorityPlannedMinutes) > 0;
  const summary = `<section class="metas-priority-summary" aria-labelledby="metasPriorityTitle"><header class="module-heading module-heading--compact"><h4 class="module-heading__title" id="metasPriorityTitle">Execução das prioridades</h4></header><p>${hasPriorityPlan ? `<strong>${model.strategicAdherence === null ? '—' : model.strategicAdherence + '%'}</strong> das prioridades executadas: ${fmt(model.priorityExecutedMinutes)} de ${fmt(model.priorityPlannedMinutes)} prioritárias planejadas na semana inteira · ${escape(periodLabel)}, todas as provas. Só estudo ligado a uma tarefa válida conta neste percentual.` : 'Ainda não há atividades prioritárias classificadas no plano desta semana.'}</p><details><summary>Como esta métrica é calculada</summary><p class="analytics-note">Plano com classificação histórica: ${model.classifiedCoverage === null ? 'sem base' : model.classifiedCoverage + '%'}.</p>`;
  const details = `<p class="analytics-note">${fmt(model.linkedMinutes)} ligadas a tarefas deste período · ${fmt(model.additionalMinutes)} avulsas · ${fmt(model.otherPeriodMinutes)} ligadas a planos de outro período.${model.invalidLinkMinutes ? ' ' + fmt(model.invalidLinkMinutes) + ' ligadas a tarefa incompatível ou inativa, sem crédito estratégico.' : ''}${model.excessLinkedMinutes ? ' ' + fmt(model.excessLinkedMinutes) + ' excedem o tempo previsto nos itens vinculados.' : ''}</p><p class="analytics-note">A execução prioritária exige estudo ligado a uma tarefa válida e usa a prioridade salva no plano. Cada item recebe crédito até o tempo previsto; excedentes continuam no estudo total. ${model.unknownPlannedMinutes ? fmt(model.unknownPlannedMinutes) + ' planejadas não têm classificação histórica e não são tratadas como baixa prioridade.' : 'A classificação não é recalculada com o diagnóstico atual.'}</p>`;
  return summary + details + '</details></section>';
}
