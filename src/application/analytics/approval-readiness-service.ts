import type { AppState } from '../../core/types.js';
import {
  calculateApprovalAcertosMetric,
  calculateApprovalConhecimentoMetric,
  calculateApprovalConsistenciaMetric,
  calculateApprovalDominioMetric,
  calculateApprovalEditalMetric,
  calculateApprovalPrazoMetric,
  calculateApprovalRetencaoMetric,
  calculateApprovalRevisoesMetric,
  calculateApprovalSimuladosMetric,
  calculateApprovalTendenciaMetric,
  extractReadinessFactors,
} from '../../domain/analytics/approval-metrics.js';
import { calculateGoalConsistency } from '../../domain/analytics/consistency.js';
import { calculateSubjectRadar } from '../../domain/analytics/multidimensional-radar.js';
import { calculateReadinessScore, READINESS_WEIGHTS } from '../../domain/analytics/readiness-score.js';
import { buildCalibratedScoreProjection } from '../../domain/forecasts/calibrated-score-projection.js';
import { buildPerformanceForecast } from '../../domain/forecasts/performance-forecast.js';
import { resolveExamPhase } from '../../domain/planning/adaptive-planning.js';
import { buildApprovalSignals } from './build-analytics-view-model.js';
import { createReadinessSnapshot, upsertReadinessSnapshot } from './readiness-history.js';
import { buildPerformanceOverview } from '../performance/build-performance-overview.js';
import { resolvePerformanceRange } from '../performance/performance-view-state.js';

export interface ApprovalReadinessServiceDependencies {
  getState: () => AppState;
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix?: string) => string;
  addDays: (iso: string | null | undefined, days: number) => string;
  diasParaRevisao: (targetIso: string | null | undefined) => number | null;
  entitySubjectId: (item: Record<string, any>) => string | null;
  activeSubjects: () => any[];
  examScopedTopics: () => any[];
  examScopedRecords: (records?: any[]) => any[];
  examScopedSimulations: () => any[];
  examEvidenceContext: () => any;
  simuladoEffectiveCounts: (sim: Record<string, any>) => { correct: number; total: number };
  simuladoNota: (sim: Record<string, any>) => number;
  getRevisoesUnificadas: () => any[];
  computeRitmo: () => any;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  topicRetentionScore: (subjectId: string, topicId: string) => any;
  subjectProgress: (subject: Record<string, any>) => number;
  ultimaAtividadeDisciplina: (subjectId: string) => string | null;
  studySecondsByDate: (sessions?: any[]) => Record<string, number>;
  metaHoursForDate: (date?: string) => number;
  performanceScopedPlans: (scope: any) => any[];
}

