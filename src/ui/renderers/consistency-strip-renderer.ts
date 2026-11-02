const shiftDate = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Last `days` days ending today as four intensity levels (0 none, 1 under 30 min or only
 * questions, 2 under 90 min, 3 more), oldest first. Same bands as the Desempenho heatmap.
 */
export function buildConsistencyStrip({
  sessions = [],
  questions = [],
  today,
  days = 28,
}: {
  sessions?: Array<Record<string, any>>;
  questions?: Array<Record<string, any>>;
  today: string;
  days?: number;
}) {
  const minutes = new Map<string, number>();
  for (const session of sessions)
    if (session.date)
      minutes.set(session.date, (minutes.get(session.date) || 0) + (Number(session.durationSeconds) || 0) / 60);
  const answered = new Set(questions.filter(item => Number(item.resolved) > 0).map(item => item.date));
  const cells = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, index - days + 1);
    const total = Math.round(minutes.get(date) || 0);
    const level = total >= 90 ? 3 : total >= 30 ? 2 : total > 0 || answered.has(date) ? 1 : 0;
    return { date, minutes: total, level };
  });
  return { cells, activeDays: cells.filter(cell => cell.level > 0).length };
}

export function renderConsistencyStrip(
  strip: ReturnType<typeof buildConsistencyStrip>,
  { formatDate = (iso: string) => iso }: { formatDate?: (iso: string) => string } = {}
) {
  const total = strip.cells.length;
  const label = `Constância: ${strip.activeDays} de ${total} dias com estudo`;
  const cells = strip.cells
    .map(
      cell =>
        `<span class="consistency-strip__day level-${cell.level}" title="${formatDate(cell.date)}: ${cell.minutes ? `${cell.minutes} min` : cell.level ? 'questões registradas' : 'sem estudo'}"></span>`
    )
    .join('');
  return `<section class="consistency-strip" aria-label="Constância nas últimas 4 semanas"><p><strong>${strip.activeDays} de ${total} dias</strong> com estudo nas últimas 4 semanas</p><div class="consistency-strip__grid" role="img" aria-label="${label}">${cells}</div></section>`;
}
