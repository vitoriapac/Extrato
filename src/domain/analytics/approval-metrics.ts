/**
 * Motor determinístico de cálculo de métricas de prontidão e aprovação.
 *
 * Consolida pontuações ponderadas de simulados, acertos, cobertura de edital,
 * domínio, revisões, tendências recentes e prazo estimado.
 *
 * Camada: Domain (sem dependências de DOM, Preact ou storage).
 */

import type { RhythmEstimatorResult } from '../planning/rhythm-estimator.js';

export interface ApprovalMetricResult {
  score: number;
  confidence: number;
  available: boolean;
  raw: number | null;
  detail: string;
}

export interface ApprovalClassification {
  nivel: string;
  cor: 'ok' | 'warn' | 'danger';
  faixa: string;
}

export interface TopicMasteryInput {
  score: number;
  confidence: number;
}

export interface TopicRetentionInput {
  score: number;
  confidence: number;
  available: boolean;
}

export interface DueReviewItem {
  status?: string;
  daysLate?: number;
}

export interface SimulationScoreItem {
  nota: number;
  totalQuestions: number;
}

export interface AcertosQuestionItem {
  resolved?: number | null;
  correct?: number | null;
}

export interface ConsistencyDayItem {
  targetSeconds: number;
  studiedSeconds: number;
}

export interface ConsistencyCalculationResult {
  applicable: number;
  available: boolean;
  achieved: number;
  studiedDays: number;
  value: number | null;
}

export interface ApprovalMetrics {
  simulados: ApprovalMetricResult;
  acertos: ApprovalMetricResult;
  edital: ApprovalMetricResult;
  dominio: ApprovalMetricResult;
  revisoes: ApprovalMetricResult;
  tendencia: ApprovalMetricResult;
  prazo: ApprovalMetricResult;
  conhecimento: ApprovalMetricResult;
  retencao: ApprovalMetricResult;
  questoes: ApprovalMetricResult;
  consistencia: ApprovalMetricResult;
}

export interface ReadinessFactors {
  coverage: ApprovalMetricResult;
  mastery: ApprovalMetricResult;
  retention: ApprovalMetricResult;
  consistency: ApprovalMetricResult;
  simulations: ApprovalMetricResult;
}

/**
 * Garante que a pontuação esteja limitada entre 0 e 100.
 */
export function clampScore(value: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

/**
 * Média aritmética de uma lista de valores numéricos.
 */
export function average(values: number[]): number {
  return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
}

/**
 * Classificação textual e semântica do nível de prontidão para a prova.
 */
export function classifyApprovalScore(score: number): ApprovalClassification {
  if (score >= 85) return { nivel: 'Excelente preparação', cor: 'ok', faixa: '85–100' };
  if (score >= 70) return { nivel: 'Preparação avançada', cor: 'ok', faixa: '70–84' };
  if (score >= 50) return { nivel: 'Em desenvolvimento', cor: 'warn', faixa: '50–69' };
  return { nivel: 'Preparação inicial', cor: 'danger', faixa: '0–49' };
}

/**
 * Calcula a métrica de desempenho em simulados com média ponderada temporal.
 */
export function calculateApprovalSimuladosMetric(
  completedSimulations: SimulationScoreItem[]
): ApprovalMetricResult {
  const window = completedSimulations.slice(-5);
  if (window.length === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem simulados concluídos',
    };
  }
  let weighted = 0;
  let weights = 0;
  let totalQuestions = 0;
  window.forEach((sim, index) => {
    const weight = index + 1;
    weighted += sim.nota * weight;
    weights += weight;
    totalQuestions += sim.totalQuestions;
  });
  const raw = weighted / weights;
  const confidence = Math.min(1, (window.length / 4) * 0.7 + (totalQuestions / 300) * 0.3);
  return {
    score: clampScore(50 + (raw - 50) * confidence),
    confidence,
    available: true,
    raw,
    detail: `${window.length} simulado${window.length === 1 ? '' : 's'} · média recente ${Math.round(raw)}%`,
  };
}

/**
 * Calcula a métrica de acertos em questões avulsas no escopo da prova.
 */
export function calculateApprovalAcertosMetric(
  questions: AcertosQuestionItem[]
): ApprovalMetricResult {
  const total = questions.reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
  const correct = questions.reduce((sum, q) => sum + (Number(q.correct) || 0), 0);
  if (total === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem questões registradas',
    };
  }
  const raw = (correct / total) * 100;
  const confidence = Math.min(1, total / 300);
  return {
    score: clampScore(50 + (raw - 50) * confidence),
    confidence,
    available: true,
    raw,
    detail: `${total} questões · acerto bruto ${Math.round(raw)}%`,
  };
}

/**
 * Calcula a cobertura de tópicos do edital e diversidade de disciplinas.
 */
