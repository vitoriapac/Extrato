import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlannedVsActualChart } from '../../src/ui/performance/planned-actual-chart.js';
import { renderErrorProfileChart } from '../../src/ui/performance/error-profile-chart.js';

test('renderPlannedVsActualChart — retorna string vazia quando não há semanas válidas', () => {
  const result = renderPlannedVsActualChart([], {
    formatDate: d => d,
    escapeHtml: s => s,
  });
  assert.equal(result, '');

  const zeroResult = renderPlannedVsActualChart(
    [{ start: '2026-09-01', plannedMinutes: 0, studiedMinutes: 0 }],
    { formatDate: d => d, escapeHtml: s => s }
  );
  assert.equal(zeroResult, '');
});

test('renderPlannedVsActualChart — renderiza SVG com barras planejadas e realizadas', () => {
  const weekly = [
    { start: '2026-09-07', plannedMinutes: 600, studiedMinutes: 720, inProgress: false },
    { start: '2026-09-14', plannedMinutes: 600, studiedMinutes: 480, inProgress: true },
  ];
  const html = renderPlannedVsActualChart(weekly, {
    formatDate: d => d,
    escapeHtml: s => s,
  });

  assert.match(html, /class="planned-actual-chart"/);
  assert.match(html, /role="img"/);
  assert.match(html, /chart-bar-planned/);
  assert.match(html, /chart-bar-achieved/);
  assert.match(html, /chart-bar-actual/);
  assert.match(html, /Planejado/);
  assert.match(html, /Realizado/);
  assert.match(html, /12 h/);
});

test('renderErrorProfileChart — retorna string vazia quando totalErrors é 0', () => {
  const result = renderErrorProfileChart({
    categories: [],
    uncategorizedCount: 0,
    totalErrors: 0,
    escapeHtml: s => s,
  });
  assert.equal(result, '');
});

test('renderErrorProfileChart — renderiza segmentos proporcionais e percentuais', () => {
  const categories = [
    { label: 'Falta de atenção', count: 15 },
    { label: 'Lacuna teórica', count: 5 },
  ];
  const html = renderErrorProfileChart({
    categories,
    uncategorizedCount: 0,
    totalErrors: 20,
    escapeHtml: s => s,
  });

  assert.match(html, /class="error-profile-chart/);
  assert.match(html, /Falta de atenção/);
  assert.match(html, /75%/);
  assert.match(html, /Lacuna teórica/);
  assert.match(html, /25%/);
});

test('renderErrorProfileChart — inclui categoria Sem categoria quando presente', () => {
  const categories = [{ label: 'Interpretação', count: 8 }];
  const html = renderErrorProfileChart({
    categories,
    uncategorizedCount: 2,
    totalErrors: 10,
    escapeHtml: s => s,
  });

  assert.match(html, /Sem categoria/);
  assert.match(html, /20%/);
  assert.match(html, /80%/);
});
