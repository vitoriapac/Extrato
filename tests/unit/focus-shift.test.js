import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFocusAndEnergy } from '../../src/domain/analytics/focus-energy-analytics.js';
import { renderFocusByShift } from '../../src/ui/performance/performance-consistency-renderer.js';

const at = hour => new Date(2026, 9, 1, hour).getTime();
const session = (hour, focusLevel, extra = {}) => ({ durationSeconds: 1800, startedAt: at(hour), focusLevel, ...extra });

test('foco por turno: percentual sobre sessões avaliadas e turno sem avaliação não vira 0%', () => {
  const analysis = analyzeFocusAndEnergy([
    session(8, 'deep'),
    session(9, 'deep'),
    session(10, 'shallow'),
    session(10, 'deep'),
    // Afternoon session with questions only: counted as a session, not as a focus rating.
    session(14, null, { questionsResolved: 10, questionsCorrect: 7 }),
  ]);
  assert.equal(analysis.shifts.morning.focusRatedCount, 4);
  assert.equal(analysis.shifts.afternoon.focusRatedCount, 0);
  const html = renderFocusByShift(analysis);
  const [morning, afternoon, night] = html.split('<li>').slice(1);
  assert.match(morning, /aria-label="Foco profundo de manhã: 75%"/);
  assert.match(morning, /4 sessões avaliadas/);
  assert.match(afternoon, /Foco profundo de tarde: sem dados suficientes/);
  assert.match(afternoon, /sem sessões avaliadas/);
  assert.doesNotMatch(afternoon, /0%/);
  assert.match(night, /sem sessões avaliadas/);
  assert.match(html, /Maior acerto em questões: tarde/);
});

test('foco por turno: com amostra pequena explica quando o diagnóstico fica disponível', () => {
  const html = renderFocusByShift(analyzeFocusAndEnergy([session(8, 'deep')]));
  assert.match(html, /a partir de 5 o diagnóstico por turno fica disponível/);
});
