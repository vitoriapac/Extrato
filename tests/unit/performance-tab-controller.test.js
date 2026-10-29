import test from 'node:test';
import assert from 'node:assert/strict';
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
});
