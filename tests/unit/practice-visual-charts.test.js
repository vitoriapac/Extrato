import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubjectWeeklyTrendVisual,
  buildErrorParetoVisual,
  buildSimulationTrendVisual,
  buildSimulationBreakdownVisual,
} from '../../src/domain/practice/practice-visual-models.js';
import {
  renderWeeklyTrendChart,
  renderErrorParetoChart,
  renderSimulationTrendChart,
  renderSimulationBreakdownBarChart,
} from '../../src/ui/primitives/charts/charts.js';

test('buildSubjectWeeklyTrendVisual — calcula pontos, taxa de acerto, tendência e volume máximo', () => {
  const weeks = [
    { start: '2026-09-01', resolved: 20, correct: 14, accuracy: 70, insufficientData: false },
    { start: '2026-09-08', resolved: 40, correct: 32, accuracy: 80, insufficientData: false },
    { start: '2026-09-15', resolved: 50, correct: 45, accuracy: 90, insufficientData: false },
  ];

  const visual = buildSubjectWeeklyTrendVisual({
    weeks,
    trend: { key: 'improving', label: 'Evolução positiva (+20 p.p.)', delta: 20 },
    colorSlot: 3,
    formatDate: d => d.slice(5),
  });

  assert.equal(visual.points.length, 3);
  assert.equal(visual.colorSlot, 3);
  assert.equal(visual.maxResolved, 50);
  assert.equal(visual.trendDirection, 'improving');
  assert.equal(visual.trendDelta, 20);
  assert.equal(visual.points[0].accuracy, 70);
  assert.equal(visual.points[2].accuracy, 90);
  assert.equal(visual.points[2].label, '09-15');
});

test('buildSubjectWeeklyTrendVisual — lida com semanas vazias ou dados insuficientes', () => {
  const visual = buildSubjectWeeklyTrendVisual({
    weeks: [],
    colorSlot: 1,
  });

  assert.equal(visual.points.length, 0);
  assert.equal(visual.trendDirection, 'insufficient');
  assert.equal(visual.maxResolved, 10);
  assert.equal(visual.averageAccuracy, null);
});

test('buildErrorParetoVisual — identifica causas vitais (80/20), causa predominante e share acumulado', () => {
  const items = [
    { id: 'lacuna_teorica', label: 'Lacuna teórica', icon: 'book', value: 50, delta: 5 },
    { id: 'interpretacao', label: 'Interpretação', icon: 'help', value: 30, delta: -2 },
    { id: 'distracao', label: 'Distração', icon: 'zap', value: 15, delta: 0 },
    { id: 'tempo', label: 'Gestão de tempo', icon: 'clock', value: 5, delta: -1 },
  ];

  const visual = buildErrorParetoVisual({
    items,
    totalErrors: 100,
    hasPrevious: true,
  });

  assert.equal(visual.totalErrors, 100);
  assert.equal(visual.items.length, 4);
  assert.equal(visual.predominantCause, 'Lacuna teórica');

  // 50% + 30% = 80%, logo os 2 primeiros itens representam as causas vitais (80%)
  assert.equal(visual.vitalCount, 2);
  assert.equal(visual.items[0].isVital, true);
  assert.equal(visual.items[1].isVital, true);
  assert.equal(visual.items[2].isVital, false);

  assert.equal(visual.items[0].cumulativeShare, 50);
  assert.equal(visual.items[1].cumulativeShare, 80);
  assert.equal(visual.items[2].cumulativeShare, 95);
  assert.equal(visual.items[3].cumulativeShare, 100);
});

test('buildErrorParetoVisual — lida com total de erros zero', () => {
  const visual = buildErrorParetoVisual({
    items: [],
    totalErrors: 0,
  });

  assert.equal(visual.totalErrors, 0);
  assert.equal(visual.vitalCount, 0);
  assert.equal(visual.predominantCause, null);
});

test('buildSimulationTrendVisual — calcula KPIs, delta e ordenação temporal de simulados', () => {
  const simulations = [
    { id: 'sim-1', nome: 'Simulado 01', date: '2026-08-01', correct: 60, total: 100, score: 60 },
    { id: 'sim-2', nome: 'Simulado 02', date: '2026-08-15', correct: 75, total: 100, score: 75 },
    { id: 'sim-3', nome: 'Simulado 03', date: '2026-09-01', correct: 85, total: 100, score: 85 },
  ];

  const visual = buildSimulationTrendVisual({
    simulations,
    targetScore: 80,
  });

  assert.equal(visual.simulations.length, 3);
  assert.equal(visual.targetScore, 80);
  assert.equal(visual.latestScore, 85);
  assert.equal(visual.scoreDelta, 10); // 85 - 75 = +10
  assert.equal(visual.bestScore, 85);
  assert.equal(visual.averageScore, 73); // (60 + 75 + 85) / 3 = 73.33 -> 73
  assert.equal(visual.onTargetCount, 1); // Only sim-3 (85 >= 80)
  assert.equal(visual.simulations[2].onTarget, true);
  assert.equal(visual.simulations[0].onTarget, false);
});

