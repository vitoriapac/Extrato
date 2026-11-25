import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightedTopicPerformance } from '../../src/domain/analytics/topic-performance.js';
import {
  calculateTopicMastery,
  MASTERY_ALGORITHM_VERSION,
} from '../../src/domain/analytics/topic-metrics.js';

const q = (over = {}) => ({ topicId: 't1', resolved: 10, correct: 5, ...over });

test('sem banca nem refeitas, o acerto ponderado é o acerto simples', () => {
  const perf = calculateWeightedTopicPerformance([q(), q({ correct: 9 })], 't1');
  assert.equal(perf.resolved, 20);
  assert.equal(perf.accuracy, 70);
  assert.equal(perf.weighting.bancaWeighted, false);
});

test('refeitas contam meio peso no acerto e no volume', () => {
  const perf = calculateWeightedTopicPerformance([q(), q({ retry: true, correct: 10 })], 't1');
  // (5 + 10·0,5) / (10 + 10·0,5) = 10 / 15
  assert.equal(perf.accuracy, 66.7);
  assert.equal(perf.resolved, 15);
  assert.equal(perf.weighting.retryQuestions, 10);
});

test('banca da prova conta em dobro só com 10 questões dela no tópico, sem inflar o volume', () => {
  const records = [q({ banca: 'Cesgranrio', correct: 2 }), q({ banca: 'FGV', correct: 8 })];
  const weighted = calculateWeightedTopicPerformance(records, 't1', { targetBanca: 'Cesgranrio' });
  // (2·2 + 8) / (10·2 + 10) = 12 / 30
  assert.equal(weighted.accuracy, 40);
  assert.equal(weighted.resolved, 20);
  assert.equal(weighted.weighting.bancaWeighted, true);

  const few = calculateWeightedTopicPerformance(
    [q({ banca: 'Cesgranrio', resolved: 9, correct: 2 }), q({ banca: 'FGV', correct: 8 })],
    't1',
    { targetBanca: 'Cesgranrio' }
  );
  assert.equal(few.weighting.bancaWeighted, false);
  assert.equal(few.accuracy, 52.6);
});

test('o Domínio explica os pesos aplicados', () => {
  const performance = calculateWeightedTopicPerformance(
    [q({ banca: 'Cesgranrio' }), q({ retry: true })],
    't1',
    { targetBanca: 'Cesgranrio' }
  );
  const mastery = calculateTopicMastery({ performance });
  assert.equal(mastery.algorithmVersion, MASTERY_ALGORITHM_VERSION);
  assert.ok(mastery.reasons.includes('Questões refeitas contam meio peso no acerto'));
  assert.ok(mastery.reasons.includes('Questões da Cesgranrio contam em dobro no acerto'));
});
