import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQuestionsTabController,
  calcAcertoPct,
  cloneRecord,
} from '../../src/ui/tabs/questions/questions-tab-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        hidden: false,
        disabled: false,
        value: '',
        dataset: {},
        classList: {
          classes: new Set(),
          add: c => elements.get(id).classList.classes.add(c),
          remove: c => elements.get(id).classList.classes.delete(c),
          contains: c => elements.get(id).classList.classes.has(c),
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        focus: () => {},
      });
    }
    return elements.get(id);
  }

  const doc = {
    getElementById: id => getElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    activeElement: null,
  };

  return { doc, elements };
}

function createBaseContext(doc) {
  let toasts = [];
  let confirms = [];
  let persists = 0;

  const state = {
    questoes: [
      {
        id: 'q-1',
        date: '2026-01-01',
        subjectId: 'sub-1',
        topicId: 'top-1',
        resolved: 10,
        correct: 7,
        errorBreakdown: { interpretacao: 2, atencao: 1, lacuna: 0, tempo: 0 },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    simulados: [],
    subjects: [{ id: 'sub-1', name: 'Português', topics: [{ id: 'top-1', name: 'Ortografia' }] }],
  };

  const questionService = {
    list: () => state.questoes,
    find: id => state.questoes.find(x => x.id === id),
    create: q => {
      state.questoes.push(q);
      return q;
    },
    remove: id => {
      state.questoes = state.questoes.filter(x => x.id !== id);
    },
    update: (id, patch) => {
      const q = state.questoes.find(x => x.id === id);
      if (q) Object.assign(q, patch);
      return q;
    },
  };

  const listViewState = {
    questionsVisible: 10,
    simulationsVisible: 10,
  };

  const LIST_VIEW_STEPS = {
    questions: 10,
    simulations: 10,
  };

  const errorCategories = {
    interpretacao: { icon: '📖', label: 'Interpretação' },
    atencao: { icon: '⚠️', label: 'Atenção' },
    lacuna: { icon: '❓', label: 'Lacuna' },
    tempo: { icon: '⏱️', label: 'Tempo' },
  };

  const context = {
    document: doc,
    state,
    listViewState,
    LIST_VIEW_STEPS,
    questionService,
    errorCategories,
    persistAndRender: () => {
      persists++;
    },
    showToast: msg => {
      toasts.push(msg);
    },
    showConfirm: (msg, onConfirm) => {
      confirms.push({ msg, onConfirm });
    },
    formatDatePt: d => d,
    getSubjectName: id => 'Português',
    getTopicName: id => 'Ortografia',
    activeSubjects: () => state.subjects,
    subjectsForSelection: () => state.subjects,
    topicsForSelection: () => state.subjects[0].topics,
  };

  return { context, state, toasts, confirms, getPersists: () => persists };
}

test('calcAcertoPct - calculates percentage correctly', () => {
  assert.equal(calcAcertoPct(8, 10), 80);
  assert.equal(calcAcertoPct(1, 3), 33.3);
  assert.equal(calcAcertoPct(0, 0), 0);
  assert.equal(calcAcertoPct(5, -1), 0);
});

test('QuestionsTabController - add, edit and delete question', () => {
  const { doc } = createMockDom();
  const { context, state, toasts, confirms, getPersists } = createBaseContext(doc);
  const controller = createQuestionsTabController(/** @type {any} */ (context));

  // Add question
  const q = controller.addQuestaoRow();
  assert.equal(state.questoes.length, 2);
  assert.equal(controller.questionEditController.state.editingId, q.id);

  // Update draft
  controller.updateQuestionDraft('resolved', 20);
  controller.updateQuestionDraft('correct', 15);
  controller.saveQuestionEdit();
  assert.equal(getPersists(), 1);
  assert.ok(toasts.some(t => t.includes('Registro atualizado')));

  // Delete question
  controller.deleteQuestaoRow(q.id);
  assert.equal(confirms.length, 1);
  confirms[0].onConfirm();
  assert.equal(state.questoes.some(x => x.id === q.id), false);
});

test('QuestionsTabController - error breakdown normalization and limiting', () => {
  const { doc } = createMockDom();
  const { context, state, toasts } = createBaseContext(doc);
  const controller = createQuestionsTabController(/** @type {any} */ (context));

  // q-1 has 10 resolved, 7 correct => 3 real errors.
  // currently: interpretacao: 2, atencao: 1 (sum = 3).
  // Attempt to add 5 to lacuna -> should be limited to 0 (since 2 + 1 = 3 already allocated)
  controller.updateQuestionError('q-1', 'lacuna', 5);
  assert.equal(state.questoes[0].errorBreakdown.lacuna, 0);
  assert.ok(toasts.some(t => t.includes('limitada ao total real de erros')));

  // Toggle question error expansion
  controller.toggleQuestionErrors('q-1');
  assert.ok(controller.openQuestionErrorIds.has('q-1'));
  controller.toggleQuestionErrors('q-1');
  assert.equal(controller.openQuestionErrorIds.has('q-1'), false);
});
