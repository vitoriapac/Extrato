import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  buildConsistencyStrip,
  renderConsistencyStrip,
} from '../../src/ui/renderers/consistency-strip-renderer.js';
import { renderCompactHeader } from '../../src/ui/renderers/header-renderer.js';
import { TodayExecutionSummary } from '../../src/ui/tabs/today/TodayExecutionSummary.js';

test('constância: 28 dias terminando hoje, faixas de intensidade e total em texto', () => {
  const strip = buildConsistencyStrip({
    today: '2026-10-28',
    sessions: [
      { date: '2026-10-28', durationSeconds: 100 * 60 },
      { date: '2026-10-27', durationSeconds: 40 * 60 },
      { date: '2026-10-01', durationSeconds: 10 * 60 },
      { date: '2026-09-30', durationSeconds: 999 * 60 },
    ],
    questions: [{ date: '2026-10-20', resolved: 5 }, { date: '2026-10-19', resolved: 0 }],
  });
  assert.equal(strip.cells.length, 28);
  assert.equal(strip.cells[0].date, '2026-10-01');
  assert.equal(strip.cells.at(-1).date, '2026-10-28');
  assert.deepEqual(
    [strip.cells.at(-1).level, strip.cells.at(-2).level, strip.cells[0].level, strip.cells[19].level, strip.cells[18].level],
    [3, 2, 1, 1, 0]
  );
  assert.equal(strip.activeDays, 4);
  const html = renderConsistencyStrip(strip);
  assert.match(html, /<strong>4 de 28 dias<\/strong>/);
  assert.match(html, /role="img" aria-label="Constância: 4 de 28 dias com estudo"/);
});

test('cabeçalho fixo: sequência com chama só aparece a partir de 1 dia', () => {
  const nodes = {};
  const doc = { getElementById: id => (nodes[id] ||= { textContent: '', hidden: false }) };
  const model = days => ({ readiness: { value: 50 }, exam: {}, plan: { number: '1' }, streak: { days } });
  renderCompactHeader(model(0), { document: doc, formatDate: String });
  assert.equal(nodes.compactStreak.hidden, true);
  renderCompactHeader(model(1), { document: doc, formatDate: String });
  assert.equal(nodes.compactStreak.hidden, false);
  assert.equal(nodes.compactStreakUnit.textContent, 'dia');
  renderCompactHeader(model(6), { document: doc, formatDate: String });
  assert.equal(nodes.compactStreakDays.textContent, '6');
  assert.equal(nodes.compactStreakUnit.textContent, 'dias');
});

test('resumo de Hoje: meta do plano cumprida ganha aviso em texto e classe da animação', () => {
  const props = { availableMinutesFormatted: '1h', plannedMinutesFormatted: '1h', executedMinutesFormatted: '1h', dateFormatted: 'hoje' };
  const met = render(h(TodayExecutionSummary, { ...props, progressPercent: 100 }));
  assert.match(met, /is-goal-met/);
  assert.match(met, /role="status"[^>]*>.*Plano do dia cumprido/s);
  const partial = render(h(TodayExecutionSummary, { ...props, progressPercent: 60 }));
  assert.doesNotMatch(partial, /is-goal-met|Plano do dia cumprido/);
});
