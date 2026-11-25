import {
  blocksBelowMinimum,
  scorePercent,
  type ScoredSimulation,
  type WeightedBlueprintSubject,
} from '../exams/simulation-score.js';
import type { ExamBlockConfig } from '../../core/types.ts';

export const POST_SIMULATION_REPLAN_VERSION = '2.1.0';
type Row = Record<string, any>;
const n = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : null);

export function buildPostSimulationReplan({
  simulation = null,
  subjects = [],
  blueprintSubjects = [],
  blocks = [],
  minimumQuestions = 5,
  availableMinutes = Infinity,
  existingSimulationIds = [],
}: {
  simulation?: Row | null;
  subjects?: Row[];
  blueprintSubjects?: WeightedBlueprintSubject[];
  blocks?: ExamBlockConfig[];
  minimumQuestions?: number;
  availableMinutes?: number;
  existingSimulationIds?: string[];
} = {}) {
  const rows = Array.isArray(simulation?.breakdown)
    ? simulation!.breakdown.filter((row: Row) => (n(row.total) ?? 0) >= minimumQuestions)
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
  const blueprintMap = new Map(
    (blueprintSubjects || []).filter(item => item?.subjectId).map(item => [item.subjectId as string, item])
  );
  const failedBlockIds = new Set(
    blocksBelowMinimum((simulation || {}) as ScoredSimulation, blocks, blueprintSubjects).map(
      miss => miss.blockId
    )
  );
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
        const accuracy = Math.round(scorePercent(row, simulation.scoring)),
          subject = subjectMap.get(row.subjectId),
          bp = row.subjectId ? blueprintMap.get(row.subjectId) : undefined,
          weight = Math.max(0.1, Number(bp?.questionWeight ?? 1) || 1),
          belowSubjectMin =
            bp?.minScore != null && Number(bp.minScore) > 0 && accuracy < Number(bp.minScore),
          belowBlockMin = Boolean(bp?.blockId && failedBlockIds.has(bp.blockId)),
          belowMinimum = belowSubjectMin || belowBlockMin,
          requestedMinutes = accuracy < 50 || belowMinimum ? 30 : accuracy < 70 ? 15 : 0,
          weightedLoss = (100 - accuracy) * weight;
        return {
          subjectId: row.subjectId || null,
          subjectName: subject?.name || 'Disciplina não identificada',
          accuracy,
          belowMinimum,
          weightedLoss,
          requestedMinutes,
          reason: belowMinimum
            ? `Abaixo do mínimo eliminatório (${accuracy}%) no simulado; priorizar recuperação.`
            : requestedMinutes
              ? `Desempenho de ${accuracy}% no simulado; reforçar questões e revisão.`
              : 'Desempenho sem déficit crítico identificado.',
        };
      })
      .filter(item => item.requestedMinutes > 0)
      .sort(
        (a, b) =>
          Number(b.belowMinimum) - Number(a.belowMinimum) ||
          b.weightedLoss - a.weightedLoss ||
          a.accuracy - b.accuracy
      ),
    adjustments = requested
      .map(({ belowMinimum: _b, weightedLoss: _w, ...item }) => {
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
        ? 'Sem capacidade livre na semana para somar os minutos extras deste simulado. O saldo pendente das tarefas da semana é outro cálculo, em Planejamento.'
        : 'O simulado não indica redistribuição imediata.',
  };
}
