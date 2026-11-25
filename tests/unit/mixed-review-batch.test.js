import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMixedReviewBatches,
  evaluateWeeklyReviewBudget,
} from '../../src/domain/reviews/mixed-review-batch.js';

test('buildMixedReviewBatches agrupa >= 3 revisões devidas por disciplina e prioriza peso no edital', () => {
  const subjects = [
    { id: 's1', name: 'Português', topics: [{ id: 't1', name: 'Crase' }] },
    {
      id: 's2',
      name: 'Direito Constitucional',
      topics: [
        { id: 't2', name: 'Controle Concentrado' },
        { id: 't3', name: 'Direitos Sociais' },
        { id: 't4', name: 'Organização do Estado' },
      ],
    },
  ];
  const reviewAgenda = [
    // Português tem apenas 2 -> não gera bateria mista
    { id: 'r1', subjectId: 's1', topicId: 't1', date: '2026-10-18', status: 'Agendada' },
    { id: 'r2', subjectId: 's1', topicId: 't1', date: '2026-10-20', status: 'Agendada' },
    // Constitucional tem 3 pendentes até hoje + 1 concluída + 1 futura -> lote de 3
    { id: 'r3', subjectId: 's2', topicId: 't2', date: '2026-10-15', status: 'Agendada' },
    { id: 'r4', subjectId: 's2', topicId: 't3', date: '2026-10-19', status: 'Agendada' },
    { id: 'r5', subjectId: 's2', topicId: 't4', date: '2026-10-20', status: 'Agendada' },
    { id: 'r6', subjectId: 's2', topicId: 't4', date: '2026-10-10', status: 'Concluído' },
    { id: 'r7', subjectId: 's2', topicId: 't4', date: '2026-10-25', status: 'Agendada' },
  ];

  const batches = buildMixedReviewBatches({
    reviewAgenda,
    subjects,
    blueprintSubjects: [{ subjectId: 's2', questionWeight: 2, priority: 'high' }],
    today: '2026-10-20',
    getTopicName: id =>
      ({ t1: 'Crase', t2: 'Controle Concentrado', t3: 'Direitos Sociais', t4: 'Organização' })[id] ||
      id,
  });

  assert.equal(batches.length, 1);
  assert.equal(batches[0].subjectId, 's2');
  assert.equal(batches[0].count, 3);
  assert.equal(batches[0].overdueCount, 2);
  assert.equal(batches[0].recommendedQuestions, 15);
  assert.equal(batches[0].impactWeight, 2.8);
});

test('evaluateWeeklyReviewBudget usa teto padrão de 25% e sinaliza estouro', () => {
  const defaultBudget = evaluateWeeklyReviewBudget({
    plannedWeeklyMinutes: 1200,
    reviewMinutesThisWeek: 360,
    budgetPct: null,
  });
  assert.equal(defaultBudget.budgetPct, 25);
  assert.equal(defaultBudget.budgetMinutes, 300);
  assert.equal(defaultBudget.exceeded, true);

  const customOk = evaluateWeeklyReviewBudget({
    plannedWeeklyMinutes: 1200,
    reviewMinutesThisWeek: 360,
    budgetPct: 35,
  });
  assert.equal(customOk.budgetPct, 35);
  assert.equal(customOk.budgetMinutes, 420);
  assert.equal(customOk.exceeded, false);
});
