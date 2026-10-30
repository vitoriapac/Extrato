import test from 'node:test';
import assert from 'node:assert/strict';
import { createApprovalTabController } from '../../src/ui/tabs/approval/approval-tab-controller.js';

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

test('createApprovalTabController — renderApprovalDashboard monta visão geral e histórico', () => {
  const mockDoc = createMockDocument();
  let insightsRendered = false;
  let saved = false;

  const state = {
    projectionSnapshots: [],
    readinessSnapshots: [],
    subjects: [{ id: 's1', name: 'Direito' }],
    recommendationFeedback: [],
    recommendationHistory: [],
    studySessions: [],
    examBlueprint: { activeExamTags: [] },
  };

  const controller = createApprovalTabController({
    document: mockDoc,
    getState: () => state,
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T10:00:00Z',
    uid: prefix => `${prefix}-1`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    formatDatePt: d => d,
    formatPlanMinutes: m => `${m}min`,
    scheduleSave: () => {
      saved = true;
    },
    computeApprovalMetrics: () => ({
      edital: 50,
      dominio: 60,
      retencao: 70,
      consistencia: 80,
      simulados: 75,
    }),
    readinessResult: () => ({
      value: 68,
      confidence: 0.8,
      confidenceLabel: 'Alta',
      state: 'ready',
    }),
    classifyApprovalScore: () => ({ label: 'Competitivo', level: 'good' }),
    projectPerformance: () => ({ calibration: {} }),
    examScopedSimulations: () => [],
    simuladoEffectiveCounts: () => ({}),
    entitySubjectId: () => null,
    currentAchievementProjection: () => ({ model: {} }),
    intelligenceCandidates: () => [],
    activeTopics: () => [],
    activeSubjects: () => [{ id: 's1', name: 'Direito' }],
    allTopics: () => [],
    renderCollectionFooter: () => '',
    renderReadinessOverview: model => `<div class="readiness">Score: ${model.score}</div>`,
    renderReadinessHistory: () => '<div class="history">Histórico</div>',
    renderTopicRetentionDashboardView: () => '<div class="retention">Retenção</div>',
    captureProjection: () => true,
    captureAchievementProjection: () => true,
    buildProjectionCalibration: () => ({}),
    getMetricDataState: () => 'ok',
    metricStateLabel: () => 'OK',
    gerarDiagnosticoAprovacao: () => ['Diagnóstico 1'],
    buildRecommendationCalibration: () => ({}),
    renderRecommendationCalibrationModel: () => '<div class="calib">Calibração</div>',
    buildRecommendationOutcomeAudit: () => ({}),
    renderRecommendationOutcomeAudit: () => '',
    buildRecommendationFollowup: () => ({}),
    renderRecommendationFollowup: () => '',
    summarizeRecommendationHistory: () => ({}),
    renderRecommendationHistory: () => '',
    topicRetentionScore: () => ({
      available: true,
      value: 80,
      confidence: 0.9,
      confidenceLabel: 'Alta',
    }),
    topicReviewHealthScore: () => ({ score: 85 }),
    topicMasteryIndex: () => ({ score: 90, confidence: 1 }),
    onRenderStudyTrack32Insights: () => {
      insightsRendered = true;
    },
    getRetentionView: () => ({ subjectId: '', confidence: 'all', order: 'desc' }),
    isRetentionShowAll: () => false,
  });

  controller.renderApprovalDashboard();

  assert.match(mockDoc.getElementById('approvalDashboard').innerHTML, /Score: 68/);
  assert.match(mockDoc.getElementById('readinessHistoryDashboard').innerHTML, /Histórico/);
  assert.match(mockDoc.getElementById('topicRetentionDashboard').innerHTML, /Retenção/);
  assert.match(mockDoc.getElementById('recommendationCalibration').innerHTML, /Calibração/);
  assert.equal(insightsRendered, true);
  assert.equal(saved, true);
});
