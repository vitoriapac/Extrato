import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeErrors } from '../../src/domain/diagnostics/error-analysis.js';
import { buildErrorAnalysisViewModel } from '../../src/application/analytics/build-error-analysis-view-model.js';
import { renderErrorAnalysis } from '../../src/ui/renderers/error-analysis-renderer.js';
const records = Array.from({ length: 12 }, (_, index) => ({
  date: '2026-09-' + String(index + 1).padStart(2, '0'),
  resolved: 2,
  correct: 1,
  errorBreakdown: { interpretacao: index < 8 ? 1 : 0, desatencao: index >= 8 ? 1 : 0 },
}));
test('diagnostica causa dominante e recomenda prática', () => {
  const result = analyzeErrors(records);
  assert.equal(result.state, 'diagnosed');
  assert.equal(result.dominant.key, 'interpretacao');
  assert.equal(result.dominant.share, 67);
  assert.equal(result.recommendedMode, 'practice');
  assert.equal(result.dominant.recommendation.studyType, 'questions');
});
test('não orienta estudo com cobertura ou amostra insuficiente', () => {
  const result = analyzeErrors([
    { resolved: 20, correct: 10, errorBreakdown: { interpretacao: 2 } },
  ]);
  assert.equal(result.state, 'insufficient');
  assert.equal(result.dominant, null);
});
test('view-model compara períodos e renderer apresenta diagnóstico e ação', () => {
  const current = analyzeErrors(records),
    previous = analyzeErrors(records.slice(0, 4), { minimumErrors: 1 });
  const model = buildErrorAnalysisViewModel({ current, previous, periodLabel: '01/09 a 12/09' }),
    html = renderErrorAnalysis(model, {
      escapeHtml: value => String(value).replaceAll('<', '&lt;'),
    });
  assert.match(html, /Diagnóstico/);
  assert.match(html, /Ação/);
  assert.match(html, /interpretação/);
  assert.match(html, /vs\. período anterior/);
});
test('perfil de erros em Pareto: ordem decrescente, acumulado em texto e resumo dos 80%', () => {
  const html = renderErrorAnalysis(
    {
      state: 'diagnosed',
      diagnosis: 'd',
      action: 'a',
      totalErrors: 20,
      coverage: 100,
      confidence: { label: 'Alta' },
      periodLabel: 'p',
      hasPrevious: false,
      items: [
        { label: 'Desatenção', value: 3 },
        { label: 'Interpretação', value: 12 },
        { label: 'Conteúdo', value: 5 },
        { label: 'Vazio', value: 0 },
      ],
    },
    { escapeHtml: String }
  );
  const labels = [...html.matchAll(/error-profile-label"> ([^<]+)</g)].map(m => m[1]);
  assert.deepEqual(labels, ['Interpretação', 'Conteúdo', 'Desatenção']);
  const cumulative = [...html.matchAll(/acumulado (\d+)%/g)].map(m => Number(m[1]));
  assert.deepEqual(cumulative, [60, 85, 100]);
  assert.match(html, /style="left:85%"/);
  assert.match(html, /As 2 primeiras categorias somam 85% dos erros\./);
});
