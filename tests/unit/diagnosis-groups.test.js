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
  assert.match(html, /1 de 5 itens com sinal de diagnóstico/);
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
    steady: [],
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

test('T29: barras de precisão com meta, antes × agora e lacuna × impacto', async () => {
  const { renderPerformanceSubjectComparison } = await import('../../src/ui/performance/performance-subject-comparison-renderer.js');
  const subject = (n, accuracy, state = 'measured') => ({ subjectId: `s${n}`, name: `Disc ${n}`, target: 80, accuracy, gap: accuracy == null ? null : accuracy - 80, evolution: 2, questions: state === 'insufficient' ? 3 : 40, state, plannedMinutes: 0, executedMinutes: 0, balanceMinutes: null, suggestion: null });
  const comparison = renderPerformanceSubjectComparison(
    { rows: [1, 2, 3, 4, 5, 6, 7].map(n => subject(n, 60 + n)).concat(subject(8, null, 'insufficient')), measured: 7, sort: 'gap' },
    { escapeHtml: String, escapeAttr: String, view: 'bars' }
  );
  assert.equal((comparison.match(/class="chart-bullet subject-precision-bar"/g) || []).length, 7);
  assert.match(comparison, /meta 80%/);
  assert.match(comparison, /Mostrar mais barras · \+3/);
  assert.match(comparison, /amostra de questões/);
  // Uma visão por vez: nas barras não há tabela, e na tabela (padrão) não há barras.
  assert.doesNotMatch(comparison, /<table/);
  assert.match(comparison, /data-performance-subject-view="bars" aria-pressed="true"/);
  const table = renderPerformanceSubjectComparison(
    { rows: [1, 2, 3, 4, 5, 6, 7].map(n => subject(n, 60 + n)).concat(subject(8, null, 'insufficient')), measured: 7, sort: 'gap' },
    { escapeHtml: String, escapeAttr: String }
  );
  assert.match(table, /<table/);
  assert.doesNotMatch(table, /subject-precision-bar/);
  assert.match(table, /Mostrar mais linhas · \+3/);
  assert.match(table, /data-performance-subject-view="table" aria-pressed="true"/);

  const { renderBeforeAfterChart } = await import('../../src/ui/performance/before-after-chart.js');
  const row = (id, accuracy, evolution) => ({ subjectId: id, name: `D ${id}`, accuracy, evolution });
  const chart = renderBeforeAfterChart(
    { groups: { attention: [row('a', 53.7, -17.7)], maintain: [row('b', 85, 1)], intervene: [], evolving: [row('c', 70, 10)] } },
    { escapeHtml: String, escapeAttr: String, targets: { a: 80 } }
  );
  assert.match(chart, /D a: 71,4% antes, 53,7% agora \(−17,7 p\.p\.\), meta 80%/);
  assert.ok(chart.indexOf('D a') < chart.indexOf('D b') && chart.indexOf('D b') < chart.indexOf('D c'));
  assert.equal(renderBeforeAfterChart({ groups: {} }, { escapeHtml: String, escapeAttr: String }), '');

  const { renderGapImpactChart } = await import('../../src/ui/performance/gap-impact-chart.js');
  const topic = (n, subjectName, mastery, impact) => ({ granularity: 'topic', name: `T${n}`, subjectName, signals: [{ metrics: { mastery, impact } }] });
  const gap = renderGapImpactChart([topic(1, 'Mat', 20, 90), topic(2, 'Port', 40, 80), topic(3, 'Mat', 50, 70), { granularity: 'topic', name: 'sem', subjectName: 'Mat', signals: [] }], { escapeHtml: String });
  assert.match(gap, /primeiros 3 tópicos/);
  assert.equal((gap.match(/gap-impact__group/g) || []).length, 2);
  assert.match(gap, /T1: lacuna \(100 menos o domínio 20\)/);
  assert.equal(renderGapImpactChart([topic(1, 'Mat', 20, 90), topic(2, 'Mat', 30, 80)], { escapeHtml: String }), '');
});

