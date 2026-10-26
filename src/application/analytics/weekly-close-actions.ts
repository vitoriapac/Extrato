export function buildWeeklyCloseActionProposal({
  priorities = [],
  selectedIds = [],
  futureDays = [],
  snapshotId = null,
}: any = {}) {
  const selected = priorities.filter((item: any, index: any) =>
    selectedIds.includes(item.priorityId || item.topicId || String(index))
  );
  const capacity = (futureDays || []).map((day: any) => ({
    date: day.date,
    remaining: Math.max(0, Math.round(Number(day.availableMinutes) || 0)),
    availableMinutes: Math.max(0, Math.round(Number(day.availableMinutes) || 0)),
  }));
  const allocations: any[] = [];
  let unallocated = 0;
  selected.forEach((item: any, index: any) => {
    let left = Math.max(0, Math.round(Number(item.estimatedMinutes) || 0));
    for (const day of capacity) {
      if (!left || !day.remaining) continue;
      const minutes = Math.min(left, day.remaining);
      allocations.push({
        priorityId: item.priorityId || item.topicId || String(index),
        topicId: item.topicId || null,
        subjectId: item.subjectId || null,
        minutes,
        date: day.date,
        action: item.action,
        reason: item.reason,
        snapshotId,
      });
      left -= minutes;
      day.remaining -= minutes;
    }
    unallocated += left;
  });
  return {
    selectedCount: selected.length,
    allocations,
    unallocatedMinutes: unallocated,
    capacityByDay: capacity.map((day: any) => ({
      date: day.date,
      availableMinutes: day.availableMinutes,
      allocatedMinutes: day.availableMinutes - day.remaining,
      remainingMinutes: day.remaining,
    })),
    snapshotId,
  };
}
