import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulationsTabController } from '../../src/ui/tabs/questions/simulations-tab-controller.js';

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
    questoes: [],
    simulados: [
      {
        id: 'sim-1',
        date: '2026-01-01',
        nome: 'Simulado 1',
        correct: 40,
        total: 50,
        breakdown: [],
      },
    ],
    subjects: [{ id: 'sub-1', name: 'Português', topics: [{ id: 'top-1', name: 'Ortografia' }] }],
  };

  const simulationService = {
    list: () => state.simulados,
    find: id => state.simulados.find(x => x.id === id),
    create: sim => {
      state.simulados.push(sim);
      return sim;
    },
    remove: id => {
      state.simulados = state.simulados.filter(x => x.id !== id);
    },
    update: (id, patch) => {
      const sim = state.simulados.find(x => x.id === id);
      if (sim) Object.assign(sim, patch);
      return sim;
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

  const context = {
    document: doc,
    state,
    listViewState,
    LIST_VIEW_STEPS,
    simulationService,
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
    activeSubjects: () => state.subjects,
    subjectsForSelection: () => state.subjects,
    topicsForSelection: () => state.subjects[0].topics,
  };

  return { context, state, toasts, confirms, getPersists: () => persists };
}

test('SimulationsTabController - scores with and without breakdown', () => {
  const { doc } = createMockDom();
  const { context } = createBaseContext(doc);
  const controller = createSimulationsTabController(/** @type {any} */ (context));

  // Without breakdown: 40 / 50 = 80%
  const sim = { id: 's', correct: 40, total: 50, breakdown: [] };
  assert.equal(controller.simuladoNota(sim), 80);
  assert.deepEqual(controller.simuladoEffectiveCounts(sim), { correct: 40, total: 50 });

  // With breakdown: Português (15/20) + Matemática (20/30) = 35 / 50 = 70%
  sim.breakdown = [
    { id: 'b1', correct: 15, total: 20 },
    { id: 'b2', correct: 20, total: 30 },
  ];
  assert.equal(controller.simuladoNota(sim), 70);
  assert.deepEqual(controller.simuladoEffectiveCounts(sim), { correct: 35, total: 50 });
});

test('SimulationsTabController - add, edit and delete simulation', () => {
  const { doc } = createMockDom();
  const { context, state, toasts, confirms, getPersists } = createBaseContext(doc);
  const controller = createSimulationsTabController(/** @type {any} */ (context));

  // Add simulation
  const sim = controller.addSimuladoRow();
  assert.equal(state.simulados.length, 2);
  assert.equal(controller.simulationEditController.state.editingId, sim.id);

  // Update draft
  controller.updateSimulationDraft('total', 60);
  controller.updateSimulationDraft('correct', 50);
  controller.saveSimulationEdit();
  assert.equal(getPersists(), 1);
  assert.ok(toasts.some(t => t.includes('Simulado atualizado')));

  // Delete simulation
  controller.deleteSimuladoRow(sim.id);
  assert.equal(confirms.length, 1);
  confirms[0].onConfirm();
  assert.equal(
    state.simulados.some(x => x.id === sim.id),
    false
  );
});

test('SimulationsTabController - breakdown management and limiting', () => {
  const { doc } = createMockDom();
  const { context, state, toasts, getPersists } = createBaseContext(doc);
  const controller = createSimulationsTabController(/** @type {any} */ (context));

  controller.toggleBreakdown('sim-1');
  assert.ok(controller.openBreakdownIds.has('sim-1'));

  controller.addBreakdownRow('sim-1');
  assert.equal(state.simulados[0].breakdown.length, 1);
  const bId = state.simulados[0].breakdown[0].id;

  // Set total = 10, correct = 15 -> should limit correct to 10
  controller.updateBreakdownRow('sim-1', bId, 'total', 10);
  controller.updateBreakdownRow('sim-1', bId, 'correct', 15);
  assert.equal(state.simulados[0].breakdown[0].correct, 10);
  assert.ok(toasts.some(t => t.includes('limitados ao total de questões')));

  controller.deleteBreakdownRow('sim-1', bId);
  assert.equal(state.simulados[0].breakdown.length, 0);
});
