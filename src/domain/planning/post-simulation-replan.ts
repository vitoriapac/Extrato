export const POST_SIMULATION_REPLAN_VERSION = '2.0.0';
type Row = Record<string, any>;
const n = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : null);
export function buildPostSimulationReplan({
  simulation = null,
  subjects = [],
  minimumQuestions = 5,
  availableMinutes = Infinity,
  existingSimulationIds = [],
}: {
  simulation?: Row | null;
  subjects?: Row[];
  minimumQuestions?: number;
  availableMinutes?: number;
  existingSimulationIds?: string[];
} = {}) {
  const rows = Array.isArray(simulation?.breakdown)
    ? simulation.breakdown.filter((row: Row) => n(row.total) >= minimumQuestions)
    : [];
  if (!simulation || !rows.length)
    return {
      algorithmVersion: POST_SIMULATION_REPLAN_VERSION,
      state: 'insufficient',
      reason: 'É necessário um simulado com detalhamento suficiente por disciplina.',
      adjustments: [] as never[],
      evidence: { rows: rows.length, minimumQuestions },
    };
  const subjectMap = new Map(subjects.map(item => [item.id, item]));
  if (existingSimulationIds.includes(simulation.id))
    return {
      algorithmVersion: POST_SIMULATION_REPLAN_VERSION,
      state: 'duplicate',
      reason: 'Este simulado já possui uma proposta registrada.',
      adjustments: [] as never[],
      simulationId: simulation.id,
    };
  let remaining = Math.max(0, Number(availableMinutes));
  const requested = rows
      .map((row: Row) => {
        const total = n(row.total) || 0,
          correct = n(row.correct) || 0,
          accuracy = Math.round((correct / total) * 100),
          subject = subjectMap.get(row.subjectId),
          requestedMinutes = accuracy < 50 ? 30 : accuracy < 70 ? 15 : 0;
        return {
          subjectId: row.subjectId || null,
          subjectName: subject?.name || 'Disciplina não identificada',
          accuracy,
          requestedMinutes,
          reason: requestedMinutes
            ? `Desempenho de ${accuracy}% no simulado; reforçar questões e revisão.`
            : 'Desempenho sem déficit crítico identificado.',
        };
      })
      .filter(item => item.requestedMinutes > 0)
      .sort((a, b) => a.accuracy - b.accuracy),
    adjustments = requested
      .map(item => {
        const deltaMinutes = Math.min(item.requestedMinutes, remaining);
        remaining -= deltaMinutes;
        return { ...item, deltaMinutes, unallocatedMinutes: item.requestedMinutes - deltaMinutes };
      })
      .filter(item => item.deltaMinutes > 0),
    unallocatedMinutes =
      requested.reduce((sum, item) => sum + item.requestedMinutes, 0) -
      adjustments.reduce((sum, item) => sum + item.deltaMinutes, 0);
  return {
    algorithmVersion: POST_SIMULATION_REPLAN_VERSION,
    state: adjustments.length
      ? 'proposal'
      : requested.length
        ? 'insufficient_capacity'
        : 'balanced',
    simulationId: simulation.id,
    simulationDate: simulation.date,
    adjustments,
    unallocatedMinutes,
    evidence: {
      rows: rows.length,
      minimumQuestions,
      measuredRows: rows.length,
      availableMinutes: Number.isFinite(Number(availableMinutes)) ? Number(availableMinutes) : null,
    },
    message: adjustments.length
      ? 'Proposta aguardando confirmação explícita.'
      : requested.length
        ? 'Sem capacidade disponível para redistribuição.'
        : 'O simulado não indica redistribuição imediata.',
  };
}
