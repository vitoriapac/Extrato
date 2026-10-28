import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyStudySummary,
  collectActivityDates,
  collectGoalDates,
  computeActivityStreak,
} from '../../src/domain/analytics/study-streak.js';

test('calculateDailyStudySummary: totaliza sessoes, questoes independentes e simulados', () => {
  const summary = calculateDailyStudySummary({
    date: '2026-10-28',
    studySessions: [
      { id: 's1', date: '2026-10-28', durationSeconds: 1800, subjectId: 'sub1' },
    ],
    questoes: [
      { id: 'q1', date: '2026-10-28', resolved: 10, correct: 8, studySessionId: 's1', subjectId: 'sub1' }, // ligada à sessão
      { id: 'q2', date: '2026-10-28', resolved: 5, correct: 4, subjectId: 'sub1' }, // independente
    ],
    simulados: [],
    reviewAgenda: [
      { status: 'Concluído', completedAt: '2026-10-28T12:00:00Z', subjectId: 'sub1' },
    ],
    targetHours: 1, // 3600 segundos
    entitySubjectId: item => item.subjectId,
    getSubjectName: () => 'Direito Constitucional',
    localDateFromTimestamp: ts => (typeof ts === 'string' ? ts.slice(0, 10) : null),
  });

  assert.equal(summary.date, '2026-10-28');
  assert.equal(summary.seconds, 1800);
  assert.equal(summary.questions, 5); // apenas a independente é adicionada além do que já está na sessão
  assert.equal(summary.reviews, 1);
  assert.equal(summary.targetSeconds, 3600);
  assert.equal(summary.goalPct, 50);
  assert.equal(summary.meaningful, true); // >= 300s
  assert.equal(summary.goalAchieved, false); // 1800 < 3600
});

test('collectActivityDates e collectGoalDates: filtram dias com atividade e metas atingidas', () => {
  const activityDates = collectActivityDates({
    studySessions: [
      { id: 's1', date: '2026-10-27' },
      { id: 's2', date: '2026-10-28' },
    ],
    questoes: [],
    simulados: [],
    isDateMeaningful: date => date === '2026-10-28',
  });
  assert.deepEqual([...activityDates], ['2026-10-28']);

  const goalDates = collectGoalDates({
    studySessions: [
      { date: '2026-10-27' },
      { date: '2026-10-28' },
    ],
    isGoalAchievedForDate: date => date === '2026-10-27',
  });
  assert.deepEqual([...goalDates], ['2026-10-27']);
});

test('computeActivityStreak: calcula streak chamando consistency engine', () => {
  const dates = new Set(['2026-10-28', '2026-10-27']);
  const streak = computeActivityStreak(dates, {
    today: '2026-10-28',
    addDays: (date, n) => {
      const d = new Date(date + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    },
  });
  assert.equal(streak, 2);
});
