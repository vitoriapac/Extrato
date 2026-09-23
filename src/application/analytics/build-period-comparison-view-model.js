import { addLocalDays, localDateRange } from '../../core/date-utils.js';
import { buildPeriodComparisonInsights } from '../../domain/analytics/period-comparison-insights.js';

const entryDate = item => item?.date || String(item?.endedAt || item?.createdAt || item?.completedAt || '').slice(0, 10);
const within = (item, start, end) => { const date = entryDate(item); return date >= start && date <= end; };
const sum = (items, key) => items.reduce((total, item) => total + (Number(item?.[key]) || 0), 0);
const shiftRange = (start, days) => addLocalDays(start, days);

function resolveRange({ preset = '7', today, start, end } = {}) {
  if (preset === 'custom' && start && end && start <= end) return { preset, start, end, days: localDateRange(start, end).length, label: `${start} a ${end}` };
  if (preset === 'month') {
    const first = `${today.slice(0, 7)}-01`;
    return { preset, start: first, end: today, days: localDateRange(first, today).length, label: 'Este mês' };
  }
  const days = Math.max(1, Math.min(366, Number(preset) || 7));
  return { preset: String(days), start: shiftRange(today, -(days - 1)), end: today, days, label: `Últimos ${days} dias` };
}

function aggregate({ sessions, questions, reviews }, range) {
  const selectedSessions = sessions.filter(item => within(item, range.start, range.end));
  const selectedQuestions = questions.filter(item => within(item, range.start, range.end));
  const selectedReviews = reviews.filter(item => within(item, range.start, range.end) && ['Concluído', 'completed', 'done'].includes(item.status));
  const resolved = sum(selectedQuestions, 'resolved');
  return {
    minutes: Math.round(sum(selectedSessions, 'durationSeconds') / 60),
    questions: resolved,
    accuracy: resolved ? Math.round(sum(selectedQuestions, 'correct') / resolved * 100) : null,
    reviews: selectedReviews.length
  };
}

export function buildPeriodComparisonViewModel({ sessions = [], questions = [], reviews = [], today, preset = '7', start, end } = {}) {
  const currentPeriod = resolveRange({ today, preset, start, end });
  const previousPeriod = { start: shiftRange(currentPeriod.start, -currentPeriod.days), end: shiftRange(currentPeriod.start, -1), label: `Período anterior · ${currentPeriod.days} dias` };
  const current = aggregate({ sessions, questions, reviews }, currentPeriod);
  const previous = aggregate({ sessions, questions, reviews }, previousPeriod);
  const metrics = [
    ['minutes', 'Tempo estudado', 'min'],
    ['questions', 'Questões resolvidas', 'count'],
    ['accuracy', 'Taxa de acerto', 'percentage_points'],
    ['reviews', 'Revisões concluídas', 'count']
  ].map(([key, label, unit]) => {
    const a = current[key], b = previous[key];
    const delta = a == null || b == null ? null : a - b;
    return { key, label, unit, current: a, previous: b, delta, state: delta == null ? 'insufficient' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable' };
  });
  const comparison = { algorithmVersion: '1.0.0', state: 'available', currentPeriod, previousPeriod, metrics };
  const insights = buildPeriodComparisonInsights(comparison, { currentQuestionVolume: current.questions, previousQuestionVolume: previous.questions });
  return { ...comparison, insights };
}
