import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNextBestAction,
  orderByDiagnosisQueue,
  NEXT_BEST_ACTION_STATES,
} from '../../src/application/diagnostics/build-next-best-action.js';
import { buildReadinessChangeExplanation } from '../../src/application/readiness/build-readiness-change-explanation.js';
import { renderPerformanceOverview } from '../../src/ui/performance/performance-overview-renderer.js';
import { createPerformanceController } from '../../src/ui/controllers/performance-controller.js';
import { renderReadinessOverview, renderReadinessInvestigation } from '../../src/ui/renderers/readiness-overview-renderer.js';
import { renderWeeklyCloseSummary } from '../../src/ui/renderers/overview-renderer.js';

test('resumos de Prontidão e fechamento preservam valores, insuficiência e detalhe acessível', () => {
  const input = {
    m: { retencao: { available: false } },
    score: 0,
    level: {},
    confidence: { nivel: 'Baixa', value: 0.2 },
    projection: { available: false, calibration: { available: false } },
    projectionHistory: { total: 0 },
    factors: [],
    approvalState: 'empty',
    approvalLabel: 'Aguardando dados',
    diagnostics: [],
    candidates: [],
  };
  const before = structuredClone(input);
  const html = renderReadinessOverview(input, {
    escapeHtml: String,
    escapeAttr: String,
    getMetricDataState: () => {},
    metricStateLabel: () => {},
  });
    // A faixa projetada não se repete no card: mora no topo e em Simulados.
  assert.doesNotMatch(html, /Projeção atual|readiness-projection-summary|Ver projeção em Simulados/);
  assert.doesNotMatch(html, /<details[^>]* open/);
  // A calibração da faixa mora em Simulados, não no card.
  assert.doesNotMatch(html, /readiness-investigation|Investigar a faixa/);
  assert.deepEqual(input, before);
  assert.match(html, /class="readiness-explanation editorial-disclosure"/);
  assert.ok(html.indexOf('data-help-topic-link="readiness"') > html.indexOf('<details'));
  const measured = {
    ...input,
    projection: {
      available: true,
      low: 70,
      high: 78,
      calibration: { available: false, status: 'below', confidenceLabel: 'Baixa' },
      forecast30: { available: false, reason: 'Histórico curto' },
      gap: { target: 80, minimum: 2, maximum: 10 },
      evidence: { observationCount: 5, sampleSize: 200 },
    },
  };
  const measuredHTML = renderReadinessOverview(measured, {
    escapeHtml: String,
    escapeAttr: String,
    getMetricDataState: () => {},
    metricStateLabel: () => {},
  });
  const visible = measuredHTML.slice(0, measuredHTML.indexOf('<details'));
  assert.doesNotMatch(visible, /Faixa projetada|Média móvel|projection-calibration-list/);
  assert.match(renderReadinessInvestigation(measured), /5 simulados comparáveis/);
  const summary = renderWeeklyCloseSummary(
    {
      state: 'ready',
      questions: { resolved: 31, accuracy: 68 },
      mainRisk: { message: 'risco completo' },
      adherence: { model: { summary: { temporalAdherence: 75 } } },
    },
    { escapeHtml: String, period: { start: '2026-09-27', end: '2026-10-03' } }
  );
  assert.match(summary, /75%/);
  assert.match(summary, /68%/);
  assert.doesNotMatch(summary, /risco completo/);
  assert.match(summary, /2026-09-27 a 2026-10-03/);
});

test('atalho de investigação mantém período, disciplina e comparação no controller', () => {
  const handlers = {};
  let state = {
    section: 'overview',
    period: '90',
    comparePrevious: true,
    subjectId: 'math',
    topicId: 'interest',
  };
  let rendered = 0;
  const surface = {
    addEventListener: (type, handler) => {
      handlers[type] = handler;
    },
  };
  const document = {
    addEventListener: () => {},
    getElementById: id => (id === 'performancePage' ? surface : null),
  };
  createPerformanceController({
    document,
    getViewState: () => state,
    setViewState: value => {
      state = value;
    },
    render: () => {
      rendered++;
    },
    activateTab: () => {
      throw Error('Must keep performance context');
    },
  }).register();
  handlers.click({
    target: {
      closest: selector =>
        selector.includes('[data-performance-investigate]')
          ? { dataset: { performanceInvestigate: 'subjects' } }
          : null,
    },
  });
  assert.deepEqual(state, {
    section: 'subjects',
    period: '90',
    comparePrevious: true,
    subjectId: 'math',
    topicId: 'interest',
  });
  assert.equal(rendered, 1);
});

