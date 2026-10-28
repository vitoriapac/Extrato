import { accuracyFromCounts } from '../../../domain/analytics/topic-performance.js';

export interface QuestionAnalyticsControllerOptions {
  document: any;
  getPerformanceSubjectId: () => string | null;
  setPerformanceSubjectId: (id: string | null) => void;
  getPerformanceViewMode: () => string;
  setPerformanceViewMode: (mode: string) => void;
  getPerformanceVisible: () => number;
  getErrorAnalysisView: () => { days: number; topicId: string };
  validQuestionRecords: () => Array<any>;
  entitySubjectId: (item: any) => string | null;
  activeSubjects: () => Array<any>;
  activeTopics: () => Array<any>;
  getSubjectWeeklyTrend: (subjectId: string) => Array<any>;
  calculateWeightedTrend: (weekly: Array<any>) => any;
  getSubjectTopicPerformance: (subjectId: string) => Array<any>;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  renderQuestionAnalyticsSummary: (opts: any) => string;
  renderTopicQuestionPerformance: (opts: any) => string;
  renderWeeklyQuestionTrend: (opts: any) => string;
  buildErrorProfile: (records: any[]) => any;
  renderQuestionErrorToolbar: (opts: any) => string;
  buildErrorAnalysisViewModel: (opts: any) => any;
  renderErrorAnalysis: (model: any, opts: any) => string;
  renderCollectionFooter: (opts: any) => string;
  formatDatePt: (iso: string) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  addDays: (iso: string, days: number) => string;
  todayISO: () => string;
}

export function createQuestionAnalyticsController(opts: QuestionAnalyticsControllerOptions) {
  function renderQuestionAnalytics(): void {
    const select = opts.document.getElementById('performanceSubjectSelect');
    if (!select) return;

    const subjects = opts.activeSubjects();
    let currentSubjectId = opts.getPerformanceSubjectId();

    if (!subjects.some(subject => subject.id === currentSubjectId)) {
      currentSubjectId =
        subjects.find(subject =>
          opts.validQuestionRecords().some(question => opts.entitySubjectId(question) === subject.id)
        )?.id ||
        subjects[0]?.id ||
        null;
      opts.setPerformanceSubjectId(currentSubjectId);
    }

    select.innerHTML = subjects
      .map(
        subject =>
          `<option value="${opts.escapeAttr(subject.id)}" ${subject.id === currentSubjectId ? 'selected' : ''}>${opts.escapeHtml(subject.name)}</option>`
      )
      .join('');

    const summary = opts.document.getElementById('questionAnalyticsSummary');
    const bars = opts.document.getElementById('topicPerformanceBars');
    const weeklyEl = opts.document.getElementById('subjectWeeklyTrend');
    const profileEl = opts.document.getElementById('subjectErrorProfile');
    const coverageEl = opts.document.getElementById('questionDataCoverage');

    if (!currentSubjectId) {
      if (summary) summary.innerHTML = '';
      const emptyHtml =
        '<div class="empty-state"><p>Cadastre uma disciplina para iniciar a análise.</p></div>';
      if (bars) bars.innerHTML = emptyHtml;
      if (weeklyEl) weeklyEl.innerHTML = emptyHtml;
      if (profileEl) profileEl.innerHTML = emptyHtml;
      if (coverageEl) coverageEl.textContent = '0% identificadas';
      return;
    }

    const records = opts.validQuestionRecords().filter(
      question => opts.entitySubjectId(question) === currentSubjectId
    );
    const resolved = records.reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
    const correct = records.reduce((sum, q) => sum + (Number(q.correct) || 0), 0);
    const identified = records
      .filter(q => q.topicId)
      .reduce((sum, q) => sum + (Number(q.resolved) || 0), 0);
    const coverage = resolved ? Math.round((identified / resolved) * 100) : 0;
    const accuracy = accuracyFromCounts(correct, resolved);
    const weekly = opts.getSubjectWeeklyTrend(currentSubjectId);
    const trend = opts.calculateWeightedTrend(weekly);

    if (coverageEl) coverageEl.textContent = `${coverage}% identificadas`;
    if (summary) {
      summary.innerHTML = opts.renderQuestionAnalyticsSummary({ resolved, accuracy, coverage, trend });
    }

    const topicPerformance = opts.getSubjectTopicPerformance(currentSubjectId);
    const mature = topicPerformance.filter(topic => topic.resolved >= 30);
    const insufficient = topicPerformance.filter(topic => topic.resolved > 0 && topic.resolved < 30);

    let viewMode = opts.getPerformanceViewMode();
    if (viewMode === 'with-data' && !mature.length && insufficient.length) {
      viewMode = 'insufficient';
      opts.setPerformanceViewMode(viewMode);
    }

    const filteredPerformance =
      viewMode === 'all'
        ? topicPerformance
        : topicPerformance.filter(topic =>
            viewMode === 'without-data'
              ? topic.resolved === 0
              : viewMode === 'insufficient'
                ? topic.resolved > 0 && topic.resolved < 30
                : topic.resolved >= 30
          );

    const performanceVisible = opts.getPerformanceVisible();

    if (bars) {
      bars.innerHTML = opts.renderTopicQuestionPerformance({
        mode: viewMode,
        topics: filteredPerformance,
        visible: performanceVisible,
        masteryForTopic: (id: string) => opts.topicMasteryIndex(currentSubjectId!, id),
        renderFooter: opts.renderCollectionFooter,
        visibleLimit: performanceVisible,
        escapeHtml: opts.escapeHtml,
      });
    }

    if (weeklyEl) {
      weeklyEl.innerHTML = opts.renderWeeklyQuestionTrend({
        weeks: weekly,
        trend,
        formatDate: opts.formatDatePt,
      });
    }

    const subjectTopics = opts.activeTopics().filter(topic => topic.subjectId === currentSubjectId);
    const errorAnalysisView = opts.getErrorAnalysisView();
    if (
      errorAnalysisView.topicId &&
      !subjectTopics.some(topic => topic.id === errorAnalysisView.topicId)
    ) {
      errorAnalysisView.topicId = '';
    }

    const currentStart = opts.addDays(opts.todayISO(), -(errorAnalysisView.days - 1));
    const previousEnd = opts.addDays(currentStart, -1);
    const previousStart = opts.addDays(previousEnd, -(errorAnalysisView.days - 1));

    const scopedRecords = opts.validQuestionRecords().filter(
      question =>
        opts.entitySubjectId(question) === currentSubjectId &&
        (!errorAnalysisView.topicId || question.topicId === errorAnalysisView.topicId)
    );

    const profile = opts.buildErrorProfile(
      scopedRecords.filter(question => question.date >= currentStart && question.date <= opts.todayISO())
    );
    const previousProfile = opts.buildErrorProfile(
      scopedRecords.filter(question => question.date >= previousStart && question.date <= previousEnd)
    );

    const errorToolbar = opts.renderQuestionErrorToolbar({
      days: errorAnalysisView.days,
      topicId: errorAnalysisView.topicId,
      topics: subjectTopics,
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    const errorModel = opts.buildErrorAnalysisViewModel({
      current: profile,
      previous: previousProfile,
      periodLabel: opts.formatDatePt(currentStart) + ' a ' + opts.formatDatePt(opts.todayISO()),
    });

    if (profileEl) {
      profileEl.innerHTML = opts.renderErrorAnalysis(errorModel, {
        toolbar: errorToolbar,
        escapeHtml: opts.escapeHtml,
      });
    }
  }

  return {
    renderQuestionAnalytics,
  };
}
