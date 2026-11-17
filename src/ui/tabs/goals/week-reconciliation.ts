export type WeekRecoverability = 'on_track' | 'recoverable' | 'needs_replan';

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
  remainingCapacityMin: number | null;
  pendingPlannedMin: number;
  recoverability: WeekRecoverability | null;
};

const clean = (n: number): number => Math.max(0, Number(n) || 0);

/** Avalia se o saldo pendente de tarefas marcadas cabe na capacidade restante da semana. */
export function assessWeekRecoverability(input: {
  capacityMin: number;
  plannedMin: number;
  studiedMin: number;
  linkedMin: number | null;
  remainingCapacityMin: number | null;
}): { pendingPlannedMin: number; recoverability: WeekRecoverability | null } {
  const capacityMin = clean(input.capacityMin);
  const plannedMin = clean(input.plannedMin);
  const studiedMin = clean(input.studiedMin);
  const executed =
    input.linkedMin === null ? studiedMin : Math.min(clean(input.linkedMin), studiedMin);
  const pendingPlannedMin = Math.max(0, plannedMin - executed);
  if (capacityMin <= 0 || plannedMin <= 0 || input.remainingCapacityMin === null) {
    return { pendingPlannedMin, recoverability: null };
  }
  const remaining = clean(input.remainingCapacityMin);
  if (pendingPlannedMin <= 0) {
    return { pendingPlannedMin: 0, recoverability: 'on_track' };
  }
  return {
    pendingPlannedMin,
    recoverability: pendingPlannedMin <= remaining ? 'recoverable' : 'needs_replan',
  };
}

/** Concilia capacidade, plano e realizado da semana (minutos); só apresentação, sem regra de domínio. */
export function buildWeekReconciliation(input: {
  capacityMin: number;
  plannedMin: number;
  studiedMin: number;
  periodLabel: string;
  remainingCapacityMin?: number | null;
  links?: {
    studiedMinutes: number;
    linkedMinutes: number;
    additionalMinutes: number;
    incompatibleMinutes: number;
    otherPeriodMinutes: number;
  } | null;
}): WeekReconciliation {
  if (!input.periodLabel) throw new Error('periodLabel é obrigatório');
  const capacityMin = clean(input.capacityMin);
  const plannedMin = clean(input.plannedMin);
  const studiedMin = clean(input.studiedMin);
  const linkedMin = input.links ? clean(input.links.linkedMinutes) : null;
  const remainingCapacityMin =
    input.remainingCapacityMin === undefined || input.remainingCapacityMin === null
      ? null
      : clean(input.remainingCapacityMin);
  const { pendingPlannedMin, recoverability } = assessWeekRecoverability({
    capacityMin,
    plannedMin,
    studiedMin,
    linkedMin,
    remainingCapacityMin,
  });
  return {
    capacityMin,
    plannedMin,
    linkedMin,
    unlinkedMin: input.links ? clean(input.links.additionalMinutes) : null,
    incompatibleMin: clean(input.links?.incompatibleMinutes ?? 0),
    otherPeriodMin: clean(input.links?.otherPeriodMinutes ?? 0),
    classifiedStudyMin: input.links ? clean(input.links.studiedMinutes) : null,
    studiedMin,
    multiple: plannedMin > 0 ? studiedMin / plannedMin : null,
    periodLabel: input.periodLabel,
    remainingCapacityMin,
    pendingPlannedMin,
    recoverability,
  };
}

/** Mesma conciliação para o Resumo e o Fechamento: parte do modelo de `buildPlanExecution`. */
export function buildWeekReconciliationFromExecution(
  model: Record<string, any>,
  formatDate: (iso: string) => string
): WeekReconciliation {
  const range = (start: string, end: string) =>
    `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`;
  const days = Array.isArray(model.days) ? model.days : [];
  let remainingCapacityMin: number | null = null;
  if (model.capacityInformed !== false && days.length > 0) {
    const todayIndex = days.reduce(
      (last: number, item: any, idx: number) => (item.future ? last : idx),
      -1
    );
    const todayRemaining =
      todayIndex >= 0
        ? Math.max(
            0,
            (Number(days[todayIndex].capacityMinutes) || 0) -
              (Number(days[todayIndex].studiedMinutes) || 0)
          )
        : 0;
    const futureRemaining = days
      .filter((day: any) => day.future)
      .reduce((sum: number, day: any) => sum + Math.max(0, Number(day.capacityMinutes) || 0), 0);
    remainingCapacityMin = todayRemaining + futureRemaining;
  }
  return buildWeekReconciliation({
    capacityMin: model.capacityInformed === false ? 0 : model.capacityMinutes,
    plannedMin: model.plannedMinutes,
    studiedMin: model.studiedMinutes,
    remainingCapacityMin,
    links: model.strategic?.reconciliation,
    periodLabel: days.length ? range(days[0].date, days.at(-1).date) : 'esta semana',
  });
}
