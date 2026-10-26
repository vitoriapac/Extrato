import {
  freezePlanExecution,
  capturePlanExecution,
  historicalExecutionItem,
} from '../domain/planning/plan-execution-snapshot.js';
const recoveryReason = (item: Record<string, any>) =>
  item.reviewUrgency >= 60
    ? 'revisão próxima do vencimento'
    : item.score >= 70
      ? 'alta prioridade por risco e impacto na prova'
      : item.executedSeconds > 0
        ? 'atividade iniciada e ainda incompleta'
        : item.reason || 'atividade pendente do período';
export function buildReplanProposal({
  plans = [],
  periodStart,
  periodEnd,
  futureDays = [],
}: any = {}) {
  const inPeriod = plans.filter((plan: any) => plan.date >= periodStart && plan.date <= periodEnd);
  const plannedMinutes = inPeriod.reduce(
    (sum: any, plan: any) =>
      sum +
      (plan.items || [])
        .filter((item: any) => !['skipped', 'replaced'].includes(item.status))
        .reduce((n: any, item: any) => n + (Number(item.plannedMinutes) || 0), 0),
    0
  );
  const executedMinutes = Math.round(
    inPeriod.reduce(
      (sum: any, plan: any) =>
        sum +
        (plan.items || []).reduce(
          (n: any, item: any) => n + (Number(item.executedSeconds) || 0) / 60,
          0
        ),
      0
    )
  );
  const pendingItems = inPeriod
    .flatMap((plan: any) =>
      (plan.items || [])
        .filter(
          (item: any) => !['completed', 'skipped', 'replaced', 'deferred'].includes(item.status)
        )
        .map((item: any) => ({
          sourcePlanId: plan.id,
          sourceItemId: item.id,
          subjectId: item.subjectId || null,
          topicId: item.topicId || null,
          remainingMinutes: Math.max(
            0,
            Math.round(
              (Number(item.plannedMinutes) || 0) - (Number(item.executedSeconds) || 0) / 60
            )
          ),
          priority: Number(item.score) || 0,
          reason: recoveryReason(item),
        }))
    )
    .filter((item: any) => item.remainingMinutes > 0)
    .sort((a: any, b: any) => b.priority - a.priority);
  const deficitMinutes = pendingItems.reduce(
    (sum: any, item: any) => sum + item.remainingMinutes,
    0
  );
  const capacities = (futureDays || []).map((day: any) => ({
    date: day.date,
    availableMinutes: Math.max(0, Math.round(Number(day.availableMinutes) || 0)),
    remaining: Math.max(0, Math.round(Number(day.availableMinutes) || 0)),
  }));
  const allocations: any[] = [];
  let remaining = deficitMinutes;
  pendingItems.forEach((item: any) => {
    let itemRemaining = item.remainingMinutes;
    capacities.forEach((day: any) => {
      if (itemRemaining <= 0 || day.remaining <= 0) return;
      const minutes = Math.min(itemRemaining, day.remaining);
      allocations.push({ ...item, date: day.date, minutes });
      itemRemaining -= minutes;
      day.remaining -= minutes;
      remaining -= minutes;
    });
  });
  const redistributedMinutes = allocations.reduce((sum, item) => sum + item.minutes, 0);
  const allocatedBySource = new Map();
  allocations.forEach(item =>
    allocatedBySource.set(
      item.sourceItemId,
      (allocatedBySource.get(item.sourceItemId) || 0) + item.minutes
    )
  );
  const retainedItems = pendingItems
    .filter((item: any) => (allocatedBySource.get(item.sourceItemId) || 0) < item.remainingMinutes)
    .map((item: any) => ({
      ...item,
      unallocatedMinutes: item.remainingMinutes - (allocatedBySource.get(item.sourceItemId) || 0),
    }));
  const capacityByDay = capacities.map((day: any) => ({
    date: day.date,
    availableMinutes: day.availableMinutes,
    allocatedMinutes: day.availableMinutes - day.remaining,
    remainingMinutes: day.remaining,
  }));
  return {
    state: deficitMinutes ? 'proposal' : 'balanced',
    periodStart,
    periodEnd,
    plannedMinutes,
    executedMinutes,
    deficitMinutes,
    redistributedMinutes,
    discardedMinutes: Math.max(0, remaining),
    pendingItems,
    allocations,
    retainedItems,
    capacityByDay,
    reasons: deficitMinutes ? ['execução abaixo do planejado no período'] : [],
  };
}

