import { capturePlanPriority } from '../../domain/planning/plan-priority-snapshot.js';
export function createStudyPlanService({
  repository,
  calculate,
  clock,
  idGenerator,
  algorithmVersion = () => 1,
  getActiveExamTags = (): string[] => [],
}: any = {}) {
  if (!repository || typeof repository.saveStudyPlan !== 'function')
    throw new TypeError('Serviço de plano requer repositório.');
  return Object.freeze({
    calculate: (input: unknown) => calculate(input),
    confirm: (proposal: Record<string, any> | null | undefined) => {
      if (!proposal || proposal.state === 'insufficient' || !proposal.items?.length) return null;
      const id = idGenerator('study-plan'),
        confirmedAt = clock.nowISO(),
        plan = {
          ...structuredClone(proposal),
          id,
          confirmedAt,
          activeExamTags: [...getActiveExamTags()],
          algorithmVersion: algorithmVersion(),
          dailyPlanOperations: [] as any[],
          items: proposal.items.map((item: any) => ({
            ...structuredClone(item),
            prioritySnapshot: item.prioritySnapshot
              ? structuredClone(item.prioritySnapshot)
              : capturePlanPriority(item, {
                  capturedAt: confirmedAt,
                  algorithmVersion: algorithmVersion(),
                }),
            id: idGenerator('study-plan-item'),
            topicId: item.topicId || item.id,
            studyPlanId: id,
          })),
        };
      return repository.saveStudyPlan(plan);
    },
    getActive: () => repository.getActiveStudyPlan(),
    listVersions: () =>
      [...repository.getStudyPlans()].sort((a, b) =>
        String(b.confirmedAt || '').localeCompare(String(a.confirmedAt || ''))
      ),
  });
}