test('visão geral de desempenho orienta investigação antes do histórico sem modificar o modelo', () => {
  const model = { current: {}, weekly: [], changes: [], history: [], readiness: null };
  const before = structuredClone(model);
  const html = renderPerformanceOverview(model, {
    range: { comparePrevious: false },
    today: '2026-10-05',
    activeExamTags: [],
    formatDate: value => value,
    escapeHtml: value => String(value),
  });
  assert.ok(html.indexOf('Resumo interpretativo') < html.indexOf('Prontidão ao longo do tempo'));
  // O bloco-link de Carga e a tabela Período atual × anterior saíram: os KPIs e Ritmo já cobrem.
  assert.doesNotMatch(html, /Carga e aderência ao plano|Período atual × anterior/);
  // A Prontidão vive só na Leitura da preparação; o KPI duplicado saiu.
  assert.doesNotMatch(html, /Histórico comparável indisponível/);
  assert.doesNotMatch(html, /Investigar o resultado/);
  assert.match(html, /não é uma probabilidade de aprovação/);
  assert.deepEqual(model, before);
});

test('desempenho separa volume de questões e sinaliza amostra pequena', () => {
  const model = { current: { resolved: 10, accuracy: 70 }, previous: { resolved: 10, accuracy: 60 }, weekly: [], changes: [], history: [], readiness: null };
  const html = renderPerformanceOverview(model, { range: { comparePrevious: true }, today: '2026-10-05', activeExamTags: [], formatDate: String, escapeHtml: String });
  assert.ok(html.indexOf('Tempo estudado') < html.indexOf('Questões respondidas'));
  assert.ok(html.indexOf('Questões respondidas') < html.indexOf('Precisão em questões'));
  assert.match(html, /10 questões · amostra pequena/);
  assert.doesNotMatch(html, /10 questões[^<]*10 p\.p\./);
});

const recommendation = {
  id: 'rec-1',
  subjectId: 's',
  topicId: 't',
  estimatedMinutes: 30,
  score: 83,
  reasons: ['Retenção baixa'],
  evidence: { evidenceLabel: 'Alta' },
};
const row = {
  subjectId: 's',
  topicId: 't',
  name: 'Juros',
  subjectName: 'Matemática',
  state: 'attention',
  severity: 'important',
  primarySignal: 'consolidation-risk',
  evidence: { label: 'Alta' },
};
const diagnosis = rows => ({ rows, topics: rows, subjects: [] });

test('próxima ação distingue intervenção prioritária e sugestão opcional sem alterar recomendação', () => {
  const before = structuredClone(recommendation);
  const required = buildNextBestAction({
    recommendations: [recommendation],
    diagnosis: diagnosis([row]),
  });
  const optional = buildNextBestAction({
    recommendations: [recommendation],
    diagnosis: diagnosis([{ ...row, state: 'progress', severity: 'monitor' }]),
  });
  assert.equal(required.state, NEXT_BEST_ACTION_STATES.ACTION_REQUIRED);
  assert.equal(optional.state, NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL);
  assert.equal(required.action.id, 'rec-1');
  assert.deepEqual(recommendation, before);
});

test('próxima ação admite manutenção, falta de evidência e ação indisponível', () => {
  assert.equal(
    buildNextBestAction({
      diagnosis: diagnosis([{ ...row, state: 'controlled' }]),
      activePlan: { id: 'plan-1' },
    }).state,
    NEXT_BEST_ACTION_STATES.MAINTAIN_PLAN
  );
  assert.equal(
    buildNextBestAction({ diagnosis: diagnosis([{ ...row, state: 'insufficient' }]) }).state,
    NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE
  );
  assert.equal(
    buildNextBestAction({
      diagnosis: diagnosis([{ ...row, state: 'insufficient' }]),
      activePlan: { id: 'plan-1' },
    }).state,
    NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE
  );
  assert.equal(
    buildNextBestAction({
      recommendations: [{ ...recommendation, eligible: false }],
      diagnosis: diagnosis([row]),
    }).state,
    NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION
  );
});

