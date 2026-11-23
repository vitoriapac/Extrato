import { subjectsBelowMinimum } from '../../domain/exams/simulation-score.js';
import { isSimulationInExamScope } from '../../domain/exams/exam-scope.js';

type Row = Record<string, any>;

export interface ExamTodaySignals {
  score: {
    available: boolean;
    central: number | null;
    target: number | null;
    /** Pontos percentuais acima (+) ou abaixo (−) da meta. */
    gap: number | null;
    net: boolean;
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
}: {
  calibration?: Row | null;
  simulations?: Row[];
  blueprint?: Row;
  subjects?: Row[];
  overdue?: number;
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
      net: blueprint.scoringMode === 'certo-errado',
    },
    minimum: {
      simulationDate: latest?.date || null,
      names: misses.map(miss => names.get(miss.subjectId) || 'Disciplina removida'),
      configured,
    },
    overdue: Math.max(0, Math.round(Number(overdue) || 0)),
  };
}
