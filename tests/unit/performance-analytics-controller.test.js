import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RADAR_AXIS_META,
  renderRadarSvg,
  renderRadarToolbarHtml,
  renderRadarAnalysisHtml,
  renderRadarDisciplinasHtml,
  createPerformanceAnalyticsController,
} from '../../src/ui/controllers/performance-analytics-controller.js';

test('renderRadarSvg — gera SVG com anéis, eixos e séries', () => {
  const selected = [
    {
      id: 'sub-1',
      name: 'Direito Constitucional',
      axes: {
        coverage: 80,
        mastery: 75,
        retention: 90,
        frequency: 60,
        consistency: 85,
      },
      interpretation: 'Desempenho consolidado',
      availableAxes: 5,
      confidenceLabel: 'Alta',
    },
  ];

  const svg = renderRadarSvg({ selected });
  assert.ok(svg.includes('<svg class="radar-svg"'));
  assert.ok(svg.includes('<polygon class="radar-grid"'));
  assert.ok(svg.includes('<line class="radar-axis"'));
  assert.ok(svg.includes('radar-series-1'));
  assert.ok(svg.includes('Direito Constitucional · Cobertura: 80/100'));
});

test('renderRadarSvg — tolera eixos parciais com valores nulos', () => {
  const selected = [
    {
      id: 'sub-incomplete',
      name: 'Direito Penal',
      axes: {
        coverage: 50,
        mastery: null,
        retention: null,
        frequency: 40,
        consistency: null,
      },
      interpretation: 'Aguardando mais sessões',
      availableAxes: 2,
      confidenceLabel: 'Baixa',
    },
  ];

  const svg = renderRadarSvg({ selected });
  assert.ok(svg.includes('<svg class="radar-svg"'));
  // Não deve desenhar polygon fechado se eixos forem incompletos
  assert.ok(!svg.includes('<polygon class="radar-shape radar-series-1"'));
  // Mas deve desenhar os círculos (dots) dos pontos com valor
  assert.ok(svg.includes('<circle class="radar-dot radar-series-1"'));
});

test('renderRadarToolbarHtml — monta seletores de disciplinas', () => {
  const subjects = [
    { id: 's1', name: 'Matemática' },
    { id: 's2', name: 'Português' },
  ];

  const html = renderRadarToolbarHtml(subjects, ['s1', 's2']);
  assert.ok(html.includes('Disciplina 1'));
  assert.ok(html.includes('Comparar com'));
  assert.ok(html.includes('<option value="s1" selected>Matemática</option>'));
  assert.ok(html.includes('<option value="s2" selected>Português</option>'));
});

test('renderRadarAnalysisHtml — exibe seções de análise descritiva', () => {
  const selected = [
    {
      id: 's1',
      name: 'Raciocínio Lógico',
      axes: { coverage: 70, mastery: 80, retention: null, frequency: 50, consistency: 60 },
      interpretation: 'Ritmo favorável',
      availableAxes: 4,
      confidenceLabel: 'Média',
    },
  ];

  const html = renderRadarAnalysisHtml(selected);
  assert.ok(html.includes('Raciocínio Lógico'));
  assert.ok(html.includes('Ritmo favorável'));
  assert.ok(html.includes('4 de 5 eixos · confiança média'));
  assert.ok(html.includes('<dd>Aguardando dados</dd>'));
  assert.ok(html.includes('<dd>70/100</dd>'));
});

test('renderRadarDisciplinasHtml — retorna estado vazio quando não há disciplinas', () => {
  const html = renderRadarDisciplinasHtml({
    subjects: [],
    selectedModels: [],
    selectedIds: [],
  });
  assert.ok(html.includes('Cadastre uma disciplina com tópicos para ver o radar.'));
});

test('createPerformanceAnalyticsController — orquestra estado de visualização e slots', () => {
  let rendered = false;
  const subjects = [
    { id: 'sub-a', name: 'Direito Civil', topics: [{ id: 't1', archived: false }] },
    { id: 'sub-b', name: 'Direito Tributário', topics: [{ id: 't2', archived: false }] },
  ];

  const controller = createPerformanceAnalyticsController({
    getSubjects: () => subjects,
    getSubjectRadarModel: s => ({
      id: s.id,
      name: s.name,
      axes: { coverage: 50, mastery: 50, retention: 50, frequency: 50, consistency: 50 },
      interpretation: 'Regular',
      availableAxes: 5,
      confidenceLabel: 'Alta',
    }),
    onRender: () => {
      rendered = true;
    },
  });

  const initialHtml = controller.renderRadarHtml();
  assert.ok(initialHtml.includes('Direito Civil'));

  // Seleciona slot 1
  controller.setRadarSubject(1, 'sub-b');
  assert.equal(rendered, true);
  assert.deepEqual(controller.getRadarViewState().subjectIds, ['sub-a', 'sub-b']);

  // Se selecionar o mesmo no slot 0, desmarca do slot 1
  controller.setRadarSubject(0, 'sub-b');
  assert.deepEqual(controller.getRadarViewState().subjectIds, ['sub-b', '']);
});
