const sum = (items: any[], selector: (item: any) => unknown) =>
  items.reduce((total: any, item: any) => total + (Number(selector(item)) || 0), 0);
import { summarizeRecommendationHistory } from '../application/recommendations/recommendation-history.js';
import { buildRecommendationOutcomeAudit } from '../application/recommendations/build-recommendation-outcome-audit.js';
import { addLocalDays } from '../core/date-utils.js';
import { buildExamReportSummary } from './exam-report-summary.js';
import { buildReportWeeklyFocus } from './weekly-focus-summary.js';
import { readinessHistoryForScope } from '../application/analytics/readiness-history.js';
import { buildWeeklyClose } from '../domain/analytics/weekly-close.js';
const shiftDate = (iso: string, days: number) => addLocalDays(iso, days);
const inPeriod = (item: Record<string, any>, start: string, end: string) => {
  const date = item.date || String(item.endedAt || item.createdAt || '').slice(0, 10);
  return Boolean(date && date >= start && date <= end);
};
const reportToday = (generatedAt: string | null | undefined) => {
  const dateOnly = String(generatedAt || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  const timestampDate = localDateFromTimestamp(generatedAt);
  if (timestampDate) return timestampDate;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
export function resolveReportPeriod({
  preset = '30',
  start = null,
  end = null,
  generatedAt,
}: any = {}) {
  const today = reportToday(generatedAt);
  if (preset === 'custom' && start && end && start <= end)
    return { preset, start, end, label: `${start} a ${end}` };
  const days = Math.max(1, Number(preset) || 30);
  return {
    preset: String(days),
    start: shiftDate(today, -(days - 1)),
    end: today,
    label: `Últimos ${days} dias`,
  };
}
export function buildStrategicReport({
  state,
  generatedAt,
  isDemo = false,
  readiness = null,
  diagnosis = null,
  forecast = null,
  period,
  candidates = [],
}: any = {}) {
  const range = resolveReportPeriod({ ...period, generatedAt }),
    activeExamTags = state.examBlueprint?.activeExamTags || [],
    subjects = (state.subjects || []).filter(
      (item: any) =>
        !item.archived &&
        (item.topics || []).some(
          (topic: any) => !topic.archived && isTopicInExamScope(topic, activeExamTags)
        )
    ),
    topics = subjects.flatMap((subject: any) =>
      (subject.topics || []).filter(
        (item: any) => !item.archived && isTopicInExamScope(item, activeExamTags)
      )
    );
  const examDate = state.examDate || state.examBlueprint?.examDate || null,
    localToday = reportToday(generatedAt),
    daysToExam = examDate ? Math.max(0, localDateRange(localToday, examDate).length - 1) : null,
    examPhase = resolveExamPhase(daysToExam);
  const allSessions = (state.studySessions || []).filter((item: any) =>
      inPeriod(item, range.start, range.end)
    ),
    allQuestions = (state.questoes || []).filter((item: any) =>
      inPeriod(item, range.start, range.end)
    ),
    simulations = (state.simulados || []).filter(
      (item: any) =>
        inPeriod(item, range.start, range.end) && isSimulationInExamScope(item, activeExamTags)
    ),
    allReviews = (state.reviewAgenda || []).filter((item: any) =>
      inPeriod(item, range.start, range.end)
    ),
    evidenceScope = resolveExamEvidenceScope({
      subjects: state.subjects || [],
      activeExamTags,
      sessions: allSessions,
      questions: allQuestions,
      reviews: allReviews,
    }),
    sessions = evidenceScope.sessions.included,
    questions = evidenceScope.questions.included,
    reviews = evidenceScope.reviews.included;
  const completedReviewEvidence = (state.reviewAgenda || [])
      .filter((item: any) => item.status === 'Concluído' && item.completedAt)
      .map((item: any) => ({ ...item, date: localDateFromTimestamp(item.completedAt) })),
    currentCompletedScope = resolveExamEvidenceScope({
      subjects: state.subjects || [],
      activeExamTags,
      sessions: [],
      questions: [],
      reviews: completedReviewEvidence.filter((item: any) =>
        inPeriod(item, range.start, range.end)
      ),
    });
  const periodLength = Math.max(1, localDateRange(range.start, range.end).length),
    previousStart = shiftDate(range.start, -periodLength),
    previousEnd = shiftDate(range.start, -1),
    previousScope = resolveExamEvidenceScope({
      subjects: state.subjects || [],
      activeExamTags,
      sessions: (state.studySessions || []).filter((item: any) =>
        inPeriod(item, previousStart!, previousEnd!)
      ),
      questions: (state.questoes || []).filter((item: any) =>
        inPeriod(item, previousStart!, previousEnd!)
      ),
      reviews: completedReviewEvidence.filter((item: any) =>
        inPeriod(item, previousStart!, previousEnd!)
      ),
    }),
    previousQuestionCount = sum(
      previousScope.questions.included,
      (item: Record<string, any>) => item.resolved
    ),
    currentQuestionCount = sum(questions, (item: Record<string, any>) => item.resolved);
  const comparison = buildPeriodComparison({
    period: {
      current: { start: range.start, end: range.end, label: range.label },
      previous: { start: previousStart, end: previousEnd, label: 'Período anterior' },
    },
    current: {
      minutes: Math.round(sum(sessions, (item: Record<string, any>) => item.durationSeconds) / 60),
      questions: currentQuestionCount,
      accuracy: currentQuestionCount
        ? Math.round(
            (sum(questions, (item: Record<string, any>) => item.correct) / currentQuestionCount) *
              100
          )
        : null,
      reviews: currentCompletedScope.reviews.included.length,
    },
    previous: {
      minutes: Math.round(
        sum(previousScope.sessions.included, (item: Record<string, any>) => item.durationSeconds) /
          60
      ),
      questions: previousQuestionCount,
      accuracy: previousQuestionCount
        ? Math.round(
            (sum(previousScope.questions.included, (item: Record<string, any>) => item.correct) /
              previousQuestionCount) *
              100
          )
        : null,
      reviews: previousScope.reviews.included.length,
    },
  });
  const comparisonInsights = buildPeriodComparisonInsights(comparison, {
    currentQuestionVolume: currentQuestionCount,
    previousQuestionVolume: previousQuestionCount,
  });
  const resolved = sum(questions, (item: Record<string, any>) => item.resolved),
    correct = sum(questions, (item: Record<string, any>) => item.correct),
    studySeconds = sum(sessions, (item: Record<string, any>) => item.durationSeconds),
    unscopedStudySeconds = sum(
      evidenceScope.sessions.excluded,
      (item: Record<string, any>) => item.durationSeconds
    ),
    unscopedResolved = sum(
      evidenceScope.questions.excluded,
      (item: Record<string, any>) => item.resolved
    ),
    simulationTotal = sum(simulations, (item: Record<string, any>) => item.total),
    simulationCorrect = sum(simulations, (item: Record<string, any>) => item.correct),
    activePlan = [...(state.studyPlans || [])].reverse().find(item => !item.undoneAt) || null,
    adjustments = (state.planAdjustments || []).filter((item: any) =>
      inPeriod(item, range.start, range.end)
    ),
    feedback = (state.recommendationFeedback || []).filter(
      (item: any) =>
        inPeriod(item, range.start, range.end) &&
        (!item.topicId || topics.some((topic: any) => topic.id === item.topicId))
    );
  const bySubject = subjects
      .map((subject: any) => {
        const scopedTopics = (subject.topics || []).filter(
            (item: any) => !item.archived && isTopicInExamScope(item, activeExamTags)
          ),
          subjectSessions = sessions.filter(item => item.subjectId === subject.id),
          unscopedSubjectSessions = evidenceScope.sessions.excluded.filter(
            item => item.subjectId === subject.id
          ),
          subjectQuestions = questions.filter(item => item.subjectId === subject.id),
          unscopedSubjectQuestions = evidenceScope.questions.excluded.filter(
            item => item.subjectId === subject.id
          ),
          volume = sum(subjectQuestions, (item: Record<string, any>) => item.resolved),
          hits = sum(subjectQuestions, (item: Record<string, any>) => item.correct);
        return {
          id: subject.id,
          name: subject.name,
          studySeconds: sum(subjectSessions, (item: Record<string, any>) => item.durationSeconds),
          unscopedStudySeconds: sum(
            unscopedSubjectSessions,
            (item: Record<string, any>) => item.durationSeconds
          ),
          questions: volume,
          unscopedQuestions: sum(
            unscopedSubjectQuestions,
            (item: Record<string, any>) => item.resolved
          ),
          accuracy: volume ? Math.round((hits / volume) * 100) : null,
          completed: scopedTopics.filter((item: any) => item.status === 'Concluído').length,
          total: scopedTopics.length,
        };
      })
      .sort((a: any, b: any) => b.studySeconds - a.studySeconds),
    planned = sum(state.dailyPlans || [], plan =>
      inPeriod(plan, range.start, range.end)
        ? sum(
            (plan.items || []).filter(
              (item: any) => !item.topicId || topics.some((topic: any) => topic.id === item.topicId)
            ),
            (item: Record<string, any>) => item.plannedMinutes
          )
        : 0
    ),
    executed = Math.round(studySeconds / 60),
    subjectNames = Object.fromEntries(subjects.map((item: any) => [item.id, item.name])),
    topicNames = Object.fromEntries(
      subjects.flatMap((subject: any) =>
        (subject.topics || []).map((topic: any) => [topic.id, topic.name])
      )
    ),
    weeklyMinutes = (Object.values(state.metas?.horasPorDia || {}) as any[]).reduce(
      (total, value) => total + (Number(value) || 0) * 60,
      0
    );
  const rawErrors: Array<[string, any]> = Object.entries(
      questions.reduce((totals: Record<string, number>, item: any) => {
        Object.entries(item.errorBreakdown || {}).forEach(
          ([key, value]) => (totals[key] = (totals[key] || 0) + (Number(value) || 0))
        );
        return totals;
      }, {})
    ).sort((a: any, b: any) => Number(b[1]) - Number(a[1])),
    errorLabels: Record<string, string> = {
      didnt_know: 'Não sabia',
      forgot: 'Esqueci',
      interpretation: 'Interpretação',
      calculation: 'Cálculo',
      inattention: 'Desatenção',
      guess: 'Chute',
      nao_sabia: 'Não sabia',
      esqueci: 'Esqueci',
      interpretacao: 'Interpretação',
      calculo: 'Cálculo',
      desatencao: 'Desatenção',
      chute: 'Chute',
    },
    errors = rawErrors.map(([key, count]) => ({ key, label: errorLabels[key] || key, count })),
    errorTotal = errors.reduce((total: number, item: any) => total + (Number(item.count) || 0), 0),
    dominantError = errors[0] || null;
  const latestSimulation =
      [...simulations].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null,
    latestBreakdown = (latestSimulation?.breakdown || []).map((item: any) => ({
      subjectName: subjectNames[item.subjectId || item.disciplinaId] || 'Disciplina removida',
      correct: Number(item.correct) || 0,
      total: Number(item.total) || 0,
      accuracy: Number(item.total)
        ? Math.round((Number(item.correct || 0) / Number(item.total)) * 100)
        : null,
    })),
    focus = (diagnosis?.weeklyFocus || []).map((item: any) => ({
      ...item,
      minutes: Math.round(((Number(weeklyMinutes) || 0) * (Number(item.percentage) || 0)) / 100),
    })),
    decisions = feedback
      .slice(-5)
      .reverse()
      .map((item: any) => {
        const snapshot = item.snapshot || {},
          subjectId = item.subjectId || snapshot.subjectId,
          topicId = item.topicId || snapshot.topicId;
        return {
          subjectName: subjectNames[subjectId] || 'Disciplina removida',
          topicName: topicNames[topicId] || 'Tópico removido',
          action: snapshot.strategy?.label || item.recommendedAction || 'Recomendação de estudo',
          result:
            (
              {
                positive: 'Resultado positivo',
                neutral: 'Resultado neutro',
                negative: 'Resultado negativo',
                insufficient: 'Resultado ainda insuficiente',
              } as Record<string, any>
            )[item.outcome?.state] || 'Resultado em acompanhamento',
        };
      });
  const examLabels: Record<string, any> = EXAM_TAG_LABELS;
  const reportTopicIds = new Set(topics.map((item: any) => item.id)),
    topicCompletions = (state.topicHistory || []).filter(
      (item: any) =>
        item.type === 'topic_completed' &&
        reportTopicIds.has(item.topicId) &&
        item.date >= range.start &&
        item.date <= range.end
    ).length;
  const resultGoals = {
    targets: {
      topicsWeekly: state.metas?.semanal ?? null,
      topicsMonthly: state.metas?.mensal ?? null,
      questionsWeekly: state.metas?.questoesSemanal ?? null,
      simulationsWeekly: state.metas?.simuladosSemanal ?? null,
      accuracy: state.metas?.metaAprovacao ?? null,
    },
    observed: {
      topicsCompleted: topicCompletions,
      questions: currentQuestionCount,
      simulations: simulations.length,
      accuracy: currentQuestionCount
        ? Math.round(
            (sum(questions, (item: Record<string, any>) => item.correct) / currentQuestionCount) *
              100
          )
        : null,
    },
    periodLabel: range.label,
  };
  const recommendationRecords = (state.recommendationHistory || []).filter(
    (item: any) =>
      inPeriod(item, range.start, range.end) &&
      (!item.topicId || topics.some((topic: any) => topic.id === item.topicId))
  );
  const adaptiveAdjustments = (state.adaptivePlanningHistory || [])
    .filter(
      (item: any) =>
        inPeriod(item, range.start, range.end) && ['applied', 'reverted'].includes(item.status)
    )
    .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const recommendationLifecycle = summarizeRecommendationHistory(recommendationRecords, {
    today: range.end,
    days: periodLength,
  });
  const recommendationOutcomes = buildRecommendationOutcomeAudit(feedback);
  const scopedPlans = (state.dailyPlans || []).map((plan: any) => ({
    ...plan,
    items: (plan.items || []).filter(
      (item: any) => !item.topicId || reportTopicIds.has(item.topicId)
    ),
  }));
  const scopedFeedback = (state.recommendationFeedback || []).filter(
    (item: any) => !item.topicId || reportTopicIds.has(item.topicId)
  );
  const weekStart = addLocalDays(range.end, -6)!,
    previousWeekStart = addLocalDays(weekStart, -7)!,
    previousWeekEnd = addLocalDays(weekStart, -1)!;
  const weekScope = resolveExamEvidenceScope({
    subjects: state.subjects || [],
    activeExamTags,
    sessions: (state.studySessions || []).filter(
      (item: any) => item.date >= weekStart && item.date <= range.end
    ),
    questions: (state.questoes || []).filter(
      (item: any) => item.date >= weekStart && item.date <= range.end
    ),
    reviews: [],
  });
  const weekSessions = weekScope.sessions.included,
    weekQuestions = weekScope.questions.included,
    weekPlans = scopedPlans
      .filter((plan: any) => plan.date >= weekStart && plan.date <= range.end)
      .flatMap((plan: any) => plan.items || []);
  const previousWeekScope = resolveExamEvidenceScope({
    subjects: state.subjects || [],
    activeExamTags,
    sessions: (state.studySessions || []).filter(
      (item: any) => item.date >= previousWeekStart && item.date <= previousWeekEnd
    ),
    questions: (state.questoes || []).filter(
      (item: any) => item.date >= previousWeekStart && item.date <= previousWeekEnd
    ),
    reviews: [],
  });
  const previousWeekQuestions = previousWeekScope.questions.included,
    previousWeekResolved = sum(previousWeekQuestions, (item: Record<string, any>) => item.resolved);
  const weeklyAudit = buildWeeklyClose({
    period: { start: weekStart, end: range.end },
    current: {
      plannedMinutes: sum(weekPlans, (item: Record<string, any>) => item.plannedMinutes),
      executedMinutes: Math.round(
        sum(weekSessions, (item: Record<string, any>) => item.durationSeconds) / 60
      ),
    },
    previous: {
      executedMinutes: Math.round(
        sum(
          previousWeekScope.sessions.included,
          (item: Record<string, any>) => item.durationSeconds
        ) / 60
      ),
      resolved: previousWeekResolved,
      accuracy: previousWeekResolved
        ? Math.round(
            (sum(previousWeekQuestions, (item: Record<string, any>) => item.correct) /
              previousWeekResolved) *
              100
          )
        : null,
    },
    sessions: weekSessions,
    plans: weekPlans,
    questions: weekQuestions,
    recommendations: scopedFeedback,
    targetAccuracy: state.metas?.metaAprovacao || 80,
  });
  const readinessHistory = readinessHistoryForScope(
    state.readinessSnapshots || [],
    activeExamTags,
    range.start,
    range.end
  );
  return {
    weeklyFocus: buildReportWeeklyFocus({
      sessions: weekSessions,
      candidates,
      dailyPlans: scopedPlans,
      recommendations: scopedFeedback,
      end: range.end,
    }),
    weeklyAudit,
    readinessHistory,
    examIntelligence: buildExamReportSummary({
      state,
      topics: subjects.flatMap((subject: any) =>
        (subject.topics || [])
          .filter((item: any) => !item.archived && isTopicInExamScope(item, activeExamTags))
          .map((topic: any) => ({ ...topic, subjectId: subject.id }))
      ),
      candidates,
    }),
    adaptiveAdjustments,
    recommendationLifecycle,
    recommendationOutcomes,
    title: isDemo ? 'Relatório estratégico de demonstração' : 'Relatório estratégico',
    isDemo,
    generatedAt,
    period: range,
    comparison,
    comparisonInsights,
    goals: resultGoals,
    exam: {
      date: examDate,
      daysToExam,
      phase: examPhase,
      target: state.examBlueprint?.targetScore ?? state.metas?.metaAprovacao ?? null,
      activeTags: [...activeExamTags],
      activeLabels: activeExamTags.length
        ? activeExamTags.map((tag: any) => examLabels[tag] || tag)
        : ['Todo o conteúdo'],
      catalogVersion: CATALOG_VERSION,
    },
    planNumber: state.planNumber || activePlan?.number || 'Não informado',
    overview: {
      subjects: subjects.length,
      topics: topics.length,
      completedTopics: topics.filter((item: any) => item.status === 'Concluído').length,
      contentPercent: topics.length
        ? Math.round(
            (topics.filter((item: any) => item.status === 'Concluído').length / topics.length) * 100
          )
        : 0,
      studySeconds,
      unscopedStudySeconds,
      resolved,
      unscopedResolved,
      accuracy: resolved ? Math.round((correct / resolved) * 100) : null,
      simulations: simulations.length,
      simulationAverage: simulationTotal
        ? Math.round((simulationCorrect / simulationTotal) * 100)
        : null,
      pendingReviews: reviews.filter(item => item.status !== 'Concluído').length,
      completedReviews: reviews.filter(item => item.status === 'Concluído').length,
    },
    readiness,
    forecast,
    activePlan,
    bySubject,
    simulations: simulations.map((item: any) => ({
      date: item.date,
      name: item.nome || 'Simulado',
      score: item.total ? Math.round((item.correct / item.total) * 100) : null,
    })),
    latestSimulation: latestSimulation
      ? {
          date: latestSimulation.date,
          name: latestSimulation.nome || 'Simulado',
          breakdown: latestBreakdown,
        }
      : null,
    execution: {
      plannedMinutes: planned,
      executedMinutes: executed,
      adherence: planned ? Math.round((executed / planned) * 100) : null,
      dailyPlans: scopedPlans.filter((item: any) => inPeriod(item, range.start, range.end)).length,
      replans: adjustments.filter((item: any) => ['applied', 'confirmed'].includes(item.status))
        .length,
      undoneReplans: adjustments.filter((item: any) => item.status === 'undone').length,
    },
    risks: (diagnosis?.bottlenecks || []).slice(0, 5),
    opportunities: (diagnosis?.opportunities || []).slice(0, 5),
    criticalReviews: (diagnosis?.criticalReviews || []).slice(0, 5),
    priorities: [...(diagnosis?.bottlenecks || []), ...(diagnosis?.opportunities || [])].slice(
      0,
      5
    ),
    focus,
    recommendations: {
      decisions: feedback.length,
      accepted: feedback.filter((item: any) => item.accepted).length,
      completed: feedback.filter((item: any) => item.completed).length,
      useful: feedback.filter((item: any) => item.useful === true).length,
      measured: feedback.filter((item: any) => item.outcome).length,
    },
    decisions,
    errors,
    errorDiagnosis: dominantError
      ? {
          message: `${Math.round((dominantError.count / errorTotal) * 100)}% dos erros categorizados vêm de ${dominantError.label.toLowerCase()}.`,
          action:
            dominantError.label === 'Chute'
              ? 'Reforçar conceitos antes de voltar às questões.'
              : 'Priorizar revisão dirigida e questões comentadas.',
        }
      : null,
    methodology: {
      readiness: readiness?.algorithmVersion || 'versão atual',
      projection: forecast?.algorithmVersion || 'versão atual',
      period: range.label,
      evidence: readiness?.confidenceLabel || 'Baixa',
      examEvidence: activeExamTags.length
        ? 'Métricas do edital incluem somente registros vinculados a tópicos elegíveis. Registros apenas da disciplina são apresentados separadamente.'
        : 'Sem filtro de concurso; todo o histórico é considerado.',
    },
  };
}
import { isTopicInExamScope, isSimulationInExamScope } from '../domain/exams/exam-scope.js';
import { resolveExamEvidenceScope } from '../domain/exams/exam-evidence-scope.js';
import { CATALOG_VERSION, EXAM_TAG_LABELS } from '../domain/exams/exam-constants.js';
import { buildPeriodComparison } from '../domain/analytics/period-comparison.js';
import { buildPeriodComparisonInsights } from '../domain/analytics/period-comparison-insights.js';
import { localDateRange } from '../core/date-utils.js';
import { localDateFromTimestamp } from '../domain/sessions/study-session.js';
import { resolveExamPhase } from '../domain/planning/adaptive-planning.js';
