export function createReplanService({
  repository,
  buildProposal,
  applyProposal,
  undoProposal,
  clock,
  idGenerator,
  getActiveExamTags = (): string[] => [],
}: any = {}) {
  if (!repository || typeof repository.saveAdjustment !== 'function')
    throw new TypeError('Serviço de replanejamento requer repositório.');
  return Object.freeze({
    calculate: (input: Record<string, any>) =>
      buildProposal({ ...input, plans: input.plans || repository.getDailyPlans() }),
    confirm: (proposal: Record<string, any> | null | undefined) => {
      if (proposal?.state !== 'proposal' || !proposal.allocations?.length) return null;
      const operationId = idGenerator('replan-operation'),
        appliedAt = clock.nowISO();
      const result = applyProposal({
        dailyPlans: repository.getDailyPlans(),
        proposal,
        operationId,
        now: appliedAt,
        idGenerator,
      });
      const adjustment: Record<string, any> = {
        ...structuredClone(proposal),
        activeExamTags: [...getActiveExamTags()],
        id: idGenerator('plan-adjustment'),
        operationId,
        confirmedAt: appliedAt,
        appliedAt,
        status: 'applied',
        changes: result.changes,
        undoneAt: null,
      };
      repository.saveAdjustment(adjustment);
      return { result, adjustment };
    },
    undo: (id: string) => {
      const adjustment = repository.findAdjustment(id);
      if (!adjustment || adjustment.undoneAt) return null;
      const result = undoProposal({ dailyPlans: repository.getDailyPlans(), adjustment });
      repository.saveAdjustment({
        ...adjustment,
        status: result.complete ? 'undone' : 'partially_undone',
        undoneAt: result.complete ? clock.nowISO() : null,
        protectedItems: result.protectedItems,
      });
      return result;
    },
  });
}