const factors = { coverage: 70, mastery: 60, retention: 55, consistency: 75, simulations: 65 };
const weights = {
  coverage: 0.3,
  mastery: 0.25,
  retention: 0.2,
  consistency: 0.15,
  simulations: 0.1,
};
const saved = (date, score, values = factors) => ({
  date,
  score,
  algorithmVersion: 1,
  weights,
  factors: values,
});

test('explicação da prontidão usa apenas dois retratos comparáveis e valores observados', () => {
  const previous = saved('2026-09-20', 64),
    current = saved('2026-09-27', 66, { ...factors, coverage: 76, retention: 58 });
  const model = buildReadinessChangeExplanation({ previous, current });
  assert.equal(model.state, 'comparable');
  assert.equal(model.delta, 2);
  assert.deepEqual(
    model.factors.find(item => item.label === 'Cobertura'),
    { label: 'Cobertura', before: 70, after: 76, direction: 'up' }
  );
  assert.deepEqual(previous, saved('2026-09-20', 64));
});

test('explicação não decompõe versões ou conjuntos de evidência diferentes', () => {
  assert.equal(
    buildReadinessChangeExplanation({
      previous: saved('2026-09-20', 64),
      current: { ...saved('2026-09-27', 66), algorithmVersion: 2 },
    }).state,
    'algorithm-change'
  );
  const changed = saved('2026-09-27', 66, { ...factors, retention: null });
  const result = buildReadinessChangeExplanation({
    previous: saved('2026-09-20', 64),
    current: changed,
  });
  assert.equal(result.state, 'evidence-change');
  assert.deepEqual(result.factors, []);
});

test('a sugestão é o primeiro da fila do Diagnóstico, não o primeiro do motor de pontuação (D-A)', () => {
  const first = { ...recommendation, id: 'rec-a', topicId: 'a', score: 95 };
  const second = { ...recommendation, id: 'rec-b', topicId: 'b', score: 40 };
  const queueRows = [
    { ...row, topicId: 'b', severity: 'critical' },
    { ...row, topicId: 'a', severity: 'important' },
  ];
  const byDiagnosis = buildNextBestAction({
    recommendations: [first, second],
    diagnosis: diagnosis(queueRows),
  });
  const byQueue = buildNextBestAction({ recommendations: [first, second], queueOrder: ['b', 'a'] });
  const noQueue = buildNextBestAction({ recommendations: [first, second] });
  assert.equal(byDiagnosis.action.topicId, 'b');
  assert.equal(byQueue.action.topicId, 'b');
  assert.equal(noQueue.action.topicId, 'a');
});

test('orderByDiagnosisQueue põe a fila na frente e mantém a ordem de quem está fora dela', () => {
  const recs = [{ topicId: 'x' }, { topicId: 'b' }, { topicId: 'y' }, { topicId: 'a' }];
  assert.deepEqual(
    orderByDiagnosisQueue(recs, ['a', 'b']).map(r => r.topicId),
    ['a', 'b', 'x', 'y']
  );
  assert.equal(orderByDiagnosisQueue(recs, []), recs);
  assert.equal(orderByDiagnosisQueue(recs, null), recs);
});

test('contrato: a mesma fila dá a mesma sugestão na Visão geral, em Hoje, no copiloto e no timer (T11)', () => {
  const recs = [
    { ...recommendation, id: 'r-a', topicId: 'a', score: 95 },
    { ...recommendation, id: 'r-b', topicId: 'b', score: 60 },
    { ...recommendation, id: 'r-c', topicId: 'c', score: 40 },
  ];
  const queue = ['c', 'b'];
  const fromNextBestAction = buildNextBestAction({ recommendations: recs, queueOrder: queue }).action.topicId;
  const fromOverviewCard = orderByDiagnosisQueue(recs, queue)[0].topicId;
  const fromTimer = orderByDiagnosisQueue(recs, queue)[0].topicId;
  assert.equal(fromNextBestAction, 'c');
  assert.equal(fromOverviewCard, fromNextBestAction);
  assert.equal(fromTimer, fromNextBestAction);
});
