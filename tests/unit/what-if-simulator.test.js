import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateWhatIfScenario } from '../../src/domain/forecasts/what-if-simulator.js';

test('simulateWhatIfScenario — nunca muta o estado persistido fornecido', () => {
  const originalState = {
    subjects: [
      {
        id: 's1',
        name: 'Direito Constitucional',
        topics: [
          { id: 't1', name: 'Direitos Fundamentais', completed: true, totalSeconds: 3600 },
          { id: 't2', name: 'Organização do Estado', completed: false, totalSeconds: 0 },
        ],
      },
    ],
    metas: {
      horasPorDia: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
      metaAprovacao: 80,
    },
    studySessions: [{ id: 'sess-1', durationSeconds: 1800 }],
  };

  const snapshotBefore = JSON.stringify(originalState);

  const result = simulateWhatIfScenario(
    {
      dailyMinutesDelta: 45,
      targetScore: 85,
      horizonDays: 30,
      subjectFocusMultipliers: { s1: 1.5 },
    },
    originalState
  );

  const snapshotAfter = JSON.stringify(originalState);

  assert.equal(
    snapshotBefore,
    snapshotAfter,
    'O estado original não pode sofrer nenhuma alteração'
  );
  assert.equal(result.isStateUnmutated, true);
});

test('simulateWhatIfScenario — acréscimo de minutos aumenta capacidade, cobertura e prontidão', () => {
  const result = simulateWhatIfScenario({
    dailyMinutesDelta: 30, // +3.5h/semana
    targetScore: 80,
    horizonDays: 30,
    currentMetrics: {
      readinessScore: 55,
      coverageScore: 40,
      masteryScore: 50,
      retentionScore: 60,
      consistencyScore: 65,
      weeklyStudyMinutes: 600, // 10h/sem
      totalTopicsCount: 40,
      coveredTopicsCount: 16,
    },
  });

  // Capacidade semanal
  assert.equal(result.baseline.weeklyStudyHours, 10);
  assert.equal(result.simulated.weeklyStudyHours, 13.5);
  assert.equal(result.delta.weeklyStudyHoursDelta, 3.5);

  // Cobertura e prontidão devem ser estritamente superiores
  assert.ok(result.simulated.coveragePercent > result.baseline.coveragePercent);
  assert.ok(result.simulated.masteryScore >= result.baseline.masteryScore);
  assert.ok(result.simulated.readinessScore > result.baseline.readinessScore);
  assert.ok(result.delta.readinessScoreDelta > 0);

  // Estimativa de dias economizados
  assert.ok(result.delta.daysSavedEstimate !== null && result.delta.daysSavedEstimate > 0);

  // Insights gerados
  assert.ok(result.insights.length >= 2);
  assert.match(result.insights[0], /\+30 min\/dia/);
});

test('simulateWhatIfScenario — redução de minutos desacelera a prontidão e gera alertas', () => {
  const result = simulateWhatIfScenario({
    dailyMinutesDelta: -30,
    targetScore: 80,
    currentMetrics: {
      readinessScore: 65,
      weeklyStudyMinutes: 840, // 14h/sem
      totalTopicsCount: 30,
      coveredTopicsCount: 15,
    },
  });

  assert.ok(result.simulated.weeklyStudyHours < result.baseline.weeklyStudyHours);
  assert.ok(result.delta.weeklyStudyHoursDelta < 0);
  assert.match(result.insights[0], /Reduzir 30 min\/dia desacelera/);
});

test('simulateWhatIfScenario — multiplicadores de foco em disciplinas com alto peso potencializam domínio', () => {
  const neutral = simulateWhatIfScenario({
    dailyMinutesDelta: 30,
    subjectFocusMultipliers: { s1: 1.0 },
    currentMetrics: { masteryScore: 50, weeklyStudyMinutes: 600 },
  });

  const focused = simulateWhatIfScenario({
    dailyMinutesDelta: 30,
    subjectFocusMultipliers: { s1: 1.5 },
    currentMetrics: { masteryScore: 50, weeklyStudyMinutes: 600 },
  });

  assert.ok(focused.simulated.masteryScore >= neutral.simulated.masteryScore);
  assert.ok(focused.insights.some(i => i.includes('direcionamento de esforço')));
});
