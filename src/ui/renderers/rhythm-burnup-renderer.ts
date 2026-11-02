const fmt = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const perWeek = (perDay: number) => fmt(perDay * 7);

export interface BurnupInput {
  totalTopics: number;
  completedTopics: number;
  /** Completed topics N days ago, oldest first; the last entry is today (daysAgo 0). */
  history: Array<{ daysAgo: number; completed: number }>;
  daysToExam?: number | null;
  /** Current pace in topics per day; 0 or missing when there is no recent completion. */
  ratePerDay?: number;
}

/**
 * Burn-up from the recent past to the exam: completed topics so far, the current pace
 * projected forward and the pace needed to finish by the exam. Without an exam date in
 * the future there is no deadline to draw against, so it returns '' and the text explains.
 */
export function renderRhythmBurnup(input: BurnupInput) {
  const { totalTopics: total, completedTopics: done, history, daysToExam } = input;
  if (!total || done >= total || daysToExam == null || daysToExam <= 0 || !history.length) return '';
  const rate = Math.max(0, Number(input.ratePerDay) || 0);
  const past = Math.max(...history.map(point => point.daysAgo));
  const span = past + daysToExam;
  const W = 320,
    H = 120,
    padY = 6;
  const x = (dayFromToday: number) => +(((dayFromToday + past) / span) * W).toFixed(2);
  const y = (topics: number) => +(H - padY - (Math.min(topics, total) / total) * (H - padY * 2)).toFixed(2);
  const real = history.map(point => `${x(-point.daysAgo)},${y(point.completed)}`).join(' ');
  const required = `${x(0)},${y(done)} ${x(daysToExam)},${y(total)}`;
  // Where the current pace gets by the exam (or to the total, if it gets there earlier).
  const projectedEnd = rate ? Math.min(daysToExam, (total - done) / rate) : 0;
  const projection = rate ? `${x(0)},${y(done)} ${x(projectedEnd)},${y(done + rate * projectedEnd)}` : '';
  const atExam = Math.min(total, Math.round(done + rate * daysToExam));
  const needed = (total - done) / daysToExam;
  const behind = rate < needed;
  const summary = rate
    ? `Ritmo atual: ${perWeek(rate)} tópicos por semana; necessário para terminar até a prova: ${perWeek(needed)} por semana. No ritmo atual, ${atExam} de ${total} tópicos na data da prova.`
    : `Sem conclusões nos últimos 14 dias; para terminar até a prova são necessários ${perWeek(needed)} tópicos por semana.`;
  return `<figure class="rhythm-burnup${behind ? ' is-behind' : ''}"><svg class="rhythm-burnup__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Cobertura do edital até a prova: ${done} de ${total} tópicos concluídos hoje. ${summary}"><line class="rhythm-burnup__total" x1="0" x2="${W}" y1="${y(total)}" y2="${y(total)}" vector-effect="non-scaling-stroke"/><line class="rhythm-burnup__today" x1="${x(0)}" x2="${x(0)}" y1="0" y2="${H}" vector-effect="non-scaling-stroke"/><polyline class="rhythm-burnup__required" points="${required}" fill="none" vector-effect="non-scaling-stroke"/>${projection ? `<polyline class="rhythm-burnup__projection" points="${projection}" fill="none" vector-effect="non-scaling-stroke"/>` : ''}<polyline class="rhythm-burnup__real" points="${real}" fill="none" vector-effect="non-scaling-stroke"/></svg><div class="rhythm-burnup__axis" aria-hidden="true"><span>8 semanas atrás</span><span style="left:${((past / span) * 100).toFixed(1)}%">Hoje</span><span>Prova</span></div><figcaption><ul class="rhythm-burnup__legend" aria-hidden="true"><li class="is-real">Concluídos</li><li class="is-projection">Ritmo atual</li><li class="is-required">Ritmo necessário</li></ul><p class="rhythm-burnup__gap">${summary}</p></figcaption></figure>`;
}
