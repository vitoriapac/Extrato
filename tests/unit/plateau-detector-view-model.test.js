import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlateauDetectorViewModel } from '../../src/application/analytics/build-plateau-detector-view-model.js';

test('buildPlateauDetectorViewModel detecta tópicos estagnados com alto volume', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Direito Constitucional',
      topics: [{ id: 't1', name: 'Controle de Constitucionalidade' }],
    },
  ];

  // 4 semanas com 15 questões cada (total 60 questões), todas com taxa estagnada em ~66% (10 acertos em 15)
  const questoes = [
    { topicId: 't1', date: '2026-09-01', resolved: 15, correct: 10 },
    { topicId: 't1', date: '2026-09-08', resolved: 15, correct: 10 },
    { topicId: 't1', date: '2026-09-15', resolved: 15, correct: 10 },
    { topicId: 't1', date: '2026-09-22', resolved: 15, correct: 10 },
  ];

  const model = buildPlateauDetectorViewModel({
    subjects,
    questoes,
    minQuestions: 40,
  });

  assert.equal(model.hasPlateauDetected, true);
  assert.equal(model.stagnantTopics.length, 1);
  const stagnant = model.stagnantTopics[0];
  assert.equal(stagnant.topicId, 't1');
  assert.equal(stagnant.questionCount, 60);
  assert.equal(stagnant.averageAccuracy, 66.7);
  assert.ok(stagnant.strategyLabel);
  assert.ok(stagnant.headline);
});

test('buildPlateauDetectorViewModel retorna sem platô quando há evolução de acerto', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Português',
      topics: [{ id: 't1', name: 'Interpretação de Texto' }],
    },
  ];

  // Evolução clara: 40% -> 60% -> 75% -> 90%
  const questoes = [
    { topicId: 't1', date: '2026-09-01', resolved: 15, correct: 6 },
    { topicId: 't1', date: '2026-09-08', resolved: 15, correct: 9 },
    { topicId: 't1', date: '2026-09-15', resolved: 15, correct: 11 },
    { topicId: 't1', date: '2026-09-22', resolved: 15, correct: 14 },
  ];

  const model = buildPlateauDetectorViewModel({
    subjects,
    questoes,
    minQuestions: 40,
  });

  assert.equal(model.hasPlateauDetected, false);
  assert.equal(model.stagnantTopics.length, 0);
});