export function createApprovalReadinessService(deps: ApprovalReadinessServiceDependencies) {
  const {
    getState,
    todayISO,
    nowISO,
    uid,
    addDays,
    diasParaRevisao,
    entitySubjectId,
    activeSubjects,
    examScopedTopics,
    examScopedRecords,
    examScopedSimulations,
    examEvidenceContext,
    simuladoEffectiveCounts,
    simuladoNota,
    getRevisoesUnificadas,
    computeRitmo,
    topicMasteryIndex,
    topicRetentionScore,
    subjectProgress,
    ultimaAtividadeDisciplina,
    studySecondsByDate,
    metaHoursForDate,
    performanceScopedPlans,
  } = deps;

  function getMetricDataState(metric: Record<string, any>, minimumConfidence = 0.35) {
    if (!metric?.available || metric.raw === null) return 'empty';
    if ((Number(metric.confidence) || 0) < minimumConfidence) return 'insufficient';
    return 'ready';
  }

  function metricStateLabel(metric: Record<string, any>, minimumConfidence = 0.35) {
    const status = getMetricDataState(metric, minimumConfidence);
    if (status === 'empty') return 'Aguardando dados';
    if (status === 'insufficient') return 'Estimativa inicial';
    return 'Resultado calculado';
  }

  function subjectRadarModel(subject: Record<string, any>) {
    const state = getState();
    const topics = subject.topics.filter((topic: any) => !topic.archived),
      coverage = topics.length ? subjectProgress(subject) : null;
    const masteryValues = topics
      .map((topic: any) => topicMasteryIndex(subject.id, topic.id))
      .filter((item: any) => item.confidence > 0);
    const retentionValues = topics
      .map((topic: any) => topicRetentionScore(subject.id, topic.id))
      .filter((item: any) => item.available);
    const mastery = masteryValues.length
      ? masteryValues.reduce((sum: any, item: any) => sum + item.score, 0) / masteryValues.length
      : null;
    const retention = retentionValues.length
      ? retentionValues.reduce((sum: any, item: any) => sum + item.score, 0) / retentionValues.length
      : null;
    const last = ultimaAtividadeDisciplina(subject.id),
      distance = last ? diasParaRevisao(last) : null,
      daysSinceContact = distance === null ? null : Math.max(0, -distance);
    const cutoff = addDays(todayISO(), -27),
      activeDates = new Set();
    state.studySessions
      .filter(item => entitySubjectId(item) === subject.id && item.date >= cutoff)
      .forEach(item => activeDates.add(item.date));
    state.questoes
      .filter(item => entitySubjectId(item) === subject.id && item.date >= cutoff)
      .forEach(item => activeDates.add(item.date));
    const result = calculateSubjectRadar({
      coverage,
      mastery,
      retention,
      daysSinceContact,
      activeDays: activeDates.size || null,
    });
    return { ...result, id: subject.id, name: subject.name };
  }

  function approvalSimuladosMetric() {
    const completed = examScopedSimulations()
      .filter(sim => simuladoEffectiveCounts(sim).total > 0)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(sim => ({
        nota: simuladoNota(sim),
        totalQuestions: simuladoEffectiveCounts(sim).total,
      }));
    return calculateApprovalSimuladosMetric(completed);
  }

  function approvalAcertosMetric() {
    return calculateApprovalAcertosMetric(examEvidenceContext().questions.included);
  }

  function approvalEditalMetric() {
    const topics = examScopedTopics();
    const concluded = topics.filter(t => t.status === 'Concluído').length;
    const subjectsWithTopics = activeSubjects().filter(s =>
      (s.topics || []).some((t: any) => !t.archived)
    ).length;
    return calculateApprovalEditalMetric({
      totalTopicsCount: topics.length,
      concludedTopicsCount: concluded,
      subjectsWithTopicsCount: subjectsWithTopics,
    });
  }

  function approvalDominioMetric() {
    const topics = examScopedTopics();
    const values = topics.map(topic => topicMasteryIndex(topic.subjectId, topic.id));
    return calculateApprovalDominioMetric({
      topicMasteries: values,
      totalTopicsCount: topics.length,
    });
  }

  function approvalRevisoesMetric() {
    const today = todayISO();
    const due = examScopedRecords(getRevisoesUnificadas()).filter(r => r.date && r.date <= today);
    const items = due.map(r => ({
      status: r.status,
      daysLate: Math.max(0, -(diasParaRevisao(r.date) || 0)),
    }));
    return calculateApprovalRevisoesMetric(items);
  }

  function approvalTendenciaMetric() {
    const simulations = examScopedSimulations()
      .filter(sim => simuladoEffectiveCounts(sim).total > 0)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(simuladoNota);
    return calculateApprovalTendenciaMetric(simulations);
  }

  function approvalPrazoMetric() {
    const state = getState();
    return calculateApprovalPrazoMetric({
      ritmo: computeRitmo(),
      hasExamDate: Boolean(state.examDate),
    });
  }

  function approvalRetencaoMetric() {
    const topics = examScopedTopics();
    const values = topics.map(t => topicRetentionScore(t.subjectId, t.id));
    return calculateApprovalRetencaoMetric({
      topicRetentions: values,
      totalTopicsCount: topics.length,
    });
  }

  function approvalConhecimentoMetric(base: Record<string, any>) {
    return calculateApprovalConhecimentoMetric(base as any);
  }

  function approvalConsistenciaMetric() {
    const today = todayISO(),
      byDate = studySecondsByDate(examEvidenceContext().sessions.included);
    const days = [];
    for (let n = 27; n >= 0; n--) {
      const date = addDays(today, -n);
      days.push({ targetSeconds: metaHoursForDate(date) * 3600, studiedSeconds: byDate[date] || 0 });
    }
    const result = calculateGoalConsistency(days);
    return calculateApprovalConsistenciaMetric({ consistencyResult: result });
  }

  function computeApprovalMetrics() {
    const base = {
      simulados: approvalSimuladosMetric(),
      acertos: approvalAcertosMetric(),
      edital: approvalEditalMetric(),
      dominio: approvalDominioMetric(),
      revisoes: approvalRevisoesMetric(),
      tendencia: approvalTendenciaMetric(),
      prazo: approvalPrazoMetric(),
    };
    return {
      ...base,
      conhecimento: approvalConhecimentoMetric(base),
      retencao: approvalRetencaoMetric(),
      questoes: base.acertos,
      consistencia: approvalConsistenciaMetric(),
    };
  }

  function readinessFactors(metrics?: Record<string, any>) {
    const m = metrics || computeApprovalMetrics();
    return extractReadinessFactors(m as any);
  }

  function readinessResult(metrics?: Record<string, any>) {
    return calculateReadinessScore(readinessFactors(metrics), READINESS_WEIGHTS);
  }

  function indiceProntidao(metrics?: Record<string, any>) {
    return readinessResult(metrics).value ?? 0;
  }

  function projectPerformance() {
    const state = getState();
    const calibration = buildCalibratedScoreProjection({
      simulations: examScopedSimulations().map(item => ({
        ...item,
        ...simuladoEffectiveCounts(item),
        breakdown: (item.breakdown || []).map((row: any) => ({
          ...row,
          subjectId: entitySubjectId(row),
        })),
      })),
      today: todayISO(),
      target: state.examBlueprint?.configuredAt
        ? state.examBlueprint.targetScore
        : state.metas.metaAprovacao,
    });
    if (!calibration.available)
      return {
        available: false,
        low: null as any,
        high: null as any,
        central: null as any,
        confidence: 0,
        confidenceLabel: 'Baixa',
        detail: calibration.reason,
        calibration,
        forecast30: { available: false, reason: calibration.reason },
      };
    const confidence = calibration.confidence === 'moderate' ? 0.5 : 0.2;
    const forecast = buildPerformanceForecast({
      currentValue: calibration.central,
      currentConfidence: confidence,
      targetScore: calibration.target,
      observations: calibration.observations,
    });
    const future = forecast.forecast30 as Record<string, any>;
    if (future.available) {
      const margin = Math.max(
        future.central - future.low,
        calibration.central! - calibration.low!,
        calibration.high! - calibration.central!
      );
      future.low = Math.max(0, future.central - margin);
      future.high = Math.min(100, future.central + margin);
      future.confidence = Math.min(confidence, future.confidence);
      future.confidenceLabel = calibration.confidenceLabel;
    }
    const forecast30 =
      calibration.calibration!.state === 'retrospective'
        ? future
        : {
            available: false,
            reason: 'A projeção futura aguarda checagem retrospectiva suficiente.',
          };
    return {
      available: true,
      low: calibration.low,
      high: calibration.high,
      central: calibration.central,
      confidence,
      confidenceLabel: calibration.confidenceLabel,
      calibration,
      gap: {
        minimum: Math.max(0, calibration.target! - calibration.high!),
        maximum: Math.max(0, calibration.target! - calibration.low!),
        target: calibration.target,
      },
      movingAverage: forecast.movingAverage,
      forecast30,
      evidence: calibration.evidence,
      scenarios: { available: false, scenarios: [] as any[] },
      detail: calibration.reason,
    };
  }

  function recentPerformance(scope = examEvidenceContext(), today = todayISO()) {
    return buildPerformanceOverview({
      range: resolvePerformanceRange({ today, period: '30', comparePrevious: false }),
      today,
      questions: scope.questions.included,
      sessions: scope.sessions.included,
      dailyPlans: performanceScopedPlans(scope),
    });
  }

  function gerarDiagnosticoAprovacao(metrics?: Record<string, any>) {
    const state = getState();
    const m = metrics || computeApprovalMetrics();
    const icons: Record<string, any> = { positive: '✅', warning: '⚠️', info: 'ℹ️' };
    return buildApprovalSignals(m, { target: state.metas.metaAprovacao }).map(
      item => `${icons[item.level]} ${item.text}`
    );
  }

  function recordedExamPhase() {
    const state = getState();
    return resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null);
  }

  function saveCurrentReadinessSnapshot({
    captureKind = 'weekly-close',
    reason = null,
    eventKey = null,
  }: any = {}) {
    const state = getState();
    const date = todayISO(),
      savedAt = nowISO(),
      snapshot = createReadinessSnapshot({
        id: uid('readiness'),
        date,
        savedAt,
        captureKind,
        reason,
        eventKey,
        examPhase: recordedExamPhase(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        metrics: readinessFactors(computeApprovalMetrics()),
      });
    return upsertReadinessSnapshot(state.readinessSnapshots, snapshot!);
  }

  function buildReadinessBeforeStrategySnapshot(reason: string, timestamp = nowISO()) {
    const state = getState();
    return createReadinessSnapshot({
      id: uid('readiness'),
      date: todayISO(),
      savedAt: timestamp,
      captureKind: 'before-strategy-change',
      reason,
      eventKey: uid('readiness-event'),
      examPhase: recordedExamPhase(),
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      metrics: readinessFactors(computeApprovalMetrics()),
    });
  }

  function captureReadinessBeforeStrategy(reason: string) {
    const state = getState();
    return upsertReadinessSnapshot(
      state.readinessSnapshots,
      buildReadinessBeforeStrategySnapshot(reason)!
    );
  }

  return {
    getMetricDataState,
    metricStateLabel,
    subjectRadarModel,
    approvalSimuladosMetric,
    approvalAcertosMetric,
    approvalEditalMetric,
    approvalDominioMetric,
    approvalRevisoesMetric,
    approvalTendenciaMetric,
    approvalPrazoMetric,
    approvalRetencaoMetric,
    approvalConhecimentoMetric,
    approvalConsistenciaMetric,
    computeApprovalMetrics,
    readinessFactors,
    readinessResult,
    indiceProntidao,
    projectPerformance,
    recentPerformance,
    gerarDiagnosticoAprovacao,
    recordedExamPhase,
    saveCurrentReadinessSnapshot,
    buildReadinessBeforeStrategySnapshot,
    captureReadinessBeforeStrategy,
  };
}
