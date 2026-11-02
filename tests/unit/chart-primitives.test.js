import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ringGeometry,
  sparklinePaths,
  bulletGeometry,
  stackedSegments,
} from '../../src/ui/primitives/charts/geometry.js';
import {
  renderRingGauge,
  renderSparkline,
  renderBulletBar,
  renderStackedBar,
} from '../../src/ui/primitives/charts/charts.js';
import { readinessWeeklyTrend } from '../../src/application/analytics/readiness-history.js';

test('ringGeometry — 0, 50, 100, acima do máximo e entradas inválidas', () => {
  const zero = ringGeometry(0);
  assert.equal(zero.ratio, 0);
  assert.equal(zero.offset, zero.circumference);
  const half = ringGeometry(50);
  assert.equal(half.ratio, 0.5);
  assert.ok(Math.abs(half.offset - half.circumference / 2) < 1e-9);
  assert.equal(ringGeometry(100).offset, 0);
  assert.equal(ringGeometry(140).ratio, 1);
  assert.equal(ringGeometry(-5).ratio, 0);
  for (const invalid of [null, undefined, NaN, '50', Infinity]) assert.equal(ringGeometry(invalid), null);
  assert.equal(ringGeometry(50, 0), null);
});

test('RingGauge — sem dados mostra estado vazio, não zero; âmbar só abaixo da meta', () => {
  const empty = renderRingGauge({ value: null, label: 'Prontidão', target: 70 });
  assert.match(empty, /role="img"/);
  assert.match(empty, /chart-ring--empty/);
  assert.match(empty, /aria-label="Prontidão: sem dados suficientes"/);
  assert.doesNotMatch(empty, /chart-ring__value/);
  assert.match(empty, />—</);

  const below = renderRingGauge({ value: 46, label: 'Prontidão', target: 70 });
  assert.match(below, /chart-ring--attention/);
  assert.match(below, /aria-label="Prontidão: 46 de 100, abaixo da meta de 70"/);
  assert.match(below, />46</);

  const onTarget = renderRingGauge({ value: 70, label: 'Prontidão', target: 70 });
  assert.match(onTarget, /chart-ring--ok/);
  assert.doesNotMatch(onTarget, /attention/);

  const zero = renderRingGauge({ value: 0, label: 'Prontidão' });
  assert.match(zero, /chart-ring--ok/);
  assert.match(zero, />0</);
});

test('sparklinePaths — lacunas interrompem a linha e menos de 2 pontos não desenha', () => {
  assert.equal(sparklinePaths([], 96, 28), null);
  assert.equal(sparklinePaths([null, 40, null], 96, 28), null);
  const flat = sparklinePaths([50, 50], 96, 28);
  assert.equal(flat.runs.length, 1);
  const gap = sparklinePaths([40, 42, null, 50, 55], 96, 28);
  assert.equal(gap.runs.length, 2);
  assert.equal(gap.dots.length, 0);
  assert.equal(sparklinePaths([10, null, 20], 96, 28).dots.length, 2);
  assert.equal(gap.last.value, 55);
  assert.equal(gap.first, 40);
  // connectGaps: one run across the gap, points keep their place in time.
  const joined = sparklinePaths([10, null, 20, null], 30, 20, 0, true);
  assert.equal(joined.runs.length, 1);
  assert.equal(joined.dots.length, 0);
  assert.equal(joined.runs[0], 'M0 20 L20 0');
  assert.equal(joined.count, 2);
  const rising = sparklinePaths([0, 100], 100, 20, 0);
  assert.equal(rising.runs[0], 'M0 20 L100 0');
});

test('Sparkline — descrição textual com início, fim e unidade; vazio explicado', () => {
  const html = renderSparkline({ values: [40, null], label: 'Prontidão', unit: 'pontos' });
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="Prontidão: histórico insuficiente"/);
  const isolated = renderSparkline({ values: [40, null, 46], label: 'Prontidão', unit: 'pontos' });
  assert.match(isolated, /aria-label="Prontidão: de 40 pontos a 46 pontos, com dados em 2 de 3 períodos"/);
  assert.equal((isolated.match(/chart-sparkline__point/g) || []).length, 2);
  const ok = renderSparkline({ values: [40, 44, 46], label: 'Prontidão', unit: 'pontos' });
  assert.match(ok, /aria-label="Prontidão: de 40 pontos a 46 pontos, com dados em 3 de 3 períodos"/);
  assert.match(ok, /chart-sparkline__dot/);
});

test('BulletBar — preenchimento, meta e tom abaixo da meta; inválido sem barra', () => {
  assert.deepEqual(bulletGeometry(50, 80), { fill: 50, target: 80, below: true });
  assert.deepEqual(bulletGeometry(90, 80), { fill: 90, target: 80, below: false });
  assert.deepEqual(bulletGeometry(0, null), { fill: 0, target: null, below: false });
  assert.equal(bulletGeometry(120, 80).fill, 100);
  assert.equal(bulletGeometry(null, 80), null);
  const html = renderBulletBar({ value: 74.5, target: 80, label: 'Acerto' });
  assert.match(html, /role="img"/);
  assert.match(html, /is-below/);
  assert.match(html, /aria-label="Acerto: 74,5%, meta 80%, abaixo da meta"/);
  assert.match(html, />74,5%</);
  assert.match(renderBulletBar({ value: undefined, label: 'Acerto' }), /sem dados/);
});

test('StackedBar — partes proporcionais, total zero vazio e legenda textual', () => {
  const segments = stackedSegments([{ value: 30 }, { value: 10 }, { value: -5 }, { value: NaN }]);
  assert.deepEqual(segments.map(s => s.width), [75, 25, 0, 0]);
  assert.deepEqual(segments.map(s => s.start), [0, 75, 100, 100]);
  assert.equal(stackedSegments([{ value: 0 }, { value: null }]), null);
  const html = renderStackedBar({
    label: 'Tempo de hoje',
    unit: 'min',
    parts: [
      { label: 'Planejado', value: 45, tone: 'primary' },
      { label: 'Extra', value: 15, tone: 'secondary' },
    ],
  });
  assert.match(html, /aria-label="Tempo de hoje: Planejado 45 min \(75%\), Extra 15 min \(25%\)"/);
  assert.match(html, /chart-stacked__legend/);
  assert.match(renderStackedBar({ label: 'Vazio', parts: [] }), /sem dados suficientes/);
});

test('readinessWeeklyTrend — último valor de cada semana, lacunas como null, só o escopo ativo', () => {
  const snapshots = [
    { date: '2026-10-05', score: 30, activeExamTags: [] },
    { date: '2026-10-20', score: 40, activeExamTags: [] },
    { date: '2026-10-22', score: 42, activeExamTags: [] },
    { date: '2026-10-31', score: 46, activeExamTags: [] },
    { date: '2026-10-31', score: 99, activeExamTags: ['bb'] },
  ];
  const trend = readinessWeeklyTrend(snapshots, [], '2026-11-01', 4);
  assert.equal(trend.length, 4);
  assert.equal(trend[3], 46);
  assert.equal(trend[2], 42);
  assert.ok(!trend.includes(99));
  assert.deepEqual(readinessWeeklyTrend([], [], '2026-11-01', 3), [null, null, null]);
  assert.deepEqual(readinessWeeklyTrend(snapshots, [], '2026-11-01', 4, 51).slice(2), [42, 51]);
  assert.equal(readinessWeeklyTrend(snapshots, [], '2026-11-01', 4, null)[3], 46);
});
