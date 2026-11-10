/**
 * @fileoverview Benchmarks estatísticos determinísticos de ritmo de aprovados por carreira.
 * Fornece parâmetros médios consolidados de horas líquidas, volume de questões, precisão
 * e distribuição de tempo (mix) para que o concurseiro compare seu ritmo com total privacidade local.
 */

export type CareerClusterId =
  | 'fiscal-controle'
  | 'policial'
  | 'tribunais-juridica'
  | 'bancaria-administrativa'
  | 'geral';

export interface CareerBenchmark {
  readonly id: CareerClusterId;
  readonly name: string;
  readonly description: string;
  readonly weeklyHours: {
    readonly minimum: number;
    readonly competitiveMin: number;
    readonly competitiveMax: number;
    readonly advanced: number;
  };
  readonly targetAccuracy: {
    readonly construction: number;
    readonly consolidation: number;
    readonly finalStretch: number;
  };
  readonly weeklyQuestions: {
    readonly minimum: number;
    readonly competitiveMin: number;
    readonly competitiveMax: number;
    readonly advanced: number;
  };
  readonly targetMix: {
    readonly theoryPercent: number;
    readonly questionsPercent: number;
    readonly reviewPercent: number;
  };
}

export type BenchmarkStatus = 'insufficient' | 'building' | 'competitive' | 'advanced';

export interface BenchmarkMetricComparison {
  readonly metric: 'weeklyHours' | 'weeklyQuestions' | 'accuracy';
  readonly label: string;
  readonly unit: string;
  readonly currentValue: number;
  readonly targetMin: number;
  readonly targetMax: number;
  readonly status: BenchmarkStatus;
  readonly statusLabel: string;
  readonly commentary: string;
  readonly progressPercent: number; // 0 a 100 para régua visual
}

export interface CareerBenchmarkComparisonResult {
  readonly career: CareerBenchmark;
  readonly periodLabel: string;
  readonly weeklyHours: BenchmarkMetricComparison;
  readonly weeklyQuestions: BenchmarkMetricComparison;
  readonly accuracy: BenchmarkMetricComparison;
  readonly measuredMix: {
    readonly theoryPercent: number;
    readonly questionsPercent: number;
    readonly reviewPercent: number;
  };
  readonly overallStatus: BenchmarkStatus;
  readonly overallLabel: string;
  readonly guidanceNote: string;
}

