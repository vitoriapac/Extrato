import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShiftEnergyViewModel } from '../../src/application/analytics/build-shift-energy-view-model.js';

test('buildShiftEnergyViewModel agrupa sessões em Manhã, Tarde e Noite', () => {
  const sessions = [
    // Manhã (08h): 3600s, foco profundo, acerto 90%
    {
      startedAt: '2026-10-15T08:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'deep',
      energyLevel: 'high',
      questionsResolved: 20,
      questionsCorrect: 18,
    },
    // Manhã (09h): 3600s, foco profundo, acerto 85%
    {
      startedAt: '2026-10-16T09:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'deep',
      energyLevel: 'high',
      questionsResolved: 20,
      questionsCorrect: 17,
    },
    // Tarde (14h): 3600s, foco normal, acerto 70%
    {
      startedAt: '2026-10-15T14:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'normal',
      energyLevel: 'normal',
      questionsResolved: 20,
      questionsCorrect: 14,
    },
    // Noite (20h): 3600s, foco distraído, acerto 50%
    {
      startedAt: '2026-10-15T20:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'distracted',
      energyLevel: 'low',
      questionsResolved: 20,
      questionsCorrect: 10,
    },
    // Noite (21h): 3600s, baixa energia
    {
      startedAt: '2026-10-16T21:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'distracted',
      energyLevel: 'low',
      questionsResolved: 20,
      questionsCorrect: 10,
    },
  ];

  const model = buildShiftEnergyViewModel({ sessions });

  assert.equal(model.totalStudyHours, 5);
  assert.equal(model.shifts.length, 3);

  // Manhã teve 2h (7200s) e melhor acerto (~87.5%)
  const morning = model.shifts.find(s => s.shift === 'morning');
  assert.ok(morning);
  assert.equal(morning.hoursSpent, 2);
  assert.equal(morning.sessionsCount, 2);
  assert.equal(morning.isPeak, true);
  assert.equal(model.peakShift, 'morning');
});

test('buildShiftEnergyViewModel lida com histórico vazio', () => {
  const model = buildShiftEnergyViewModel({ sessions: [] });
  assert.equal(model.totalStudyHours, 0);
  assert.equal(model.isSampleSufficient, false);
  assert.equal(model.peakShift, null);
});
