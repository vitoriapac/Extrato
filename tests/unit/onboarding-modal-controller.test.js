import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboardingModalController } from '../../src/features/onboarding/onboarding-modal-controller.js';

function createMockDom() {
  const elements = new Map();
  function makeElement(id, tagName = 'div') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      hidden: false,
      innerHTML: '',
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this.classes.add(c); else this.classes.delete(c);
            return force;
          }
          if (this.classes.has(c)) { this.classes.delete(c); return false; }
          this.classes.add(c); return true;
        },
        contains(c) { return this.classes.has(c); },
      },
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] ?? null; },
      removeAttribute(k) { delete this.attributes[k]; },
      focus() { el.isFocused = true; },
      isFocused: false,
      isConnected: true,
      getClientRects() { return [{ width: 100, height: 20 }]; },
      querySelector(selector) {
        if (selector === '[data-guided-action="next"]') {
          return elements.get('guidedNextBtn') || null;
        }
        if (selector === '[data-guided-action="open"]') {
          return elements.get('guidedOpenBtn') || null;
        }
        if (selector === '[data-guided-manual-return]') {
          return elements.get('guidedManualReturnBtn') || null;
        }
        if (selector === '#guidedActionHint') {
          return elements.get('guidedActionHint') || null;
        }
        return null;
      },
      querySelectorAll() {
        return [];
      },
      after() {},
      append(...items) {
        items.forEach(child => {
          if (child && child.id) elements.set(child.id, child);
        });
      },
      prepend(child) {
        if (child.id) elements.set(child.id, child);
      },
      remove() {
        if (id) elements.delete(id);
      },
    };
    elements.set(id, el);
    return el;
  }

  const document = {
    body: {
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
      },
    },
    activeElement: null,
    getElementById(id) {
      return elements.get(id) || makeElement(id);
    },
    querySelector(selector) {
      if (selector === '#panel-dashboard .overview-now') return makeElement('overviewNow');
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement(tag) {
      return makeElement('elem_' + Math.random(), tag);
    },
  };

  return { document, elements, makeElement };
}

test('onboardingModalController: navegação de passos e abertura/fechamento', async () => {
  const { document } = createMockDom();

  let saved = false;
  let toasted = '';
  const state = {
    examDate: '2026-12-01',
    metas: { horasPorDia: { '1': 2, '2': 2 } },
    subjects: [
      {
        id: 'sub-1',
        name: 'Direito Constitucional',
        archived: false,
        topics: [
          { id: 'top-1', name: 'Direitos Fundamentais', archived: false, difficulty: 'Médio', estimatedStudyMinutes: 60 },
        ],
      },
    ],
    studySessions: [],
    questoes: [],
    dailyPlans: [],
    studyPlans: [],
  };

  const uiState = {
    onboarding: {
      open: false,
      currentStep: 'exam',
      presetId: 'custom',
      manualReturn: false,
      dismissedForSession: false,
      previousFocus: null,
    },
  };

  const updatedTopics = [];
  const controller = createOnboardingModalController({
    document,
    getState: () => state,
    getUiState: () => uiState,
    isDemoMode: () => false,
    ensureExamCatalog: async () => {},
    showToast: msg => { toasted = msg; },
    escapeHtml: s => String(s),
    escapeAttr: s => String(s),
    formatPlanMinutes: m => `${m} min`,
    todayISO: () => '2026-10-28',
    examPresets: [],
    difficultyOptions: ['Fácil', 'Médio', 'Difícil'],
    subjectService: {
      updateTopic: (sId, tId, payload) => {
        updatedTopics.push({ sId, tId, payload });
      },
    },
    getSubjectById: id => state.subjects.find(s => s.id === id),
    activeSubjects: () => state.subjects.filter(s => !s.archived),
    scheduleSave: () => { saved = true; },
    persistAndRender: () => { saved = true; },
    buildStudyPlanProposal: () => null,
    calculateStudyPlanPreview: () => {},
    getStudyPlanPreview: () => null,
    confirmStudyPlan: () => {},
    calculateDailyPlanPreview: () => {},
    getDailyPlanPreview: () => null,
    confirmDailyPlanPreview: () => {},
    render: () => {},
    activateTab: () => {},
    syncModalShell: () => {},
    requestFrame: cb => cb(),
  });

  // Abre onboarding
  await controller.openGuidedOnboarding();
  assert.equal(uiState.onboarding.open, true);
  assert.ok(document.body.classList.classes.has('onboarding-open'));

  // Move onboarding
  controller.moveOnboarding(1);
  assert.ok(uiState.onboarding.currentStep);

  // Fecha onboarding
  controller.closeGuidedOnboarding({ manual: true });
  assert.equal(uiState.onboarding.open, false);
  assert.equal(uiState.onboarding.manualReturn, true);
  assert.equal(document.body.classList.classes.has('onboarding-open'), false);
});

