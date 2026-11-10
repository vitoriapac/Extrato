import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { ShiftEnergyCard } from '../../src/ui/tabs/performance/ShiftEnergyCard.js';
import { buildShiftEnergyViewModel } from '../../src/application/analytics/build-shift-energy-view-model.js';
import { createPerformanceTabController } from '../../src/ui/tabs/performance/performance-tab-controller.js';

function createMockDeps() {
  const elements = {};
  function makeEl(id) {
    elements[id] = {
      innerHTML: '',
      textContent: '',
      append: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
  };

  const state = {
    progressHistory: [],
    examBlueprint: { activeExamTags: [] },
    subjects: [{ id: 's1', name: 'Português' }],
    studySessions: [],
    questoes: [],
    simulados: [],
    dailyPlans: [],
  };

  const deps = {
    document: mockDoc,
    getState: () => state,
    todayISO: () => '2026-10-28',
    formatDatePt: d => d,
    escapeHtml: s => String(s ?? ''),
    escapeAttr: s => String(s ?? ''),
    examEvidenceContext: () => ({
      content: { eligibleTopics: [] },
      sessions: { included: [] },
      questions: { included: [] },
    }),
    examScopedSubjects: () => [{ id: 's1', name: 'Português' }],
    examScopedSimulations: () => [],
    activeSubjects: () => [{ id: 's1', name: 'Português' }],
    subjectRadarModel: () => ({
      labels: ['Teoria', 'Questões', 'Revisão'],
      datasets: [{ data: [80, 70, 90] }],
    }),
  };

  return { deps, elements, getState: () => state };
}

test('PerformanceTabController — recordProgressSnapshot e renderProgressChart', () => {
  const { deps, elements, getState } = createMockDeps();
  const controller = createPerformanceTabController(deps);

  controller.recordProgressSnapshot(75);
  const history = getState().progressHistory;
  assert.equal(history.length, 1);
  assert.equal(history[0].pct, 75);
  assert.equal(history[0].date, '2026-10-28');

  // Atualiza mesmo dia sem duplicar
  controller.recordProgressSnapshot(80);
  assert.equal(history.length, 1);
  assert.equal(history[0].pct, 80);

  controller.renderProgressChart();
  assert.ok(elements['progressChart'].innerHTML.length > 0);
});

test('PerformanceTabController — renderRadarDisciplinas e setRadarSubject', () => {
  const { deps, elements } = createMockDeps();
  const controller = createPerformanceTabController(deps);

  controller.renderRadarDisciplinas();
  assert.ok(elements['radarChart'].innerHTML.length > 0);

  controller.setRadarSubject('slot1', 's1');
  assert.ok(elements['radarChart'].innerHTML.length > 0);
});

test('PerformanceTabController — renderPerformance renderiza container principal', () => {
  const { deps, elements } = createMockDeps();
  const controller = createPerformanceTabController(deps);

  controller.renderPerformance();
  assert.ok(elements['performancePage'].innerHTML.length > 0);
  assert.match(elements['performancePage'].innerHTML, /Visão geral|Disciplinas/);
  // O benchmark mora em Consistência; a Visão geral não o carrega.
  assert.doesNotMatch(elements['performancePage'].innerHTML, /performanceCareerBenchmarkMount/);
});

test('ShiftEnergyCard Preact Component — renderiza turnos e pico cognitivo', () => {
  const model = buildShiftEnergyViewModel({
    sessions: [
      {
        startedAt: '2026-10-15T08:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'deep',
        energyLevel: 'high',
        questionsResolved: 10,
        questionsCorrect: 9,
      },
      {
        startedAt: '2026-10-15T14:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'normal',
        energyLevel: 'normal',
      },
      {
        startedAt: '2026-10-15T20:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'distracted',
        energyLevel: 'low',
      },
    ],
  });

  const html = render(h(ShiftEnergyCard, { model }));
  assert.match(html, /Eficiência &amp; Energia por Turno/);
  assert.match(html, /Manhã/);
  assert.match(html, /Tarde/);
  assert.match(html, /Noite/);
  assert.match(html, /3,0h|3h/);
});