export const CAREER_BENCHMARKS: Readonly<Record<CareerClusterId, CareerBenchmark>> = Object.freeze({
  'fiscal-controle': Object.freeze({
    id: 'fiscal-controle',
    name: 'Fiscal & Controle',
    description: 'Receita Federal, SEFAZ, TCU, TCE, CGU e Auditorias Fiscais',
    weeklyHours: Object.freeze({
      minimum: 18,
      competitiveMin: 24,
      competitiveMax: 32,
      advanced: 36,
    }),
    targetAccuracy: Object.freeze({
      construction: 72,
      consolidation: 80,
      finalStretch: 86,
    }),
    weeklyQuestions: Object.freeze({
      minimum: 180,
      competitiveMin: 220,
      competitiveMax: 320,
      advanced: 380,
    }),
    targetMix: Object.freeze({
      theoryPercent: 25,
      questionsPercent: 55,
      reviewPercent: 20,
    }),
  }),
  'policial': Object.freeze({
    id: 'policial',
    name: 'Policial & Segurança',
    description: 'Polícia Federal, PRF, Polícias Civis, Militares e Penais',
    weeklyHours: Object.freeze({
      minimum: 15,
      competitiveMin: 20,
      competitiveMax: 26,
      advanced: 30,
    }),
    targetAccuracy: Object.freeze({
      construction: 68,
      consolidation: 76,
      finalStretch: 82,
    }),
    weeklyQuestions: Object.freeze({
      minimum: 140,
      competitiveMin: 180,
      competitiveMax: 260,
      advanced: 320,
    }),
    targetMix: Object.freeze({
      theoryPercent: 30,
      questionsPercent: 50,
      reviewPercent: 20,
    }),
  }),
  'tribunais-juridica': Object.freeze({
    id: 'tribunais-juridica',
    name: 'Tribunais & Jurídica',
    description: 'TJ, TRT, TRF, MPU, Defensoria Pública e Analista/Técnico Judiciário',
    weeklyHours: Object.freeze({
      minimum: 16,
      competitiveMin: 22,
      competitiveMax: 28,
      advanced: 32,
    }),
    targetAccuracy: Object.freeze({
      construction: 70,
      consolidation: 80,
      finalStretch: 87,
    }),
    weeklyQuestions: Object.freeze({
      minimum: 160,
      competitiveMin: 200,
      competitiveMax: 280,
      advanced: 340,
    }),
    targetMix: Object.freeze({
      theoryPercent: 25,
      questionsPercent: 55,
      reviewPercent: 20,
    }),
  }),
  'bancaria-administrativa': Object.freeze({
    id: 'bancaria-administrativa',
    name: 'Bancária & Administrativa',
    description: 'Caixa Econômica, Banco do Brasil, INSS, CNU e Agências Reguladoras',
    weeklyHours: Object.freeze({
      minimum: 12,
      competitiveMin: 18,
      competitiveMax: 24,
      advanced: 28,
    }),
    targetAccuracy: Object.freeze({
      construction: 70,
      consolidation: 78,
      finalStretch: 84,
    }),
    weeklyQuestions: Object.freeze({
      minimum: 120,
      competitiveMin: 160,
      competitiveMax: 220,
      advanced: 280,
    }),
    targetMix: Object.freeze({
      theoryPercent: 35,
      questionsPercent: 45,
      reviewPercent: 20,
    }),
  }),
  'geral': Object.freeze({
    id: 'geral',
    name: 'Concursos Gerais',
    description: 'Concursos municipais, estaduais, conselhos e cargos gerais',
    weeklyHours: Object.freeze({
      minimum: 14,
      competitiveMin: 20,
      competitiveMax: 26,
      advanced: 30,
    }),
    targetAccuracy: Object.freeze({
      construction: 70,
      consolidation: 78,
      finalStretch: 85,
    }),
    weeklyQuestions: Object.freeze({
      minimum: 140,
      competitiveMin: 180,
      competitiveMax: 250,
      advanced: 300,
    }),
    targetMix: Object.freeze({
      theoryPercent: 30,
      questionsPercent: 50,
      reviewPercent: 20,
    }),
  }),
});

/**
 * Detecta a carreira provável com base no concurso ativo ou disciplinas do estudante.
 */
export function detectCareerCluster(state: any): CareerClusterId {
  const activeTags = (state?.examBlueprint?.activeExamTags || []).map((t: any) => String(t).toLowerCase());
  const presetId = String(state?.uiState?.onboarding?.presetId || state?.presetId || '').toLowerCase();
  const subjects = (state?.subjects || []).map((s: any) => String(s.name || '').toLowerCase());
  const customTitle = String(state?.examBlueprint?.customTitle || '').toLowerCase();

  const combinedText = `${presetId} ${customTitle} ${subjects.join(' ')}`;

  if (
    activeTags.includes('bb') ||
    activeTags.includes('caixa') ||
    activeTags.includes('caixa-ti') ||
    combinedText.includes('caixa') ||
    combinedText.includes('bancari') ||
    combinedText.includes('banco do brasil') ||
    combinedText.includes('inss')
  ) {
    return 'bancaria-administrativa';
  }

  if (
    combinedText.includes('policia') ||
    combinedText.includes('polícia') ||
    combinedText.includes('prf') ||
    combinedText.includes('penal') ||
    combinedText.includes('segurança pública')
  ) {
    return 'policial';
  }

  if (
    combinedText.includes('fiscal') ||
    combinedText.includes('receita') ||
    combinedText.includes('tcu') ||
    combinedText.includes('tce') ||
    combinedText.includes('auditor') ||
    combinedText.includes('sefaz')
  ) {
    return 'fiscal-controle';
  }

  if (
    combinedText.includes('tribunal') ||
    combinedText.includes('trf') ||
    combinedText.includes('trt') ||
    combinedText.includes('tjsp') ||
    combinedText.includes('judiciari') ||
    combinedText.includes('judiciári') ||
    combinedText.includes('magistratura')
  ) {
    return 'tribunais-juridica';
  }

  return 'geral';
}

