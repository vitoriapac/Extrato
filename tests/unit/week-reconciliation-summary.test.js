import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WeekReconciliationSummary } from '../../src/ui/tabs/goals/WeekReconciliationSummary.js';
import { buildWeekReconciliation } from '../../src/ui/tabs/goals/week-reconciliation.js';

const html = (plannedMin, studiedMin, capacityMin = 720) =>
  render(h(WeekReconciliationSummary, { data: buildWeekReconciliation({ capacityMin, plannedMin, studiedMin, periodLabel: '03 a 09 nov' }) }));

test('minutos fracionários arredondam antes de virar horas (119,7 min = 2h00)', () => {
  const out = html(100, 50, 119.7);
  assert.match(out, />2h00</);
  assert.doesNotMatch(out, /1h00/);
});

test('aviso de plano curto usa o múltiplo exibido (2,04 não mostra; 2,06 mostra)', () => {
  assert.doesNotMatch(html(100, 204), /tempo distribuído nos dias/);
  assert.match(html(100, 206), /tempo distribuído nos dias/);
});
