import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubjectStudyDistributionVisual,
  buildPlanImpactAlignmentVisual,
  buildWeeklyAllocationBarVisual,
  buildPhaseRoadmapVisual,
} from '../../src/domain/planning/planning-visual-models.js';
import {
  renderGroupedBarChart,
  renderAllocationBar,
  renderPhaseRoadmapTimeline,
} from '../../src/ui/primitives/charts/charts.js';

test('buildSubjectStudyDistributionVisual — calcula minutos, gaps, status e colorSlot', () => {
  const subjects = [
    { id: 'sub-dir-penal', name: 'Direito Penal' },
    { id: 'sub-port', name: 'Língua Portuguesa' },
  ];

  const distributionRows = [
    {
      subjectId: 'sub-dir-penal',
      name: 'Direito Penal',
      plannedMinutes: 180,
      studiedMinutes: 240, // +60 -> surplus
      plannedShare: 60,
      studiedShare: 75,
    },
    {
      subjectId: 'sub-port',
      name: 'Língua Portuguesa',
      plannedMinutes: 120,
      studiedMinutes: 60, // -60 -> deficit
      plannedShare: 40,
      studiedShare: 25,
    },
  ];

  const visual = buildSubjectStudyDistributionVisual({ distributionRows, subjects });

  assert.equal(visual.totalPlannedMinutes, 300);
  assert.equal(visual.totalStudiedMinutes, 300);
  assert.equal(visual.maxMinutes, 240);
  assert.equal(visual.rows.length, 2);

  const penalRow = visual.rows.find(r => r.subjectId === 'sub-dir-penal');
  assert.ok(penalRow);
  assert.equal(penalRow.status, 'surplus');
  assert.equal(penalRow.diffMinutes, 60);
  assert.ok(penalRow.colorSlot >= 1 && penalRow.colorSlot <= 8);

  const portRow = visual.rows.find(r => r.subjectId === 'sub-port');
  assert.ok(portRow);
  assert.equal(portRow.status, 'deficit');
  assert.equal(portRow.diffMinutes, -60);
});

test('buildPlanImpactAlignmentVisual — classifica sob/sub-alocação e alinhamento', () => {
  const subjects = [
    { id: 's1', name: 'Conhecimentos Bancários' },
    { id: 's2', name: 'Atualidades' },
    { id: 's3', name: 'Matemática' },
  ];

  const alignmentRows = [
    {
      subjectId: 's1',
      name: 'Conhecimentos Bancários',
      plannedShare: 50,
      impactShare: 35, // +15 -> overallocated
      impactCount: 10,
      topicCount: 12,
    },
    {
      subjectId: 's2',
      name: 'Atualidades',
      plannedShare: 5,
      impactShare: 20, // -15 -> underallocated
      impactCount: 5,
      topicCount: 5,
    },
    {
      subjectId: 's3',
      name: 'Matemática',
      plannedShare: 25,
      impactShare: 25, // 0 -> balanced
      impactCount: 8,
      topicCount: 8,
    },
  ];

  const visual = buildPlanImpactAlignmentVisual({ alignmentRows, subjects });

  assert.equal(visual.overallocatedCount, 1);
  assert.equal(visual.underallocatedCount, 1);
  assert.equal(visual.balancedCount, 1);

  const bancarios = visual.rows.find(r => r.subjectId === 's1');
  assert.equal(bancarios?.alignmentStatus, 'overallocated');
  assert.equal(bancarios?.gapShare, 15);

  const atualidades = visual.rows.find(r => r.subjectId === 's2');
  assert.equal(atualidades?.alignmentStatus, 'underallocated');

  const mat = visual.rows.find(r => r.subjectId === 's3');
  assert.equal(mat?.alignmentStatus, 'balanced');
});

