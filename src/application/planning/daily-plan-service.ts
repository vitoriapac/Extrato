export function createDailyPlanService({
  repository,
  buildProposal,
  applyProposal,
  undoGeneration,
  clock,
  idGenerator,
}: any = {}) {
  if (!repository || typeof repository.getDailyPlans !== 'function')
    throw new TypeError('Serviço diário requer repositório.');
  return Object.freeze({
    calculate: (input: Record<string, any>) =>
      buildProposal({ ...input, existingPlans: repository.getDailyPlans() }),
    confirm: (proposal: Record<string, any>, studyPlan: Record<string, any>) => {
      const operationId = idGenerator('daily-plan-operation'),
        createdAt = clock.nowISO(),
        result = applyProposal({
          dailyPlans: repository.getDailyPlans(),
          proposal,
          operationId,
          now: createdAt,
          idGenerator,
        });
      studyPlan.dailyPlanOperations = Array.isArray(studyPlan.dailyPlanOperations)
        ? studyPlan.dailyPlanOperations
        : [];
      studyPlan.dailyPlanOperations.push({
        id: operationId,
        createdAt,
        createdItems: result.createdItems,
        undoneAt: null,
      });
      return result;
    },
    undo: (operation: Record<string, any>, studyPlan: Record<string, any>) => {
      const result = undoGeneration({
        dailyPlans: repository.getDailyPlans(),
        operationId: operation.id,
      });
      operation.undoneAt = result.complete ? clock.nowISO() : null;
      operation.protectedItems = result.protectedItems;
      repository.saveStudyPlan(studyPlan);
      return result;
    },
  });
}
