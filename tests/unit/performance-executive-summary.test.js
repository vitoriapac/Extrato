import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceExecutiveSummary } from '../../src/application/performance/build-performance-executive-summary.js';
import { buildWeeklyReadingTips } from '../../src/application/performance/build-weekly-performance-brief.js';
import { renderPerformanceExecutiveSummary } from '../../src/ui/performance/performance-executive-summary-renderer.js';

const window = (over = {}) => ({
  start: '2026-04-01',
  end: '2026-04-07',
  studiedMinutes: 0,
  plannedMinutes: 0,
  planFulfillmentPct: null,
  sessionCount: 0,
  activeDays: 0,
  resolved: 0,
  correct: 0,
  accuracy: null,
  simulationsCount: 0,
  ...over,
});

test('resumo executivo — sem projeção declara dados insuficientes e não inventa mudança', () => {
  const summary = buildPerformanceExecutiveSummary({
    model: { current: { resolved: 0, sessionCount: 0 }, changes: [] },
    range: { label: 'Últimos 30 dias' },
    projection: null,
  });
  assert.equal(summary.situation.status, 'none');
  assert.equal(summary.change, null);
  const html = renderPerformanceExecutiveSummary(summary);
  assert.match(html, /Resumo executivo/);
  assert.match(html, /Dados insuficientes para projetar a meta/);
  assert.match(html, /Sem mudança mensurável com base comparável/);
  assert.match(html, /data-performance-investigate="diagnosis"/);
});

test('resumo executivo — com projeção mostra situação, faixa, confiança e amostra pequena', () => {
  const summary = buildPerformanceExecutiveSummary({
    model: {
      current: { resolved: 20, sessionCount: 4 },
      changes: [{ label: 'Precisão em questões', delta: 7, unit: 'p.p.' }],
    },
    range: { label: 'Últimos 30 dias' },
    projection: {
      status: 'attention',
      confidence: { level: 'low' },
      current: { targetScore: 80, simulationAccuracy: 81 },
      projection: { calibratedSimulationBand: { low: 69, high: 93 } },
    },
  });
  const html = renderPerformanceExecutiveSummary(summary);
  assert.match(html, /Atenção\. O resultado central dos simulados \(81%\) atinge a meta de 80%/);
  assert.match(html, /faixa estimada de 69% a 93% inclui valores abaixo dela/);
  assert.match(html, /Confiança baixa/);
  assert.match(html, /Precisão em questões: \+7 p\.p\. frente ao período anterior/);
  assert.match(html, /20 questões · 4 sessões/);
  assert.match(html, /Amostra pequena/);
  assert.doesNotMatch(html, /aprova/i);
});

test('dicas do resumo semanal — explicam o limite e o que registrar, sem agir sozinhas', () => {
  const tips = buildWeeklyReadingTips(
    window({ resolved: 12, sessionCount: 3, planFulfillmentPct: 56 }),
    window()
  );
  assert.equal(tips.readingTips.length, 3);
  assert.match(tips.readingTips[0], /menos de 30 questões/);
  assert.match(tips.readingTips[1], /semana anterior/);
  assert.match(tips.readingTips[2], /você decide o ajuste/);
  assert.ok(tips.keepTips.length >= 1 && tips.keepTips.length <= 2);

  const empty = buildWeeklyReadingTips(window(), window({ studiedMinutes: 60 }));
  assert.match(empty.keepTips.join(' '), /Registre as sessões/);
  assert.match(empty.keepTips.join(' '), /Registre as questões/);

  const steady = buildWeeklyReadingTips(
    window({ resolved: 80, sessionCount: 5, simulationsCount: 1 }),
    window({ resolved: 60, studiedMinutes: 300 })
  );
  assert.deepEqual(steady.readingTips, []);
  assert.match(steady.keepTips[0], /Feche a semana/);
});
