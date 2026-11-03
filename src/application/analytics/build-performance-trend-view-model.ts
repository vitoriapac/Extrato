import { addLocalDays } from '../../core/date-utils.js';
import { formatDecimal } from '../../core/format-number.js';

export interface PerformanceTrendPoint {
  date: string;
  label: string;
  questionAccuracy: number | null;
  questionResolved: number;
  simulationScore: number | null;
  simulationName?: string;
}

export interface PerformanceTrendViewModel {
  hasData: boolean;
  questionAccuracy: number | null;
  totalResolved: number;
  totalCorrect: number;
  simulationLatest: number | null;
  simulationMean: number | null;
  simulationCount: number;
  targetScore: number;
  gap: number | null;
  status: 'ok' | 'attention' | 'insufficient';
  points: PerformanceTrendPoint[];
  summaryText: string;
}

export function buildPerformanceTrendViewModel(
  state: any,
  today: string
): PerformanceTrendViewModel {
  const targetScore = Number(state?.metas?.metaAprovacao) || 80;
  const questoes = Array.isArray(state?.questoes) ? state.questoes : [];
  const simulados = Array.isArray(state?.simulados) ? state.simulados : [];

  // Filtrar questões válidas até hoje
  const validQuestoes = questoes.filter((q: any) => {
    return q && q.date && q.date <= today && Number(q.resolved) > 0;
  });

  // Filtrar simulados válidos até hoje ordenados por data
  const validSimulados = simulados
    .filter((s: any) => {
      return s && s.date && s.date <= today && Number(s.total) > 0;
    })
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  const totalResolved = validQuestoes.reduce(
    (sum: number, q: any) => sum + (Number(q.resolved) || 0),
    0
  );
  const totalCorrect = validQuestoes.reduce(
    (sum: number, q: any) => sum + (Number(q.correct) || 0),
    0
  );
  const questionAccuracy =
    totalResolved > 0 ? Math.round((totalCorrect / totalResolved) * 1000) / 10 : null;

  const simScores = validSimulados.map(
    (s: any) => Math.round((Number(s.correct) / Number(s.total)) * 1000) / 10
  );
  const simulationLatest = simScores.length > 0 ? simScores[simScores.length - 1] : null;
  const simulationMean =
    simScores.length > 0
      ? Math.round((simScores.reduce((a: number, b: number) => a + b, 0) / simScores.length) * 10) / 10
      : null;
  const simulationCount = validSimulados.length;

  const hasData = totalResolved > 0 || simulationCount > 0;

  // Montar 8 buckets semanais terminando na data atual
  const WEEKS_COUNT = 8;
  const points: PerformanceTrendPoint[] = [];

  for (let w = WEEKS_COUNT - 1; w >= 0; w--) {
    const endDaysAgo = w * 7;
    const startDaysAgo = endDaysAgo + 6;
    const startDate = addLocalDays(today, -startDaysAgo) || today;
    const endDate = addLocalDays(today, -endDaysAgo) || today;

    // Questões resolvidas no período da semana
    const weekQuestions = validQuestoes.filter(
      (q: any) => q.date >= startDate && q.date <= endDate
    );
    const weekResolved = weekQuestions.reduce(
      (sum: number, q: any) => sum + (Number(q.resolved) || 0),
      0
    );
    const weekCorrect = weekQuestions.reduce(
      (sum: number, q: any) => sum + (Number(q.correct) || 0),
      0
    );
    const weekAccuracy =
      weekResolved > 0 ? Math.round((weekCorrect / weekResolved) * 1000) / 10 : null;

    // Simulados realizados no período da semana
    const weekSims = validSimulados.filter((s: any) => s.date >= startDate && s.date <= endDate);
    let simScore: number | null = null;
    let simName: string | undefined;
    if (weekSims.length > 0) {
      const latestSim = weekSims[weekSims.length - 1];
      simScore = Math.round((Number(latestSim.correct) / Number(latestSim.total)) * 1000) / 10;
      simName = latestSim.nome || 'Simulado';
    }

    const [, m, d] = endDate.split('-');
    const label = `${d}/${m}`;

    points.push({
      date: endDate,
      label,
      questionAccuracy: weekAccuracy,
      questionResolved: weekResolved,
      simulationScore: simScore,
      simulationName: simName,
    });
  }

  // Avaliação do rendimento frente à meta
  const benchmarkScore = simulationLatest ?? questionAccuracy;
  const gap = benchmarkScore != null ? Math.round((benchmarkScore - targetScore) * 10) / 10 : null;
  const status: 'ok' | 'attention' | 'insufficient' =
    benchmarkScore == null ? 'insufficient' : benchmarkScore >= targetScore ? 'ok' : 'attention';

  let summaryText = 'Sem registros suficientes para calcular a tendência.';
  if (benchmarkScore != null) {
    if (gap != null && gap >= 0) {
      summaryText = `Rendimento recente de ${formatDecimal(benchmarkScore)}% alinhado à meta de ${formatDecimal(targetScore)}%.`;
    } else {
      summaryText = `Rendimento recente de ${formatDecimal(benchmarkScore)}% está ${formatDecimal(Math.abs(gap!))} p.p. abaixo da meta de ${formatDecimal(targetScore)}%.`;
    }
  }

  return {
    hasData,
    questionAccuracy,
    totalResolved,
    totalCorrect,
    simulationLatest,
    simulationMean,
    simulationCount,
    targetScore,
    gap,
    status,
    points,
    summaryText,
  };
}
