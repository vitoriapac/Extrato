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
const MIN_SPACED_WINDOW_QUESTIONS = 4;
const TARGET_WINDOW_QUESTIONS = 10;
const SIGNIFICANT_DROP_THRESHOLD = 25; // 25 pontos percentuais de queda
const MIN_SPACED_DAYS_THRESHOLD = 14; // Mais de 14 dias entre avaliações

function parseDayTimestamp(dateStr: string): number | null {
  const ts = Date.parse(`${dateStr}T00:00:00Z`);
  return Number.isFinite(ts) ? ts / 86400000 : null;
}

/**
 * Avalia o histórico de questões de um tópico e detecta sinais de falsa consolidação.
 * Agrega eventos próximos em janelas mínima inicial e espaçada recente para evitar falsos
 * positivos com micro-listas de 2–3 questões.
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

  const firstDay = parseDayTimestamp(topicEvents[0].date);
  const initialEvents: QuestionEvent[] = [];
  let initialTotal = 0;
  for (const ev of topicEvents) {
    const evDay = parseDayTimestamp(ev.date);
    if (
      initialEvents.length > 0 &&
      (initialTotal >= TARGET_WINDOW_QUESTIONS ||
        (firstDay !== null && evDay !== null && Math.round(evDay - firstDay) >= MIN_SPACED_DAYS_THRESHOLD))
    ) {
      break;
    }
    initialEvents.push(ev);
    initialTotal += Number(ev.total);
  }
  const initialCorrect = initialEvents.reduce((sum, ev) => sum + Number(ev.correct), 0);
  const initialLastDay = parseDayTimestamp(initialEvents[initialEvents.length - 1].date);

  const remaining = topicEvents.slice(initialEvents.length);
  const spacedCandidates = remaining.filter(ev => {
    const evDay = parseDayTimestamp(ev.date);
    return (
      initialLastDay !== null &&
      evDay !== null &&
      Math.round(evDay - initialLastDay) >= MIN_SPACED_DAYS_THRESHOLD
    );
  });

  if (spacedCandidates.length > 0) {
    const spacedEvents: QuestionEvent[] = [];
    let spacedTotal = 0;
    for (let i = spacedCandidates.length - 1; i >= 0; i--) {
      spacedEvents.push(spacedCandidates[i]);
      spacedTotal += Number(spacedCandidates[i].total);
      if (spacedTotal >= TARGET_WINDOW_QUESTIONS) break;
    }
    const spacedCorrect = spacedEvents.reduce((sum, ev) => sum + Number(ev.correct), 0);
    const lastSpacedDay = parseDayTimestamp(spacedCandidates[spacedCandidates.length - 1].date);
    const daysBetween =
      initialLastDay !== null && lastSpacedDay !== null ? Math.round(lastSpacedDay - initialLastDay) : 0;

    if (initialTotal < MIN_SPACED_WINDOW_QUESTIONS || spacedTotal < MIN_SPACED_WINDOW_QUESTIONS) {
      return {
        topicId,
        topicName,
        status: 'insufficient_data',
        initialAccuracy: Math.round((initialCorrect / initialTotal) * 100),
        spacedAccuracy: null,
        accuracyDrop: null,
        daysBetweenAssessments: daysBetween,
        sampleQuestionsCount: totalQuestions,
        alertMessage: null,
        recommendedAction: null,
      };
    }

    const initialAccuracy = Math.round((initialCorrect / initialTotal) * 100);
    const spacedAccuracy = Math.round((spacedCorrect / spacedTotal) * 100);
    const drop = initialAccuracy - spacedAccuracy;
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

  const lastEvent = topicEvents[topicEvents.length - 1];
  const lastDay = parseDayTimestamp(lastEvent.date);
  const daysBetween = initialLastDay !== null && lastDay !== null ? Math.round(lastDay - initialLastDay) : 0;
  const initialAccuracy = Math.round((initialCorrect / initialTotal) * 100);
  const spacedAccuracy = Math.round((Number(lastEvent.correct) / Number(lastEvent.total)) * 100);
  const drop = initialAccuracy - spacedAccuracy;

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
