import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyPlanProposal,
  applyDailyPlanProposal,
  undoDailyPlanGeneration,
} from '../../src/application/planning/distribute-study-plan.js';
const studyPlan = {
  id: 'study-1',
  items: [
    {
      id: 'source-1',
      subjectId: 's1',
      topicId: 't1',
      subjectName: 'Matemática',
      topicName: 'Porcentagem',
      minutes: 120,
      activityMix: { theory: 50, questions: 50, reviews: 20 },
    },
  ],
};
test('distribui um tópico curto e resto de bloco sem criar minutos adicionais', () => {
  const short = { id: 'short', items: [{ id: 'a', topicId: 't1', minutes: 7 }] };
  const result = buildDailyPlanProposal({
    studyPlan: short,
    reserveRatio: 0,
    days: [{ date: '2026-11-06', availableMinutes: 10 }],
  });
  assert.equal(result.plannedMinutes, 7);
  assert.equal(result.unallocatedMinutes, 0);
  const long = { id: 'long', items: [{ id: 'b', topicId: 't2', minutes: 65 }] };
  const split = buildDailyPlanProposal({
    studyPlan: long,
    reserveRatio: 0,
    days: [{ date: '2026-11-06', availableMinutes: 65 }],
  });
  assert.equal(split.plannedMinutes, 65);
  assert.equal(split.unallocatedMinutes, 0);
  const plans = [];
  let nextId = 0;
  const input = {
    dailyPlans: plans,
    proposal: split,
    operationId: 'operation',
    now: '2026-11-06T12:00:00Z',
    idGenerator: prefix => `${prefix}-${++nextId}`,
  };
  assert.equal(applyDailyPlanProposal(input).createdItems, 2);
  assert.equal(
    plans[0].items.reduce((sum, item) => sum + item.plannedMinutes, 0),
    65
  );
  assert.equal(applyDailyPlanProposal(input).createdItems, 0);
});
test('distribui atividades por dia, reserva flexibilidade e divide blocos longos', () => {
  const result = buildDailyPlanProposal({
    studyPlan,
    days: [
      { date: '2026-09-01', availableMinutes: 90 },
      { date: '2026-09-02', availableMinutes: 90 },
    ],
  });
  assert.equal(result.state, 'proposal');
  assert.equal(result.plannedMinutes, 120);
  assert.ok(result.days.every(day => day.flexMinutes >= 9));
  assert.ok(result.days.flatMap(day => day.items).every(item => item.minutes <= 60));
});
test('não duplica vínculos já materializados', () => {
  const result = buildDailyPlanProposal({
    studyPlan,
    existingPlans: [
      {
        date: '2026-09-01',
        items: [{ studyPlanId: 'study-1', studyPlanItemId: 'source-1', status: 'planned' }],
      },
    ],
    days: [{ date: '2026-09-01', availableMinutes: 180 }],
  });
  assert.equal(result.state, 'insufficient');
  assert.equal(result.existingLinkedItems, 1);
});
test('confirma e desfaz somente itens ainda não executados', () => {
  const proposal = buildDailyPlanProposal({
    studyPlan,
    days: [{ date: '2026-09-01', availableMinutes: 180 }],
  });
  const plans = [];
  let id = 0;
  const applied = applyDailyPlanProposal({
    dailyPlans: plans,
    proposal,
    operationId: 'op-1',
    now: '2026-09-01T12:00:00Z',
    idGenerator: prefix => `${prefix}-${++id}`,
  });
  assert.equal(applied.createdItems, 3);
  plans[0].items[0].executedSeconds = 60;
  const undone = undoDailyPlanGeneration({ dailyPlans: plans, operationId: 'op-1' });
  assert.equal(undone.removedItems, 2);
  assert.equal(undone.protectedItems.length, 1);
});
test('agenda já marcada e reserva consomem a capacidade: a proposta devolve os totais da janela para explicar o que não coube', () => {
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-11-${String(16 + index).padStart(2, '0')}`,
    availableMinutes: 120,
  }));
  const existingPlans = days.map(day => ({
    date: day.date,
    items: [{ id: `x-${day.date}`, status: 'planned', plannedMinutes: 80 }],
  }));
  const plan = { id: 'week', items: [{ id: 'item', topicId: 't1', minutes: 720 }] };
  const result = buildDailyPlanProposal({
    studyPlan: plan,
    existingPlans,
    days,
    reserveRatio: 0.1,
  });
  // 120 − 12 de reserva − 80 já agendados = 28 por dia.
  assert.equal(result.plannedMinutes, 7 * 28);
  assert.equal(result.unallocatedMinutes, 720 - 7 * 28);
  assert.deepEqual(result.window, {
    availableMinutes: 840,
    reserveMinutes: 84,
    existingMinutes: 560,
  });
  const empty = buildDailyPlanProposal({ studyPlan: plan, days, reserveRatio: 0.1 });
  assert.equal(empty.window.existingMinutes, 0);
  assert.equal(empty.plannedMinutes, 720);
  assert.equal(empty.unallocatedMinutes, 0);
});

const week = Array.from({ length: 7 }, (_, index) => ({
  date: `2026-11-${String(9 + index).padStart(2, '0')}`,
  availableMinutes: 120,
}));
const planItems = reviews => ({
  id: 'week-plan',
  items: [
    {
      id: 'p1',
      topicId: 't1',
      subjectId: 's',
      minutes: 600 - reviews,
      activityMix: { theory: 360 - reviews, questions: 240, reviews },
    },
  ],
});
const reviewsOnAgenda = count =>
  Array.from({ length: count }, (_, index) => ({
    id: `r${index}`,
    topicId: `r-topic-${index}`,
    subjectId: 's',
    date: week[index % 7].date,
    minutes: 25,
  }));
const reviewMinutes = proposal =>
  proposal.days
    .flatMap(day => day.items)
    .filter(item => item.type === 'review')
    .reduce((sum, item) => sum + item.minutes, 0);

test('plano de 90% da capacidade (720 min) propõe 648 e cabe nos 7 dias sem agenda marcada', async () => {
  const { buildStudyPlan } = await import('../../src/application/build-study-plan.js');
  const topics = Array.from({ length: 6 }, (_, index) => ({
    id: `t${index}`,
    subjectId: `s${index % 4}`,
    subjectName: `S${index % 4}`,
    estimatedMinutes: 400,
    examImpact: 90 - index * 3,
    masteryGap: 50,
    retentionNeed: 30,
  }));
  const plan = buildStudyPlan({ topics, weeklyAvailableMinutes: 720, weeksUntilExam: 3 });
  assert.equal(plan.weeklyPlannedMinutes, 648);
  const days = [60, 120, 120, 120, 120, 120, 60].map((availableMinutes, index) => ({
    date: `2026-11-${16 + index}`,
    availableMinutes,
  }));
  const proposal = buildDailyPlanProposal({ studyPlan: { id: 'p', items: plan.items }, days });
  assert.equal(proposal.unallocatedMinutes, 0);
  assert.equal(proposal.plannedMinutes, 648);
});

test('revisões da agenda substituem as do plano: a soma não passa do maior dos dois', () => {
  // Plano com 65 min de revisão e 6 revisões na agenda (150 min): fica 150, não 215.
  const result = buildDailyPlanProposal({
    studyPlan: planItems(65),
    days: week,
    dueReviews: reviewsOnAgenda(6),
  });
  assert.equal(reviewMinutes(result), 150);
  assert.equal(result.replacedReviewMinutes, 65);
  // Agenda menor que a parcela do plano: o plano cobre o resto, total igual à parcela do plano.
  const small = buildDailyPlanProposal({
    studyPlan: planItems(120),
    days: week,
    dueReviews: reviewsOnAgenda(2),
  });
  assert.equal(reviewMinutes(small), 120);
  // Sem revisões na agenda nada muda.
  const none = buildDailyPlanProposal({ studyPlan: planItems(65), days: week, dueReviews: [] });
  assert.equal(reviewMinutes(none), 65);
  assert.equal(none.replacedReviewMinutes, 0);
});

test('um plano de 720 min com 6 revisões na agenda cabe nos 7 dias de 120 min com reserva de 10%', () => {
  const result = buildDailyPlanProposal({
    studyPlan: planItems(65),
    days: week,
    dueReviews: reviewsOnAgenda(6),
  });
  assert.equal(result.unallocatedMinutes, 0);
});
