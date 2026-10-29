import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyRecommendationController } from '../../src/ui/tabs/today/study-recommendation-controller.js';

function createMockDom() {
  const elements = new Map();
  function makeElement(id) {
    const el = {
      id,
      innerHTML: '',
      replaceChildren() { this.innerHTML = ''; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    };
    elements.set(id, el);
    return el;
  }
  return {
    document: {
      getElementById(id) {
        // Retorna null para overviewNextAction para evitar mount Preact em ambiente puro de Node
        if (id === 'overviewNextAction') return null;
        return elements.get(id) || makeElement(id);
      },
    },
    elements,
  };
}

test('studyRecommendationController: refreshStudyRecommendationItems calcula recomendações', () => {
  const { document } = createMockDom();
  let saved = false;
  const state = {
    examBlueprint: { activeExamTags: [] },
    recommendationHistory: [],
    recommendationFeedback: [],
    dailyPlans: [],
    studyPlans: [],
    studySessions: [],
    planAdjustments: [],
    activeTimer: {},
    algorithmVersions: { recommendations: 1 },
  };

  const candidates = [
    {
      id: 'cand-1',
      subjectId: 'sub-1',
      topicId: 'top-1',
      subjectName: 'Direito Administrativo',
      topicName: 'Atos Administrativos',
      examImpact: 85,
      masteryGap: 60,
      estimatedMinutes: 45,
      blockedPrerequisites: [],
      archived: false,
      completed: false,
      covered: false,
      action: 'Estudar tópicos críticos',
      reasons: ['Alta incidência', 'Baixo acerto recente'],
      studyType: 'study',
    },
  ];

  const controller = createStudyRecommendationController({
    document,
    getState: () => state,
    metaHoursToday: () => 2,
    intelligenceCandidates: () => candidates,
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T10:00:00Z',
    uid: (p = 'id') => `${p}_mock`,
    localDateISO: () => '2026-10-28',
    formatPlanMinutes: m => `${m} min`,
    formatDatePt: d => d,
    escapeHtml: s => String(s),
    escapeAttr: s => String(s),
    pluralize: (n, s) => `${n} ${s}`,
    showToast: () => {},
    showPrompt: () => {},
    scheduleSave: () => { saved = true; },
    renderRecommendationHistorySummary: () => {},
    getTopicName: () => 'Tópico',
    getSubjectName: () => 'Disciplina',
    getTopicById: () => null,
    getTopicPerformance: () => ({ accuracy: 70, resolved: 20 }),
    needsMaintenance: () => false,
    activeTopics: () => [],
    dailyExecutionController: { build: () => ({ priority: null }) },
    hasStartedStudyTimer: () => false,
    activeTimerMatchesRecommendation: () => false,
    renderActiveStudyTimerNotice: () => '',
    openStudyTimerFocus: () => {},
    topicResumeLabel: () => '',
    guidedStudyService: { next: () => {}, start: () => {} },
    todayDailyStudyPlan: () => null,
    freezePlanExecution: () => {},
    startPlannedActivity: () => {},
    addQuestaoRow: () => ({ id: 'q1' }),
    activateTab: () => {},
    reviewService: { createManualReview: () => ({ id: 'rev1' }) },
    completeAgendaReview: () => {},
    validQuestionRecords: () => [],
    renderFinalStretchBanner: () => {},
    renderAlertasInteligentes: () => {},
    renderPlanoHoje: () => {},
    replanService: { calculate: () => null },
    planningRepository: {},
    metaHoursForDate: () => 2,
    startOfWeek: () => '2026-10-26',
    addDays: (iso, n) => {
      const d = new Date(iso + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    },
    diasParaRevisao: () => 30,
    localDateFromTimestamp: () => '2026-10-28',
  });

  const { availableMinutes, candidates: returnedCandidates } = controller.refreshStudyRecommendationItems({
    recordHistory: true,
  });

  assert.equal(availableMinutes, 120);
  assert.equal(returnedCandidates.length, 1);
  const current = controller.getCurrentRecommendations();
  assert.ok(Array.isArray(current));
  assert.ok(current.length > 0);
  assert.equal(current[0].topicId, 'top-1');
  assert.equal(saved, true);
});

test('studyRecommendationController: markRecommendationNotUseful descarta e salva', () => {
  const { document } = createMockDom();
  let saved = false;
  const state = {
    examBlueprint: { activeExamTags: [] },
    recommendationHistory: [],
    recommendationFeedback: [],
    dailyPlans: [],
    studyPlans: [],
    studySessions: [],
    planAdjustments: [],
    activeTimer: {},
    algorithmVersions: { recommendations: 1 },
  };

  const controller = createStudyRecommendationController({
    document,
    getState: () => state,
    metaHoursToday: () => 1,
    intelligenceCandidates: () => [],
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T10:00:00Z',
    uid: (p = 'id') => `${p}_mock`,
    localDateISO: () => '2026-10-28',
    formatPlanMinutes: m => `${m} min`,
    formatDatePt: d => d,
    escapeHtml: s => String(s),
    escapeAttr: s => String(s),
    pluralize: (n, s) => `${n} ${s}`,
    showToast: () => {},
    showPrompt: () => {},
    scheduleSave: () => { saved = true; },
    renderRecommendationHistorySummary: () => {},
    getTopicName: () => 'Tópico',
    getSubjectName: () => 'Disciplina',
    getTopicById: () => null,
    getTopicPerformance: () => ({ accuracy: 60, resolved: 10 }),
    needsMaintenance: () => false,
    activeTopics: () => [],
    dailyExecutionController: { build: () => ({ priority: null }) },
    hasStartedStudyTimer: () => false,
    activeTimerMatchesRecommendation: () => false,
    renderActiveStudyTimerNotice: () => '',
    openStudyTimerFocus: () => {},
    topicResumeLabel: () => '',
    guidedStudyService: { next: () => {}, start: () => {} },
    todayDailyStudyPlan: () => null,
    freezePlanExecution: () => {},
    startPlannedActivity: () => {},
    addQuestaoRow: () => ({ id: 'q1' }),
    activateTab: () => {},
    reviewService: { createManualReview: () => ({ id: 'rev1' }) },
    completeAgendaReview: () => {},
    validQuestionRecords: () => [],
    renderFinalStretchBanner: () => {},
    renderAlertasInteligentes: () => {},
    renderPlanoHoje: () => {},
    replanService: { calculate: () => null },
    planningRepository: {},
    metaHoursForDate: () => 1,
    startOfWeek: () => '2026-10-26',
    addDays: (iso, n) => {
      const d = new Date(iso + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    },
    diasParaRevisao: () => null,
    localDateFromTimestamp: () => '2026-10-28',
  });

  controller.setCurrentRecommendations([
    {
      id: 'rec-1',
      recommendationId: 'rec-1',
      topicId: 'top-1',
      subjectId: 'sub-1',
      mastery: 50,
      score: 70,
    },
  ]);

  controller.markRecommendationNotUseful('rec-1');
  assert.ok(controller.getDismissedRecommendationIds().has('rec-1'));
  assert.equal(saved, true);
  assert.equal(state.recommendationFeedback.length, 1);
  assert.equal(state.recommendationFeedback[0].useful, false);
});

test('studyRecommendationController: replanController integra calculate, clear e confirm', () => {
  const { document } = createMockDom();
  let replanCalculated = false;
  let replanCleared = false;
  let replanConfirmed = false;

  const fakeReplanService = {
    calculate() {
      replanCalculated = true;
      return { state: 'proposal', allocations: [{ id: 'a1' }], createdItems: 1 };
    },
    confirm() {
      replanConfirmed = true;
      return { createdItems: 1 };
    },
  };

  const state = { planAdjustments: [], dailyPlans: [] };

  const controller = createStudyRecommendationController({
    document,
    getState: () => state,
    metaHoursToday: () => 2,
    intelligenceCandidates: () => [],
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T10:00:00Z',
    uid: () => 'id1',
    localDateISO: () => '2026-10-28',
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
    escapeHtml: s => s,
    escapeAttr: s => s,
    pluralize: (n, s) => `${n} ${s}`,
    showToast: () => {},
    showPrompt: () => {},
    scheduleSave: () => {},
    renderRecommendationHistorySummary: () => {},
    getTopicName: () => '',
    getSubjectName: () => '',
    getTopicById: () => null,
    getTopicPerformance: () => ({ accuracy: 0, resolved: 0 }),
    needsMaintenance: () => false,
    activeTopics: () => [],
    dailyExecutionController: { build: () => ({ priority: null }) },
    hasStartedStudyTimer: () => false,
    activeTimerMatchesRecommendation: () => false,
    renderActiveStudyTimerNotice: () => '',
    openStudyTimerFocus: () => {},
    topicResumeLabel: () => '',
    guidedStudyService: { next: () => {}, start: () => {} },
    todayDailyStudyPlan: () => null,
    freezePlanExecution: () => {},
    startPlannedActivity: () => {},
    addQuestaoRow: () => ({ id: 'q' }),
    activateTab: () => {},
    reviewService: { createManualReview: () => ({ id: 'r' }) },
    completeAgendaReview: () => {},
    validQuestionRecords: () => [],
    renderFinalStretchBanner: () => {},
    renderAlertasInteligentes: () => {},
    renderPlanoHoje: () => {},
    replanService: fakeReplanService,
    planningRepository: {
      getDailyPlans: () => [],
      getAdjustments: () => [],
      saveAdjustments: () => {},
      saveDailyPlans: () => {},
    },
    metaHoursForDate: () => 2,
    startOfWeek: () => '2026-10-26',
    addDays: (iso, n) => {
      const d = new Date(iso + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    },
    diasParaRevisao: () => null,
    localDateFromTimestamp: () => '2026-10-28',
  });

  controller.calculateReplanPreview();
  assert.equal(replanCalculated, true);

  controller.clearReplanPreview();
  assert.equal(controller.replanController.view(), null);

  // Recalcula proposta antes de confirmar
  controller.calculateReplanPreview();
  controller.confirmReplan();
  assert.equal(replanConfirmed, true);
});
