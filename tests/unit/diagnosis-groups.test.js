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

test('agrupa por disciplina, com contagem, e só a primeira abre, com até três conteúdos', () => {
  const html = render({});
  assert.equal((html.match(/<details class="diagnosis-group"/g) || []).length, 3);
  assert.match(html, /Disciplina a<\/strong> · 2 conteúdos/);
  assert.match(html, /Disciplina b<\/strong> · 1 conteúdo</);
  assert.equal((html.match(/<details class="diagnosis-group" open>/g) || []).length, 1);
  assert.equal((html.match(/<template data-lazy>/g) || []).length, 2);
  assert.doesNotMatch(html, /Mostrar mais diagnósticos/);
});

test('filtro por prioridade e evidência mantém o lugar na fila e informa a contagem', () => {
  const html = render({ severity: 'critical', evidence: 'low' });
  assert.match(html, /1 de 5 conteúdos/);
  assert.match(html, /4 · TÓPICO/);
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.match(render({ severity: 'monitor' }), /Nenhum conteúdo com esse filtro/);
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