export function calculateApprovalEditalMetric(params: {
  totalTopicsCount: number;
  concludedTopicsCount: number;
  subjectsWithTopicsCount: number;
}): ApprovalMetricResult {
  const { totalTopicsCount, concludedTopicsCount, subjectsWithTopicsCount } = params;
  if (totalTopicsCount === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem tópicos cadastrados',
    };
  }
  const raw = (concludedTopicsCount / totalTopicsCount) * 100;
  const confidence = Math.min(
    1,
    (totalTopicsCount / 40) * 0.55 + (subjectsWithTopicsCount / 5) * 0.45
  );
  return {
    score: clampScore(50 + (raw - 50) * confidence),
    confidence,
    available: true,
    raw,
    detail: `${concludedTopicsCount} de ${totalTopicsCount} tópicos concluídos`,
  };
}

/**
 * Calcula o índice de domínio agregado sobre os tópicos do edital.
 */
export function calculateApprovalDominioMetric(params: {
  topicMasteries: TopicMasteryInput[];
  totalTopicsCount: number;
}): ApprovalMetricResult {
  const { topicMasteries, totalTopicsCount } = params;
  if (totalTopicsCount === 0) {
    return { score: 50, confidence: 0, available: false, raw: null, detail: 'Sem tópicos ativos' };
  }
  const evidenced = topicMasteries.filter(item => item.confidence > 0);
  if (evidenced.length === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Ainda não há evidências de domínio',
    };
  }
  const weightTotal = evidenced.reduce((sum, item) => sum + Math.max(0.15, item.confidence), 0);
  const raw =
    evidenced.reduce((sum, item) => sum + item.score * Math.max(0.15, item.confidence), 0) /
    weightTotal;
  const coverage = evidenced.length / totalTopicsCount;
  const evidence = evidenced.reduce((sum, item) => sum + item.confidence, 0) / evidenced.length;
  const confidence = Math.min(1, coverage * 0.55 + evidence * 0.45);
  return {
    score: clampScore(50 + (raw - 50) * confidence),
    confidence,
    available: true,
    raw,
    detail: `${Math.round(raw)}/100 em ${evidenced.length} de ${totalTopicsCount} tópicos`,
  };
}

/**
 * Avalia a saúde da execução de revisões em relação às revisões vencidas até a data atual.
 */
export function calculateApprovalRevisoesMetric(
  dueReviews: DueReviewItem[]
): ApprovalMetricResult {
  if (dueReviews.length === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem revisões vencidas até hoje',
    };
  }
  const completed = dueReviews.filter(r => r.status === 'Concluído').length;
  const pending = dueReviews.filter(r => r.status !== 'Concluído');
  const severity = pending.reduce((sum, r) => {
    const daysLate = Math.max(0, r.daysLate || 0);
    return sum + Math.min(1, daysLate / 14);
  }, 0);
  const raw = Math.max(0, (completed / dueReviews.length) * 100 - (severity / dueReviews.length) * 20);
  const confidence = Math.min(1, dueReviews.length / 10);
  const evidence = Math.max(0.4, confidence);
  return {
    score: clampScore(50 + (raw - 50) * evidence),
    confidence,
    available: true,
    raw,
    detail: `${completed} de ${dueReviews.length} revisões em dia`,
  };
}

/**
 * Avalia a tendência de variação nas notas dos simulados recentes.
 */
export function calculateApprovalTendenciaMetric(
  simulationScores: number[]
): ApprovalMetricResult {
  if (simulationScores.length < 2) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'São necessários pelo menos 2 simulados',
    };
  }
  const windowSize = Math.min(3, Math.floor(simulationScores.length / 2));
  const previous = simulationScores.slice(-(windowSize * 2), -windowSize);
  const recent = simulationScores.slice(-windowSize);
  const variation = average(recent) - average(previous);
  const raw = clampScore(50 + variation * 2);
  const confidence = Math.min(1, (simulationScores.length - 1) / 5);
  return {
    score: clampScore(50 + (raw - 50) * confidence),
    confidence,
    available: true,
    raw,
    detail: `Variação recente ${variation >= 0 ? '+' : ''}${Math.round(variation * 10) / 10} p.p.`,
  };
}

/**
 * Avalia o cumprimento do prazo para a data da prova com base no ritmo calculado.
 */
