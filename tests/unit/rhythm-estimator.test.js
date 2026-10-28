import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCoverageRhythm,
  calculateOverdueReviewsCount,
} from '../../src/domain/planning/rhythm-estimator.js';

test('calculateCoverageRhythm: retorna sem-topicos quando total de topicos for zero', () => {
  const result = calculateCoverageRhythm({
    totalTopics: 0,
    completedTopics: 0,
    recentCompletedTopicsCount: 0,
    today: '2026-10-28',
    addDays: (d, n) => d,
  });
  assert.deepEqual(result, { status: 'sem-topicos' });
});

test('calculateCoverageRhythm: retorna completo quando todos os topicos foram concluidos', () => {
  const result = calculateCoverageRhythm({
    totalTopics: 20,
    completedTopics: 20,
    recentCompletedTopicsCount: 2,
    today: '2026-10-28',
    addDays: (d, n) => d,
  });
  assert.deepEqual(result, { status: 'completo' });
});

test('calculateCoverageRhythm: retorna sem-dados quando nao houver conclusoes recentes', () => {
  const result = calculateCoverageRhythm({
    totalTopics: 20,
    completedTopics: 5,
    recentCompletedTopicsCount: 0,
    today: '2026-10-28',
    addDays: (d, n) => d,
  });
  assert.deepEqual(result, { status: 'sem-dados', remaining: 15 });
});

test('calculateCoverageRhythm: calcula dias necessarios e compara com prazo da prova no-prazo', () => {
  const result = calculateCoverageRhythm({
    totalTopics: 30,
    completedTopics: 16,
    recentCompletedTopicsCount: 14, // 1 topico por dia (14/14)
    today: '2026-10-28',
    examDate: '2026-11-30',
    daysToExam: 33,
    addDays: (d, n) => `date+${n}`,
  });
  assert.equal(result.status, 'ok');
  assert.equal(result.remaining, 14);
  assert.equal(result.ratePerDay, 1);
  assert.equal(result.daysNeeded, 14);
  assert.equal(result.comparativo, 'no-prazo');
  assert.equal(result.daysToExam, 33);
});

test('calculateCoverageRhythm: detecta status atrasado quando dias necessarios excedem prova', () => {
  const result = calculateCoverageRhythm({
    totalTopics: 30,
    completedTopics: 10,
    recentCompletedTopicsCount: 7, // 0.5 topico por dia -> 20 / 0.5 = 40 dias
    today: '2026-10-28',
    examDate: '2026-11-15',
    daysToExam: 18,
    addDays: (d, n) => `date+${n}`,
  });
  assert.equal(result.status, 'ok');
  assert.equal(result.remaining, 20);
  assert.equal(result.ratePerDay, 0.5);
  assert.equal(result.daysNeeded, 40);
  assert.equal(result.comparativo, 'atrasado');
  assert.equal(result.daysToExam, 18);
});

test('calculateOverdueReviewsCount: totaliza revisoes vencidas e pendentes', () => {
  const count = calculateOverdueReviewsCount({
    calendarItems: [
      { date: '2026-10-20', status: 'Pendente', id: '1' },
      { date: '2026-10-27', status: 'Concluído', id: '2' },
      { date: '2026-10-30', status: 'Pendente', id: '3' }, // futuro
    ],
    reviewAgendaItems: [
      { date: '2026-10-25', status: 'Pendente', id: '4' },
      { date: '2026-10-28', status: 'Pendente', id: '5' }, // hoje, não é menor que hoje
    ],
    today: '2026-10-28',
    isCurrentReference: () => true,
  });
  // calendar 1 (2026-10-20) + agenda 4 (2026-10-25) = 2
  assert.equal(count, 2);
});
