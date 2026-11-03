import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVolatileMasteryViewModel } from '../../src/application/analytics/build-volatile-mastery-view-model.js';

test('buildVolatileMasteryViewModel detecta tópicos com queda de rendimento após intervalo', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Direito Administrativo',
      topics: [
        { id: 't1', name: 'Atos Administrativos' },
        { id: 't2', name: 'Licitações' },
      ],
    },
  ];

  const questoes = [
    // t1: 10/10 no dia 1 (100%), depois 4/10 20 dias depois (40%) => queda de 60 p.p.!
    { topicId: 't1', date: '2026-09-01', total: 10, correct: 10 },
    { topicId: 't1', date: '2026-09-22', total: 10, correct: 4 },

    // t2: constante e consolidado (9/10 depois 9/10)
    { topicId: 't2', date: '2026-09-01', total: 10, correct: 9 },
    { topicId: 't2', date: '2026-09-22', total: 10, correct: 9 },
  ];

  const model = buildVolatileMasteryViewModel({
    subjects,
    questoes,
    limit: 4,
  });

  assert.equal(model.volatileTopics.length, 1);
  const volatile = model.volatileTopics[0];
  assert.equal(volatile.topicId, 't1');
  assert.equal(volatile.initialAccuracy, 100);
  assert.equal(volatile.spacedAccuracy, 40);
  assert.equal(volatile.accuracyDrop, 60);
  assert.equal(volatile.statusVariant, 'danger');
});

test('buildVolatileMasteryViewModel retorna vazio quando não há quedas severas', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Português',
      topics: [{ id: 't1', name: 'Crase' }],
    },
  ];

  const questoes = [
    { topicId: 't1', date: '2026-09-01', total: 10, correct: 8 },
    { topicId: 't1', date: '2026-09-20', total: 10, correct: 8 },
  ];

  const model = buildVolatileMasteryViewModel({
    subjects,
    questoes,
  });

  assert.equal(model.volatileTopics.length, 0);
  assert.match(model.summary, /Nenhum sinal de falsa consolidação/);
});
