/**
 * Motor de Missão de Recuperação de Atrasos (src/domain/recovery/recovery-mission-engine.ts)
 *
 * Seleciona e dimensiona blocos sequenciais de revisão com base no tempo disponível
 * informado pelo estudante (ex.: 30, 45, 60 min), priorizando matérias de maior urgência,
 * volatilidade e peso na prova para maximizar o resgate do déficit sem sobrecarga.
 *
 * Módulo puramente algorítmico e determinístico, sem dependência de DOM ou storage.
 */

export interface OverdueReviewItem {
  id: string;
  origin: string;
  date: string;
  subjectId?: string | null;
  subjectName: string;
  topicId?: string | null;
  topicName: string;
  daysOverdue: number;
  priorityScore?: number | null;
  isCriticalRisk?: boolean;
}

export interface RecoveryMissionBlock {
  id: string;
  reviewId: string;
  origin: string;
  subjectId?: string | null;
  subjectName: string;
  topicId?: string | null;
  topicName: string;
  durationMinutes: number;
  urgencyScore: number;
  urgencyReason: string;
}

export interface RecoveryMissionPlan {
  availableMinutes: number;
  blockDurationMinutes: number;
  totalAllocatedMinutes: number;
  totalReviewsInDebt: number;
  rescuedReviewsCount: number;
  remainingDebtCount: number;
  blocks: RecoveryMissionBlock[];
}

export interface BuildRecoveryMissionOptions {
  overdueItems: readonly OverdueReviewItem[];
  availableMinutes: number;
  blockDurationMinutes?: number;
  criticalTopicIds?: ReadonlySet<string> | readonly string[];
}

/**
 * Calcula a pontuação de urgência pedagógica para priorizar o resgate da revisão.
 */
export function calculateReviewUrgencyScore(
  item: OverdueReviewItem,
  criticalTopicIds?: ReadonlySet<string> | readonly string[]
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Dias de atraso (curva de esquecimento de Ebbinghaus)
  const days = Math.max(1, item.daysOverdue || 1);
  const daysComponent = Math.min(50, days * 5);
  score += daysComponent;
  if (days >= 7) {
    reasons.push(`${days} dias de atraso`);
  } else if (days > 1) {
    reasons.push(`${days} dias de atraso`);
  } else {
    reasons.push('Venceu recentemente');
  }

  // 2. Tópico crítico / retenção volátil
  const isCritical =
    Boolean(item.isCriticalRisk) ||
    Boolean(
      item.topicId &&
        criticalTopicIds &&
        (Array.isArray(criticalTopicIds)
          ? criticalTopicIds.includes(item.topicId)
          : (criticalTopicIds as ReadonlySet<string>).has(item.topicId))
    );

  if (isCritical) {
    score += 40;
    reasons.push('Risco de esquecimento / volatilidade');
  }

  // 3. Relevância de edital / prioridade do candidato
  const priority = Number(item.priorityScore) || 0;
  if (priority >= 70) {
    score += 30;
    reasons.push('Alta relevância na prova');
  } else if (priority >= 40) {
    score += 15;
  }

  return {
    score,
    reason: reasons.join(' · '),
  };
}

/**
 * Constrói o plano de blocos da missão de recuperação com base no tempo disponível.
 */
export function buildRecoveryMissionPlan({
  overdueItems = [],
  availableMinutes,
  blockDurationMinutes = 15,
  criticalTopicIds,
}: BuildRecoveryMissionOptions): RecoveryMissionPlan {
  const safeMinutes = Math.max(0, Math.floor(Number(availableMinutes) || 0));
  const safeBlockDuration = Math.max(5, Math.floor(Number(blockDurationMinutes) || 15));

  if (safeMinutes <= 0 || overdueItems.length === 0) {
    return {
      availableMinutes: safeMinutes,
      blockDurationMinutes: safeBlockDuration,
      totalAllocatedMinutes: 0,
      totalReviewsInDebt: overdueItems.length,
      rescuedReviewsCount: 0,
      remainingDebtCount: overdueItems.length,
      blocks: [],
    };
  }

  const maxBlocks = Math.floor(safeMinutes / safeBlockDuration);
  if (maxBlocks <= 0) {
    return {
      availableMinutes: safeMinutes,
      blockDurationMinutes: safeBlockDuration,
      totalAllocatedMinutes: 0,
      totalReviewsInDebt: overdueItems.length,
      rescuedReviewsCount: 0,
      remainingDebtCount: overdueItems.length,
      blocks: [],
    };
  }

  // Ordena itens pela urgência decrescente
  const scoredItems = overdueItems.map((item, idx) => {
    const { score, reason } = calculateReviewUrgencyScore(item, criticalTopicIds);
    return { item, score, reason, originalIndex: idx };
  });

  scoredItems.sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);

  const selected = scoredItems.slice(0, maxBlocks);

  const blocks: RecoveryMissionBlock[] = selected.map(({ item, score, reason }, index) => ({
    id: `block-${index + 1}-${item.id}`,
    reviewId: item.id,
    origin: item.origin,
    subjectId: item.subjectId || null,
    subjectName: item.subjectName || 'Disciplina',
    topicId: item.topicId || null,
    topicName: item.topicName || 'Tópico de Estudo',
    durationMinutes: safeBlockDuration,
    urgencyScore: score,
    urgencyReason: reason,
  }));

  const totalAllocatedMinutes = blocks.length * safeBlockDuration;

  return {
    availableMinutes: safeMinutes,
    blockDurationMinutes: safeBlockDuration,
    totalAllocatedMinutes,
    totalReviewsInDebt: overdueItems.length,
    rescuedReviewsCount: blocks.length,
    remainingDebtCount: Math.max(0, overdueItems.length - blocks.length),
    blocks,
  };
}
