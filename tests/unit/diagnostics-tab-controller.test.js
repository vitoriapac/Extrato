import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnosticsTabController } from '../../src/ui/tabs/diagnostics/diagnostics-tab-controller.js';

function createMockDocument() {
  const elements = new Map();

  function getOrCreate(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
      });
    }
    return elements.get(id);
  }

  return {
    getElementById: id => getOrCreate(id),
  };
}

test('createDiagnosticsTabController — renderAlertasInteligentes reconcilia e renderiza alertas', () => {
  const mockDoc = createMockDocument();
  let saved = false;

  const state = {
    alertStates: {},
    metas: { semanal: 5 },
  };

  const controller = createDiagnosticsTabController({
    document: mockDoc,
    getState: () => state,
    scheduleSave: () => {
      saved = true;
    },
    todayISO: () => '2026-10-28',
    addDays: (iso, days) => iso,
    startOfWeek: iso => iso,
    formatPlanMinutes: m => `${m}min`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    pluralize: (c, s) => `${c} ${s}`,
    diasParaRevisao: () => 10,
    computeAlertasInteligentes: () => [{ id: 'a1', reason: 'Déficit semanal' }],
    computeApprovalMetrics: () => ({}),
    readinessResult: () => ({}),
    computeRitmo: () => ({}),
    computeStudyPriorities: () => [],
    motivoPrioridade: () => '',
    examScopedTopics: () => [],
    examScopedSubjects: () => [],
    uniqueTopicsCompletedBetween: () => 2,
    buildExecutiveSummary: () => ({ score: 85 }),
    renderExecutiveSummaryView: () => '<div class="summary">Resumo Executivo</div>',
    reconcileAlerts: alerts => ({ visible: alerts, states: { a1: 'active' }, additional: 0 }),
    renderIntelligentAlerts: ({ alerts }) => ({
      list: `<div class="alerts">${alerts.length} alertas</div>`,
      overview: '<div class="overview">Atenção</div>',
    }),
    dismissAlert: (states, id) => ({ ...states, [id]: 'dismissed' }),
    refreshStudyRecommendationItems: () => ({ candidates: [] }),
    examEvidenceContext: () => ({}),
    getStudyPlanPreview: () => null,
    currentAchievementProjection: () => ({ model: {} }),
    buildDiagnosisPageModel: () => ({
      diagnosis: {},
      consolidated: {},
      preparationSignals: { rows: [] },
      nextAction: { id: 'act1' },
      debt: { count: 0 },
    }),
    renderDiagnosisCenterView: () => '<div class="diagnosis-view">Diagnostico</div>',
    renderRecoveryReviewDebt: () => '',
    analyzeFocusAndEnergy: () => ({ fatigueAlert: null }),
    analysisContextBanner: () => '',
    renderNextBestAction: () => '<div class="next-action">Proxima Acao</div>',
    getDailyPriority: () => 'alta',
    renderPreparationSignals: () => '',
    buildDecisionCoherenceReport: () => ({}),
    renderDecisionCoherenceDebug: () => '',
    buildStudyAction: () => null,
    recommendationActionLabel: () => '',
    getCurrentStudyRecommendations: () => [],
    setCurrentConsolidatedDiagnosis: () => {},
    latestStudyPlan: () => null,
    weeklyStrategyCapacity: () => 600,
  });

  controller.renderAlertasInteligentes();

  const container = mockDoc.getElementById('alertasInteligentesList');
  assert.match(container.innerHTML, /1 alertas/);
  assert.equal(saved, true);

  controller.renderExecutiveSummary();
  const summary = mockDoc.getElementById('executiveSummary');
  assert.match(summary.innerHTML, /Resumo Executivo/);

  controller.renderDiagnosisCenter();
  const diag = mockDoc.getElementById('diagnosisCenter');
  assert.match(diag.innerHTML, /Diagnostico/);
  assert.match(diag.innerHTML, /Proxima Acao/);
});
