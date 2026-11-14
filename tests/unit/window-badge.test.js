import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWindowBadge, WINDOW_LABELS } from '../../src/ui/performance/window-badge.js';
import { renderAdherenceTarget } from '../../src/ui/renderers/adherence-target-renderer.js';
import { renderAdherenceChangeExplanation } from '../../src/ui/renderers/adherence-change-renderer.js';
import { renderPerformanceExecutiveSummary } from '../../src/ui/performance/performance-executive-summary-renderer.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

test('selo de janela: só o vocabulário oficial e o título é escapado', () => {
  assert.deepEqual(Object.values(WINDOW_LABELS), [
    '7 dias',
    'período',
    'semana atual',
    'todo o histórico',
  ]);
  const html = renderWindowBadge('period', 'Últimos "30" dias');
  assert.match(html, /data-window="period"/);
  assert.match(html, />período</);
  assert.match(html, /title="Últimos &quot;30&quot; dias"/);
});

test('números de aderência, "o que mudou" e simulados saem com selo de janela', () => {
  const target = renderAdherenceTarget(
    { enabled: true, target: 80, actual: 40, state: 'below_target' },
    { escapeHtml }
  );
  assert.match(target, /data-window="currentWeek"/);
  const change = renderAdherenceChangeExplanation(
    { state: 'insufficient', message: 'Sem base comparável.' },
    { escapeHtml }
  );
  assert.match(change, /data-window="currentWeek"/);
  const summary = renderPerformanceExecutiveSummary(
    {
      rangeLabel: 'Últimos 30 dias',
      situation: {
        status: 'attention',
        confidence: 'low',
        target: 80,
        simulationAccuracy: 81,
        band: null,
      },
      change: null,
      base: { resolved: 40, sessions: 5, smallSample: false },
    },
    { escapeHtml }
  );
  assert.match(summary, /data-window="history"/);
});

test('simulados: uma casa decimal e contagem com critério e janela no resumo', () => {
  const html = renderPerformanceExecutiveSummary(
    {
      rangeLabel: 'Últimos 30 dias',
      situation: {
        status: 'on_track',
        confidence: 'low',
        target: 80,
        simulationAccuracy: 80.7,
        band: { low: 76.2, high: 85 },
        simulationCount: 3,
      },
      change: null,
      base: { resolved: 40, sessions: 5, smallSample: false },
    },
    { escapeHtml }
  );
  assert.match(html, /3 simulados, todo o histórico/);
  assert.match(html, /80,7%/);
  assert.match(html, /76,2%/);
});
