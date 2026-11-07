import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr } from '../../src/core/utils.js';
import { renderErrorProfileChart } from '../../src/ui/performance/error-profile-chart.js';
import { renderSelectionStep } from '../../src/features/exam-import/exam-import-renderer.js';

const payload = '"><img src=x onerror=alert(1)>';
// Nenhum elemento/atributo novo pode surgir: o texto hostil deve aparecer apenas escapado.
const assertEscaped = html => {
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /"><img/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
};

test('gráfico de perfil de erros escapa rótulo de categoria (inclui aria-label)', () => {
  const html = renderErrorProfileChart({
    categories: [{ label: payload, count: 3 }],
    totalErrors: 3,
    escapeHtml,
  });
  assertEscaped(html);
});

test('etapa de seleção do importador escapa nome e id de disciplina', () => {
  const html = renderSelectionStep(
    {
      visibleSubjects: [
        { id: payload, name: payload, selectedCount: 0, totalCount: 1, checked: false },
      ],
      selectedTopics: 0,
      totalTopics: 1,
    },
    { escapeHtml, escapeAttr }
  );
  assertEscaped(html);
});
