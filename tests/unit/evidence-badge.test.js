import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coverageEvidence,
  renderEvidenceBadge,
  EVIDENCE_LABELS,
} from '../../src/ui/performance/evidence-badge.js';
import { renderPerformanceSubjectComparison } from '../../src/ui/performance/performance-subject-comparison-renderer.js';
import { renderStabilityMap } from '../../src/ui/performance/stability-map-renderer.js';

const escape = value => String(value);

test('selo de evidência: só os três estados e nada quando a evidência basta', () => {
  assert.deepEqual(Object.values(EVIDENCE_LABELS), [
    'amostra pequena',
    'confiança baixa',
    'sem dados suficientes',
  ]);
  assert.equal(renderEvidenceBadge(null), '');
  assert.match(renderEvidenceBadge('low', 'dica'), /data-evidence="low"[^>]*title="dica"/);
  assert.equal(coverageEvidence(0, 5), 'insufficient');
  assert.equal(coverageEvidence(3, 5), 'small');
  assert.equal(coverageEvidence(5, 5), null);
  assert.equal(coverageEvidence(0, 0), null);
});

test('comparação e mapa de estabilidade declaram a cobertura de amostra no cabeçalho', () => {
  const row = (id, state) => ({
    subjectId: id,
    name: id,
    target: 80,
    accuracy: 60,
    questions: 20,
    gap: -20,
    state,
    evolution: null,
    priority: null,
    plannedMinutes: null,
    executedMinutes: null,
    balanceMinutes: null,
    suggestion: null,
  });
  const comparison = renderPerformanceSubjectComparison(
    { rows: [row('a', 'ok'), row('b', 'insufficient')], sort: 'gap', measured: 1 },
    { escapeHtml: escape, escapeAttr: escape }
  );
  assert.match(comparison, /data-evidence="small"[^>]*title="1 de 2 disciplinas/);
  const stability = renderStabilityMap(
    {
      measured: 0,
      total: 3,
      groups: { attention: [], maintain: [], intervene: [], evolving: [], insufficient: [] },
    },
    { escapeHtml: escape, escapeAttr: escape }
  );
  assert.match(stability, /data-evidence="insufficient"/);
});
