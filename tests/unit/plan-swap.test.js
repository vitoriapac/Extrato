import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPlanSwap,
  planSwapCandidate,
} from '../../src/application/daily-execution/plan-swap.js';

const plan = () => ({
  plannedMinutes: 80,
  items: [
    {
      id: 'pt',
      topicId: 't1',
      status: 'planned',
      score: 70,
      position: 1,
      plannedMinutes: 45,
      executedSeconds: 0,
      sessionIds: [],
    },
    {
      id: 'en',
      topicId: 't2',
      status: 'planned',
      score: 40,
      position: 2,
      plannedMinutes: 35,
      executedSeconds: 0,
      sessionIds: [],
    },
    {
      id: 'done',
      topicId: 't3',
      status: 'completed',
      score: 10,
      position: 3,
      plannedMinutes: 20,
      executedSeconds: 1200,
      sessionIds: ['s'],
    },
    {
      id: 'started',
      topicId: 't4',
      status: 'planned',
      score: 5,
      position: 4,
      plannedMinutes: 20,
      executedSeconds: 300,
      sessionIds: ['s2'],
    },
  ],
});

test('troca escolhe o bloco intocado de menor prioridade, nunca um já iniciado ou concluído', () => {
  assert.equal(planSwapCandidate(plan(), 'tx').id, 'en');
  assert.equal(planSwapCandidate(plan(), 't2').id, 'pt', 'não troca o próprio tópico sugerido');
  assert.equal(planSwapCandidate({ items: [] }), null);
});

test('usa o score do retrato de prioridade quando o bloco veio do plano semanal', () => {
  const p = {
    items: [
      { id: 'a', status: 'planned', position: 1, prioritySnapshot: { score: 30 } },
      { id: 'b', status: 'planned', position: 2, prioritySnapshot: { score: 80 } },
    ],
  };
  assert.equal(planSwapCandidate(p, 'x').id, 'a');
});

test('aplicar a troca marca o bloco como substituído e ajusta o tempo planejado', () => {
  const p = plan();
  const result = applyPlanSwap(
    p,
    'en',
    { id: 'new', plannedMinutes: 25, status: 'planned' },
    '2026-11-26T10:00:00Z'
  );
  assert.equal(result.replaced.status, 'replaced');
  assert.equal(result.replaced.replacedByItemId, 'new');
  assert.equal(result.added.position, 2);
  assert.equal(p.plannedMinutes, 70);
  assert.equal(applyPlanSwap(p, 'en', { id: 'again' }, 'x'), null, 'não troca duas vezes');
});