test('onboardingModalController: setGuidedSubjectLevel atualiza tópicos com tempo estimado', () => {
  const { document } = createMockDom();
  const state = {
    examDate: '2026-12-01',
    metas: { horasPorDia: { '1': 2 } },
    subjects: [
      {
        id: 'sub-1',
        name: 'Português',
        archived: false,
        topics: [
          { id: 'top-1', name: 'Sintaxe', archived: false, difficulty: 'Médio', estimatedStudyMinutes: 60 },
          { id: 'top-2', name: 'Morfologia', archived: false, difficulty: 'Médio', estimatedStudyMinutes: null },
        ],
      },
    ],
  };

  const uiState = { onboarding: { open: true, currentStep: 'levels' } };
  const updated = [];

  const controller = createOnboardingModalController({
    document,
    getState: () => state,
    getUiState: () => uiState,
    isDemoMode: () => false,
    ensureExamCatalog: async () => {},
    showToast: () => {},
    escapeHtml: s => s,
    escapeAttr: s => s,
    formatPlanMinutes: m => `${m}m`,
    todayISO: () => '2026-10-28',
    examPresets: [],
    difficultyOptions: ['Fácil', 'Médio', 'Difícil'],
    subjectService: {
      updateTopic: (sId, tId, payload) => {
        updated.push({ sId, tId, payload });
      },
    },
    getSubjectById: id => state.subjects.find(s => s.id === id),
    activeSubjects: () => state.subjects,
    scheduleSave: () => {},
    persistAndRender: () => {},
    buildStudyPlanProposal: () => null,
    calculateStudyPlanPreview: () => {},
    getStudyPlanPreview: () => null,
    confirmStudyPlan: () => {},
    calculateDailyPlanPreview: () => {},
    getDailyPlanPreview: () => null,
    confirmDailyPlanPreview: () => {},
    render: () => {},
    activateTab: () => {},
    syncModalShell: () => {},
  });

  controller.setGuidedSubjectLevel('sub-1', 'Difícil', { refresh: false });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].payload.difficulty, 'Difícil');
  assert.equal(updated[1].payload.difficulty, 'Difícil');
  assert.equal(updated[1].payload.estimatedStudyMinutes, 120); // Difícil = 120min padrão
});

test('onboardingModalController: Escape fecha o modal de onboarding', () => {
  const { document } = createMockDom();
  const state = { examDate: null, metas: { horasPorDia: {} }, subjects: [] };
  const uiState = { onboarding: { open: true, currentStep: 'exam' } };

  const controller = createOnboardingModalController({
    document,
    getState: () => state,
    getUiState: () => uiState,
    isDemoMode: () => false,
    ensureExamCatalog: async () => {},
    showToast: () => {},
    escapeHtml: s => s,
    escapeAttr: s => s,
    formatPlanMinutes: m => `${m}m`,
    todayISO: () => '2026-10-28',
    examPresets: [],
    difficultyOptions: ['Fácil', 'Médio', 'Difícil'],
    subjectService: { updateTopic: () => {} },
    getSubjectById: () => null,
    activeSubjects: () => [],
    scheduleSave: () => {},
    persistAndRender: () => {},
    buildStudyPlanProposal: () => null,
    calculateStudyPlanPreview: () => {},
    getStudyPlanPreview: () => null,
    confirmStudyPlan: () => {},
    calculateDailyPlanPreview: () => {},
    getDailyPlanPreview: () => null,
    confirmDailyPlanPreview: () => {},
    render: () => {},
    activateTab: () => {},
    syncModalShell: () => {},
  });

  let prevented = false;
  controller.handleOverlayKeydown({
    key: 'Escape',
    preventDefault: () => { prevented = true; },
  });

  assert.equal(prevented, true);
  assert.equal(uiState.onboarding.open, false);
});
