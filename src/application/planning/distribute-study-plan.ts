import { freezePlanExecution } from '../../domain/planning/plan-execution-snapshot.js';
const ACTIVE_STATUSES = new Set(['planned', 'in_progress', 'partial', 'completed', 'deferred']);
const clampMinutes = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));

function existingSourceKeys(plans: any[] | null | undefined, studyPlanId: string) {
  return new Set(
    (plans || []).flatMap((plan: any) =>
      (plan.items || [])
        .filter(
          (item: any) =>
            item.studyPlanId === studyPlanId &&
            item.studyPlanItemId &&
            ACTIVE_STATUSES.has(item.status)
        )
        .map((item: any) => item.studyPlanItemId)
    )
  );
}

export function buildDailyPlanProposal({
  studyPlan,
  existingPlans = [],
  days = [],
  dueReviews = [],
  reserveRatio = 0.1,
  eligibleTopicIds = null,
}: any = {}) {
  if (!studyPlan?.id || !Array.isArray(studyPlan.items))
    return {
      state: 'insufficient',
      reason: 'Plano semanal ausente.',
      days: [] as any[],
      plannedMinutes: 0,
      unallocatedMinutes: 0,
    };
  const existingKeys = existingSourceKeys(existingPlans, studyPlan.id),
    ratio = Math.max(0, Math.min(0.4, Number(reserveRatio) || 0));
  const slots = (days || []).map((day: any) => {
    const existing = existingPlans
      .filter((plan: any) => plan.date === day.date)
      .flatMap((plan: any) => plan.items || [])
      .filter((item: any) => !['skipped', 'replaced'].includes(item.status))
      .reduce((sum: any, item: any) => sum + clampMinutes(item.plannedMinutes), 0);
    const available = clampMinutes(day.availableMinutes),
      reserve = Math.round(available * ratio),
      capacity = Math.max(0, available - reserve - existing);
    return {
      date: day.date,
      availableMinutes: available,
      reserveMinutes: reserve,
      existingMinutes: existing,
      remaining: capacity,
      items: [] as any[],
    };
  });
  const candidates: any[] = [];
  const allowed = (topicId: string) =>
    eligibleTopicIds === null || eligibleTopicIds.includes(topicId);
  (dueReviews || [])
    .filter(
      (review: any) =>
        review?.topicId &&
        review?.date &&
        allowed(review.topicId) &&
        !existingKeys.has(`review:${review.id}`)
    )
    .forEach((review: any, index: any) =>
      candidates.push({
        studyPlanItemId: `review:${review.id || index}`,
        subjectId: review.subjectId || null,
        topicId: review.topicId,
        subjectName: review.subjectName || '',
        topicName: review.topicName || '',
        type: 'review',
        minutes: clampMinutes(review.minutes || 25),
        dueDate: review.date,
        origin: 'review',
      })
    );
  studyPlan.items
    .filter((item: any) => allowed(item.topicId || item.id) && !existingKeys.has(item.id))
    .forEach((item: any) => {
      const mixes = [
        ['review', item.activityMix?.reviews],
        ['questions', item.activityMix?.questions],
        ['study', item.activityMix?.theory],
      ].filter(([, minutes]) => clampMinutes(minutes) > 0);
      (mixes.length ? mixes : [['study', item.minutes]]).forEach(([type, minutes]) =>
        candidates.push({
          studyPlanItemId: item.id,
          subjectId: item.subjectId || null,
          topicId: item.topicId || item.id || null,
          subjectName: item.subjectName || '',
          topicName: item.topicName || '',
          type,
          prioritySnapshot: item.prioritySnapshot ? structuredClone(item.prioritySnapshot) : null,
          minutes: clampMinutes(minutes),
          dueDate: null,
          origin: 'study-plan',
        })
      );
    });
  let unallocatedMinutes = 0;
  for (const candidate of candidates) {
    let remaining = candidate.minutes;
    const ordered = candidate.dueDate
      ? [...slots].sort(
          (a, b) =>
            Math.abs(a.date.localeCompare(candidate.dueDate)) -
            Math.abs(b.date.localeCompare(candidate.dueDate))
        )
      : slots;
    for (const slot of ordered) {
      while (remaining > 0 && slot.remaining >= 15) {
        const chunk = Math.min(60, remaining, slot.remaining),
          minutes = chunk < 15 ? 0 : chunk;
        if (!minutes) break;
        slot.items.push({ ...candidate, minutes });
        slot.remaining -= minutes;
        remaining -= minutes;
      }
      if (remaining <= 0) break;
    }
    unallocatedMinutes += remaining;
  }
  const proposalDays = slots
    .filter((slot: any) => slot.items.length)
    .map((slot: any) => ({
      ...slot,
      plannedMinutes: slot.items.reduce((sum: any, item: any) => sum + item.minutes, 0),
      flexMinutes: slot.reserveMinutes + slot.remaining,
    }));
  const plannedMinutes = proposalDays.reduce((sum: any, day: any) => sum + day.plannedMinutes, 0);
  return {
    state: plannedMinutes ? 'proposal' : 'insufficient',
    studyPlanId: studyPlan.id,
    activeExamTags: [...(studyPlan.activeExamTags || [])],
    days: proposalDays,
    plannedMinutes,
    unallocatedMinutes,
    existingLinkedItems: existingKeys.size,
    reserveRatio: ratio,
    reason: plannedMinutes ? null : 'Não há capacidade ou itens novos para distribuir.',
  };
}

