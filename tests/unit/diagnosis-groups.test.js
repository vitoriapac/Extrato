import test from 'node:test';
import assert from 'node:assert/strict';
import { renderConsolidatedDiagnosis } from '../../src/ui/renderers/consolidated-diagnosis-renderer.js';

const row = (n, subjectId, severity, quality) => ({
  subjectId,
  topicId: `t${n}`,
  name: `Tópico ${n}`,
  subjectName: `Disciplina ${subjectId}`,
  granularity: 'topic',
  primarySignal: 'gap',
  severity,
  severityLabel: severity === 'critical' ? 'Crítica' : 'Importante',
  state: 'attention',
  evidenceQuality: quality,
  evidence: { label: quality === 'low' ? 'Baixa' : 'Moderada' },
  signals: [{ kind: 'gap', active: true, reasons: ['Lacuna'], period: null }],
});
const topics = [
  row(1, 'a', 'critical', 'moderate'),
  row(2, 'b', 'important', 'low'),
  row(3, 'a', 'important', 'moderate'),
  row(4, 'c', 'critical', 'low'),
  row(5, 'c', 'important', 'moderate'),
];
const render = filters =>
  renderConsolidatedDiagnosis(
    { topics, subjects: [] },
    { studyActionForItem: () => null, escapeHtml: String, escapeAttr: String, filters }
  );

test('agrupa por disciplina, com contagem, e só a primeira abre, com até três tópicos', () => {
  const html = render({});
  assert.equal((html.match(/<details class="diagnosis-group"/g) || []).length, 3);
  assert.match(html, /Disciplina a<\/strong> · 2 tópicos/);
  assert.match(html, /Disciplina b<\/strong> · 1 tópico</);
  assert.equal((html.match(/<details class="diagnosis-group" open>/g) || []).length, 1);
  assert.equal((html.match(/<template data-lazy>/g) || []).length, 2);
  assert.doesNotMatch(html, /Mostrar mais diagnósticos/);
});

test('filtro por prioridade e evidência mantém o lugar na fila e informa a contagem', () => {
  const html = render({ severity: 'critical', evidence: 'low' });
  assert.match(html, /1 de 5 tópicos/);
  assert.match(html, /4 · TÓPICO/);
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.match(render({ severity: 'monitor' }), /Nenhum tópico com esse filtro/);
});

test('ordenar por tempo × edital e por críticos reordena as disciplinas e mostra o motivo', () => {
  const allocation = {
    a: { timePercent: 50, examWeightPercent: 20 },
    b: { timePercent: 10, examWeightPercent: 40 },
    c: { timePercent: 40, examWeightPercent: 40 },
  };
  const names = html => [...html.matchAll(/<strong>(Disciplina \w)<\/strong>/g)].map(m => m[1]);
  const byGap = renderConsolidatedDiagnosis(
    { topics, subjects: [] },
    { studyActionForItem: () => null, escapeHtml: String, escapeAttr: String, filters: { sort: 'allocation' }, allocation }
  );
  assert.deepEqual(names(byGap), ['Disciplina b', 'Disciplina c', 'Disciplina a']);
  assert.match(byGap, /tempo 10% · edital 40%/);
  const byRisk = renderConsolidatedDiagnosis(
    { topics, subjects: [] },
    { studyActionForItem: () => null, escapeHtml: String, escapeAttr: String, filters: { sort: 'vulnerable' } }
  );
  assert.match(byRisk, /1 crítico/);
});

test('Matriz: sem nenhuma disciplina fora do quadrante crítico, só a lista', async () => {
  const { renderPedagogicalMatrixSection } = await import('../../src/ui/performance/performance-matrix-renderer.js');
  const item = { name: 'Informática', mastery: 20, retention: 30, studyMinutes: 60 };
  const base = { items: [item], thresholdMastery: 70, thresholdRetention: 60 };
  const critical = renderPedagogicalMatrixSection(
    { ...base, quadrantCounts: { consolidated: 0, forgetting_risk: 0, building: 0, critical: 1 } },
    { escapeHtml: String }
  );
  assert.doesNotMatch(critical, /matrix-chart-scroll/);
  assert.match(critical, /matrix-ranked/);
  const mixed = renderPedagogicalMatrixSection(
    { ...base, quadrantCounts: { consolidated: 0, forgetting_risk: 0, building: 1, critical: 0 } },
    { escapeHtml: String }
  );
  assert.match(mixed, /matrix-chart-scroll/);
});