export function applyReplan({
  dailyPlans = [],
  proposal,
  operationId,
  now,
  idGenerator,
}: any = {}) {
  if (proposal?.state !== 'proposal' || !operationId || typeof idGenerator !== 'function')
    return { changes: [] as any[], createdItems: 0 };
  const changes = [],
    originalStatuses = new Map();
  for (const allocation of proposal.allocations) {
    const sourcePlan = dailyPlans.find((plan: any) => plan.id === allocation.sourcePlanId),
      sourceItem = sourcePlan?.items?.find((item: any) => item.id === allocation.sourceItemId);
    if (!sourceItem) continue;
    if (
      dailyPlans.some((plan: any) =>
        (plan.items || []).some(
          (item: any) =>
            item.rescheduleOperationId === operationId &&
            item.rescheduledFromId === sourceItem.id &&
            item.currentDate === allocation.date
        )
      )
    )
      continue;
    let destination = dailyPlans.find((plan: any) => plan.date === allocation.date);
    if (!destination) {
      destination = {
        id: idGenerator('plan'),
        date: allocation.date,
        availableMinutes: allocation.minutes,
        plannedMinutes: 0,
        flexMinutes: 0,
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      dailyPlans.push(destination);
    }
    const sourceKey = `${sourcePlan.id}:${sourceItem.id}`;
    if (!originalStatuses.has(sourceKey)) originalStatuses.set(sourceKey, sourceItem.status);
    freezePlanExecution(sourceItem, {
      date: sourcePlan.date,
      activeExamTags: sourcePlan.activeExamTags || [],
      capturedAt: now,
      historicalContextKnown: false,
    });
    sourceItem.transferredMinutes =
      (Number(sourceItem.transferredMinutes) || 0) + allocation.minutes;
    sourceItem.status = 'deferred';
    sourceItem.skippedReason = `Redistribuída para ${allocation.date}`;
    sourcePlan.updatedAt = now;
    const created = {
      ...historicalExecutionItem(sourceItem),
      id: idGenerator('plan-item'),
      plannedMinutes: allocation.minutes,
      executedSeconds: 0,
      status: 'planned',
      sessionIds: [],
      originalDate: sourceItem.originalDate || sourcePlan.date,
      currentDate: allocation.date,
      rescheduleCount: (Number(sourceItem.rescheduleCount) || 0) + 1,
      skippedReason: null,
      rescheduledFromId: sourceItem.id,
      rescheduleOperationId: operationId,
      createdAt: now,
      lastExecutedAt: null,
    };
    created.executionSnapshot = capturePlanExecution(created, {
      date: allocation.date,
      activeExamTags: sourceItem.executionSnapshot.activeExamTags,
      capturedAt: now,
      originItemId: sourceItem.executionSnapshot.originItemId,
    });
    created.transferredMinutes = 0;
    destination.items.push(created);
    destination.plannedMinutes = (destination.items || [])
      .filter((item: any) => !['skipped', 'replaced'].includes(item.status))
      .reduce((sum: any, item: any) => sum + (Number(item.plannedMinutes) || 0), 0);
    destination.flexMinutes = Math.max(
      0,
      (Number(destination.availableMinutes) || 0) - destination.plannedMinutes
    );
    destination.updatedAt = now;
    changes.push({
      sourcePlanId: sourcePlan.id,
      sourceItemId: sourceItem.id,
      sourcePreviousStatus: originalStatuses.get(sourceKey),
      destinationPlanId: destination.id,
      destinationItemId: created.id,
      date: allocation.date,
      minutes: allocation.minutes,
    });
  }
  return { changes, createdItems: changes.length, operationId };
}

export function undoReplan({ dailyPlans = [], adjustment }: any = {}) {
  const protectedItems = [],
    undoneChanges = [],
    protectedSources = new Set(),
    sourceKey = (change: Record<string, any>) => `${change.sourcePlanId}:${change.sourceItemId}`;
  for (const change of adjustment?.changes || []) {
    const destination = dailyPlans.find((plan: any) => plan.id === change.destinationPlanId),
      item = destination?.items?.find(
        (candidate: any) => candidate.id === change.destinationItemId
      );
    if (!item) continue;
    const executed =
      Number(item.executedSeconds) > 0 ||
      (item.sessionIds || []).length > 0 ||
      ['in_progress', 'partial', 'completed'].includes(item.status);
    if (executed) {
      protectedItems.push(item.id);
      protectedSources.add(sourceKey(change));
      continue;
    }
    destination.items = destination.items.filter((candidate: any) => candidate.id !== item.id);
    destination.plannedMinutes = destination.items
      .filter((candidate: any) => !['skipped', 'replaced'].includes(candidate.status))
      .reduce((sum: any, candidate: any) => sum + (Number(candidate.plannedMinutes) || 0), 0);
    destination.flexMinutes = Math.max(
      0,
      (Number(destination.availableMinutes) || 0) - destination.plannedMinutes
    );
    undoneChanges.push(change);
  }
  undoneChanges.forEach(change => {
    const source = dailyPlans
      .find((plan: any) => plan.id === change.sourcePlanId)
      ?.items?.find((candidate: any) => candidate.id === change.sourceItemId);
    if (source)
      source.transferredMinutes = Math.max(
        0,
        (Number(source.transferredMinutes) || 0) - change.minutes
      );
  });
  undoneChanges
    .filter(change => !protectedSources.has(sourceKey(change)))
    .forEach(change => {
      const source = dailyPlans
        .find((plan: any) => plan.id === change.sourcePlanId)
        ?.items?.find((candidate: any) => candidate.id === change.sourceItemId);
      if (source) {
        source.status = change.sourcePreviousStatus || 'planned';
        source.skippedReason = null;
      }
    });
  for (let index = dailyPlans.length - 1; index >= 0; index--)
    if (!dailyPlans[index].items?.length) dailyPlans.splice(index, 1);
  return { undoneChanges, protectedItems, complete: protectedItems.length === 0 };
}
