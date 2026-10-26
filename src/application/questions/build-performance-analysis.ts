import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';
const count = (value: unknown) => Math.max(0, Number(value) || 0);
const accuracy = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 1000) / 10 : null;
export function performancePeriodRecords(
  records: Array<Record<string, any>>,
  { today, period = '90' }: any = {}
) {
  const start = period === 'all' ? null : addLocalDays(today, -(Number(period) - 1));
  return records.filter(
    (item: any) => parseLocalDate(item.date) && item.date <= today && (!start || item.date >= start)
  );
}
export function buildPerformanceAnalysis({
  questions = [],
  simulations = [],
  candidates = [],
  today,
  period = '90',
}: any = {}) {
  const selected = performancePeriodRecords(questions, { today, period });
  const totals = selected.reduce(
    (sum: any, item: any) => {
      const total = count(item.resolved);
      sum.total += total;
      sum.correct += Math.min(total, count(item.correct));
      return sum;
    },
    { total: 0, correct: 0 }
  );
  const categories = {
    naoSabia: 'Não sabia',
    esqueci: 'Esqueci',
    interpretacao: 'Interpretação',
    calculo: 'Cálculo',
    desatencao: 'Desatenção',
    chute: 'Chute',
  };
  const errorCounts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
  for (const item of selected) {
    let remaining = Math.max(
      0,
      count(item.resolved) - Math.min(count(item.resolved), count(item.correct))
    );
    for (const key of Object.keys(categories)) {
      const value = Math.min(remaining, count(item.errorBreakdown?.[key]));
      errorCounts[key] += value;
      remaining -= value;
    }
  }
  const errorCategories = Object.entries(categories).map(([key, label]) => ({
    label,
    count: errorCounts[key],
  }));
  const categorized = Object.values(errorCounts).reduce((sum, value) => sum + value, 0);
  const days = period === 'all' ? 90 : Number(period),
    midpoint = addLocalDays(today, -(Math.floor(days / 2) - 1));
  const topicMap = new Map();
  for (const item of selected) {
    if (!item.topicId) continue;
    const row = topicMap.get(item.topicId) || {
      before: { total: 0, correct: 0 },
      after: { total: 0, correct: 0 },
    };
    const bucket = item.date < midpoint ? row.before : row.after,
      total = count(item.resolved);
    bucket.total += total;
    bucket.correct += Math.min(total, count(item.correct));
    topicMap.set(item.topicId, row);
  }
  const topics = candidates
    .filter((item: any) => topicMap.has(item.topicId))
    .map((item: any) => {
      const sample = topicMap.get(item.topicId),
        before = accuracy(sample.before.correct, sample.before.total),
        after = accuracy(sample.after.correct, sample.after.total);
      return {
        topicId: item.topicId,
        name: item.topicName || item.name || 'Tópico',
        impact: item.examImpact ?? item.impact ?? null,
        before,
        after,
        beforeTotal: sample.before.total,
        afterTotal: sample.after.total,
        delta:
          sample.before.total >= 30 && sample.after.total >= 30
            ? Math.round((after - before) * 10) / 10
            : null,
      };
    })
    .sort((a: any, b: any) => (a.delta ?? 101) - (b.delta ?? 101));
  const exams = performancePeriodRecords(simulations, { today, period })
    .filter((item: any) => count(item.total) > 0)
    .slice()
    .sort(
      (a: any, b: any) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id))
    );
  const scores = exams.map((item: any) =>
    accuracy(Math.min(count(item.correct), count(item.total)), count(item.total))
  );
  return {
    period,
    errorCategories,
    uncategorizedErrors: totals.total - totals.correct - categorized,
    questionCount: totals.total,
    accuracy: accuracy(totals.correct, totals.total),
    errors: totals.total - totals.correct,
    topics,
    simulationCount: exams.length,
    current: scores.at(-1) ?? null,
    previous: scores.at(-2) ?? null,
    mean: scores.length
      ? Math.round((scores.reduce((a: any, b: any) => a + b, 0) / scores.length) * 10) / 10
      : null,
    best: scores.length ? Math.max(...scores) : null,
    latestVolume: exams.at(-1)?.total ?? 0,
  };
}
