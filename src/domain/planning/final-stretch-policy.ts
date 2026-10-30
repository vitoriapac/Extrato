/**
 * Modo Reta Final Policy (src/domain/planning/final-stretch-policy.ts)
 *
 * Adapta dinamicamente a estratégia de planejamento e recomendação à medida
 * que a data da prova se aproxima (limiar padrão < 15 dias).
 *
 * Regras principais:
 * 1. Gatilho ativado quando faltam menos de 15 dias para a prova alvo (dias >= 0).
 * 2. Inversão da matriz de esforço: alocação maciça (80%+) em questões e revisões.
 * 3. Congelamento de novos tópicos teóricos densos que nunca foram estudados.
 * 4. Foco agressivo em tópicos com alta incidência em prova (>= 60%) e acerto frágil (< 70%).
 */

export const FINAL_STRETCH_THRESHOLD_DAYS = 15;

/** Relação de distribuição de carga no Modo Reta Final: 15% teoria rápida, 50% questões, 35% revisões. */
export const FINAL_STRETCH_RATIOS = Object.freeze({
  theory: 0.15,
  questions: 0.5,
  reviews: 0.35,
});

export interface FinalStretchTopicInput {
  topicId: string;
  subjectId?: string;
  topicName?: string;
  sessionsCount?: number;
  totalStudySeconds?: number;
  historicalPresencePercent?: number | null;
  currentMastery?: number | null;
  recentAccuracy?: number | null;
}

export interface FinalStretchBanner {
  active: boolean;
  daysToExam: number | null;
  badge: string;
  title: string;
  message: string;
  urgency: 'critical' | 'high' | 'normal';
}

/**
 * Determina se o Modo Reta Final deve estar ativo com base no prazo para a prova.
 */
export function isFinalStretchActive(
  daysToExam: number | null | undefined,
  thresholdDays: number = FINAL_STRETCH_THRESHOLD_DAYS
): boolean {
  if (daysToExam == null || !Number.isFinite(daysToExam)) return false;
  return daysToExam >= 0 && daysToExam < thresholdDays;
}

/**
 * Retorna as proporções de estudo recomendadas.
 * Se o modo reta final estiver ativo, prioriza 85% entre questões e revisões.
 */
export function resolvePhaseRatios(
  daysToExam: number | null | undefined,
  fallbackRatios = { theory: 0.5, questions: 0.3, reviews: 0.2 }
): { theory: number; questions: number; reviews: number; isFinalStretch: boolean } {
  if (isFinalStretchActive(daysToExam)) {
    return {
      ...FINAL_STRETCH_RATIOS,
      isFinalStretch: true,
    };
  }
  return {
    ...fallbackRatios,
    isFinalStretch: false,
  };
}

/**
 * Determina se um tópico teórico novo deve ter sua abertura bloqueada no modo reta final.
 * Tópicos sem sessões prévias e sem tempo registrado são congelados para evitar dispersão.
 */
export function shouldFreezeNewTheoryTopic(
  topic: FinalStretchTopicInput,
  daysToExam: number | null | undefined
): boolean {
  if (!isFinalStretchActive(daysToExam)) return false;
  const sessions = topic.sessionsCount ?? 0;
  const seconds = topic.totalStudySeconds ?? 0;
  return sessions === 0 && seconds === 0;
}

/**
 * Calcula um multiplicador de urgência/peso para o tópico no Modo Reta Final.
 * Tópicos com alta presença no edital (>= 60%) e domínio instável (< 70%) recebem até 3.0x de boost.
 */
export function calculateFinalStretchWeightMultiplier(
  topic: FinalStretchTopicInput,
  daysToExam: number | null | undefined
): number {
  if (!isFinalStretchActive(daysToExam)) return 1.0;

  const presence = topic.historicalPresencePercent ?? 0;
  const mastery = topic.currentMastery ?? topic.recentAccuracy ?? 50;

  // Lacuna Crítica de Prova: alta presença (>= 60%) e domínio frágil (< 70%)
  if (presence >= 60 && mastery < 70) {
    // Escala proporcional aos dias restantes: quanto mais perto, mais urgente
    const days = Math.max(1, daysToExam!);
    if (days <= 5) return 3.0;
    if (days <= 10) return 2.5;
    return 2.0;
  }

  // Tópico com alta presença mas já dominado (>= 85%): apenas manutenção leve (0.8x)
  if (presence >= 60 && mastery >= 85) {
    return 0.8;
  }

  // Tópico de baixa presença (< 30%) no modo reta final: despriorizado (0.4x)
  if (presence < 30) {
    return 0.4;
  }

  return 1.0;
}

/**
 * Monta o banner explicativo de Reta Final para o topo da aplicação.
 */
export function buildFinalStretchBanner(
  daysToExam: number | null | undefined,
  examName?: string
): FinalStretchBanner {
  const active = isFinalStretchActive(daysToExam);
  if (!active || daysToExam == null) {
    return {
      active: false,
      daysToExam: null,
      badge: '',
      title: '',
      message: '',
      urgency: 'normal',
    };
  }

  const examLabel = examName ? ` para ${examName}` : '';
  const daysText =
    daysToExam === 0 ? 'é hoje!' : daysToExam === 1 ? 'falta 1 dia' : `faltam ${daysToExam} dias`;
  const urgency = daysToExam <= 5 ? 'critical' : 'high';

  return {
    active: true,
    daysToExam,
    badge: 'Modo Reta Final',
    title: `Reta Final Ativada: ${daysText}${examLabel}`,
    message:
      daysToExam <= 5
        ? 'Foco total em simulados rápidos, revisão de pontos críticos e baterias cegas de questões. Novos tópicos teóricos suspensos.'
        : 'Carga priorizada em questões de fixação (50%) e revisões ativas (35%). Fechamento direcionado das principais lacunas do edital.',
    urgency,
  };
}
