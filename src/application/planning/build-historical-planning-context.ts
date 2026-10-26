import { capacityForPeriod } from '../../domain/planning/capacity-history.js';

export function buildHistoricalPlanningContext({
  dailyPlans = [],
  capacityHistory = [],
  start,
  end,
}: any = {}) {
  const items = dailyPlans
    .filter((plan: any) => plan.date >= start && plan.date <= end)
    .flatMap((plan: any) =>
      (plan.items || []).map((item: any) => {
        const snapshot =
          item.executionSnapshot?.version === 1 &&
          item.executionSnapshot.historicalContextKnown !== false
            ? item.executionSnapshot
            : null;
        return {
          id: item.id,
          date: plan.date,
          status: item.status || null,
          recorded: Boolean(snapshot),
          planVersion: snapshot?.studyPlanId || null,
          subjectId: snapshot?.subjectId || null,
          topicId: snapshot?.topicId || null,
          activityType: snapshot?.type || null,
          originalMinutes: snapshot?.plannedMinutes ?? null,
          transferredMinutes: Math.max(0, Number(item.transferredMinutes) || 0),
          originItemId: snapshot?.originItemId || null,
          validFrom: snapshot?.validFrom || snapshot?.date || null,
          validUntil: snapshot?.validUntil || snapshot?.date || null,
          prioritySnapshot: snapshot?.prioritySnapshot
            ? structuredClone(snapshot.prioritySnapshot)
            : null,
        };
      })
    );
  const roots = items.filter((item: any) => item.recorded && item.originItemId === item.id);
  return {
    version: 1,
    capacity: capacityForPeriod(capacityHistory, { start, end }),
    items,
    originalRootMinutes: items.every((item: any) => item.recorded)
      ? roots.reduce((sum: any, item: any) => sum + item.originalMinutes, 0)
      : null,
    legacyItems: items.filter((item: any) => !item.recorded).length,
    deferredItems: items.filter((item: any) => item.status === 'deferred').length,
    replacedItems: items.filter((item: any) => item.status === 'replaced').length,
    skippedItems: items.filter((item: any) => ['skipped', 'discarded'].includes(item.status))
      .length,
  };
}
