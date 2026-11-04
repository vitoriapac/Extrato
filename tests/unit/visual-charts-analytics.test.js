import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudyTimelineModel } from '../../src/domain/analytics/study-timeline.js';
import { buildStudyDistributionModel } from '../../src/domain/analytics/study-distribution.js';
import { buildMultiSubjectPerformanceModel } from '../../src/domain/analytics/subject-performance-timeline.js';
import {
  buildPedagogicalMatrixModel,
  classifyPedagogicalQuadrant,
} from '../../src/domain/analytics/pedagogical-matrix.js';
import {
  donutGeometry,
  stackedColumnsGeometry,
  multiLineGeometry,
  pedagogicalMatrixGeometry,
} from '../../src/ui/primitives/charts/geometry.js';
import {
  renderStackedColumnChart,
  renderDonutChart,
  renderMultiLineChart,
  renderPedagogicalMatrixChart,
} from '../../src/ui/primitives/charts/charts.js';

test('buildStudyTimelineModel — agrupa sessões por data e disciplina, calcula totais e frações', () => {
  const subjects = [
    { id: 'sub-1', name: 'Direito Penal', color: 1 },
    { id: 'sub-2', name: 'Direito Constitucional', color: 2 },
  ];
  const sessions = [
    { date: '2026-11-01', subjectId: 'sub-1', durationSeconds: 3600 },
    { date: '2026-11-01', subjectId: 'sub-2', durationSeconds: 1800 },
    { date: '2026-11-02', subjectId: 'sub-1', durationSeconds: 7200 },
    { date: '2026-11-05', subjectId: 'sub-1', durationSeconds: 1800 }, // fora do range
  ];

  const model = buildStudyTimelineModel({
    sessions,
    subjects,
    startDate: '2026-11-01',
    endDate: '2026-11-03',
  });

  assert.equal(model.periodDaysCount, 3);
  assert.equal(model.totalSeconds, 12600);
  assert.equal(model.maxDaySeconds, 7200);

  // Dia 1: sub-1 (3600s, 67%) e sub-2 (1800s, 33%)
  const day1 = model.days.find(d => d.date === '2026-11-01');
  assert.ok(day1);
  assert.equal(day1.totalSeconds, 5400);
  assert.equal(day1.segments.length, 2);

  // Resumo de matérias
  assert.equal(model.subjectSummaries.length, 2);
  assert.equal(model.subjectSummaries[0].subjectId, 'sub-1');
  assert.equal(model.subjectSummaries[0].totalSeconds, 10800);
  assert.equal(model.subjectSummaries[0].colorSlot, 1);
  assert.equal(model.subjectSummaries[1].subjectId, 'sub-2');
  assert.equal(model.subjectSummaries[1].totalSeconds, 1800);
  assert.equal(model.subjectSummaries[1].colorSlot, 2);
});

test('buildStudyTimelineModel — entradas vazias ou datas inválidas', () => {
  const empty = buildStudyTimelineModel({
    sessions: [],
    subjects: [],
    startDate: '2026-11-03',
    endDate: '2026-11-01', // invertido
  });
  assert.equal(empty.totalSeconds, 0);
  assert.equal(empty.days.length, 0);
});

test('buildStudyDistributionModel — calcula frações, percentuais e rosca de matérias', () => {
  const subjects = [
    { id: 'sub-1', name: 'Português', color: 3 },
    { id: 'sub-2', name: 'Raciocínio Lógico', color: 4 },
  ];
  const sessions = [
    { date: '2026-11-02', subjectId: 'sub-1', durationSeconds: 5400 },
    { date: '2026-11-02', subjectId: 'sub-2', durationSeconds: 1800 },
  ];

  const model = buildStudyDistributionModel({
    sessions,
    subjects,
    startDate: '2026-11-01',
    endDate: '2026-11-03',
  });

  assert.equal(model.totalSeconds, 7200);
  assert.equal(model.slices.length, 2);
  assert.equal(model.slices[0].subjectId, 'sub-1');
  assert.equal(model.slices[0].percentage, 75);
  assert.equal(model.slices[0].ratio, 0.75);
  assert.equal(model.slices[0].colorSlot, 3);

  assert.equal(model.slices[1].subjectId, 'sub-2');
  assert.equal(model.slices[1].percentage, 25);
  assert.equal(model.slices[1].ratio, 0.25);
  assert.equal(model.slices[1].colorSlot, 4);
});

test('buildMultiSubjectPerformanceModel — evolução multilinear por período', () => {
  const subjects = [
    { id: 'sub-1', name: 'Direito Administrativo', color: 5 },
    { id: 'sub-2', name: 'Informática', color: 6 },
  ];
  const questions = [
    { date: '2026-11-01', subjectId: 'sub-1', resolved: 20, correct: 18 },
    { date: '2026-11-02', subjectId: 'sub-1', resolved: 10, correct: 7 },
    { date: '2026-11-02', subjectId: 'sub-2', resolved: 30, correct: 24 },
  ];

  const model = buildMultiSubjectPerformanceModel({
    questions,
    subjects,
    today: '2026-11-04',
    period: '7',
  });

  assert.equal(model.totalResolved, 60);
  assert.equal(model.totalCorrect, 49);
  assert.equal(model.overallAccuracy, 82);
  assert.equal(model.series.length, 2);

  const sub1Series = model.series.find(s => s.subjectId === 'sub-1');
  assert.ok(sub1Series);
  assert.equal(sub1Series.totalResolved, 30);
  assert.equal(sub1Series.totalCorrect, 25);
  assert.equal(sub1Series.overallAccuracy, 83);
  assert.equal(sub1Series.colorSlot, 5);
});

