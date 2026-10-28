import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubjectErrorRate,
  findSubjectLatestActivityDate,
  calculateDaysSinceSubjectStudy,
} from '../../src/domain/analytics/subject-error-metrics.js';

test('calculateSubjectErrorRate: calcula porcentagem de erro combinando questoes e simulados', () => {
  const questions = [
    { subjectId: 'dir-const', resolved: 20, correct: 16 }, // 4 erros
    { subjectId: 'outra-disc', resolved: 10, correct: 5 },
  ];
  const simulations = [
    {
      breakdown: [
        { subjectId: 'dir-const', total: 10, correct: 8 }, // 2 erros
      ],
    },
  ];

  // total dir-const = 20 + 10 = 30. acertos = 16 + 8 = 24. erro = 6/30 = 20.0%
  const rate = calculateSubjectErrorRate(
    'dir-const',
    questions,
    simulations,
    item => item.subjectId
  );
  assert.equal(rate, 20.0);

  const emptyRate = calculateSubjectErrorRate(
    'sem-dados',
    questions,
    simulations,
    item => item.subjectId
  );
  assert.equal(emptyRate, 0);
});

test('findSubjectLatestActivityDate: seleciona a data mais recente dentre todas as fontes', () => {
  const latest = findSubjectLatestActivityDate({
    subjectId: 'dir-const',
    topicHistoryDates: ['2026-10-15'],
    questionDates: ['2026-10-20'],
    calendarDates: ['2026-10-10'],
    reviewDates: ['2026-10-25'],
    sessionDates: ['2026-10-22'],
  });
  assert.equal(latest, '2026-10-25');

  const empty = findSubjectLatestActivityDate({
    subjectId: 'vazio',
    topicHistoryDates: [],
    questionDates: [],
    calendarDates: [],
    reviewDates: [],
    sessionDates: [],
  });
  assert.equal(empty, null);
});

test('calculateDaysSinceSubjectStudy: calcula dias transcorridos ou retorna fallback', () => {
  assert.equal(
    calculateDaysSinceSubjectStudy('2026-10-20', date => -5),
    5
  );
  assert.equal(
    calculateDaysSinceSubjectStudy(null, date => 0),
    0
  );
  assert.equal(
    calculateDaysSinceSubjectStudy('2026-10-20', () => null),
    21
  );
});
