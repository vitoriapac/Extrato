const IGNORED_ACTIVITY_TYPES = new Set([
  'topic_archived',
  'topic_restored',
  'subject_archived',
  'subject_restored',
]);

type Row = Record<string, any>;
type ToLocalDate = (value: unknown) => string | null | undefined;

export function historyEventLocalDate(
  event: Row | null | undefined,
  toLocalDate: ToLocalDate = value => value as string
) {
  if (typeof event?.localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.localDate))
    return event.localDate;
  if (typeof event?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) return event.date;
  return toLocalDate(event?.occurredAt || event?.date) || null;
}

export function createTopicHistoryService({
  getState,
  clock,
  idGenerator,
  toLocalDate = (value: unknown) => value as string,
}: any = {}) {
  if (typeof getState !== 'function' || !clock || typeof idGenerator !== 'function')
    throw new TypeError('Serviço de histórico requer estado, relógio e gerador de IDs.');
  const records = (): Row[] => {
    const state = getState();
    if (!Array.isArray(state.topicHistory)) state.topicHistory = [];
    return state.topicHistory;
  };
  const referenceOf = (metadata: Row | null | undefined) =>
    metadata?.sessionId || metadata?.reviewId || metadata?.operationId || null;
  const add = (
    type: any,
    subjectId: any,
    topicId: string | null = null,
    metadata: any = {},
    options: any = {}
  ) => {
    const reference = referenceOf(metadata);
    if (reference) {
      const existing = records().find(
        event => event.type === type && referenceOf(event.metadata) === reference
      );
      if (existing) return existing;
    }
    const occurredAt = options.occurredAt || clock.nowISO(),
      localDate = options.localDate || clock.today();
    const event = {
      id: idGenerator('history'),
      date: occurredAt,
      occurredAt,
      localDate,
      type,
      subjectId: subjectId || null,
      topicId: topicId || null,
      examScope: Array.isArray(options.examScope) ? [...options.examScope] : null,
      metadata: { ...metadata },
    };
    records().push(event);
    return event;
  };
  const list = ({ type, subjectId, topicId, start, end, includeLifecycle = true }: any = {}) =>
    records().filter(event => {
      if (type && event.type !== type) return false;
      if (subjectId && event.subjectId !== subjectId) return false;
      if (topicId && event.topicId !== topicId) return false;
      if (!includeLifecycle && IGNORED_ACTIVITY_TYPES.has(event.type)) return false;
      const date = historyEventLocalDate(event, toLocalDate);
      return (!start || date! >= start) && (!end || date! <= end);
    });
  const lastActivity = (filter: Row) =>
    list({ ...filter, includeLifecycle: false }).reduce((latest: string | null, event) => {
      const date = historyEventLocalDate(event, toLocalDate);
      return date && (!latest || date > latest) ? date : latest;
    }, null);
  return Object.freeze({
    add,
    list,
    lastActivity,
    eventLocalDate: (event: Row) => historyEventLocalDate(event, toLocalDate),
  });
}