test('classifyPedagogicalQuadrant e buildPedagogicalMatrixModel — quadrantes pedagógicos', () => {
  assert.equal(classifyPedagogicalQuadrant(80, 75).quadrant, 'consolidated');
  assert.equal(classifyPedagogicalQuadrant(85, 40).quadrant, 'forgetting_risk');
  assert.equal(classifyPedagogicalQuadrant(50, 70).quadrant, 'building');
  assert.equal(classifyPedagogicalQuadrant(45, 30).quadrant, 'critical');

  const model = buildPedagogicalMatrixModel({
    subjects: [
      { id: 's1', name: 'Matéria A', mastery: 85, retention: 75, studyMinutes: 300 },
      { id: 's2', name: 'Matéria B', mastery: 80, retention: 40, studyMinutes: 120 },
      { id: 's3', name: 'Matéria C', mastery: 55, retention: 80, studyMinutes: 200 },
      { id: 's4', name: 'Matéria D', mastery: 40, retention: 30, studyMinutes: 90 },
    ],
  });

  assert.equal(model.quadrantCounts.consolidated, 1);
  assert.equal(model.quadrantCounts.forgetting_risk, 1);
  assert.equal(model.quadrantCounts.building, 1);
  assert.equal(model.quadrantCounts.critical, 1);
  assert.equal(model.items.length, 4);
});

test('geometrias SVG — donutGeometry, stackedColumnsGeometry, multiLineGeometry, pedagogicalMatrixGeometry', () => {
  // Donut
  const donut = donutGeometry([{ ratio: 0.6, startRatio: 0 }, { ratio: 0.4, startRatio: 0.6 }], 50);
  assert.equal(donut.items.length, 2);
  assert.ok(donut.circumference > 300);

  // Stacked columns
  const cols = stackedColumnsGeometry([
    {
      date: '2026-11-01',
      totalSeconds: 3600,
      segments: [{ seconds: 3600, colorSlot: 1, subjectName: 'Sub A' }],
    },
    {
      date: '2026-11-02',
      totalSeconds: 7200,
      segments: [{ seconds: 7200, colorSlot: 2, subjectName: 'Sub B' }],
    },
  ]);
  assert.equal(cols.columns.length, 2);
  assert.equal(cols.columns[0].segments[0].colorSlot, 1);
  assert.equal(cols.columns[1].segments[0].colorSlot, 2);
  assert.ok(cols.columns[1].segments[0].height > cols.columns[0].segments[0].height);

  // Multi-line
  const multiline = multiLineGeometry(
    [
      {
        id: 's1',
        name: 'S1',
        colorSlot: 1,
        points: [{ periodKey: 'p1', accuracy: 80 }, { periodKey: 'p2', accuracy: 90 }],
      },
    ],
    2
  );
  assert.equal(multiline.series[0].dots.length, 2);
  assert.equal(multiline.series[0].runs.length, 1);

  // Pedagogical matrix
  const matrix = pedagogicalMatrixGeometry([
    { id: 's1', name: 'S1', colorSlot: 1, mastery: 80, retention: 70, studyMinutes: 180 },
  ]);
  assert.equal(matrix.bubbles.length, 1);
  assert.ok(matrix.bubbles[0].r >= 8);
});

test('renderers de componentes Preact — geram SVG acessível com classes semânticas de disciplinas', () => {
  // StackedColumnChart
  const stackedHtml = renderStackedColumnChart({
    days: [
      {
        date: '2026-11-01',
        totalSeconds: 3600,
        segments: [{ seconds: 3600, colorSlot: 2, subjectName: 'Direito Penal' }],
      },
    ],
  });
  assert.match(stackedHtml, /class="chart-stacked-columns"/);
  assert.match(stackedHtml, /role="img"/);
  assert.match(stackedHtml, /subject-fill-2/);

  // DonutChart
  const donutHtml = renderDonutChart({
    slices: [
      {
        subjectId: 's1',
        subjectName: 'Português',
        colorSlot: 3,
        seconds: 7200,
        percentage: 100,
        ratio: 1,
        startRatio: 0,
      },
    ],
    totalSeconds: 7200,
  });
  assert.match(donutHtml, /class="chart-donut/);
  assert.match(donutHtml, /subject-stroke-3/);
  assert.match(donutHtml, /2h/);

  // MultiLineChart
  const multiLineHtml = renderMultiLineChart({
    series: [
      {
        id: 's1',
        name: 'Matemática',
        colorSlot: 4,
        points: [{ periodKey: '2026-11-01', accuracy: 85 }],
      },
    ],
    periodLabels: ['01/11'],
  });
  assert.match(multiLineHtml, /class="chart-multiline/);
  assert.match(multiLineHtml, /subject-stroke-4/);

  // PedagogicalMatrixChart
  const matrixHtml = renderPedagogicalMatrixChart({
    items: [
      {
        id: 's1',
        name: 'Informática',
        colorSlot: 5,
        mastery: 80,
        retention: 70,
        studyMinutes: 120,
      },
    ],
  });
  assert.match(matrixHtml, /class="chart-matrix/);
  assert.match(matrixHtml, /subject-fill-5/);
  assert.match(matrixHtml, /Consolidada/);
});
