export type DayReconciliationRow = {
  key: 'available' | 'planned' | 'executed' | 'overrun' | 'free';
  label: string;
  minutes: number;
};

export type DayReconciliation = {
  rows: DayReconciliationRow[];
  overrunMinutes: number;
  status: 'within' | 'over' | 'no-availability';
};

const clean = (n: number): number => Math.max(0, Number(n) || 0);

/** Concilia disponibilidade, plano e estudo do dia (minutos; sem formatação de texto). */
export function buildDayReconciliation(input: { available: number; planned: number; executed: number }): DayReconciliation {
  const available = clean(input.available);
  const planned = clean(input.planned);
  const executed = clean(input.executed);
  const rows: DayReconciliationRow[] = [
    { key: 'available', label: 'Disponível', minutes: available },
    { key: 'planned', label: 'Planejado', minutes: planned },
    { key: 'executed', label: 'Estudado', minutes: executed },
  ];
  if (available === 0) return { rows, overrunMinutes: 0, status: 'no-availability' };
  const overrunMinutes = Math.max(0, planned - available);
  if (overrunMinutes > 0) {
    rows.push({ key: 'overrun', label: 'Excedente', minutes: overrunMinutes });
    return { rows, overrunMinutes, status: 'over' };
  }
  rows.push({ key: 'free', label: 'Livre', minutes: available - Math.max(planned, executed) > 0 ? available - Math.max(planned, executed) : 0 });
  return { rows, overrunMinutes: 0, status: 'within' };
}
