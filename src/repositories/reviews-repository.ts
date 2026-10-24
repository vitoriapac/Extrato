export function createReviewsRepository({
  getState,
}: { getState?: () => Record<string, any> } = {}) {
  if (typeof getState !== 'function')
    throw new TypeError('Repositório de revisões requer acesso ao estado.');
  const items = (): any[] =>
    Array.isArray(getState()?.reviewAgenda) ? getState().reviewAgenda : [];
  return Object.freeze({
    all: () => items(),
    findById: (id: string) => items().find(item => item.id === id) || null,
    listPending: () => items().filter(item => item.status !== 'Concluído'),
    add: (review: any) => {
      items().push(review);
      return review;
    },
    update: (id: string, changes: Record<string, any>) => {
      const review = items().find(item => item.id === id);
      if (!review) return null;
      Object.assign(review, changes);
      return review;
    },
    remove: (id: string) => {
      const list = items(),
        index = list.findIndex(item => item.id === id);
      return index < 0 ? null : list.splice(index, 1)[0];
    },
    hasPendingForTopic: (
      topicId: string,
      date?: string | null,
      { exceptId = null }: { exceptId?: string | null } = {}
    ) =>
      items().some(
        item =>
          item.id !== exceptId &&
          (item.topicId || item.topicRef) === topicId &&
          item.status !== 'Concluído' &&
          (!date || item.date === date)
      ),
  });
}
