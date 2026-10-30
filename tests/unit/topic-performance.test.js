import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyFromCounts,
  performanceConfidence,
  classifyAccuracy,
  calculateTopicPerformance,
  calculateSubjectPerformanceCounts,
  calculateTopicErrorRate,
  calculateSubjectPerformanceBetween,
  calculateSubjectWeeklyTrend,
  calculateTopicPerformanceBetween,
  calculateTopicWeeklyTrend,
  calculateWeightedTrend,
  calculateDominantTopicError,
} from '../../src/domain/analytics/topic-performance.js';

test('accuracyFromCounts calcula porcentagem arredondada com 1 casa', () => {
  assert.equal(accuracyFromCounts(0, 0), null);
  assert.equal(accuracyFromCounts(7, 10), 70);
  assert.equal(accuracyFromCounts(1, 3), 33.3);
});

test('performanceConfidence classifica faixas de amostra', () => {
  assert.equal(performanceConfidence(5, 10).key, 'insufficient');
  assert.equal(performanceConfidence(15).key, 'low');
  assert.equal(performanceConfidence(35).key, 'medium');
  assert.equal(performanceConfidence(60).key, 'high');
});

test('classifyAccuracy classifica conforme target', () => {
  assert.equal(classifyAccuracy(null, 80).key, 'none');
  assert.equal(classifyAccuracy(85, 80).key, 'strong');
  assert.equal(classifyAccuracy(75, 80).key, 'attention');
  assert.equal(classifyAccuracy(60, 80).key, 'weak');
});

test('calculateTopicPerformance agrega questoes do topico', () => {
  const records = [
    { topicId: 't1', resolved: 10, correct: 8 },
    { topicId: 't2', resolved: 5, correct: 5 },
    { topicId: 't1', resolved: 15, correct: 12 },
  ];
  const perf = calculateTopicPerformance(records, 't1');
  assert.equal(perf.resolved, 25);
  assert.equal(perf.correct, 20);
  assert.equal(perf.accuracy, 80);
});

test('calculateSubjectPerformanceCounts agrega questoes e simulados', () => {
  const questions = [
    { subjectId: 's1', resolved: 20, correct: 15 },
    { subjectId: 's2', resolved: 10, correct: 8 },
  ];
  const simulados = [
    {
      breakdown: [
        { subjectId: 's1', total: 10, correct: 9 },
        { subjectId: 's2', total: 5, correct: 4 },
      ],
    },
  ];
  const perf = calculateSubjectPerformanceCounts(questions, simulados, 's1', q => q.subjectId);
  assert.equal(perf.resolved, 30);
  assert.equal(perf.correct, 24);
  assert.equal(perf.accuracy, 80);
});

test('calculateTopicErrorRate pondera taxa de topico e disciplina', () => {
  // topic com < 10 resolvidas -> usa taxa da disciplina
  const lowSampleTopic = { resolved: 5, correct: 2, accuracy: 40 };
  const subjectPerf = { resolved: 50, correct: 40, accuracy: 80 };
  const rate1 = calculateTopicErrorRate(lowSampleTopic, subjectPerf);
  assert.equal(rate1.source, 'subject');
  assert.equal(rate1.rate, 20);

  // topic com 50+ resolvidas -> usa 100% topico
  const highSampleTopic = { resolved: 50, correct: 35, accuracy: 70 };
  const rate2 = calculateTopicErrorRate(highSampleTopic, subjectPerf);
  assert.equal(rate2.source, 'topic');
  assert.equal(rate2.rate, 30);
});

test('calculateSubjectWeeklyTrend gera array de semanas', () => {
  const records = [{ subjectId: 's1', date: '2026-10-26', resolved: 10, correct: 8 }];
  const trend = calculateSubjectWeeklyTrend({
    records,
    subjectId: 's1',
    weeks: 2,
    startOfWeekFn: () => '2026-10-26',
    addDaysFn: (iso, days) => {
      const d = new Date(iso);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    },
    today: '2026-10-28',
    entitySubjectId: q => q.subjectId,
  });

  assert.equal(trend.length, 2);
  assert.equal(trend[1].resolved, 10);
  assert.equal(trend[1].accuracy, 80);
});

test('calculateDominantTopicError formata erro dominante', () => {
  const profile = {
    dominant: { key: 'interpretacao', share: 60, recommendation: 'Treinar leitura' },
  };
  const categories = {
    interpretacao: { label: 'Interpretação', icon: '📖' },
  };
  const res = calculateDominantTopicError(profile, categories, {});
  assert.equal(res.key, 'interpretacao');
  assert.equal(res.meta.label, 'Interpretação');
  assert.equal(res.recommendation, 'Treinar leitura');
});
