export type WeekReconciliation = {
  capacityMin: number;
  plannedMin: number;
  linkedMin: number | null;
  unlinkedMin: number | null;
  incompatibleMin: number;
  otherPeriodMin: number;
  classifiedStudyMin: number | null;
  studiedMin: number;
  multiple: number | null;
  periodLabel: string;
};

const clean = (n: number): number => Math.max(0, Number(n) || 0);

/** Concilia capacidade, plano e realizado da semana (minutos); só apresentação, sem regra de domínio. */
export function buildWeekReconciliation(input: {
  capacityMin: number;
  plannedMin: number;
  studiedMin: number;
  periodLabel: string;
  links?: {
    studiedMinutes: number;
    linkedMinutes: number;
    additionalMinutes: number;
    incompatibleMinutes: number;
    otherPeriodMinutes: number;
  } | null;
}): WeekReconciliation {
  if (!input.periodLabel) throw new Error('periodLabel é obrigatório');
  const plannedMin = clean(input.plannedMin);
  const studiedMin = clean(input.studiedMin);
  return {
    capacityMin: clean(input.capacityMin),
    plannedMin,
    linkedMin: input.links ? clean(input.links.linkedMinutes) : null,
    unlinkedMin: input.links ? clean(input.links.additionalMinutes) : null,
    incompatibleMin: clean(input.links?.incompatibleMinutes ?? 0),
    otherPeriodMin: clean(input.links?.otherPeriodMinutes ?? 0),
    classifiedStudyMin: input.links ? clean(input.links.studiedMinutes) : null,
    studiedMin,
    multiple: plannedMin > 0 ? studiedMin / plannedMin : null,
    periodLabel: input.periodLabel,
  };
}

/** Mesma conciliação para o Resumo e o Fechamento: parte do modelo de `buildPlanExecution`. */
export function buildWeekReconciliationFromExecution(
  model: Record<string, any>,
  formatDate: (iso: string) => string
): WeekReconciliation {
  const range = (start: string, end: string) =>
    `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`;
  return buildWeekReconciliation({
    capacityMin: model.capacityInformed === false ? 0 : model.capacityMinutes,
    plannedMin: model.plannedMinutes,
    studiedMin: model.studiedMinutes,
    links: model.strategic?.reconciliation,
    periodLabel: model.days.length
      ? range(model.days[0].date, model.days.at(-1).date)
      : 'esta semana',
  });
}
