import test from 'node:test';
import assert from 'node:assert/strict';
import { wireAppDependencies } from '../../src/bootstrap/wire-dependencies.js';

function createMockState() {
  return {
    subjects: [],
    studySessions: [],
    questoes: [],
    simulados: [],
    calendar: [],
    dailyPlans: [],
    studyPlans: [],
    recommendationFeedback: [],
    topicHistory: [],
    metasPorDisciplina: [],
    planningCapacityHistory: [],
    metas: {
      horasPorDia: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4 },
    },
    settings: {},
    examBlueprint: { activeExamTags: ['tag1'] },
    algorithmVersions: {
      adaptiveReview: 'v2',
      recommendations: 'v3',
    },
  };
}

function createBaseOptions(state = createMockState()) {
  const localStore = new Map();
  let idCounter = 1;

  return {
    dbName: 'test-db',
    dbVersion: 1,
    storeName: 'test-store',
    storageKey: 'test-storage-key',
    demoStorageKey: 'test-demo-key',
    isDemoMode: false,
    getState: () => state,
    clock: {
      today: () => '2026-10-28',
      nowISO: () => '2026-10-28T12:00:00.000Z',
    },
    idGenerator: prefix => `${prefix || 'id'}-${idCounter++}`,
    readLocal: key => localStore.get(key) || null,
    writeLocal: (key, val) => {
      localStore.set(key, val);
      return true;
    },
    removeLocal: key => localStore.delete(key),
    getTopicById: id => null,
    evidenceScopeForTopic: id => ({ scope: id }),
    applyAdaptiveReviewRating: (current, rating) => ({ current, rating }),
    addHistoryEvent: () => {},
    entitySubjectId: entity => entity.subjectId || null,
    refreshTopicReviewStats: () => {},
    buildStudyPlan: () => ({ plan: true }),
    buildDailyPlanProposal: () => ({ proposal: true }),
    applyDailyPlanProposal: () => {},
    undoDailyPlanGeneration: () => {},
    buildReplanProposal: () => ({ replan: true }),
    applyReplan: () => {},
    undoReplan: () => {},
    normalizeErrorBreakdown: item => item,
    completeRecommendationFeedback: () => {},
    measureRecommendationResults: () => {},
    currentStudyRecommendations: () => [],
    parseLocalDate: str => new Date(str),
    allTopics: () => [],
    normalizeTopicStrategy: t => t,
    captureReadinessBeforeStrategy: () => {},
    invalidatePlanPreview: () => {},
    persistAndRender: () => {},
    renderSubjects: () => {},
    showToast: () => {},
    timestampToLocalDateISO: ts => '2026-10-28',
  };
}

test('wireAppDependencies — instancia todos os serviços e repositórios em modo padrão', () => {
  const state = createMockState();
  const options = createBaseOptions(state);

  const deps = wireAppDependencies(options);

  assert.ok(deps.persistentStorageManager);
  assert.ok(deps.realStorageProvider);
  assert.equal(deps.demoStorageProvider, null);
  assert.ok(deps.appContext);
  assert.ok(deps.planningRepository);
  assert.ok(deps.reviewService);
  assert.ok(deps.studyPlanService);
  assert.ok(deps.dailyPlanService);
  assert.ok(deps.replanService);
  assert.ok(deps.sessionService);
  assert.ok(deps.guidedStudyService);
  assert.ok(deps.calendarService);
  assert.ok(deps.questionService);
  assert.ok(deps.simulationService);
  assert.ok(deps.subjectGoalService);
  assert.ok(deps.goalsService);
  assert.ok(deps.subjectService);
  assert.ok(deps.topicStrategyController);
  assert.ok(deps.topicHistoryService);
  assert.equal(typeof deps.observePlanningCapacity, 'function');
  assert.equal(deps.storageManager, deps.appContext.storage);
});

test('wireAppDependencies — instancia demoStorageProvider quando isDemoMode é true', () => {
  const state = createMockState();
  const sessionMap = new Map();
  const mockSessionStorage = {
    getItem: k => sessionMap.get(k) || null,
    setItem: (k, v) => sessionMap.set(k, String(v)),
    removeItem: k => sessionMap.delete(k),
  };

  const options = {
    ...createBaseOptions(state),
    isDemoMode: true,
    sessionStorage: mockSessionStorage,
    generateDemoData: () => ({ demo: true }),
  };

  const deps = wireAppDependencies(options);

  assert.ok(deps.demoStorageProvider);
  assert.equal(deps.appContext.storage, deps.demoStorageProvider);
});

test('wireAppDependencies — observePlanningCapacity adiciona registro ao histórico de capacidade', () => {
  const state = createMockState();
  const options = createBaseOptions(state);

  const deps = wireAppDependencies(options);

  assert.equal(state.planningCapacityHistory.length, 0);
  deps.observePlanningCapacity('edited');
  assert.equal(state.planningCapacityHistory.length, 1);
  assert.equal(state.planningCapacityHistory[0].source, 'edited');
  assert.equal(state.planningCapacityHistory[0].effectiveDate, '2026-10-28');
  assert.deepEqual(state.planningCapacityHistory[0].hoursByDay, state.metas.horasPorDia);
});

test('wireAppDependencies — repositórios manipulam as coleções do estado corretamente', () => {
  const state = createMockState();
  const options = createBaseOptions(state);

  const deps = wireAppDependencies(options);

  deps.appContext.repositories.questoes.add({ id: 'q-1', resolved: 10, correct: 8 });
  assert.equal(state.questoes.length, 1);
  assert.equal(state.questoes[0].id, 'q-1');

  const found = deps.appContext.repositories.questoes.findById('q-1');
  assert.equal(found?.id, 'q-1');
  assert.equal(found?.correct, 8);
});
