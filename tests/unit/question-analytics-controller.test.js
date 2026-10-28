import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestionAnalyticsController } from '../../src/ui/tabs/questions/question-analytics-controller.js';

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

test('createQuestionAnalyticsController — renderQuestionAnalytics monta select, resumo e graficos', () => {
  const mockDoc = createMockDocument();
  let performanceSubjectId = 's1';
  let performanceViewMode = 'with-data';

  const controller = createQuestionAnalyticsController({
    document: mockDoc,
    getPerformanceSubjectId: () => performanceSubjectId,
    setPerformanceSubjectId: id => {
      performanceSubjectId = id;
    },
    getPerformanceViewMode: () => performanceViewMode,
    setPerformanceViewMode: mode => {
      performanceViewMode = mode;
    },
    getPerformanceVisible: () => 10,
    getErrorAnalysisView: () => ({ days: 30, topicId: '' }),
    validQuestionRecords: () => [
      { id: 'q1', subjectId: 's1', topicId: 't1', resolved: 20, correct: 16, date: '2026-10-25' },
    ],
    entitySubjectId: item => item.subjectId,
    activeSubjects: () => [{ id: 's1', name: 'Direito' }],
    activeTopics: () => [{ id: 't1', subjectId: 's1', name: 'Contratos' }],
    getSubjectWeeklyTrend: () => [{ resolved: 20, correct: 16, accuracy: 80 }],
    calculateWeightedTrend: () => ({ key: 'up', label: 'Alta' }),
    getSubjectTopicPerformance: () => [
      { id: 't1', name: 'Contratos', resolved: 20, correct: 16, accuracy: 80 },
    ],
    topicMasteryIndex: () => ({ score: 80 }),
    renderQuestionAnalyticsSummary: ({ accuracy, resolved }) =>
      `<div class="summary">${accuracy}% de ${resolved} questoes</div>`,
    renderTopicQuestionPerformance: ({ topics }) =>
      `<div class="bars">${topics.length} topicos</div>`,
    renderWeeklyQuestionTrend: ({ trend }) => `<div class="trend">${trend.label}</div>`,
    buildErrorProfile: () => ({ dominant: null }),
    renderQuestionErrorToolbar: () => '<div class="toolbar">Toolbar</div>',
    buildErrorAnalysisViewModel: () => ({ current: {} }),
    renderErrorAnalysis: () => '<div class="error-profile">Perfil de Erros</div>',
    renderCollectionFooter: () => '',
    formatDatePt: d => d,
    escapeHtml: s => s,
    escapeAttr: s => s,
    addDays: (iso, days) => iso,
    todayISO: () => '2026-10-28',
  });

  controller.renderQuestionAnalytics();

  const select = mockDoc.getElementById('performanceSubjectSelect');
  assert.match(select.innerHTML, /value="s1"/);
  assert.match(select.innerHTML, /selected/);

  const summary = mockDoc.getElementById('questionAnalyticsSummary');
  assert.match(summary.innerHTML, /80% de 20 questoes/);

  const bars = mockDoc.getElementById('topicPerformanceBars');
  assert.match(bars.innerHTML, /1 topicos/);

  const profile = mockDoc.getElementById('subjectErrorProfile');
  assert.match(profile.innerHTML, /Perfil de Erros/);
});