export interface MetricAggregates {
  readonly studiedHours: number;
  readonly resolvedQuestions: number;
  readonly accuracyPercent: number | null;
  readonly theoryMinutes: number;
  readonly questionsMinutes: number;
  readonly reviewMinutes: number;
}

/**
 * Agrega sessões e questões nos últimos N dias a partir de uma data de referência (YYYY-MM-DD).
 */
export function aggregateRecentActivity(
  sessions: any[] = [],
  questions: any[] = [],
  {
    todayISO = new Date().toISOString().slice(0, 10),
    daysWindow = 7,
  }: { todayISO?: string; daysWindow?: number } = {}
): MetricAggregates {
  const windowStart = new Date(todayISO);
  windowStart.setDate(windowStart.getDate() - daysWindow + 1);
  const windowStartISO = windowStart.toISOString().slice(0, 10);

  let totalMinutes = 0;
  let theoryMinutes = 0;
  let questionsMinutes = 0;
  let reviewMinutes = 0;

  for (const session of sessions) {
    const sessionDate = session.date || session.occurredAt?.slice(0, 10);
    if (!sessionDate || sessionDate < windowStartISO || sessionDate > todayISO) {
      continue;
    }
    const mins = Number(session.durationMinutes) || (Number(session.durationSeconds) || 0) / 60;
    totalMinutes += mins;

    const type = session.type || 'study';
    if (type === 'questions') {
      questionsMinutes += mins;
    } else if (type === 'review' || type === 'simulation') {
      reviewMinutes += mins;
    } else {
      theoryMinutes += mins;
    }
  }

  let totalQuestions = 0;
  let correctQuestions = 0;

  for (const q of questions) {
    const qDate = q.date || q.createdAt?.slice(0, 10);
    if (!qDate || qDate < windowStartISO || qDate > todayISO) {
      continue;
    }
    const total = Number(q.resolved || q.total || q.quantidade) || 0;
    const correct = Number(q.correct || q.acertos) || 0;
    totalQuestions += total;
    correctQuestions += correct;
  }

  // Se não houver questões nos últimos 7 dias, estende a janela de precisão para 28 dias
  let accuracyPercent: number | null =
    totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : null;

  if (accuracyPercent === null) {
    const extendedStart = new Date(todayISO);
    extendedStart.setDate(extendedStart.getDate() - 28 + 1);
    const extendedStartISO = extendedStart.toISOString().slice(0, 10);

    let extendedTotal = 0;
    let extendedCorrect = 0;
    for (const q of questions) {
      const qDate = q.date || q.createdAt?.slice(0, 10);
      if (qDate && qDate >= extendedStartISO && qDate <= todayISO) {
        extendedTotal += Number(q.resolved || q.total || q.quantidade) || 0;
        extendedCorrect += Number(q.correct || q.acertos) || 0;
      }
    }
    if (extendedTotal > 0) {
      accuracyPercent = Math.round((extendedCorrect / extendedTotal) * 100);
    }
  }

  return {
    studiedHours: Math.round((totalMinutes / 60) * 10) / 10,
    resolvedQuestions: totalQuestions,
    accuracyPercent,
    theoryMinutes,
    questionsMinutes,
    reviewMinutes,
  };
}

