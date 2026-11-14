import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { analyzeFocusAndEnergy } from '../../src/domain/analytics/focus-energy-analytics.js';
import { buildShiftEnergyViewModel } from '../../src/application/analytics/build-shift-energy-view-model.js';
import { ShiftEnergyCard } from '../../src/ui/tabs/performance/ShiftEnergyCard.js';

const at = hour => new Date(2026, 9, 1, hour).getTime();
const session = (hour, focusLevel, extra = {}) => ({ durationSeconds: 1800, startedAt: at(hour), focusLevel, ...extra });

test('foco por turno: percentual sobre sessões avaliadas e turno sem avaliação não vira 0%', () => {
  const analysis = analyzeFocusAndEnergy([
    session(8, 'deep'),
    session(9, 'deep'),
    session(10, 'shallow'),
    session(10, 'deep'),
    session(14, null, { questionsResolved: 10, questionsCorrect: 7 }),
  ]);
  assert.equal(analysis.shifts.morning.focusRatedCount, 4);
  assert.equal(analysis.shifts.afternoon.focusRatedCount, 0);
  assert.equal(analysis.shifts.morning.deepFocusPercent, 75);
});

const cardHtml = (sessions, periodFocus) =>
  renderToString(h(ShiftEnergyCard, { model: buildShiftEnergyViewModel({ sessions }), periodFocus }));

test('turno: um bloco com dois selos de janela e uma única frase de leitura', () => {
  const sessions = [session(8, 'deep'), session(9, 'deep'), session(10, 'shallow'), session(10, 'deep'), session(14, 'shallow')];
  const html = cardHtml(sessions, {
    label: 'Últimos 30 dias',
    byShift: {
      morning: { percent: 75, rated: 4 },
      afternoon: { percent: null, rated: 0 },
      night: { percent: null, rated: 0 },
    },
  });
  assert.match(html, /data-window="history"/);
  assert.match(html, /data-window="period"/);
  assert.match(html, /Foco profundo \(período\):/);
  assert.match(html, /75%/);
  assert.equal((html.match(/shift-energy-card__reading/g) || []).length, 1);
  // Sem sessão avaliada no período o turno mostra traço, nunca 0%.
  assert.match(html, /—/);
});

test('turno: sem foco do período o cartão usa só a janela do histórico', () => {
  const html = cardHtml([session(8, 'deep')], null);
  assert.doesNotMatch(html, /data-window="period"/);
  assert.match(html, /Foco profundo:/);
});