export function applyDailyPlanProposal({
  dailyPlans = [],
  proposal,
  operationId,
  now,
  idGenerator,
}: any = {}) {
  if (proposal?.state !== 'proposal' || !operationId || typeof idGenerator !== 'function')
    return { createdItems: 0, createdPlans: 0 };
  const existing = new Set(
    dailyPlans.flatMap((plan: any) =>
      (plan.items || [])
        .filter((item: any) => item.studyPlanId === proposal.studyPlanId && item.studyPlanItemId)
        .map((item: any) => `${item.studyPlanItemId}:${item.type}:${item.currentDate || plan.date}`)
    )
  );
  let createdItems = 0,
    createdPlans = 0;
  proposal.days.forEach((day: any) => {
    let plan = dailyPlans.find((item: any) => item.date === day.date);
    if (!plan) {
      plan = {
        id: idGenerator('plan'),
        date: day.date,
        availableMinutes: day.availableMinutes,
        plannedMinutes: 0,
        flexMinutes: day.availableMinutes,
        createdAt: now,
        updatedAt: now,
        studyPlanId: proposal.studyPlanId,
        generationOperationId: operationId,
        items: [],
      };
      dailyPlans.push(plan);
      createdPlans++;
    }
    day.items.forEach((source: any) => {
      const key = `${source.studyPlanItemId}:${source.type}:${day.date}`;
      if (existing.has(key)) return;
      existing.add(key);
      plan.items.push({
        id: idGenerator('plan-item'),
        subjectId: source.subjectId,
        topicId: source.topicId,
        subjectName: source.subjectName,
        topicName: source.topicName,
        type: source.type,
        prioritySnapshot: source.prioritySnapshot ? structuredClone(source.prioritySnapshot) : null,
        plannedMinutes: source.minutes,
        executedSeconds: 0,
        status: 'planned',
        sessionIds: [],
        position: plan.items.length + 1,
        statusIcon: 'calendar',
        statusLabel: 'Plano semanal',
        reason:
          source.origin === 'review'
            ? 'Revisão prevista para o período'
            : 'Distribuição confirmada do plano semanal',
        action:
          source.type === 'questions'
            ? 'Resolver questões'
            : source.type === 'review'
              ? 'Revisar o tópico'
              : 'Estudar o tópico',
        recommendedQuestions: 0,
        originalDate: day.date,
        currentDate: day.date,
        rescheduleCount: 0,
        skippedReason: null,
        recommendationId: null,
        studyPlanId: proposal.studyPlanId,
        studyPlanItemId: source.studyPlanItemId,
        generationOperationId: operationId,
        createdAt: now,
      });
      freezePlanExecution(plan.items.at(-1), {
        date: day.date,
        activeExamTags: proposal.activeExamTags || [],
        capturedAt: now,
        studyPlanId: proposal.studyPlanId,
      });
      createdItems++;
    });
    plan.plannedMinutes = (plan.items || [])
      .filter((item: any) => !['skipped', 'replaced'].includes(item.status))
      .reduce((sum: any, item: any) => sum + clampMinutes(item.plannedMinutes), 0);
    plan.flexMinutes = Math.max(0, plan.availableMinutes - plan.plannedMinutes);
    plan.updatedAt = now;
  });
  return { createdItems, createdPlans, operationId };
}

export function undoDailyPlanGeneration({ dailyPlans = [], operationId }: any = {}) {
  let removedItems = 0;
  const protectedItems: any[] = [];
  for (let index = dailyPlans.length - 1; index >= 0; index--) {
    const plan = dailyPlans[index];
    plan.items = (plan.items || []).filter((item: any) => {
      if (item.generationOperationId !== operationId) return true;
      const executed =
        Number(item.executedSeconds) > 0 ||
        (item.sessionIds || []).length > 0 ||
        ['in_progress', 'partial', 'completed'].includes(item.status);
      if (executed) {
        protectedItems.push(item.id);
        return true;
      }
      removedItems++;
      return false;
    });
    plan.plannedMinutes = plan.items
      .filter((item: any) => !['skipped', 'replaced'].includes(item.status))
      .reduce((sum: any, item: any) => sum + clampMinutes(item.plannedMinutes), 0);
    plan.flexMinutes = Math.max(0, (Number(plan.availableMinutes) || 0) - plan.plannedMinutes);
    if (!plan.items.length && plan.generationOperationId === operationId)
      dailyPlans.splice(index, 1);
  }
  return { removedItems, protectedItems, complete: protectedItems.length === 0 };
}