test('T30: meta e amostra pequena na precisão, faixa projetada nos simulados, peso na prova × domínio', async () => {
  const { renderQuestionEvolution } = await import('../../src/ui/renderers/question-evolution-renderer.js');
  const bucket = (key, resolved, movingAccuracy) => ({ key, resolved, correct: Math.round(resolved * 0.7), errors: resolved - Math.round(resolved * 0.7), accuracy: 70, movingAccuracy });
  const model = { state: 'ready', monthly: false, resolved: 200, accuracy: 70, buckets: [bucket('2026-10-05', 40, 70), bucket('2026-10-12', 12, null), bucket('2026-10-19', 50, 74), bucket('2026-10-26', 50, 76)] };
  const html = renderQuestionEvolution(model, { formatDate: d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`, targetPercent: 80 });
  assert.match(html, /question-evolution-goal/);
  assert.equal((html.match(/question-evolution-thin/g) || []).length, 1);
  assert.match(html, /Meta de precisão \(80%\)/);
  assert.match(html, /amostra pequena \(12 questões\)/);
  assert.doesNotMatch(renderQuestionEvolution(model, { formatDate: String }), /question-evolution-goal/);

  const { renderSimulationTrendChart } = await import('../../src/ui/renderers/simulations-renderer.js');
  const items = [1, 2, 3].map(n => ({ nome: `S${n}`, date: `2026-10-0${n}`, correct: 70 + n, total: 100 }));
  const args = { items, scoreFor: item => item.correct, formatDate: d => d, escapeHtml: String, targetScore: 80 };
  const withBand = renderSimulationTrendChart({ ...args, band: { low: 69, high: 93 } });
  assert.match(withBand, /simulation-band/);
  assert.match(withBand, /Faixa projetada para a prova \(69% a 93%\)/);
  assert.doesNotMatch(renderSimulationTrendChart(args), /simulation-band/);

  const { renderIncidenceBySubject } = await import('../../src/ui/performance/incidence-by-subject-chart.js');
  const row = (subjectName, questionCount, mastery) => ({ subjectName, questionCount, mastery });
  const out = renderIncidenceBySubject([row('Mat', 20, 40), row('Mat', 10, 60), row('Port', 40, null), row('Inf', 30, 80)], 100);
  assert.match(out, /Mat: 30% das questões da banca analisadas/);
  assert.match(out, /Mat: domínio médio 50 de 100, em 2 tópicos/);
  assert.match(out, /sem domínio medido/);
  assert.ok(out.indexOf('Port') < out.indexOf('Inf'));
  assert.equal(renderIncidenceBySubject([row('A', 5, 1), row('B', 5, 1)], 10), '');
  assert.equal(renderIncidenceBySubject([row('A', 5, 1)], 0), '');
});

test('T31: linha da capacidade, barras de tempo por disciplina e faixas por turno', async () => {
  const { renderPlannedVsActualChart } = await import('../../src/ui/performance/planned-actual-chart.js');
  const weekly = [{ start: '2026-10-05', plannedMinutes: 600, studiedMinutes: 500 }, { start: '2026-10-12', plannedMinutes: 600, studiedMinutes: 700 }];
  const withCap = renderPlannedVsActualChart(weekly, { formatDate: String, escapeHtml: String, capacityMinutes: 1260 });
  assert.match(withCap, /chart-capacity-line/);
  assert.match(withCap, /Capacidade do plano \(21 h\/sem\)/);
  assert.doesNotMatch(renderPlannedVsActualChart(weekly, { formatDate: String, escapeHtml: String }), /chart-capacity-line/);
  assert.doesNotMatch(renderPlannedVsActualChart(weekly, { formatDate: String, escapeHtml: String, capacityMinutes: 0 }), /chart-capacity-line/);

  const { renderTimeBySubjectBars } = await import('../../src/ui/performance/time-by-subject-bars.js');
  const slices = Array.from({ length: 11 }, (_, n) => ({ subjectId: `d${n + 1}`, subjectName: `D${n + 1}`, seconds: (20 - n) * 600, percentage: 5 + n, colorSlot: (n % 8) + 1 }));
  slices.push({ subjectId: '__outras', subjectName: 'Outras disciplinas', seconds: 99999, percentage: 40, colorSlot: 0 });
  const bars = renderTimeBySubjectBars({ slices, totalSeconds: 100000 }, { escapeHtml: String });
  assert.equal((bars.match(/time-bars__row/g) || []).length, 9);
  assert.ok(bars.lastIndexOf('Outras disciplinas') > bars.lastIndexOf('D8'));
  assert.match(bars, /Outras disciplinas: /);
  assert.match(bars, /D1: 3 h 20 min/);
  assert.equal(renderTimeBySubjectBars({ slices: [], totalSeconds: 0 }, { escapeHtml: String }), '');

  const { h } = await import('preact');
  const { renderToString } = await import('preact-render-to-string');
  const { ShiftEnergyCard } = await import('../../src/ui/tabs/performance/ShiftEnergyCard.js');
  const { buildShiftEnergyViewModel } = await import('../../src/application/analytics/build-shift-energy-view-model.js');
  const html = renderToString(h(ShiftEnergyCard, { model: buildShiftEnergyViewModel({ sessions: [{ startedAt: '2026-10-15T08:00:00Z', durationSeconds: 3600, focusLevel: 'deep', questionsResolved: 10, questionsCorrect: 9 }] }) }));
  assert.equal((html.match(/class="shift-band[ "]/g) || []).length, 3);
  assert.match(html, /precisão de 90%/);
  assert.match(html, /sem questões registradas/);
});

test('T36: a linha-chave dos universos relaciona edital, por concluir, sinal e histórico, e explica a diferença', async () => {
  const { renderTopicUniverse, countRemainingTopics } = await import('../../src/ui/performance/topic-universe.js');
  const diagnosis = renderTopicUniverse({ inScope: 305, remaining: 194, withSignal: 296 });
  assert.match(diagnosis, /data-topic-universe/);
  assert.match(diagnosis, /305 tópicos no edital · 194 por concluir · 296 com sinal de diagnóstico \(9 sem sinal ainda não entram na lista\)\./);
  assert.match(renderTopicUniverse({ inScope: 305, remaining: 194, withSignal: 297, inNextAction: 1 }), /(8 sem sinal ainda não entram na lista; 1 aparece em Próxima ação, acima da lista)/);
  const exams = renderTopicUniverse({ inScope: 305, remaining: 194, mapped: 304 });
  assert.match(exams, /305 tópicos no edital · 194 por concluir · 304 mapeados ao histórico da banca \(1 sem questão no histórico da banca\)\./);
  // Sem diferença, sem parêntese; sem tópicos, sem linha.
  assert.doesNotMatch(renderTopicUniverse({ inScope: 10, remaining: 4, mapped: 10 }), /\(/);
  assert.equal(renderTopicUniverse({ inScope: 0 }), '');
  assert.match(renderTopicUniverse({ inScope: 1 }), /1 tópico no edital\./);
  assert.equal(countRemainingTopics([{ status: 'Concluído' }, { status: 'Em andamento' }, { status: 'Não iniciado' }, {}]), 3);
});

test('T37: precisão com uma casa, diferença em p.p. com sinal e uma casa, e "Sem dados" no lugar do traço', async () => {
  const { formatPercent, formatPointsMagnitude, formatPoints } = await import('../../src/core/format-number.js');
  assert.equal(formatPercent(69.3), '69,3%');
  assert.equal(formatPercent(55), '55,0%');
  assert.equal(formatPercent(null), 'Sem dados');
  assert.equal(formatPercent(''), 'Sem dados');
  assert.equal(formatPointsMagnitude(20), '20,0 p.p.');
  assert.equal(formatPointsMagnitude(-6), '6,0 p.p.');
  assert.equal(formatPoints(-6), '−6,0 p.p.');

  const { renderPerformanceSubjectComparison } = await import('../../src/ui/performance/performance-subject-comparison-renderer.js');
  const row = (n, accuracy, state = 'measured') => ({ subjectId: `s${n}`, name: `D${n}`, target: 80, accuracy, gap: accuracy == null ? null : accuracy - 80, evolution: -6, questions: 40, state, plannedMinutes: 0, executedMinutes: 0, balanceMinutes: null, suggestion: null });
  const html = renderPerformanceSubjectComparison({ rows: [row(1, 55), row(2, 53.7)], measured: 2, sort: 'gap' }, { escapeHtml: String, escapeAttr: String, view: 'bars' });
  assert.match(html, /55,0% · meta de precisão 80%/);
  assert.match(html, /53,7% · meta de precisão 80%/);
  assert.doesNotMatch(html, /−6 p\.p\./);
  assert.match(html, /−6,0 p\.p\./);

  const { calculateCareerBenchmarkComparison } = await import('../../src/domain/analytics/career-benchmarks.js');
  const { h } = await import('preact');
  const { renderToString } = await import('preact-render-to-string');
  const { CareerBenchmarkCard } = await import('../../src/ui/components/CareerBenchmarkCard.js');
  const comparison = calculateCareerBenchmarkComparison({ studiedHours: 22, resolvedQuestions: 200, accuracyPercent: 80, theoryMinutes: 1, questionsMinutes: 1, reviewMinutes: 1 }, 'policial');
  const card = renderToString(h(CareerBenchmarkCard, { comparison, selectedCareerId: 'policial' }));
  assert.match(card, /alvo: 20 a 26 h\/sem/);
  assert.match(card, /alvo: 76% a 82%/);
});

test('T38: evidência em 4 estados, prioridade alta e média, tipo de problema à parte e tendência com nomes descritivos', async () => {
  const { diagnosticLabel, DIAGNOSTIC_VOCABULARY, diagnosticSignalLabel } = await import('../../src/domain/diagnostics/diagnostic-vocabulary.js');
  assert.equal(diagnosticLabel('severity', 'critical'), 'Prioridade alta');
  assert.equal(diagnosticLabel('severity', 'important'), 'Prioridade média');
  assert.deepEqual(['high', 'moderate', 'low', 'unassessed'].map(key => diagnosticLabel('evidence', key)), ['Alta', 'Média', 'Baixa', 'Sem evidência']);
  // O que não tem dado cai sempre em "Sem evidência", nunca em "Dados insuficientes".
  assert.equal(diagnosticLabel('trend', 'insufficient'), 'Sem evidência');
  assert.equal(diagnosticLabel('outcome', 'insufficient'), 'Sem evidência');
  assert.equal(diagnosticLabel('nada', 'nada'), 'Sem evidência');
  // O tipo de problema não carrega prioridade: Lacuna, Cobertura, Revisão, Coletar evidência.
  assert.deepEqual(['critical-gap', 'critical-coverage', 'priority-review', 'collect-evidence'].map(diagnosticSignalLabel), ['Lacuna', 'Cobertura', 'Revisão', 'Coletar evidência']);
  assert.doesNotMatch(JSON.stringify(DIAGNOSTIC_VOCABULARY), /Dados insuficientes|Atenção prioritária|Importante/);

  const { EVIDENCE_LABELS } = await import('../../src/ui/performance/evidence-badge.js');
  assert.ok(Object.values(EVIDENCE_LABELS).every(label => /evidência/.test(label)));

  const { renderStabilityMap } = await import('../../src/ui/performance/stability-map-renderer.js');
  const html = renderStabilityMap({ groups: { attention: [{ subjectId: 'a', name: 'A', accuracy: 85, evolution: -4 }], maintain: [], intervene: [], evolving: [], insufficient: [] }, total: 1, measured: 1 }, { escapeHtml: String, escapeAttr: String });
  assert.match(html, /<h4>Em queda<\/h4>/);
  assert.match(html, /<h4>Abaixo da meta<\/h4>/);
  assert.doesNotMatch(html, /Intervir|Evoluindo|<h4>Manter/);
});

test('T39: o selo do período diz a janela real e a Leitura avisa que as janelas são diferentes', async () => {
  const { renderWindowBadge, windowBadgeLabel } = await import('../../src/ui/performance/window-badge.js');
  assert.equal(windowBadgeLabel('period', 'Últimos 30 dias'), '30 dias');
  assert.equal(windowBadgeLabel('period', 'Últimos 7 dias'), '7 dias');
  assert.equal(windowBadgeLabel('period', 'Todo o histórico'), 'todo o histórico');
  // Sem rótulo reconhecível cai no genérico; os outros tipos não mudam.
  assert.equal(windowBadgeLabel('period', ''), 'período');
  assert.equal(windowBadgeLabel('period', 'Período indisponível'), 'período');
  assert.equal(windowBadgeLabel('currentWeek', 'Últimos 30 dias'), 'semana atual');
  assert.match(renderWindowBadge('period', 'Últimos 90 dias'), />90 dias<\/span>/);
  assert.match(renderWindowBadge('period', 'Últimos 90 dias'), /title="Últimos 90 dias"/);

  const { renderPreparationReading } = await import('../../src/ui/performance/preparation-reading-renderer.js');
  const reading = {
    howAmI: { readiness: { value: 47, detail: null, verdict: null }, projection: null, rhythm: null },
    pulling: [],
    whatToDo: { state: 'x', action: null, reason: null, deficit: null, recovery: false },
    steady: [],
    evidence: [],
  };
  assert.match(renderPreparationReading(reading), /data-window-note="true"[^>]*>Janelas diferentes: o ritmo e o que falta são dos últimos 7 dias/);
  assert.doesNotMatch(renderPreparationReading({ ...reading, howAmI: { ...reading.howAmI, readiness: null } }), /data-window-note/);

  const { renderAdherenceMetrics } = await import('../../src/ui/renderers/adherence-renderer.js');
  const model = {
    summary: { temporalAdherence: 70, matchedMinutes: 60, plannedMinutes: 90, executedMinutes: 80, volumeRatio: 88, additionalMinutes: 0, excessLinkedMinutes: 0, incompatibleMinutes: 0, otherPeriodMinutes: 0 },
    priority: { classifiedCoverage: 100, plannedMinutes: 60, executedMinutes: 50, adherence: 80, unknownPlannedMinutes: 0, completedActivities: 1, plannedActivities: 1, partiallyExecutedActivities: 0 },
    subjects: [],
  };
  const html = renderAdherenceMetrics(model, { escapeHtml: String, windowLabel: 'Últimos 30 dias' });
  assert.equal((html.match(/>30 dias<\/span>/g) || []).length, 5);
  assert.doesNotMatch(html, />período<\/span>/);
});

test('T40: os quadrantes ficam numa dobra que o controller abre ou fecha conforme a tela, e as dobras de método dizem "Como ler:"', async () => {
  const { renderExamMatrix } = await import('../../src/ui/renderers/exam-matrix-renderer.js');
  const model = {
    state: 'available',
    filters: { scope: 'active', board: 'all', year: 'all', role: 'all', subject: 'all', search: '', sort: 'incidence', mode: 'quadrants' },
    options: { tags: [], boards: [], years: [], roles: [], subjects: [] },
    scopedExamCount: 1, selectedExamCount: 1, partialExamCount: 0, analyzedQuestionCount: 10, exams: [],
    rows: [{ topicId: 't', subjectName: 'S', name: 'T', presencePercent: 80, mastery: 40, confidence: 'high', presentExamCount: 4, examCount: 5, questionCount: 3, cells: [] }],
  };
  const html = renderExamMatrix(model, {});
  assert.match(html, /<details class="exam-matrix-quadrants-fold" open><summary>Quadrantes de incidência × domínio<\/summary>/);
  assert.doesNotMatch(renderExamMatrix({ ...model, filters: { ...model.filters, mode: 'history' } }, {}), /exam-matrix-quadrants-fold/);

  const { renderStabilityMap } = await import('../../src/ui/performance/stability-map-renderer.js');
  const map = renderStabilityMap({ groups: { attention: [{ subjectId: 'a', name: 'A', accuracy: 85, evolution: -4 }], maintain: [], intervene: [], evolving: [], insufficient: [] }, total: 1, measured: 1 }, { escapeHtml: String, escapeAttr: String });
  // O "Como ler" da comparação e do mapa vive num guia único da aba, em Por disciplina.
  assert.doesNotMatch(map, /limits-disclosure|Como ler/);
});

test('T41: a sigla da Matriz diz o nome completo e a grade do heatmap tem a lista de 12 semanas para o celular', async () => {
  const { renderPedagogicalMatrixSection } = await import('../../src/ui/performance/performance-matrix-renderer.js');
  const html = renderPedagogicalMatrixSection(
    { items: [{ name: 'Matemática Financeira', mastery: 20, retention: 30, studyMinutes: 60 }], thresholdMastery: 70, thresholdRetention: 60, quadrantCounts: { consolidated: 0, forgetting_risk: 0, building: 0, critical: 1 } },
    { escapeHtml: String }
  );
  assert.match(html, /<abbr title="Matemática Financeira">/);
  assert.doesNotMatch(html, /Sigla na dispersão/);

  const { h } = await import('preact');
  const { renderToString } = await import('preact-render-to-string');
  const { ActivityHeatmap } = await import('../../src/ui/primitives/charts/ActivityHeatmap.js');
  const days = Array.from({ length: 21 }, (_, n) => ({ date: `2026-10-${String(n + 5).padStart(2, '0')}`, dayOfWeek: (n + 0) % 7, weekIndex: Math.floor(n / 7), value: n % 3, level: n % 3, selected: false, tooltip: `dia ${n}`, summary: {} }));
  const out = renderToString(h(ActivityHeatmap, { mode: 'calendar', calendarVisual: { weeksCount: 3, days, monthLabels: [], weekdayLabels: [], maxLevel: 4, activeDaysCount: 14, totalDaysCount: 21 }, hasActivity: true }));
  assert.match(out, /class="heatmap-weekly-mobile"/);
  assert.match(out, /heatmap-grid-wrap/);
  assert.ok((out.match(/<li[ >]/g) || []).length >= 3);
});

test('T42: busca de tópicos, filtros numa dobra com contagem e restaurar padrão', () => {
  const withFilters = filters => render(filters);
  const base = withFilters({});
  assert.match(base, /data-diagnosis-search/);
  assert.match(base, /<details class="diagnosis-filters-fold" data-fold-key="diagnosis-filters"><summary>Filtros<\/summary>/);
  assert.doesNotMatch(base, /data-diagnosis-reset/);
  assert.match(base, /<strong>Lacuna:<\/strong>/);
  assert.match(base, /<strong>Prioridade provisória:<\/strong>/);
  const searched = withFilters({ search: 'tópico 3' });
  assert.match(searched, /1 de 5 itens/);
  assert.match(searched, /<summary>Filtros \(1 ativo\)<\/summary>/);
  assert.match(searched, /data-diagnosis-reset/);
  // A busca ignora acentos e maiúsculas e olha também o nome da disciplina.
  assert.match(withFilters({ search: 'TOPICO 1' }), /1 de 5 itens/);
  assert.match(withFilters({ search: 'disciplina c' }), /2 de 5 itens/);
  assert.match(withFilters({ search: 'xyz' }), /0 de 5 itens/);
  const combined = withFilters({ severity: 'critical', search: 'disciplina c' });
  assert.match(combined, /<summary>Filtros \(2 ativos\)<\/summary>/);
});

test('T42: Alt + 1–5 troca de subaba, Alt + 6–9 muda o período e o resto é ignorado', async () => {
  const { performanceShortcut } = await import('../../src/ui/controllers/performance-controller.js');
  const key = (n, extra = {}) => ({ altKey: true, code: `Digit${n}`, ...extra });
  assert.deepEqual([1, 2, 3, 4, 5].map(n => performanceShortcut(key(n))?.section), ['overview', 'subjects', 'diagnosis', 'questions', 'consistency']);
  assert.deepEqual([6, 7, 8, 9].map(n => performanceShortcut(key(n))?.period), ['7', '30', '90', 'all']);
  assert.equal(performanceShortcut({ code: 'Digit1' }), null);
  assert.equal(performanceShortcut(key(1, { ctrlKey: true })), null);
  assert.equal(performanceShortcut(key(1, { shiftKey: true })), null);
  assert.equal(performanceShortcut({ altKey: true, code: 'KeyA' }), null);
});

test('T43: a Leitura diz o que já está firme antes do alerta, só com evidência', async () => {
  const { buildPreparationReading } = await import('../../src/application/performance/build-preparation-reading.js');
  const reading = buildPreparationReading({
    subjectAccuracy: { a: { accuracy: 85, resolved: 40 }, b: { accuracy: 90, resolved: 4 }, c: { accuracy: 60, resolved: 50 }, d: { accuracy: 82, resolved: 12 } },
    accuracyTarget: 80,
    weeklyBrief: { current: { plannedMinutes: 600, studiedMinutes: 650 } },
    projection: { current: { simulationAccuracy: 83.4, targetScore: 80 } },
  });
  assert.equal(reading.steady.length, 3);
  assert.match(reading.steady[0], /^2 disciplinas já estão na meta de precisão de 80%/);
  assert.match(reading.steady[1], /resultado central dos simulados comparáveis \(83%\) está na meta de 80%/);
  assert.match(reading.steady[2], /Semana cumprida/);
  const none = buildPreparationReading({ subjectAccuracy: { b: { accuracy: 95, resolved: 5 } }, weeklyBrief: { current: { plannedMinutes: 600, studiedMinutes: 100 } } });
  assert.deepEqual(none.steady, []);
  const { renderPreparationReading } = await import('../../src/ui/performance/preparation-reading-renderer.js');
  assert.match(renderPreparationReading({ ...reading, howAmI: { readiness: { value: 47, detail: null, verdict: null }, projection: null, rhythm: null } }), /data-steady="true"><h5 class="m-0">O que já está firme<\/h5>/);

  const { renderTopicUniverse } = await import('../../src/ui/performance/topic-universe.js');
  assert.match(renderTopicUniverse({ inScope: 305, remaining: 194, withSignal: 297, controlled: 12 }), /194 por concluir · 297 com sinal de diagnóstico · 12 já sob controle/);
});

test('Auditoria 4.2/4.5/4.6: seleção de até 3 disciplinas em Questões, ação na Matriz/Assunto e bateria curta em Simulados', async () => {
  const { createPerformanceViewState, updatePerformanceViewState } = await import(
    '../../src/application/performance/performance-view-state.js'
  );
  let state = createPerformanceViewState();
  state = updatePerformanceViewState(state, { toggleQuestionSubject: 's1' });
  state = updatePerformanceViewState(state, { toggleQuestionSubject: 's2' });
  state = updatePerformanceViewState(state, { toggleQuestionSubject: 's3' });
  state = updatePerformanceViewState(state, { toggleQuestionSubject: 's4' });
  assert.deepEqual(state.selectedQuestionSubjects, ['s2', 's3', 's4']);
  state = updatePerformanceViewState(state, { toggleQuestionSubject: 's3' });
  assert.deepEqual(state.selectedQuestionSubjects, ['s2', 's4']);

  const { renderPerformanceQuestions } = await import(
    '../../src/ui/performance/performance-questions-renderer.js'
  );
  const subjectsList = Array.from({ length: 6 }, (_, i) => ({
    subjectId: `s${i + 1}`,
    subjectName: `Disciplina ${i + 1}`,
    colorSlot: (i % 8) + 1,
    totalResolved: i === 0 ? 10 : 50,
    totalCorrect: i === 0 ? 8 : 40,
    overallAccuracy: 80,
    points: [{ periodKey: '2026-11-01', accuracy: 80 }],
  }));
  const qHtml = renderPerformanceQuestions({
    evolution: { state: 'ready', monthly: false, resolved: 260, accuracy: 80, buckets: [] },
    analysis: { questionCount: 260, accuracy: 80, errors: 52, errorCategories: [], uncategorizedErrors: 52, topics: [] },
    multiSubjectPerformance: {
      series: subjectsList,
      periods: ['2026-11-01'],
      periodLabels: ['01/11'],
      totalResolved: 260,
      totalCorrect: 208,
      overallAccuracy: 80,
    },
    range: { label: 'Últimos 30 dias', comparePrevious: false },
    formatDate: String,
    escapeHtml: String,
    selectedQuestionSubjects: ['s1', 's6'],
  });
  assert.match(qHtml, /amostra pequena/);
  assert.match(qHtml, /Mostrar todas as 6 disciplinas/);
  assert.match(qHtml, /data-performance-question-subjects-reset/);
  assert.match(qHtml, /data-performance-question-subject="s1" aria-pressed="true"/);

  const { renderPedagogicalMatrixSection } = await import(
    '../../src/ui/performance/performance-matrix-renderer.js'
  );
  const matrixHtml = renderPedagogicalMatrixSection(
    {
      items: [{ name: 'Informática', mastery: 45, retention: 50, studyMinutes: 60 }],
      thresholdMastery: 70,
      thresholdRetention: 60,
      quadrantCounts: { consolidated: 0, forgetting_risk: 0, building: 0, critical: 1 },
    },
    { escapeHtml: String }
  );
  assert.match(matrixHtml, /Retomar fundamentos/);
  assert.match(matrixHtml, /data-matrix-method="true"/);

  const { buildPerformanceSubjects } = await import(
    '../../src/application/performance/build-performance-subjects.js'
  );
  const { renderPerformanceSubjects } = await import(
    '../../src/ui/performance/performance-subjects-renderer.js'
  );
  const subjModel = buildPerformanceSubjects({
    subjects: [{ id: 's1', name: 'Português', topics: [{ id: 't1', name: 'Crase' }] }],
    range: { start: '2026-11-01', end: '2026-11-15', label: 'Últimos 15 dias', comparePrevious: false },
    today: '2026-11-15',
    questions: [{ subjectId: 's1', topicId: 't1', date: '2026-11-10', resolved: 20, correct: 10 }],
    metricsByTopic: { t1: { mastery: 50, retention: 40, evidence: 20 } },
  });
  assert.equal(subjModel.topics[0].recommendedAction, 'Retomar fundamentos');
  const subjHtml = renderPerformanceSubjects(subjModel, {
    range: { label: 'Últimos 15 dias', comparePrevious: false },
    formatDate: String,
    escapeHtml: String,
    escapeAttr: String,
  });
  assert.match(subjHtml, /Retomar fundamentos/);

  const { renderSimulationTrendChart } = await import('../../src/ui/renderers/simulations-renderer.js');
  const simHtml = renderSimulationTrendChart({
    items: [
      { nome: 'Bateria', date: '2026-11-01', correct: 8, total: 10 },
      { nome: 'Prova', date: '2026-11-08', correct: 75, total: 100 },
      { nome: 'Prova 2', date: '2026-11-15', correct: 80, total: 100 },
    ],
    scoreFor: i => Math.round((i.correct / i.total) * 1000) / 10,
    formatDate: String,
    escapeHtml: String,
  });
  assert.match(simHtml, /8\/10 questões \(bateria curta\)/);
  assert.match(simHtml, /75\/100 questões</);
});
