export const MIN_SESSION_MINUTES = 15;

export interface MaintenanceSignals {
  masteryGap?: number | null;
  retentionRisk?: number | null;
  retentionNeed?: number | null;
  reviewHealthRisk?: number | null;
  reviewUrgency?: number | null;
}

export interface StudyCandidateState extends MaintenanceSignals {
  archived?: boolean;
  blockedPrerequisites?: string[];
  completed?: boolean;
  covered?: boolean;
}

// Candidates are open records built by several services; these functions read only the fields below.
type Open<T> = T & Record<string, any>;

export interface PrerequisiteNode {
  id: string;
  prerequisites?: string[];
  archived?: boolean;
  mastery?: number | null;
  covered?: boolean;
  status?: string;
}

export function needsMaintenance(item: Open<MaintenanceSignals>) {
  return (
    (item.masteryGap != null && item.masteryGap > 40) ||
    ((item.retentionRisk ?? item.retentionNeed) != null &&
      (item.retentionRisk ?? item.retentionNeed) > 40) ||
    (item.reviewHealthRisk != null && item.reviewHealthRisk > 40) ||
    item.reviewUrgency >= 40
  );
}

export function canStudy(
  item: Open<StudyCandidateState> | null | undefined,
  { ignoreToday = false }: { ignoreToday?: boolean } = {}
) {
  return Boolean(
    item &&
    !item.archived &&
    !item.blockedPrerequisites?.length &&
    (ignoreToday || !item.completed) &&
    (!item.covered || needsMaintenance(item))
  );
}

export function sessionMinutes(
  item: Open<{ sessionMinutes?: number | null; estimatedMinutes?: number | null }>,
  availableMinutes: unknown
) {
  const available = Math.floor(Number(availableMinutes) || 0);
  if (available < MIN_SESSION_MINUTES) return 0;
  const desired = Number(item.sessionMinutes ?? item.estimatedMinutes) || 30;
  return Math.min(available, 60, Math.max(MIN_SESSION_MINUTES, Math.round(desired)));
}

// Missing references, archived bases and transitive cycles remain blocked.
export function prerequisiteBlockers(topic: PrerequisiteNode, topics: PrerequisiteNode[] = []) {
  const byId = new Map(topics.map(item => [item.id, item]));
  const blockers = new Set<string>();
  const visit = (id: string, path: Set<string>) => {
    if (path.has(id)) {
      blockers.add(id);
      return;
    }
    const base = byId.get(id);
    if (!base || base.archived) {
      blockers.add(id);
      return;
    }
    const known = base.mastery != null && Number.isFinite(Number(base.mastery));
    if (known ? base.mastery < 60 : !(base.covered || base.status === 'Concluído'))
      blockers.add(id);
    const next = new Set(path);
    next.add(id);
    for (const parent of base.prerequisites || []) visit(parent, next);
  };
  for (const id of topic.prerequisites || []) visit(id, new Set([topic.id]));
  return [...blockers];
}

export function withPrerequisiteEligibility(
  candidates: Open<PrerequisiteNode>[],
  topics: PrerequisiteNode[] = candidates
): Open<PrerequisiteNode & { blockedPrerequisites: string[] }>[] {
  return candidates.map(item => ({
    ...item,
    blockedPrerequisites: prerequisiteBlockers(item, topics),
  }));
}

export function resolveStudyEligibility(
  candidates: Array<
    Open<PrerequisiteNode & { blockedPrerequisites?: string[] }> | null | undefined
  >,
  topics?: PrerequisiteNode[]
): Open<PrerequisiteNode & { blockedPrerequisites: string[] }>[] {
  return candidates.filter(Boolean).map(item => ({
    ...item,
    blockedPrerequisites: topics
      ? prerequisiteBlockers(item, topics)
      : (item.blockedPrerequisites ?? prerequisiteBlockers(item, candidates.filter(Boolean))),
  }));
}
