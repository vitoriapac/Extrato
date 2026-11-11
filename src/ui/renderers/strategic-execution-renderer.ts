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
const fmt = (value: unknown) => {
  const minutes = Math.round(Number(value) || 0);
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
};

export function renderStrategicExecution(model: Record<string, any>, periodLabel = 'esta semana') {
  if (!model) return '';
  const hasPriorityPlan = Number(model.priorityPlannedMinutes) > 0;
  const kpiCells = hasPriorityPlan
    ? `<span class="ui-progress" role="progressbar" aria-label="Aderência estratégica" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.max(0, Math.min(100, model.strategicAdherence ?? 0))}"><i style="width:${Math.max(0, Math.min(100, model.strategicAdherence ?? 0))}%"></i></span><div class="strategic-execution-summary"><div><span>Prioritário planejado</span><strong>${fmt(model.priorityPlannedMinutes)}</strong></div><div><span>Prioritário executado</span><strong>${fmt(model.priorityExecutedMinutes)}</strong></div></div>`
    : '';
  const summary = `<section class="metas-priority-summary" aria-labelledby="metasPriorityTitle"><header class="module-heading module-heading--compact"><h4 class="module-heading__title" id="metasPriorityTitle">Execução das prioridades</h4></header><strong class="metas-priority-value">${model.strategicAdherence === null ? '—' : model.strategicAdherence + '%'}</strong><p>${hasPriorityPlan ? `${fmt(model.priorityExecutedMinutes)} de ${fmt(model.priorityPlannedMinutes)} de prioridade · ${escape(periodLabel)}.` : 'Ainda não há atividades prioritárias classificadas no plano desta semana.'}</p>${kpiCells}<details><summary>Como esta métrica é calculada</summary><p class="analytics-note">Plano com classificação histórica: ${model.classifiedCoverage === null ? 'sem base' : model.classifiedCoverage + '%'}.</p>`;
  const details = `<p class="analytics-note">${fmt(model.linkedMinutes)} vinculadas a atividades deste período · ${fmt(model.additionalMinutes)} sem vínculo · ${fmt(model.otherPeriodMinutes)} vinculadas a planos de outro período.${model.invalidLinkMinutes ? ' ' + fmt(model.invalidLinkMinutes) + ' com vínculo incompatível ou inativo, sem crédito estratégico.' : ''}${model.excessLinkedMinutes ? ' ' + fmt(model.excessLinkedMinutes) + ' excedem o tempo previsto nos itens vinculados.' : ''}</p><p class="analytics-note">A execução prioritária exige vínculo válido e usa a prioridade salva no plano. Cada item recebe crédito até o tempo previsto; excedentes continuam no estudo total. ${model.unknownPlannedMinutes ? fmt(model.unknownPlannedMinutes) + ' planejadas não têm classificação histórica e não são tratadas como baixa prioridade.' : 'A classificação não é recalculada com o diagnóstico atual.'}</p>`;
  return summary + details + '</details></section>';
}
