import { addLocalDays } from '../../core/date-utils.js';

type Item = { date?: string | null; status?: string | null; origem?: string | null };
export type AgendaBucket = { total: number; reviews: number; tasks: number };

// Regras de data da Agenda (as mesmas de getGroupedReviews): pendente e com data válida.
const isPending = (item: Item) => item.status !== 'Concluído' && Boolean(item.date);
export const isOverdueItem = (item: Item, today: string) => isPending(item) && item.date! < today;
export const isTodayItem = (item: Item, today: string) => isPending(item) && item.date === today;
const isNext7 = (item: Item, today: string) =>
  isPending(item) && item.date! > today && item.date! <= (addLocalDays(today, 7) || today);

// Tarefa de estudo vem do Calendário; o resto é Revisão espaçada.
const isTask = (item: Item) => item.origem === 'Calendário';

function count(items: Item[]): AgendaBucket {
  const tasks = items.filter(isTask).length;
  return { total: items.length, reviews: items.length - tasks, tasks };
}

export function buildAgendaBuckets(items: Item[] = [], today: string) {
  return {
    overdue: count(items.filter(item => isOverdueItem(item, today))),
    today: count(items.filter(item => isTodayItem(item, today))),
    next7: count(items.filter(item => isNext7(item, today))),
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function describeBucket(
  bucket: AgendaBucket,
  period: string,
  empty = `Nada ${period}`,
  singular = period
): string {
  if (!bucket.total) return empty;
  const parts = [
    bucket.reviews ? plural(bucket.reviews, 'revisão', 'revisões') : '',
    bucket.tasks ? plural(bucket.tasks, 'tarefa', 'tarefas') : '',
  ].filter(Boolean);
  const text = parts.join(' + ');
  return `${text} ${bucket.total === 1 ? singular : period}`;
}
