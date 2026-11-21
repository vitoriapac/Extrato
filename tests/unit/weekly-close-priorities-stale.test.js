import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeeklyClose } from '../../src/domain/analytics/weekly-close.js';

const base = allQuestions => ({
  period: { start: '2026-11-09', end: '2026-11-15' },
  current: { plannedMinutes: 120, executedMinutes: 100 },
  targetAccuracy: 80,
  allQuestions,
  recommendations: [
    {
      recommendationId: 'r1',
      topicId: 'classes-de-palavras',
      subjectId: 'lp',
      date: '2026-11-10',
      accepted: true,
      estimatedMinutes: 35,
    },
  ],
});

test('foco da próxima semana: tópico com 10+ questões e acerto na meta sai (T11, caso 1 da T10)', () => {
  const close = buildWeeklyClose(
    base([{ topicId: 'classes-de-palavras', date: '2026-10-01', resolved: 20, correct: 17 }])
  );
  assert.equal(close.priorities.length, 0);
});

test('foco da próxima semana: amostra pequena ou acerto abaixo da meta mantém a recomendação', () => {
  const few = buildWeeklyClose(
    base([{ topicId: 'classes-de-palavras', date: '2026-10-01', resolved: 9, correct: 9 }])
  );
  assert.equal(few.priorities.length, 1);
  const low = buildWeeklyClose(
    base([{ topicId: 'classes-de-palavras', date: '2026-10-01', resolved: 20, correct: 10 }])
  );
  assert.equal(low.priorities.length, 1);
  assert.equal(buildWeeklyClose(base(null)).priorities.length, 1);
});
