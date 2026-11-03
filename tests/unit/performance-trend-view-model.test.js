import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceTrendViewModel } from '../../src/application/analytics/build-performance-trend-view-model.js';

const todayISO = '2026-11-03';

test('buildPerformanceTrendViewModel: estado vazio lida com segurança sem falhar', () => {
  const result = buildPerformanceTrendViewModel(null, todayISO);
  assert.equal(result.hasData, false);
  assert.equal(result.questionAccuracy, null);
  assert.equal(result.totalResolved, 0);
  assert.equal(result.simulationCount, 0);
  assert.equal(result.simulationLatest, null);
  assert.equal(result.simulationMean, null);
  assert.equal(result.targetScore, 80);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.points.length, 8);
});

test('buildPerformanceTrendViewModel: calcula precisão de questões, notas de simulados e pontos semanais', () => {
  const state = {
    questoes: [
      { date: '2026-11-02', resolved: 30, correct: 24 }, // 80%
      { date: '2026-10-25', resolved: 40, correct: 28 }, // 70%
      { date: '2026-10-18', resolved: 20, correct: 18 }, // 90%
    ],
    simulados: [
      { id: 'sim-1', date: '2026-10-20', nome: 'Simulado Caixa 1', total: 60, correct: 42 }, // 70%
      { id: 'sim-2', date: '2026-11-01', nome: 'Simulado Caixa 2', total: 60, correct: 48 }, // 80%
    ],
    metas: {
      metaAprovacao: 75,
    },
  };

  const result = buildPerformanceTrendViewModel(state, todayISO);
  assert.equal(result.hasData, true);
  assert.equal(result.totalResolved, 90);
  assert.equal(result.totalCorrect, 70);
  assert.equal(result.questionAccuracy, 77.8);
  assert.equal(result.simulationCount, 2);
  assert.equal(result.simulationLatest, 80.0);
  assert.equal(result.simulationMean, 75.0);
  assert.equal(result.targetScore, 75);
  assert.equal(result.status, 'ok');
  assert.equal(result.gap, 5); // 80 - 75
  assert.equal(result.points.length, 8);

  // Check that the points have question accuracies where available
  const activePoints = result.points.filter(p => p.questionAccuracy !== null);
  assert.ok(activePoints.length >= 2);

  // Check that simulation points were attached
  const simPoints = result.points.filter(p => p.simulationScore !== null);
  assert.ok(simPoints.length >= 1);
});

test('buildPerformanceTrendViewModel: sinaliza atenção quando rendimento fica abaixo da meta', () => {
  const state = {
    questoes: [
      { date: '2026-11-02', resolved: 20, correct: 10 }, // 50%
    ],
    simulados: [
      { id: 'sim-1', date: '2026-11-01', nome: 'Simulado 1', total: 50, correct: 30 }, // 60%
    ],
    metas: {
      metaAprovacao: 80,
    },
  };

  const result = buildPerformanceTrendViewModel(state, todayISO);
  assert.equal(result.hasData, true);
  assert.equal(result.status, 'attention');
  assert.equal(result.gap, -20); // 60 - 80
  assert.match(result.summaryText, /20 p\.p\. abaixo da meta/);
});