/**
 * Compara os dados reais medidos do estudante contra o benchmark da carreira escolhida.
 */
export function calculateCareerBenchmarkComparison(
  aggregates: MetricAggregates,
  careerId: CareerClusterId = 'geral'
): CareerBenchmarkComparisonResult {
  const career = CAREER_BENCHMARKS[careerId] || CAREER_BENCHMARKS.geral;

  // 1. Horas Semanais
  const hours = aggregates.studiedHours;
  let hoursStatus: BenchmarkStatus = 'insufficient';
  let hoursStatusLabel = 'Abaixo do Mínimo';
  let hoursCommentary = 'Abaixo da faixa mínima de referência; pode ser fase inicial ou semana atípica.';

  if (hours >= career.weeklyHours.advanced) {
    hoursStatus = 'advanced';
    hoursStatusLabel = 'Ritmo Avançado';
    hoursCommentary = 'Carga horária na faixa avançada de referência.';
  } else if (hours >= career.weeklyHours.competitiveMin) {
    hoursStatus = 'competitive';
    hoursStatusLabel = 'Faixa Competitiva';
    hoursCommentary = 'Volume semanal dentro da faixa de referência.';
  } else if (hours >= career.weeklyHours.minimum) {
    hoursStatus = 'building';
    hoursStatusLabel = 'Fase de Construção';
    hoursCommentary = 'Entre o mínimo e a faixa competitiva de referência.';
  }

  const hoursProgress = Math.min(100, Math.round((hours / career.weeklyHours.advanced) * 100));

  const weeklyHoursComparison: BenchmarkMetricComparison = Object.freeze({
    metric: 'weeklyHours',
    label: 'Horas Líquidas Semanais',
    unit: 'h/sem',
    currentValue: hours,
    targetMin: career.weeklyHours.competitiveMin,
    targetMax: career.weeklyHours.competitiveMax,
    status: hoursStatus,
    statusLabel: hoursStatusLabel,
    commentary: hoursCommentary,
    progressPercent: hoursProgress,
  });

  // 2. Volume de Questões
  const questions = aggregates.resolvedQuestions;
  let qStatus: BenchmarkStatus = 'insufficient';
  let qStatusLabel = 'Abaixo do Mínimo';
  let qCommentary = 'Volume de questões abaixo da faixa mínima de referência nesta semana.';

  if (questions >= career.weeklyQuestions.advanced) {
    qStatus = 'advanced';
    qStatusLabel = 'Volume Avançado';
    qCommentary = 'Volume na faixa avançada de referência. Vale conferir se há tempo para revisar os erros.';
  } else if (questions >= career.weeklyQuestions.competitiveMin) {
    qStatus = 'competitive';
    qStatusLabel = 'Faixa Competitiva';
    qCommentary = 'Volume dentro da faixa competitiva de referência.';
  } else if (questions >= career.weeklyQuestions.minimum) {
    qStatus = 'building';
    qStatusLabel = 'Fase de Construção';
    qCommentary = 'Entre o mínimo e a faixa competitiva de referência.';
  }

  const qProgress = Math.min(100, Math.round((questions / career.weeklyQuestions.advanced) * 100));

  const weeklyQuestionsComparison: BenchmarkMetricComparison = Object.freeze({
    metric: 'weeklyQuestions',
    label: 'Volume de Questões Semanais',
    unit: 'questões/sem',
    currentValue: questions,
    targetMin: career.weeklyQuestions.competitiveMin,
    targetMax: career.weeklyQuestions.competitiveMax,
    status: qStatus,
    statusLabel: qStatusLabel,
    commentary: qCommentary,
    progressPercent: qProgress,
  });

  // 3. Precisão (% de acertos)
  const accuracy = aggregates.accuracyPercent ?? 0;
  let accStatus: BenchmarkStatus = 'insufficient';
  let accStatusLabel = aggregates.accuracyPercent === null ? 'Sem Amostra' : 'Abaixo do Alvo';
  let accCommentary = 'Resolva mais questões para calibrar a precisão média por disciplina.';

  if (aggregates.accuracyPercent !== null) {
    if (accuracy >= career.targetAccuracy.finalStretch) {
      accStatus = 'advanced';
      accStatusLabel = 'Nível Reta Final';
      accCommentary = 'Precisão acima de 85%! Padrão de nota de corte para as primeiras colocações.';
    } else if (accuracy >= career.targetAccuracy.consolidation) {
      accStatus = 'competitive';
      accStatusLabel = 'Faixa Competitiva';
      accCommentary = 'Precisão sólida. Excelente aproveitamento nos temas centrais do edital.';
    } else if (accuracy >= career.targetAccuracy.construction) {
      accStatus = 'building';
      accStatusLabel = 'Fase de Construção';
      accCommentary = 'Taxa de acertos saudável para quem está construindo a base teórica.';
    }
  }

  const accProgress = Math.min(100, Math.round(accuracy));

  const accuracyComparison: BenchmarkMetricComparison = Object.freeze({
    metric: 'accuracy',
    label: 'Precisão em Questões',
    unit: '%',
    currentValue: accuracy,
    targetMin: career.targetAccuracy.consolidation,
    targetMax: career.targetAccuracy.finalStretch,
    status: accStatus,
    statusLabel: accStatusLabel,
    commentary: accCommentary,
    progressPercent: accProgress,
  });

  // 4. Mix de Estudo
  const totalStudyMins =
    aggregates.theoryMinutes + aggregates.questionsMinutes + aggregates.reviewMinutes;
  const theoryPercent =
    totalStudyMins > 0 ? Math.round((aggregates.theoryMinutes / totalStudyMins) * 100) : 0;
  const questionsPercent =
    totalStudyMins > 0 ? Math.round((aggregates.questionsMinutes / totalStudyMins) * 100) : 0;
  const reviewPercent =
    totalStudyMins > 0
      ? Math.max(0, 100 - theoryPercent - questionsPercent)
      : 0;

  // 5. Status Geral
  const statusScores: Record<BenchmarkStatus, number> = {
    insufficient: 0,
    building: 1,
    competitive: 2,
    advanced: 3,
  };

  const avgScore =
    (statusScores[hoursStatus] + statusScores[qStatus] + statusScores[accStatus]) / 3;

  let overallStatus: BenchmarkStatus = 'insufficient';
  let overallLabel = 'Construindo Consistência';
  let guidanceNote =
    'Seu foco no momento deve ser a regularidade. Mesmo 1h a 2h diárias bem cumpridas garantem evolução sólida.';

  if (avgScore >= 2.3) {
    overallStatus = 'advanced';
    overallLabel = 'Ritmo Avançado de Aprovado';
    guidanceNote =
      'Seu ritmo está entre os mais altos da categoria. Mantenha os simulados periódicos e preserve o sono e o descanso.';
  } else if (avgScore >= 1.6) {
    overallStatus = 'competitive';
    overallLabel = 'Ritmo Competitivo de Aprovação';
    guidanceNote =
      'Parabéns! Seus indicadores de horas, questões e precisão convergem para a média dos aprovados nesta carreira.';
  } else if (avgScore >= 0.8) {
    overallStatus = 'building';
    overallLabel = 'Fase de Construção de Base';
    guidanceNote =
      'Você está no caminho certo. Pequenos ajustes de 20 minutos a mais de questões por dia aceleram sua prontidão.';
  }

  return Object.freeze({
    career,
    periodLabel: 'Últimos 7 dias',
    weeklyHours: weeklyHoursComparison,
    weeklyQuestions: weeklyQuestionsComparison,
    accuracy: accuracyComparison,
    measuredMix: Object.freeze({
      theoryPercent,
      questionsPercent,
      reviewPercent,
    }),
    overallStatus,
    overallLabel,
    guidanceNote,
  });
}
