import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveDayShift,
  analyzeFocusAndEnergy,
} from '../../src/domain/analytics/focus-energy-analytics.js';

test('resolveDayShift — classifica corretamente os turnos pelas horas', () => {
  assert.equal(resolveDayShift('2026-10-01T08:30:00Z'), 'morning');
  assert.equal(resolveDayShift('2026-10-01T14:15:00Z'), 'afternoon');
  assert.equal(resolveDayShift('2026-10-01T21:00:00Z'), 'night');
  assert.equal(resolveDayShift('2026-10-01T02:00:00Z'), 'night');
});

test('analyzeFocusAndEnergy — rejeita diagnósticos se a amostra for inferior a 5 sessões', () => {
  const sessions = [
    {
      date: '2026-10-01',
      startedAt: '2026-10-01T08:00:00Z',
      durationSeconds: 3600,
      energyLevel: 'high',
    },
    {
      date: '2026-10-02',
      startedAt: '2026-10-02T08:00:00Z',
      durationSeconds: 3600,
      energyLevel: 'high',
    },
  ];

  const result = analyzeFocusAndEnergy(sessions);

  assert.equal(result.isSampleSufficient, false);
  assert.equal(result.sampleSize, 2);
  assert.equal(result.peakShift, null);
  assert.match(result.recommendations[0], /Amostra atual \(2 sessões\) ainda insuficiente/);
});

test('analyzeFocusAndEnergy — identifica turno de pico e alerta de fadiga noturna com amostra suficiente', () => {
  // 6 sessões: 3 pela manhã (acerto 90%) e 3 à noite (acerto 55% e baixa energia)
  const sessions = [
    // Manhã
    {
      date: '2026-10-01',
      startedAt: '2026-10-01T09:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'deep',
      energyLevel: 'high',
      questionsResolved: 20,
      questionsCorrect: 18,
    },
    {
      date: '2026-10-02',
      startedAt: '2026-10-02T09:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'deep',
      energyLevel: 'high',
      questionsResolved: 20,
      questionsCorrect: 18,
    },
    {
      date: '2026-10-03',
      startedAt: '2026-10-03T09:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'deep',
      energyLevel: 'high',
      questionsResolved: 20,
      questionsCorrect: 18,
    },
    // Noite
    {
      date: '2026-10-01',
      startedAt: '2026-10-01T21:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'distracted',
      energyLevel: 'low',
      questionsResolved: 20,
      questionsCorrect: 11,
    },
    {
      date: '2026-10-02',
      startedAt: '2026-10-02T21:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'distracted',
      energyLevel: 'low',
      questionsResolved: 20,
      questionsCorrect: 11,
    },
    {
      date: '2026-10-03',
      startedAt: '2026-10-03T21:00:00Z',
      durationSeconds: 3600,
      focusLevel: 'distracted',
      energyLevel: 'low',
      questionsResolved: 20,
      questionsCorrect: 11,
    },
  ];

  const result = analyzeFocusAndEnergy(sessions);

  assert.equal(result.isSampleSufficient, true);
  assert.equal(result.sampleSize, 6);
  assert.equal(result.peakShift, 'morning');
  assert.ok(result.shifts.morning.averageAccuracy >= 90);
  assert.ok(result.shifts.night.averageAccuracy <= 55);

  // Alerta de fadiga ativado (queda de 35 p.p. à noite)
  assert.ok(result.fatigueAlert !== null);
  assert.match(result.fatigueAlert, /Queda de 35 p.p./);
  assert.ok(
    result.recommendations.some(r =>
      r.includes('melhor rendimento cognitivo ocorre no turno da manhã')
    )
  );
});
