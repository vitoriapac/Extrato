import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodayViewModel } from '../../src/application/planning/build-today-view-model.js';

test('Hoje separa disponível, planejado, executado e atraso dos dias anteriores', () => {
  const model = buildTodayViewModel({
    date: '2026-09-23',
    availableMinutes: 150,
    plan: {
      items: [
        { id: 'a', plannedMinutes: 60, executedSeconds: 1800, status: 'partial' },
        { id: 'b', plannedMinutes: 30, executedSeconds: 0, status: 'planned' },
      ],
    },
    pastPlans: [
      {
        date: '2026-09-22',
        items: [
          { plannedMinutes: 80, executedSeconds: 1200, status: 'partial' },
          { plannedMinutes: 40, status: 'skipped' },
        ],
      },
    ],
  });
  assert.equal(model.availableMinutes, 150);
  assert.equal(model.plannedMinutes, 90);
  assert.equal(model.executedMinutes, 30);
  assert.equal(model.recoveryMinutes, 60);
  assert.equal(model.progress, 33);
  assert.equal(model.nextActivity.id, 'a');
});

test('Hoje não cobra itens concluídos, ignorados ou o dia ainda em andamento como atraso', () => {
  const model = buildTodayViewModel({
    date: '2026-09-23',
    pastPlans: [
      {
        date: '2026-09-22',
        items: [
          { plannedMinutes: 60, status: 'completed' },
          { plannedMinutes: 60, status: 'replaced' },
        ],
      },
      { date: '2026-09-23', items: [{ plannedMinutes: 60, status: 'planned' }] },
    ],
  });
  assert.equal(model.recoveryMinutes, 0);
  assert.equal(model.progress, null);
});

test('tempo fora do plano não altera a parcela concluída do plano', () => {
  const date = '2026-10-02';
  const model = buildTodayViewModel({
    date, availableMinutes: 120,
    subjects: [{ id: 's', name: 'Português', topics: [{ id: 't', name: 'Texto' }] }],
    plan: { id: 'p', date, items: [{ id: 'i', subjectId: 's', topicId: 't', type: 'study', plannedMinutes: 60 }] },
    sessions: [
      { id: 'a', date, subjectId: 's', topicId: 't', type: 'study', durationSeconds: 900, planItemId: 'i' },
      { id: 'b', date, subjectId: 's', topicId: 't', type: 'study', durationSeconds: 1800 },
    ],
  });
  assert.equal(model.executedMinutes, 45);
  assert.equal(model.planCompletedMinutes, 15);
  assert.equal(model.planRemainingMinutes, 45);
  assert.equal(model.progress, 25);
});
