import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPedagogicalMatrixSection } from '../../src/ui/performance/performance-matrix-renderer.js';
import { calculateApprovalSimuladosMetric } from '../../src/domain/analytics/approval-metrics.js';
import { renderPerformanceExecutiveSummary } from '../../src/ui/performance/performance-executive-summary-renderer.js';
import { EVIDENCE_LABELS } from '../../src/ui/performance/evidence-badge.js';

const escapeHtml = value => String(value);

test('domínio e retenção da Matriz saem sempre em /100, nunca em %', () => {
  const html = renderPedagogicalMatrixSection(
    {
      items: [{ name: 'Informática', mastery: 47, retention: 55, studyMinutes: 60 }],
      thresholdMastery: 70,
      thresholdRetention: 60,
      quadrantCounts: {},
    },
    { escapeHtml }
  );
  assert.match(html, /domínio 47\/100 · retenção 55\/100/);
  assert.doesNotMatch(html, /domínio \d+(,\d)?%/);
});

test('"confiança" fica só na faixa projetada; o selo de amostra usa "evidência"', () => {
  assert.equal(EVIDENCE_LABELS.low, 'evidência baixa');
});

test('fator Simulados da Prontidão diz quantos e a janela', () => {
  const sims = Array.from({ length: 6 }, (_, i) => ({ nota: 70 + i, totalQuestions: 40 }));
  const result = calculateApprovalSimuladosMetric(sims);
  assert.match(result.detail, /^5 últimos simulados, todo o histórico · média ponderada \d+(,\d)?%$/);
});

test('resumo: contagem comparável diz de quantos simulados do histórico', () => {
  const base = {
    rangeLabel: 'Últimos 30 dias',
    situation: {
      status: 'on_track',
      confidence: 'low',
      target: 80,
      simulationAccuracy: 81,
      band: null,
      simulationCount: 3,
      simulationTotal: 5,
    },
    change: null,
    base: { resolved: 40, sessions: 5, smallSample: false },
  };
  const html = renderPerformanceExecutiveSummary(base, { escapeHtml });
  assert.match(html, /3 de 5 simulados, todo o histórico/);
});

test('subaba: um "Copiar link" e linha de comparação só quando há comparação', async () => {
  const { renderPerformanceChromeHtml } = await import('../../src/ui/performance/performance-page.js');
  const range = { label: 'Últimos 30 dias', previous: { start: '2026-09-15', end: '2026-10-14' } };
  const chrome = state =>
    renderPerformanceChromeHtml({ viewState: state, range, activeExamCount: 0, escapeHtml });
  const on = chrome({ section: 'overview', period: '30d', comparePrevious: true });
  const off = chrome({ section: 'overview', period: '30d', comparePrevious: false });
  const diagnosis = chrome({ section: 'diagnosis', period: '30d', comparePrevious: true });
  assert.match(on, /comparação: /);
  assert.doesNotMatch(off, /comparação: /);
  assert.doesNotMatch(diagnosis, /comparação: /);
  for (const html of [on, off, diagnosis])
    assert.equal((html.match(/data-performance-copy-link/g) || []).length, 1);
});
