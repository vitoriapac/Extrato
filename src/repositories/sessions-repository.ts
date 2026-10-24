import { normalizeStudySession } from '../domain/sessions/study-session.js';

export function createSessionsRepository({
  getState,
  normalize = normalizeStudySession,
}: {
  getState?: () => Record<string, any>;
  normalize?: (session: any) => any;
} = {}) {
  if (typeof getState !== 'function')
    throw new TypeError('Repositório de sessões requer acesso ao estado.');
  const items = (): any[] => {
    const sessions = Array.isArray(getState()?.studySessions) ? getState().studySessions : [];
    sessions.forEach((session: any, index: number) => {
      sessions[index] = normalize(session);
    });
    return sessions;
  };
  return Object.freeze({
    all: () => items(),
    findById: (id: string) => items().find(item => item.id === id) || null,
    add: (session: any) => {
      const normalized = normalize(session);
      if (items().some(item => item.id === normalized.id))
        return items().find(item => item.id === normalized.id);
      items().push(normalized);
      return normalized;
    },
    update: (id: string, changes: Record<string, any>) => {
      const list = items(),
        index = list.findIndex(item => item.id === id);
      if (index < 0) return null;
      list[index] = normalize({ ...list[index], ...changes, id });
      return list[index];
    },
    remove: (id: string) => {
      const list = items(),
        index = list.findIndex(item => item.id === id);
      return index < 0 ? null : list.splice(index, 1)[0];
    },
    listByPeriod: ({
      start = null,
      end = null,
    }: { start?: string | null; end?: string | null } = {}) =>
      items().filter(item => (!start || item.date >= start) && (!end || item.date <= end)),
    listByTopic: (topicId: string) => items().filter(item => item.topicId === topicId),
    listByPlanItem: (planItemId: string) => items().filter(item => item.planItemId === planItemId),
  });
}
