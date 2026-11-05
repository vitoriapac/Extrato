import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubjectWeeklyTrendVisual,
  buildErrorParetoVisual,
  buildSimulationTrendVisual,
} from '../../src/domain/practice/practice-visual-models.js';
import {
  renderWeeklyTrendChart,
  renderSimulationTrendChart,
  renderErrorParetoChart,
  renderDonutChart,
  renderActivityHeatmap,
} from '../../src/ui/primitives/charts/charts.js';

test('WeeklyTrendChart renderiza classes de micro-transições interativas estilo Amicro', () => {
  const visual = buildSubjectWeeklyTrendVisual({
    weeks: [
      { start: '2026-10-01', resolved: 20, correct: 16, accuracy: 80, insufficientData: false },
      { start: '2026-10-08', resolved: 30, correct: 27, accuracy: 90, insufficientData: false },
    ],
    trend: { key: 'improving', label: 'Em alta', delta: 10 },
    colorSlot: 2,
  });

  const html = renderWeeklyTrendChart({ visual });

  // Card com elevação interativa
  assert.match(html, /chart-card-interactive/);
  // Barras com micro-interações
  assert.match(html, /chart-bar-interactive/);
  // Pontos de dados com foco magnético
  assert.match(html, /chart-point-interactive/);
});

test('SimulationTrendChart renderiza card interativo e pontos reativos', () => {
  const visual = buildSimulationTrendVisual({
    simulations: [
      { id: 's1', nome: 'Simulado 1', date: '2026-10-15', score: 82, total: 100, correct: 82 },
    ],
    targetScore: 80,
  });

  const html = renderSimulationTrendChart({ visual });

  assert.match(html, /chart-card-interactive/);
  assert.match(html, /chart-point-interactive/);
});

test('DonutChart renderiza arcos com classe de transição fluida', () => {
  const slices = [
    {
      subjectId: 'sub-1',
      subjectName: 'Direito Constitucional',
      colorSlot: 1,
      seconds: 3600,
      percentage: 100,
      ratio: 1,
      startRatio: 0,
    },
  ];

  const html = renderDonutChart({ slices, totalSeconds: 3600 });

  assert.match(html, /chart-donut__slice/);
});

test('ErrorParetoChart e ActivityHeatmap incorporam transições de elevação', () => {
  const paretoVisual = buildErrorParetoVisual({
    items: [
      { id: 'c1', label: 'Falta de atenção', value: 10 },
    ],
    totalErrors: 10,
  });

  const paretoHtml = renderErrorParetoChart({ visual: paretoVisual });
  assert.match(paretoHtml, /chart-card-interactive/);

  const heatmapHtml = renderActivityHeatmap({ mode: 'calendar' });
  assert.match(heatmapHtml, /chart-card-interactive/);
});