test('p.p.: sempre com sinal tipográfico e uma casa', async () => {
  const { formatPoints } = await import('../../src/core/format-number.js');
  assert.equal(formatPoints(13.2), '+13,2 p.p.');
  assert.equal(formatPoints(-6), '−6,0 p.p.');
  assert.equal(formatPoints(-17.74), '−17,7 p.p.');
  assert.equal(formatPoints(0), '0,0 p.p.');
  assert.equal(formatPoints(null), '—');
});

test('janela: o selo fica colado ao rótulo de cada número (cartão de métrica, aderência)', async () => {
  const { renderMetricCard } = await import('../../src/ui/components/presentation.js');
  const { renderWindowBadge } = await import('../../src/ui/performance/window-badge.js');
  const html = renderMetricCard({
    label: 'Precisão',
    value: '69,3%',
    windowBadge: renderWindowBadge('period', 'Últimos 30 dias'),
  });
  assert.match(html, /<span>Precisão <span class="performance-window" data-window="period"/);
  assert.doesNotMatch(renderMetricCard({ label: 'Precisão', value: '1' }), /performance-window/);
  const { renderAdherenceMetrics } = await import('../../src/ui/renderers/adherence-renderer.js');
  const model = {
    summary: { temporalAdherence: 70, matchedMinutes: 60, plannedMinutes: 90, executedMinutes: 80, volumeRatio: 88, additionalMinutes: 0, excessLinkedMinutes: 0, incompatibleMinutes: 0, otherPeriodMinutes: 0 },
    priority: { classifiedCoverage: 100, plannedMinutes: 60, executedMinutes: 50, adherence: 80, unknownPlannedMinutes: 0, completedActivities: 1, plannedActivities: 1, partiallyExecutedActivities: 0 },
    subjects: [],
  };
  const adherence = renderAdherenceMetrics(model, { escapeHtml: String });
  assert.equal((adherence.match(/<span>(Aderência ao plano|Execução prioritária|Carga planejada|Tempo realizado) <span class="performance-window"/g) || []).length, 4);
});

test('mapa de estabilidade usa o formatador de p.p. (menos tipográfico) e a faixa projetada tem um formato', async () => {
  const { renderStabilityMap } = await import('../../src/ui/performance/stability-map-renderer.js');
  const row = { subjectId: 's', name: 'Português', accuracy: 53.7, evolution: -17.7 };
  const html = renderStabilityMap(
    { groups: { attention: [row], maintain: [], intervene: [], evolving: [], insufficient: [] }, total: 1, measured: 1 },
    { escapeHtml: String, escapeAttr: String }
  );
  assert.match(html, /53,7% · −17,7 p\.p\./);
  assert.doesNotMatch(html, /-17,7/);
});

test('Matriz: siglas únicas e contadores com os nomes dos quatro quadrantes', async () => {
  const { matrixAbbreviations } = await import('../../src/ui/primitives/charts/matrix-abbreviations.js');
  const abbr = matrixAbbreviations(['Produtos e Serviços', 'Probabilidade e Estatística', 'Matemática', 'Matemática Financeira']);
  assert.equal(new Set(abbr.values()).size, 4);
  assert.equal(abbr.get('Matemática'), 'MAT');
  assert.equal(abbr.get('Matemática Financeira'), 'MAT·F');
  const { renderPedagogicalMatrixSection } = await import('../../src/ui/performance/performance-matrix-renderer.js');
  const html = renderPedagogicalMatrixSection(
    { items: [{ name: 'A', mastery: 20, retention: 30, studyMinutes: 1 }], thresholdMastery: 70, thresholdRetention: 60, quadrantCounts: { consolidated: 0, forgetting_risk: 0, building: 0, critical: 1 } },
    { escapeHtml: String }
  );
  for (const name of ['Consolidada', 'Risco de Esquecimento', 'Em Construção', 'Vulnerabilidade Crítica'])
    assert.match(html, new RegExp(`${name}: [0-9]`));
});

