import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeeklyCloseModalController } from '../../src/features/weekly-close/weekly-close-modal-controller.js';

function createMockDeps() {
  const elements = {};
  function makeEl(id) {
    elements[id] = {
      innerHTML: '',
      scrollIntoView: () => {},
      focus: () => {},
    };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
    querySelector: () => ({ focus: () => {} }),
  };

  let toasted = '';
  let saved = false;

  const state = {
    examDate: '2026-12-31',
    metas: {
      metaAprovacao: 80,
      aderenciaSemanal: 80,
      horasPorDia: { '2026-10-28': 4 },
    },
    weeklyCloseSnapshots: [],
    readinessSnapshots: [],
    studyPlans: [],
    recommendationFeedback: [],
    studySessions: [],
    questoes: [],
    simulados: [],
    subjects: [{ id: 's1', name: 'Português' }],
    examBlueprint: { activeExamTags: [] },
  };

  const deps = {
    document: mockDoc,
    getState: () => state,
    examEvidenceContext: () => ({
      content: { eligibleTopics: [{ id: 't1', subjectId: 's1' }] },
      sessions: { included: [] },
      questions: { included: [] },
    }),
    intelligenceCandidates: () => [],
    getSubjectName: id => (id === 's1' ? 'Português' : id),
    getTopicName: id => (id === 't1' ? 'Crase' : id),
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T12:00:00Z',
    addDays: (d, n) => `2026-10-${28 + n}`,
    diasParaRevisao: () => 64,
    formatPlanMinutes: m => `${m} min`,
    escapeHtml: s => String(s ?? ''),
    escapeAttr: s => String(s ?? ''),
    uid: prefix => `${prefix}-1`,
    showToast: msg => {
      toasted = msg;
    },
    showConfirm: (_msg, onConfirm) => onConfirm(),
    scheduleSave: () => {
      saved = true;
    },
    metaHoursForDate: () => 4,
    allTopics: () => [],
  };

  return { deps, elements, getState: () => state, getToasted: () => toasted, isSaved: () => saved };
}

test('WeeklyCloseModalController — renderWeeklyCloseActions gera formulário de prioridades', () => {
  const { deps } = createMockDeps();
  const controller = createWeeklyCloseModalController(deps);

  // Salvar o retrato agora fica no ato "O retrato", depois da prévia.
  const emptyActions = controller.renderWeeklyCloseActions({ priorities: [] });
  assert.equal(emptyActions, '');

  const actionsWithPriorities = controller.renderWeeklyCloseActions({
    priorities: [{ priorityId: 'p1', action: 'Revisar Crase', estimatedMinutes: 60 }],
  });
  assert.match(actionsWithPriorities, /Revisar Crase/);
  assert.match(actionsWithPriorities, /Conferir impacto/);
  assert.match(actionsWithPriorities, /60 min/);
});

test('WeeklyCloseModalController — toggleWeeklyPriority altera seleções do draft', () => {
  const { deps } = createMockDeps();
  const controller = createWeeklyCloseModalController(deps);

  controller.toggleWeeklyPriority('p1', true);
  assert.deepEqual(controller.weeklyCloseController.view().selectedIds, ['p1']);

  controller.toggleWeeklyPriority('p1', false);
  assert.deepEqual(controller.weeklyCloseController.view().selectedIds, []);
});

test('WeeklyCloseModalController — openWeeklyClose navega para seção de metas', () => {
  const { deps } = createMockDeps();
  let activated = '';
  deps.activateTab = tab => {
    activated = tab;
  };

  const controller = createWeeklyCloseModalController(deps);
  controller.openWeeklyClose();
  assert.equal(activated, 'metas');
});