test('buildSimulationTrendVisual — lida com lista vazia de simulados', () => {
  const visual = buildSimulationTrendVisual({
    simulations: [],
    targetScore: 80,
  });

  assert.equal(visual.simulations.length, 0);
  assert.equal(visual.latestScore, null);
  assert.equal(visual.bestScore, null);
  assert.equal(visual.scoreDelta, null);
  assert.equal(visual.onTargetCount, 0);
});

test('buildSimulationBreakdownVisual — calcula aproveitamento por disciplina vs média da prova', () => {
  const breakdown = [
    { id: 'b-1', subjectId: 'sub-dir-penal', correct: 18, total: 20 }, // 90%
    { id: 'b-2', subjectId: 'sub-const', correct: 12, total: 20 },    // 60%
    { id: 'b-3', subjectId: 'sub-port', correct: 15, total: 20 },     // 75%
  ];

  const subjects = [
    { id: 'sub-dir-penal', name: 'Direito Penal' },
    { id: 'sub-const', name: 'Direito Constitucional' },
    { id: 'sub-port', name: 'Língua Portuguesa' },
  ];

  const visual = buildSimulationBreakdownVisual({
    breakdown,
    overallScore: 75,
    subjects,
  });

  assert.equal(visual.overallScore, 75);
  assert.equal(visual.rows.length, 3);
  assert.equal(visual.highestSubject, 'Direito Penal');
  assert.equal(visual.lowestSubject, 'Direito Constitucional');

  const penal = visual.rows.find(r => r.subjectId === 'sub-dir-penal');
  assert.ok(penal);
  assert.equal(penal.score, 90);
  assert.equal(penal.relativeGap, 15); // 90 - 75
  assert.equal(penal.isAboveAverage, true);
  assert.ok(penal.colorSlot >= 1 && penal.colorSlot <= 8);

  const constRow = visual.rows.find(r => r.subjectId === 'sub-const');
  assert.ok(constRow);
  assert.equal(constRow.score, 60);
  assert.equal(constRow.relativeGap, -15); // 60 - 75
  assert.equal(constRow.isAboveAverage, false);
});

test('renderWeeklyTrendChart — renderiza string SVG válida e acessível', () => {
  const visual = buildSubjectWeeklyTrendVisual({
    weeks: [
      { start: '2026-09-01', resolved: 20, correct: 16, accuracy: 80, insufficientData: false },
      { start: '2026-09-08', resolved: 30, correct: 27, accuracy: 90, insufficientData: false },
    ],
    colorSlot: 2,
  });

  const html = renderWeeklyTrendChart({ visual });
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('chart-weekly-trend'));
  assert.ok(html.includes('subject-bg-2'));
});

test('renderErrorParetoChart — renderiza barras de Pareto e percentual acumulado', () => {
  const visual = buildErrorParetoVisual({
    items: [
      { id: 'lacuna_teorica', label: 'Lacuna teórica', value: 40 },
      { id: 'distracao', label: 'Distração', value: 10 },
    ],
    totalErrors: 50,
  });

  const html = renderErrorParetoChart({ visual });
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('chart-error-pareto'));
  assert.ok(html.includes('Lacuna teórica'));
  assert.ok(html.includes('80%'));
});

test('renderSimulationTrendChart — renderiza gráfico de evolução e linha de corte da meta', () => {
  const visual = buildSimulationTrendVisual({
    simulations: [
      { id: 's1', nome: 'Simulado 1', date: '2026-09-01', correct: 70, total: 100, score: 70 },
      { id: 's2', nome: 'Simulado 2', date: '2026-09-15', correct: 85, total: 100, score: 85 },
    ],
    targetScore: 80,
  });

  const html = renderSimulationTrendChart({ visual });
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('chart-simulation-trend'));
  assert.ok(html.includes('Média Recente'));
  assert.ok(html.includes('80%'));
});

test('renderSimulationBreakdownBarChart — renderiza barras de disciplinas com média de corte', () => {
  const visual = buildSimulationBreakdownVisual({
    breakdown: [
      { id: 'b1', subjectId: 's1', correct: 10, total: 10 },
    ],
    overallScore: 80,
    subjects: [{ id: 's1', name: 'Informática' }],
  });

  const html = renderSimulationBreakdownBarChart({ visual });
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('chart-simulation-breakdown'));
  assert.ok(html.includes('Informática'));
  assert.ok(html.includes('Raio-X do Simulado'));
});
