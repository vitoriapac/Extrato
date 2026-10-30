/**
 * Detecção de Domínio Volátil / Falsa Consolidação (src/domain/analytics/volatile-mastery.ts)
 *
 * Identifica o fenômeno cognitivo de "Ilusão de Competência":
 * O estudante estuda a teoria e acerta > 85% das questões logo em seguida (memória de curto prazo),
 * porém, em revisões espaçadas (> 14 dias), o rendimento desaba para níveis críticos (< 65%).
 */

export interface QuestionEvent {
  id?: string;
  topicId: string;
  date: string;
  total: number;
  correct: number;
  source?: 'immediate' | 'review' | 'simulation' | 'generic';
}

export interface VolatileMasteryDiagnostic {
  topicId: string;
  topicName?: string;
  status: 'volatile' | 'consolidated' | 'emerging' | 'insufficient_data';
  initialAccuracy: number | null;
  spacedAccuracy: number | null;
  accuracyDrop: number | null;
  daysBetweenAssessments: number | null;
  sampleQuestionsCount: number;
  alertMessage: string | null;
  recommendedAction: string | null;
}

const MIN_SAMPLE_QUESTIONS = 8;
const SIGNIFICANT_DROP_THRESHOLD = 25; // 25 pontos percentuais de queda
const MIN_SPACED_DAYS_THRESHOLD = 14; // Mais de 14 dias entre avaliações

function parseDayTimestamp(dateStr: string): number | null {
  const ts = Date.parse(`${dateStr}T00:00:00Z`);
  return Number.isFinite(ts) ? ts / 86400000 : null;
}

/**
 * Avalia o histórico de questões de um tópico e detecta sinais de falsa consolidação.
 */
export function analyzeTopicVolatileMastery({
  topicId,
  topicName,
  questions = [],
}: {
  topicId: string;
  topicName?: string;
  questions?: QuestionEvent[];
}): VolatileMasteryDiagnostic {
  const topicEvents = questions
    .filter(q => q.topicId === topicId && Number(q.total) > 0 && Number.isFinite(Number(q.correct)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalQuestions = topicEvents.reduce((sum, q) => sum + Number(q.total), 0);

  if (topicEvents.length < 2 || totalQuestions < MIN_SAMPLE_QUESTIONS) {
    return {
      topicId,
      topicName,
      status: 'insufficient_data',
      initialAccuracy: null,
      spacedAccuracy: null,
      accuracyDrop: null,
      daysBetweenAssessments: null,
      sampleQuestionsCount: totalQuestions,
      alertMessage: null,
      recommendedAction: null,
    };
  }

  const firstEvent = topicEvents[0];
  const lastEvent = topicEvents[topicEvents.length - 1];

  const firstDay = parseDayTimestamp(firstEvent.date);
  const lastDay = parseDayTimestamp(lastEvent.date);

  const daysBetween = firstDay !== null && lastDay !== null ? Math.round(lastDay - firstDay) : 0;

  const initialAccuracy = Math.round((Number(firstEvent.correct) / Number(firstEvent.total)) * 100);
  const spacedAccuracy = Math.round((Number(lastEvent.correct) / Number(lastEvent.total)) * 100);
  const drop = initialAccuracy - spacedAccuracy;

  // Condição de Domínio Volátil (Ilusão de Competência):
  // 1. Acerto inicial alto (>= 85%)
  // 2. Intervalo relevante (>= 14 dias)
  // 3. Queda brusca (>= 25 pontos percentuais) ou acerto final frágil (< 60%)
  const isHighInitial = initialAccuracy >= 80;
  const isSpacedInterval = daysBetween >= MIN_SPACED_DAYS_THRESHOLD;
  const isCollapsed = drop >= SIGNIFICANT_DROP_THRESHOLD || spacedAccuracy < 60;

  if (isHighInitial && isSpacedInterval && isCollapsed) {
    return {
      topicId,
      topicName,
      status: 'volatile',
      initialAccuracy,
      spacedAccuracy,
      accuracyDrop: Math.max(0, drop),
      daysBetweenAssessments: daysBetween,
      sampleQuestionsCount: totalQuestions,
      alertMessage: `Domínio Volátil: Acerto caiu de ${initialAccuracy}% para ${spacedAccuracy}% após ${daysBetween} dias.`,
      recommendedAction:
        'Aplicar bateria cega de 15 questões (sem consulta prévia) para restaurar a memória de longo prazo.',
    };
  }

  if (spacedAccuracy >= 75 && isSpacedInterval) {
    return {
      topicId,
      topicName,
      status: 'consolidated',
      initialAccuracy,
      spacedAccuracy,
      accuracyDrop: Math.max(0, drop),
      daysBetweenAssessments: daysBetween,
      sampleQuestionsCount: totalQuestions,
      alertMessage: null,
      recommendedAction: 'Manter revisões espaçadas padrão no calendário.',
    };
  }

  return {
    topicId,
    topicName,
    status: 'emerging',
    initialAccuracy,
    spacedAccuracy,
    accuracyDrop: Math.max(0, drop),
    daysBetweenAssessments: daysBetween,
    sampleQuestionsCount: totalQuestions,
    alertMessage: null,
    recommendedAction: 'Continuar alternando estudo teórico e questões.',
  };
}

/**
 * Varre todos os tópicos de uma lista e retorna os tópicos classificados como voláteis.
 */
export function identifyVolatileTopics(
  topics: Array<{ id: string; name?: string }>,
  questions: QuestionEvent[]
): VolatileMasteryDiagnostic[] {
  return topics
    .map(topic =>
      analyzeTopicVolatileMastery({
        topicId: topic.id,
        topicName: topic.name,
        questions,
      })
    )
    .filter(diagnostic => diagnostic.status === 'volatile');
}
