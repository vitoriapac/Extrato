// Spreads overdue reviews over the next days without exceeding each day's capacity.
// Pure: it only proposes moves; applying and undoing them is the caller's job, after confirmation.

/** Time budgeted per review when turning daily availability into review slots. */
export const MINUTES_PER_REVIEW = 20;

const shiftDate = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

export interface ReviewMove {
  id: string;
  from: string;
  to: string;
}

export function buildReviewRedistribution({
  reviews = [],
  today,
  hoursByDay = {},
  horizonDays = 14,
  minutesPerReview = MINUTES_PER_REVIEW,
}: {
  reviews?: Array<Record<string, any>>;
  today: string;
  hoursByDay?: Record<string, unknown>;
  horizonDays?: number;
  minutesPerReview?: number;
}) {
  const pending = reviews.filter(item => item.status !== 'Concluído' && item.date);
  const overdue = pending
    .filter(item => item.date < today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const days = Array.from({ length: horizonDays }, (_, index) => {
    const date = shiftDate(today, index);
    const hours = Math.max(0, Math.min(24, Number(hoursByDay[String(weekday(date))]) || 0));
    const capacity = Math.floor((hours * 60) / minutesPerReview);
    const before = pending.filter(item => item.date === date).length;
    return { date, capacity, before, after: before };
  });
  const moves: ReviewMove[] = [];
  const unplaced: string[] = [];
  for (const item of overdue) {
    // Days without study (capacity 0) are skipped; a day already over capacity takes nothing more.
    const day = days.find(candidate => candidate.after < candidate.capacity);
    if (!day) {
      unplaced.push(item.id);
      continue;
    }
    day.after++;
    moves.push({ id: item.id, from: item.date, to: day.date });
  }
  return {
    moves,
    unplaced,
    overdue: overdue.length,
    days: days.filter(day => day.after > day.before),
    hasCapacity: days.some(day => day.capacity > 0),
  };
}

/** Applies the moves to the agenda in place; returns the moves that were actually applied. */
export function applyReviewMoves(reviews: Array<Record<string, any>>, moves: ReviewMove[]) {
  const byId = new Map(reviews.map(item => [item.id, item]));
  return moves.filter(move => {
    const item = byId.get(move.id);
    // Skip anything edited since the preview: same rule the plan recovery uses before writing.
    if (!item || item.date !== move.from || item.status === 'Concluído') return false;
    item.date = move.to;
    return true;
  });
}

/** Undo: puts each review back on its original date, unless it was changed again meanwhile. */
export function revertReviewMoves(reviews: Array<Record<string, any>>, moves: ReviewMove[]) {
  return applyReviewMoves(
    reviews,
    moves.map(move => ({ id: move.id, from: move.to, to: move.from }))
  );
}
