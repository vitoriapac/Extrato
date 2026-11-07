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
  const result = buildDailyPlanProposal({ studyPlan: short, reserveRatio: 0, days: [{ date: '2026-11-06', availableMinutes: 10 }] });
  assert.equal(result.plannedMinutes, 7);
  assert.equal(result.unallocatedMinutes, 0);
  const long = { id: 'long', items: [{ id: 'b', topicId: 't2', minutes: 65 }] };
  const split = buildDailyPlanProposal({ studyPlan: long, reserveRatio: 0, days: [{ date: '2026-11-06', availableMinutes: 65 }] });
  assert.equal(split.plannedMinutes, 65);
  assert.equal(split.unallocatedMinutes, 0);
  const plans = [];
  let nextId = 0;
  const input = { dailyPlans: plans, proposal: split, operationId: 'operation', now: '2026-11-06T12:00:00Z', idGenerator: prefix => `${prefix}-${++nextId}` };
  assert.equal(applyDailyPlanProposal(input).createdItems, 2);
  assert.equal(plans[0].items.reduce((sum, item) => sum + item.plannedMinutes, 0), 65);
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
