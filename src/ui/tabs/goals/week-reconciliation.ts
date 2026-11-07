export type WeekReconciliation = {
  capacityMin: number;
  plannedMin: number;
  offPlanMin: number;
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
}): WeekReconciliation {
  if (!input.periodLabel) throw new Error('periodLabel é obrigatório');
  const plannedMin = clean(input.plannedMin);
  const studiedMin = clean(input.studiedMin);
  return {
    capacityMin: clean(input.capacityMin),
    plannedMin,
    offPlanMin: Math.max(0, studiedMin - plannedMin),
    studiedMin,
    multiple: plannedMin > 0 ? studiedMin / plannedMin : null,
    periodLabel: input.periodLabel,
  };
}