test('T28: tendência semanal dos KPIs e régua da Prontidão com faixa projetada e meta', async () => {
  const { buildPerformanceOverview, KPI_TREND_WEEKS } = await import('../../src/application/performance/build-performance-overview.js');
  const range = { start: '2026-11-01', end: '2026-11-14', label: 'Últimos 14 dias', comparePrevious: false };
  const model = buildPerformanceOverview({
    range,
    today: '2026-11-14',
    sessions: [
      { date: '2026-11-14', durationSeconds: 7200 },
      { date: '2026-11-03', durationSeconds: 3600 },
      { date: '2026-09-01', durationSeconds: 3600 },
    ],
    questions: [
      { date: '2026-11-14', resolved: 20, correct: 15 },
      { date: '2026-11-04', resolved: 5, correct: 5 },
    ],
  });
  assert.equal(model.trend.length, KPI_TREND_WEEKS);
  // 14/11/2026 é sábado: a semana em andamento (09/11) fica de fora e a última completa começa em 02/11.
  assert.equal(model.trend.at(-1).start, '2026-11-02');
  assert.equal(model.trend.at(-1).studiedMinutes, 60);
  assert.equal(model.trend.at(-1).resolved, 5);
  assert.equal(model.trend.at(-1).accuracy, null);
  assert.equal(model.trend.reduce((sum, row) => sum + row.studiedMinutes, 0), 60);
  const sunday = buildPerformanceOverview({ range, today: '2026-11-15', sessions: [{ date: '2026-11-14', durationSeconds: 3600 }], questions: [{ date: '2026-11-14', resolved: 20, correct: 15 }] });
  assert.equal(sunday.trend.at(-1).start, '2026-11-09');
  assert.equal(sunday.trend.at(-1).accuracy, 75);

  const { renderPreparationReading } = await import('../../src/ui/performance/preparation-reading-renderer.js');
  const reading = {
    howAmI: { readiness: { value: 47, detail: null, verdict: null }, projection: { text: 't', low: 69, high: 93, target: 80 }, rhythm: null },
    pulling: [],
    whatToDo: { state: 'x', action: null, reason: null, deficit: null, recovery: false },
    evidence: [],
  };
  const html = renderPreparationReading(reading);
  assert.match(html, /data-projection-ruler="true"/);
  assert.match(html, /aria-label="Faixa projetada de nota de 69% a 93%, meta de 80%, em uma escala de 0 a 100"/);
  assert.doesNotMatch(renderPreparationReading({ ...reading, howAmI: { ...reading.howAmI, projection: null } }), /data-projection-ruler/);

  const { renderPerformanceOverview } = await import('../../src/ui/performance/performance-overview-renderer.js');
  const base = { current: { studiedMinutes: 60, resolved: 20, accuracy: 70, sessionCount: 1 }, previous: null, weekly: [], changes: [], history: [], readiness: null };
  const opts = { range, today: '2026-11-14', formatDate: String, escapeHtml: String };
  const trend = [1, 2, 3, 4, 5, 6].map(n => ({ start: `w${n}`, studiedMinutes: n * 60, resolved: n * 10, accuracy: n > 4 ? null : 60 + n }));
  const withTrend = renderPerformanceOverview({ ...base, trend }, opts);
  assert.equal((withTrend.match(/performance-kpi__trend/g) || []).length, 3);
  assert.equal((renderPerformanceOverview({ ...base, trend: trend.slice(0, 2) }, opts).match(/performance-kpi__trend/g) || []).length, 0);
});
