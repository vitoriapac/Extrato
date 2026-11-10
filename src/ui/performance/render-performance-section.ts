import { renderPerformanceOverview } from './performance-overview-renderer.js';
import { renderPerformanceQuestions } from './performance-questions-renderer.js';
import { renderPerformanceSimulations } from './performance-simulations-renderer.js';
import { renderPerformanceSubjects } from './performance-subjects-renderer.js';
import { renderPerformanceConsistency } from './performance-consistency-renderer.js';

export function renderPerformanceSection(
  pageModel: Record<string, any>,
  { range, today, activeExamTags, formatDate, escapeHtml, escapeAttr, targetScore }: any = {}
) {
  switch (pageModel.section) {
    case 'overview':
      return renderPerformanceOverview(pageModel.model, {
        range,
        today,
        activeExamTags,
        formatDate,
        escapeHtml,
        escapeAttr,
        weeklyBrief: pageModel.weeklyBrief,
        preparationReading: pageModel.preparationReading,
        comparisonModel: pageModel.comparisonModel,
        readinessChange: pageModel.readinessChange,
        achievementProjection: pageModel.achievementProjection,
        achievementHistory: pageModel.achievementHistory,
        achievementCapacityMinutes: pageModel.achievementCapacityMinutes,
        adherenceContext: pageModel.adherenceContext,
        recoveryPlan: pageModel.recoveryPlan,
      });
    case 'questions':
      return renderPerformanceQuestions({ ...pageModel, range, formatDate, escapeHtml });
    case 'simulations':
      return renderPerformanceSimulations(pageModel.model, {
        range,
        targetScore,
        formatDate,
        escapeHtml,
      });
    case 'subjects':
      return renderPerformanceSubjects(pageModel.model, {
        range,
        formatDate,
        escapeHtml,
        escapeAttr,
        topicDetail: pageModel.detail,
        comparison: pageModel.comparison,
        stabilityMap: pageModel.stabilityMap,
        pedagogicalMatrix: pageModel.pedagogicalMatrix,
      });
    case 'consistency':
      return `${renderPerformanceConsistency(pageModel.model, { range, formatDate, escapeHtml })}<div id="performanceConsistencyMuralMount" class="mt-4"></div><div id="performanceCareerBenchmarkMount" class="mt-4"></div>`;
    case 'diagnosis':
      return '<div id="performanceDiagnosisMount" class="space-y-4"></div>';
    case 'history':
      return '<p class="analytics-note">Conquistas, tempo de estudo e o histórico de sessões consolidados. Esses registros preservam sua memória de estudo e não alteram o cálculo de risco.</p><div id="performanceHistorySupplementalMount" class="performance-history-supplemental space-y-4 mt-3"></div>';
    default:
      return '';
  }
}
