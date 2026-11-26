// "Trocar no plano": the diagnosis suggestion takes the place of today's lowest-priority block
// that has not been touched yet. Started, partial or finished blocks are never swapped out.
interface PlanItem {
  id: string;
  status: string;
  topicId?: string | null;
  executedSeconds?: number;
  sessionIds?: string[];
  score?: number;
  position?: number;
  plannedMinutes?: number;
  prioritySnapshot?: { score?: number | null } | null;
  [key: string]: unknown;
}
interface Plan {
  items: PlanItem[];
  plannedMinutes?: number;
  updatedAt?: string;
}

// Blocks distributed from the weekly plan keep their score only in the priority snapshot.
const priorityOf = (item: PlanItem) => Number(item.score ?? item.prioritySnapshot?.score) || 0;

export function planSwapCandidate(
  plan: Plan | null | undefined,
  suggestionTopicId?: string | null
) {
  const untouched = (plan?.items || []).filter(
    item =>
      item.status === 'planned' &&
      !Number(item.executedSeconds) &&
      !(item.sessionIds || []).length &&
      item.topicId !== suggestionTopicId
  );
  // Lowest score goes first; on a tie, the block later in the day.
  return (
    [...untouched].sort(
      (a, b) =>
        priorityOf(a) - priorityOf(b) || (Number(b.position) || 0) - (Number(a.position) || 0)
    )[0] || null
  );
}

export function applyPlanSwap(plan: Plan, replacedId: string, newItem: PlanItem, now: string) {
  const old = plan.items.find(item => item.id === replacedId);
  if (!old || old.status !== 'planned') return null;
  old.status = 'replaced';
  old.skippedReason = 'Trocado pela sugestão do diagnóstico';
  old.replacedByItemId = newItem.id;
  newItem.position = old.position;
  newItem.replacesItemId = old.id;
  plan.items.push(newItem);
  plan.plannedMinutes =
    (Number(plan.plannedMinutes) || 0) -
    (Number(old.plannedMinutes) || 0) +
    (Number(newItem.plannedMinutes) || 0);
  plan.updatedAt = now;
  return { replaced: old, added: newItem };
}