test('buildWeeklyAllocationBarVisual — agrega fatias de disciplinas e mix de atividades', () => {
  const subjects = [
    { id: 's1', name: 'Direito Constitucional' },
    { id: 's2', name: 'Direito Administrativo' },
  ];

  const planItems = [
    {
      subjectId: 's1',
      subjectName: 'Direito Constitucional',
      minutes: 300,
      activityMix: { theory: 150, questions: 100, reviews: 50 },
    },
    {
      subjectId: 's2',
      subjectName: 'Direito Administrativo',
      minutes: 200,
      activityMix: { theory: 50, questions: 100, reviews: 50 },
    },
  ];

  const visual = buildWeeklyAllocationBarVisual({
    planItems,
    subjects,
    weeklyCapacityMinutes: 600, // 500 planejados + 100 flex
  });

  assert.equal(visual.totalWeeklyMinutes, 500);
  assert.equal(visual.flexMinutes, 100);
  assert.equal(visual.subjects.length, 2);

  // Ordenação decrescente: s1 (300) antes de s2 (200)
  assert.equal(visual.subjects[0].subjectId, 's1');
  assert.equal(visual.subjects[0].percentage, 50); // 300 / 600 = 50%
  assert.equal(visual.subjects[1].percentage, 33.3); // 200 / 600 = 33.3%

  // Mix total: 200 theory, 200 questions, 100 reviews = 500
  assert.equal(visual.mix.theoryMinutes, 200);
  assert.equal(visual.mix.questionsMinutes, 200);
  assert.equal(visual.mix.reviewsMinutes, 100);
  assert.equal(visual.mix.theoryPercentage, 40);
  assert.equal(visual.mix.questionsPercentage, 40);
  assert.equal(visual.mix.reviewsPercentage, 20);
});

test('buildPhaseRoadmapVisual — determina fases de preparação e contagem regressiva', () => {
  // Cenário 1: 20 dias restantes -> Modo Reta Final (85/15)
  const roadmap20d = buildPhaseRoadmapVisual({
    examDate: '2026-11-24',
    today: '2026-11-04',
    planStartDate: '2026-10-01',
  });

  assert.equal(roadmap20d.daysRemaining, 20);
  assert.equal(roadmap20d.phase, 'final_stretch');
  assert.equal(roadmap20d.phaseLabel, 'Modo Reta Final (85/15)');
  assert.ok(roadmap20d.progressPercentage > 0 && roadmap20d.progressPercentage <= 100);

  const activePhase = roadmap20d.phasesList.find(p => p.isActive);
  assert.equal(activePhase?.key, 'final_stretch');

  // Cenário 2: 5 dias restantes -> Revisão Final
  const roadmap5d = buildPhaseRoadmapVisual({
    examDate: '2026-11-09',
    today: '2026-11-04',
  });
  assert.equal(roadmap5d.daysRemaining, 5);
  assert.equal(roadmap5d.phase, 'final_review');

  // Cenário 3: Sem data de prova
  const undated = buildPhaseRoadmapVisual({
    examDate: null,
    today: '2026-11-04',
  });
  assert.equal(undated.phase, 'undated');
  assert.equal(undated.daysRemaining, null);
});

test('renderGroupedBarChart, renderAllocationBar, renderPhaseRoadmapTimeline — geram marcação acessível', () => {
  const subjects = [{ id: 's1', name: 'Informática' }];
  const distributionVisual = buildSubjectStudyDistributionVisual({
    distributionRows: [
      { subjectId: 's1', name: 'Informática', plannedMinutes: 120, studiedMinutes: 120 },
    ],
    subjects,
  });

  const barHtml = renderGroupedBarChart({ rows: distributionVisual.rows, maxMinutes: 120 });
  assert.ok(barHtml.includes('chart-grouped-bars'));
  assert.ok(barHtml.includes('Informática'));
  assert.ok(barHtml.includes('subject-bg-'));

  const allocationVisual = buildWeeklyAllocationBarVisual({
    planItems: [{ subjectId: 's1', subjectName: 'Informática', minutes: 120 }],
    subjects,
    weeklyCapacityMinutes: 120,
  });
  const allocHtml = renderAllocationBar({ visual: allocationVisual });
  assert.ok(allocHtml.includes('chart-allocation-bar'));
  assert.ok(allocHtml.includes('Capacidade Semanal Alocada'));

  const roadmapVisual = buildPhaseRoadmapVisual({
    examDate: '2026-12-01',
    today: '2026-11-04',
  });
  const roadmapHtml = renderPhaseRoadmapTimeline({ visual: roadmapVisual });
  assert.ok(roadmapHtml.includes('chart-phase-roadmap'));
  assert.ok(roadmapHtml.includes('Fase Atual'));
  assert.ok(roadmapHtml.includes('dias'));
});

test('alocação mostra ranking legível de todas as disciplinas', () => {
  const subjects = Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, name: `Disciplina ${i}` }));
  const visual = buildWeeklyAllocationBarVisual({
    subjects,
    planItems: subjects.map((subject, i) => ({ subjectId: subject.id, minutes: (i + 1) * 10 })),
    weeklyCapacityMinutes: 280,
  });
  const html = renderAllocationBar({ visual });
  assert.match(html, /Distribuição por disciplina/);
  assert.ok(html.indexOf('Disciplina 6') < html.indexOf('Disciplina 0'));
  assert.match(html, /Disciplina 0/);
});
