import test from 'node:test';
import assert from 'node:assert/strict';
import { detectAnomalousTimerSession } from '../../src/domain/sessions/idle-timer-guardian.js';

test('detectAnomalousTimerSession ignora sessões normais dentro da janela esperada', () => {
  const normal = detectAnomalousTimerSession({
    elapsedSeconds: 55 * 60,
    targetMinutes: 50,
    hiddenSeconds: 10 * 60,
  });
  assert.equal(normal.anomalous, false);
  assert.equal(normal.message, null);
});

test('detectAnomalousTimerSession sinaliza sessão longa acima do multiplicador da meta ou 150 min', () => {
  const forgotten = detectAnomalousTimerSession({
    elapsedSeconds: 185 * 60,
    targetMinutes: 60,
  });
  assert.equal(forgotten.anomalous, true);
  assert.equal(forgotten.reason, 'exceeded_target');
  assert.equal(forgotten.suggestedMinutes, 60);
  assert.match(forgotten.message, /185 min/);

  // Bloco com meta longa (90 min * 2.2 = 198 min) -> 160 min ainda é válido
  const longBlockOk = detectAnomalousTimerSession({
    elapsedSeconds: 160 * 60,
    targetMinutes: 90,
  });
  assert.equal(longBlockOk.anomalous, false);
});

test('detectAnomalousTimerSession sinaliza retorno de segundo plano ocioso >= 120 min', () => {
  const hidden = detectAnomalousTimerSession({
    elapsedSeconds: 135 * 60,
    targetMinutes: 45,
    hiddenSeconds: 125 * 60,
  });
  assert.equal(hidden.anomalous, true);
  assert.equal(hidden.reason, 'background_idle');
  assert.equal(hidden.suggestedMinutes, 45);
});