export function calculateApprovalPrazoMetric(params: {
  ritmo: RhythmEstimatorResult;
  hasExamDate: boolean;
}): ApprovalMetricResult {
  const { ritmo, hasExamDate } = params;
  if (!hasExamDate) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Data da prova não definida',
    };
  }
  if (ritmo.status === 'completo') {
    return {
      score: 100,
      confidence: 1,
      available: true,
      raw: 100,
      detail: 'Cobertura cadastrada concluída',
    };
  }
  if (ritmo.status !== 'ok' || !ritmo.comparativo) {
    return {
      score: 50,
      confidence: 0.2,
      available: false,
      raw: null,
      detail: 'Ritmo recente insuficiente para estimar',
    };
  }
  if (ritmo.comparativo === 'no-prazo') {
    const slack = (ritmo.daysToExam ?? 0) - (ritmo.daysNeeded ?? 0);
    const raw = clampScore(70 + Math.min(30, Math.max(0, slack)));
    return {
      score: raw,
      confidence: 1,
      available: true,
      raw,
      detail: `Previsão com ${slack} dia${slack === 1 ? '' : 's'} de folga`,
    };
  }
  const delay = (ritmo.daysNeeded ?? 0) - (ritmo.daysToExam ?? 0);
  const raw = clampScore(60 - Math.min(60, Math.max(0, delay) * 2));
  return {
    score: raw,
    confidence: 1,
    available: true,
    raw,
    detail: `Previsão ${delay} dia${delay === 1 ? '' : 's'} após a prova`,
  };
}

/**
 * Combina o domínio dos tópicos (65%) e a cobertura do edital (35%).
 */
export function calculateApprovalConhecimentoMetric(base: {
  dominio: ApprovalMetricResult;
  edital: ApprovalMetricResult;
}): ApprovalMetricResult {
  const parts: Array<{ v: number; c: number; w: number }> = [];
  if (base.dominio.available) {
    parts.push({ v: base.dominio.raw ?? base.dominio.score, c: base.dominio.confidence, w: 0.65 });
  }
  if (base.edital.available) {
    parts.push({ v: base.edital.raw ?? base.edital.score, c: base.edital.confidence, w: 0.35 });
  }
  if (!parts.length) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem evidências suficientes de conhecimento',
    };
  }
  const w = parts.reduce((n, x) => n + x.w, 0);
  const raw = parts.reduce((n, x) => n + x.v * x.w, 0) / w;
  const confidence = parts.reduce((n, x) => n + x.c * x.w, 0) / w;
  return {
    score: clampScore(50 + (raw - 50) * Math.max(0.25, confidence)),
    confidence,
    available: true,
    raw,
    detail: 'Domínio dos tópicos (65%) + cobertura do edital (35%)',
  };
}

/**
 * Agrega a pontuação de retenção espaçada de todos os tópicos avaliados.
 */
export function calculateApprovalRetencaoMetric(params: {
  topicRetentions: TopicRetentionInput[];
  totalTopicsCount: number;
}): ApprovalMetricResult {
  const { topicRetentions, totalTopicsCount } = params;
  const values = topicRetentions.filter(x => x.available);
  if (!values.length || totalTopicsCount === 0) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Sem evidências de retenção por tópico',
    };
  }
  const weight = values.reduce((n, x) => n + Math.max(0.15, x.confidence), 0);
  const raw = values.reduce((n, x) => n + x.score * Math.max(0.15, x.confidence), 0) / weight;
  const confidence = Math.min(
    1,
    (values.reduce((n, x) => n + x.confidence, 0) / values.length) * 0.65 +
      (values.length / totalTopicsCount) * 0.35
  );
  return {
    score: clampScore(50 + (raw - 50) * Math.max(0.35, confidence)),
    confidence,
    available: true,
    raw,
    detail: `${Math.round(raw)}% em ${values.length} de ${totalTopicsCount} tópicos`,
  };
}

/**
 * Avalia a consistência no cumprimento de metas diárias nos últimos 28 dias.
 */
export function calculateApprovalConsistenciaMetric(params: {
  consistencyResult: ConsistencyCalculationResult;
}): ApprovalMetricResult {
  const { consistencyResult } = params;
  if (!consistencyResult.applicable) {
    return {
      score: 50,
      confidence: 0,
      available: false,
      raw: null,
      detail: 'Defina metas de horas para medir consistência',
    };
  }
  const raw = consistencyResult.value ?? 0;
  const confidence = Math.min(1, consistencyResult.studiedDays / 14);
  return {
    score: clampScore(50 + (raw - 50) * Math.max(0.2, confidence)),
    confidence,
    available: consistencyResult.available,
    raw,
    detail: `${consistencyResult.achieved} de ${consistencyResult.applicable} metas diárias atingidas nos últimos 28 dias`,
  };
}

/**
 * Constrói o mapa de fatores de prontidão para o Readiness Score.
 */
export function extractReadinessFactors(metrics: ApprovalMetrics): ReadinessFactors {
  return {
    coverage: metrics.edital,
    mastery: metrics.dominio,
    retention: metrics.retencao,
    consistency: metrics.consistencia,
    simulations: metrics.simulados,
  };
}
