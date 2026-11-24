import { subjectsBelowMinimum } from '../../domain/exams/simulation-score.js';
import { isSimulationInExamScope } from '../../domain/exams/exam-scope.js';
import { cutoffPercent } from '../../domain/analytics/cutoff-reference.js';
import { addLocalDays } from '../../core/date-utils.js';

type Row = Record<string, any>;

export interface ExamTodaySignals {
  score: {
    available: boolean;
    central: number | null;
    target: number | null;
    /** Pontos percentuais acima (+) ou abaixo (−) da meta. */
    gap: number | null;
    net: boolean;
    /** Nota de corte informada, em % da escala; null sem corte. */
    cutoff: number | null;
    /** Pontos percentuais acima (+) ou abaixo (−) do corte. */
    cutoffGap: number | null;
    /** Faixa projetada (mesmo motor da Projeção); null quando o motor não a fornece. */
    low: number | null;
    high: number | null;
    confidenceLabel: string | null;
    /** Simulados comparáveis por trás da faixa. */
    simulations: number;
    /** Acerto em questões novas dos últimos 30 dias com amostra suficiente; null na prova certo/errado. */
    questionAccuracy: number | null;
  };
  minimum: {
    /** Data do último simulado considerado; null sem simulado com detalhamento. */
    simulationDate: string | null;
    names: string[];
    configured: boolean;
  };
  overdue: number;
}

/**
 * Os três sinais do topo da Visão geral: nota projetada × meta, disciplinas abaixo do
 * mínimo no último simulado e pendências atrasadas.
 */
export function buildExamTodaySignals({
  calibration,
  simulations = [],
  blueprint = {},
  subjects = [],
  overdue = 0,
  questions = [],
  today = null,
}: {
  calibration?: Row | null;
  simulations?: Row[];
  blueprint?: Row;
  subjects?: Row[];
  overdue?: number;
  questions?: Row[];
  today?: string | null;
}): ExamTodaySignals {
  const available =
    Boolean(calibration?.available) && Number.isFinite(Number(calibration?.central));
  const central = available ? Math.round(Number(calibration!.central)) : null;
  const target =
    calibration?.target != null && Number.isFinite(Number(calibration.target))
      ? Math.round(Number(calibration!.target))
      : blueprint.targetScore != null && Number.isFinite(Number(blueprint.targetScore))
        ? Math.round(Number(blueprint.targetScore))
        : null;

  const cutoff = cutoffPercent(blueprint.cutoff);
  const net = blueprint.scoringMode === 'certo-errado';
  const range =
    available &&
    Number.isFinite(Number(calibration!.low)) &&
    Number.isFinite(Number(calibration!.high));

  // Acerto bruto não se compara com nota líquida, por isso só na prova de acerto simples.
  const since = today ? addLocalDays(today, -29) : null;
  let resolved = 0,
    correct = 0;
  if (since && !net)
    for (const q of questions) {
      const date = String(q?.date || '');
      if (q?.retry || date < since || date > today!) continue;
      resolved += Number(q.resolved) || 0;
      correct += Number(q.correct) || 0;
    }
  const questionAccuracy = resolved >= 50 ? Math.round((correct / resolved) * 100) : null;

  const blueprintSubjects: Row[] = blueprint.subjects || [];
  const configured = blueprintSubjects.some(item => Number(item.minScore) > 0);
  const latest = simulations
    .filter(
      sim => sim?.breakdown?.length && isSimulationInExamScope(sim, blueprint.activeExamTags || [])
    )
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];
  const names = new Map<string, string>(subjects.map(s => [s.id, s.name]));
  const misses =
    latest && configured
      ? subjectsBelowMinimum(
          latest,
          blueprintSubjects as Array<{ subjectId: string | null; minScore?: number | null }>
        )
      : [];

  return {
    score: {
      available,
      central,
      target,
      gap: central !== null && target !== null ? central - target : null,
      net,
      cutoff,
      cutoffGap:
        central !== null && cutoff !== null ? Math.round((central - cutoff) * 10) / 10 : null,
      low: range ? Math.round(Number(calibration!.low)) : null,
      high: range ? Math.round(Number(calibration!.high)) : null,
      confidenceLabel: available ? calibration!.confidenceLabel || null : null,
      simulations: available ? (calibration!.observations || []).length : 0,
      questionAccuracy,
    },
    minimum: {
      simulationDate: latest?.date || null,
      names: misses.map(miss => names.get(miss.subjectId) || 'Disciplina removida'),
      configured,
    },
    overdue: Math.max(0, Math.round(Number(overdue) || 0)),
  };
}
