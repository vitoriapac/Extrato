export interface MixedReviewBatchItem {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  topicName: string;
  date: string;
  type: string;
  isOverdue: boolean;
}

export interface MixedReviewBatch {
  subjectId: string;
  subjectName: string;
  items: MixedReviewBatchItem[];
  count: number;
  overdueCount: number;
  recommendedQuestions: number;
  estimatedMinutes: number;
  impactWeight: number;
}

export interface WeeklyReviewBudgetEvaluation {
  budgetPct: number;
  isCustom: boolean;
  budgetMinutes: number;
  usedMinutes: number;
  usedPct: number;
  exceeded: boolean;
}

const PRIORITY_FACTOR: Record<string, number> = {
  high: 1.4,
  normal: 1.0,
  low: 0.7,
};

/**
 * Identifica disciplinas com >= 3 revisões vencidas ou de hoje e consolida em um lote de Bateria Mista.
 */
export interface MixedReviewAgendaEntry {
  id: string;
  date?: string | null;
  status?: string | null;
  type?: string | null;
  topicId?: string | null;
  topicRef?: string | null;
  subjectId?: string | null;
  subjectRef?: string | null;
}

export interface MixedReviewSubjectEntry {
  id: string;
  name?: string | null;
  topics?: Array<{ id?: string | null; difficulty?: string | null }>;
}

export interface MixedReviewBlueprintSubjectEntry {
  subjectId?: string | null;
  questionWeight?: number | null;
  priority?: string | null;
}

export function buildMixedReviewBatches({
  reviewAgenda = [],
  subjects = [],
  blueprintSubjects = [],
  today,
  entitySubjectId = (item: MixedReviewAgendaEntry) => item?.subjectId || item?.subjectRef || null,
  getTopicName = (id: string) => id || 'Tópico',
}: {
  reviewAgenda?: MixedReviewAgendaEntry[];
  subjects?: MixedReviewSubjectEntry[];
  blueprintSubjects?: MixedReviewBlueprintSubjectEntry[];
  today: string;
  entitySubjectId?: (item: MixedReviewAgendaEntry) => string | null;
  getTopicName?: (id: string) => string;
}): MixedReviewBatch[] {
  const subjectNameMap = new Map<string, string>();
  const topicToSubjectMap = new Map<string, string>();
  for (const subject of subjects || []) {
    if (!subject?.id) continue;
    subjectNameMap.set(subject.id, subject.name || 'Disciplina');
    for (const topic of subject.topics || []) {
      if (topic?.id) topicToSubjectMap.set(topic.id, subject.id);
    }
  }

  const bpMap = new Map<string, MixedReviewBlueprintSubjectEntry>();
  for (const item of blueprintSubjects || []) {
    if (item?.subjectId) bpMap.set(item.subjectId, item);
  }

  const grouped = new Map<string, MixedReviewBatchItem[]>();
  for (const review of reviewAgenda || []) {
    if (!review || review.status === 'Concluído' || !review.date || review.date > today) continue;
    const topicId = review.topicId || review.topicRef || null;
    const subjectId =
      entitySubjectId(review) || (topicId ? topicToSubjectMap.get(topicId) || null : null);
    if (!subjectId) continue;

    const list = grouped.get(subjectId) || [];
    list.push({
      id: review.id,
      subjectId,
      topicId,
      topicName: topicId ? getTopicName(topicId) : 'Revisão geral',
      date: review.date,
      type: review.type || 'Revisão',
      isOverdue: review.date < today,
    });
    grouped.set(subjectId, list);
  }

  const batches: MixedReviewBatch[] = [];
  for (const [subjectId, items] of grouped) {
    if (items.length < 3) continue;
    const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const overdueCount = sortedItems.filter(item => item.isOverdue).length;
    const bp = bpMap.get(subjectId);
    const weight = Math.max(0.1, Number(bp?.questionWeight ?? 1) || 1);
    const priorityFactor = PRIORITY_FACTOR[bp?.priority || 'normal'] ?? 1;
    const impactWeight = Math.round(weight * priorityFactor * 100) / 100;

    batches.push({
      subjectId,
      subjectName: subjectNameMap.get(subjectId) || 'Disciplina',
      items: sortedItems,
      count: sortedItems.length,
      overdueCount,
      recommendedQuestions: Math.min(40, Math.max(15, sortedItems.length * 5)),
      estimatedMinutes: Math.min(60, Math.max(25, sortedItems.length * 8)),
      impactWeight,
    });
  }

  return batches.sort(
    (a, b) =>
      Number(b.overdueCount > 0) - Number(a.overdueCount > 0) ||
      b.impactWeight - a.impactWeight ||
      b.count - a.count ||
      a.subjectName.localeCompare(b.subjectName)
  );
}

/**
 * Avalia o consumo do teto semanal de revisão em minutos. Padrão sugerido: 25%.
 */
export function evaluateWeeklyReviewBudget({
  plannedWeeklyMinutes = 0,
  reviewMinutesThisWeek = 0,
  budgetPct = null,
}: {
  plannedWeeklyMinutes?: number;
  reviewMinutesThisWeek?: number;
  budgetPct?: number | null;
} = {}): WeeklyReviewBudgetEvaluation {
  const isCustom =
    budgetPct != null && Number.isFinite(Number(budgetPct)) && Number(budgetPct) > 0;
  const effectivePct = isCustom ? Math.min(60, Math.max(10, Math.round(Number(budgetPct)))) : 25;
  const totalPlanned = Math.max(0, Math.round(Number(plannedWeeklyMinutes) || 0));
  const budgetMinutes = totalPlanned > 0 ? Math.round((totalPlanned * effectivePct) / 100) : 0;
  const usedMinutes = Math.max(0, Math.round(Number(reviewMinutesThisWeek) || 0));
  const usedPct = totalPlanned > 0 ? Math.round((usedMinutes / totalPlanned) * 100) : 0;

  return {
    budgetPct: effectivePct,
    isCustom,
    budgetMinutes,
    usedMinutes,
    usedPct,
    exceeded: budgetMinutes > 0 && usedMinutes > budgetMinutes,
  };
}
