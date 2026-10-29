import {
  accuracyFromCounts,
  calculateWeightedTrend as defaultCalculateWeightedTrend,
} from '../../../domain/analytics/topic-performance.js';
import {
  renderQuestionAnalyticsSummary as defaultRenderQuestionAnalyticsSummary,
  renderTopicQuestionPerformance as defaultRenderTopicQuestionPerformance,
  renderWeeklyQuestionTrend as defaultRenderWeeklyQuestionTrend,
  renderQuestionErrorToolbar as defaultRenderQuestionErrorToolbar,
} from '../../renderers/question-analytics-renderer.js';
import { buildErrorAnalysisViewModel as defaultBuildErrorAnalysisViewModel } from '../../../application/analytics/build-error-analysis-view-model.js';
import { renderErrorAnalysis as defaultRenderErrorAnalysis } from '../../renderers/error-analysis-renderer.js';
import { renderCollectionFooter as defaultRenderCollectionFooter } from '../../list-components.js';
import { DEFAULT_LIST_VISIBLE_ITEMS } from '../../progressive-list.js';

export interface QuestionAnalyticsControllerOptions {
  document: any;
  getPerformanceSubjectId?: () => string | null;
  setPerformanceSubjectId?: (id: string | null) => void;
  getPerformanceViewMode?: () => string;
  setPerformanceViewMode?: (mode: string) => void;
  getPerformanceVisible?: () => number;
  getErrorAnalysisView?: () => { days: number; topicId: string };
  validQuestionRecords: () => Array<any>;
  entitySubjectId: (item: any) => string | null;
  activeSubjects: () => Array<any>;
  activeTopics: () => Array<any>;
  getSubjectWeeklyTrend: (subjectId: string) => Array<any>;
  calculateWeightedTrend?: (weekly: Array<any>) => any;
  getSubjectTopicPerformance: (subjectId: string) => Array<any>;
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  renderQuestionAnalyticsSummary?: (opts: any) => string;
  renderTopicQuestionPerformance?: (opts: any) => string;
  renderWeeklyQuestionTrend?: (opts: any) => string;
  buildErrorProfile: (records: any[]) => any;
  renderQuestionErrorToolbar?: (opts: any) => string;
  buildErrorAnalysisViewModel?: (opts: any) => any;
  renderErrorAnalysis?: (model: any, opts: any) => string;
  renderCollectionFooter?: (opts: any) => string;
  formatDatePt: (iso: string) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  addDays: (iso: string, days: number) => string;
  todayISO: () => string;
}

