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