export function createQuestionAnalyticsController(opts: QuestionAnalyticsControllerOptions) {
  let internalSubjectId: string | null = null;
  let internalViewMode = 'with-data';
  let internalVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  const internalErrorAnalysisView = { days: 30, topicId: '' };

  const getPerformanceSubjectId = opts.getPerformanceSubjectId || (() => internalSubjectId);
  const setPerformanceSubjectIdInternal =
    opts.setPerformanceSubjectId ||
    ((id: string | null) => {
      internalSubjectId = id;
    });
  const getPerformanceViewMode = opts.getPerformanceViewMode || (() => internalViewMode);
  const setPerformanceViewModeInternal =
    opts.setPerformanceViewMode ||
    ((mode: string) => {
      internalViewMode = mode;
    });
  const getPerformanceVisible = opts.getPerformanceVisible || (() => internalVisible);
  const getErrorAnalysisView = opts.getErrorAnalysisView || (() => internalErrorAnalysisView);

  const calculateWeightedTrend = opts.calculateWeightedTrend || defaultCalculateWeightedTrend;
  const renderQuestionAnalyticsSummary =
    opts.renderQuestionAnalyticsSummary || defaultRenderQuestionAnalyticsSummary;
  const renderTopicQuestionPerformance =
    opts.renderTopicQuestionPerformance || defaultRenderTopicQuestionPerformance;
  const renderWeeklyQuestionTrend =
    opts.renderWeeklyQuestionTrend || defaultRenderWeeklyQuestionTrend;
  const renderQuestionErrorToolbar =
    opts.renderQuestionErrorToolbar || defaultRenderQuestionErrorToolbar;
  const buildErrorAnalysisViewModel =
    opts.buildErrorAnalysisViewModel || defaultBuildErrorAnalysisViewModel;
  const renderErrorAnalysis = opts.renderErrorAnalysis || defaultRenderErrorAnalysis;
  const renderCollectionFooter = opts.renderCollectionFooter || defaultRenderCollectionFooter;

  function renderQuestionAnalytics(): void {
    const select = opts.document.getElementById('performanceSubjectSelect');
    if (!select) return;

    const subjects = opts.activeSubjects();
    let currentSubjectId = getPerformanceSubjectId();

    if (!subjects.some(subject => subject.id === currentSubjectId)) {
      currentSubjectId =
        subjects.find(subject =>
          opts.validQuestionRecords().some(question => opts.entitySubjectId(question) === subject.id)
        )?.id ||
        subjects[0]?.id ||
        null;
      setPerformanceSubjectIdInternal(currentSubjectId);
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
    const trend = calculateWeightedTrend(weekly);

    if (coverageEl) coverageEl.textContent = `${coverage}% identificadas`;
    if (summary) {
      summary.innerHTML = renderQuestionAnalyticsSummary({ resolved, accuracy, coverage, trend });
    }

    const topicPerformance = opts.getSubjectTopicPerformance(currentSubjectId);
    const mature = topicPerformance.filter(topic => topic.resolved >= 30);
    const insufficient = topicPerformance.filter(topic => topic.resolved > 0 && topic.resolved < 30);

    let viewMode = getPerformanceViewMode();
    if (viewMode === 'with-data' && !mature.length && insufficient.length) {
      viewMode = 'insufficient';
      setPerformanceViewModeInternal(viewMode);
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

    const performanceVisible = getPerformanceVisible();

    if (bars) {
      bars.innerHTML = renderTopicQuestionPerformance({
        mode: viewMode,
        topics: filteredPerformance,
        visible: performanceVisible,
        masteryForTopic: (id: string) => opts.topicMasteryIndex(currentSubjectId!, id),
        renderFooter: renderCollectionFooter,
        visibleLimit: performanceVisible,
        escapeHtml: opts.escapeHtml,
      });
    }

    if (weeklyEl) {
      weeklyEl.innerHTML = renderWeeklyQuestionTrend({
        weeks: weekly,
        trend,
        formatDate: opts.formatDatePt,
      });
    }

    const subjectTopics = opts.activeTopics().filter(topic => topic.subjectId === currentSubjectId);
    const errorAnalysisView = getErrorAnalysisView();
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

    const errorToolbar = renderQuestionErrorToolbar({
      days: errorAnalysisView.days,
      topicId: errorAnalysisView.topicId,
      topics: subjectTopics,
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    const errorModel = buildErrorAnalysisViewModel({
      current: profile,
      previous: previousProfile,
      periodLabel: opts.formatDatePt(currentStart) + ' a ' + opts.formatDatePt(opts.todayISO()),
    });

    if (profileEl) {
      profileEl.innerHTML = renderErrorAnalysis(errorModel, {
        toolbar: errorToolbar,
        escapeHtml: opts.escapeHtml,
      });
    }
  }

  function setSubjectId(id: string | null): void {
    setPerformanceSubjectIdInternal(id);
  }

  function setViewMode(mode: string): void {
    const valid = ['with-data', 'insufficient', 'without-data', 'all'].includes(mode)
      ? mode
      : 'with-data';
    setPerformanceViewModeInternal(valid);
    internalVisible = DEFAULT_LIST_VISIBLE_ITEMS;
    renderQuestionAnalytics();
  }

  function setErrorAnalysisFilter(field: string, value: any): void {
    const view = getErrorAnalysisView();
    if (field === 'days' && [7, 30, 60, 90].includes(Number(value))) view.days = Number(value);
    if (field === 'topicId') view.topicId = value || '';
    renderQuestionAnalytics();
  }

  function showAllPerformance(): void {
    internalVisible = Number.MAX_SAFE_INTEGER;
    renderQuestionAnalytics();
  }

  function resetPerformanceLimit(): void {
    internalVisible = DEFAULT_LIST_VISIBLE_ITEMS;
    renderQuestionAnalytics();
  }

  function resetLimitDefault(): void {
    internalVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  }

  return {
    renderQuestionAnalytics,
    setSubjectId,
    setViewMode,
    setErrorAnalysisFilter,
    changePerformanceLimit: showAllPerformance,
    showAllPerformance,
    resetPerformanceLimit,
    resetLimitDefault,
  };
}
