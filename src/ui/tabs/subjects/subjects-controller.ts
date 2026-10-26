import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { SubjectsTab } from './SubjectsTab.js';

export interface SubjectsControllerContext {
  state: any;
  subjectSearchController: any;
  subjectExamFilter: string;
  subjectTopicFilters?: Map<string, { status: string; difficulty: string }>;
  subjectTopicLimits?: Map<string, number>;
  openNotesIds?: Set<string>;
  isCommonTopic: (topic: any, tags: string[]) => boolean;
  EXAM_TAGS: Record<string, string>;
  STATUS_OPTIONS: readonly string[];
  STATUS_CLASS: Record<string, string>;
  DIFFICULTY_OPTIONS: readonly string[];
  DIFFICULTY_CLASS: Record<string, string>;
  subjectProgress: (subject: any) => number;
  matchesSubjectSearch: (subject: any, topic: any, query: string) => boolean;
  pluralize: (count: number, singular: string, plural?: string) => string;
  renderCollectionFooter?: (options: any) => string;
  examBadges?: (topic: any) => string;
  renderTopicAnalyticsState?: (subject: any, topic: any) => string;
  renderTopicStrategyEditor?: (subject: any, topic: any) => string;
}

export function createSubjectsController(ctx: SubjectsControllerContext) {
  const subjectTopicFilters =
    ctx.subjectTopicFilters || new Map<string, { status: string; difficulty: string }>();
  const subjectTopicLimits = ctx.subjectTopicLimits || new Map<string, number>();
  const openNotesIds = ctx.openNotesIds || new Set<string>();

  function topicMatchesExam(topic: any): boolean {
    const filter = ctx.subjectExamFilter || 'all';
    if (filter === 'all') return true;
    if (filter === 'common') {
      return ctx.isCommonTopic(topic, [ctx.EXAM_TAGS.BB, ctx.EXAM_TAGS.CAIXA]);
    }
    if (filter === 'bb') {
      return (topic.examTags || []).includes(ctx.EXAM_TAGS.BB);
    }
    if (filter === 'caixa') {
      return (topic.examTags || []).includes(ctx.EXAM_TAGS.CAIXA);
    }
    if (filter === 'caixa-ti') {
      return (topic.examTags || []).includes(ctx.EXAM_TAGS.CAIXA_TI);
    }
    return true;
  }

  function getActiveSubjects(): any[] {
    return (ctx.state.subjects || []).filter((s: any) => !s.archived);
  }

  function getArchivedSubjects(): any[] {
    return (ctx.state.subjects || []).filter((s: any) => s.archived);
  }

  function getFilteredSubjects(): any[] {
    const allActive = getActiveSubjects();
    const query = ctx.subjectSearchController?.query || '';
    const filter = ctx.subjectExamFilter || 'all';

    return allActive.filter((subject: any) => {
      const hasMatchingTopics = (subject.topics || []).some(
        (topic: any) =>
          !topic.archived &&
          topicMatchesExam(topic) &&
          ctx.matchesSubjectSearch(subject, topic, query)
      );
      return hasMatchingTopics || (!query && filter === 'all');
    });
  }

  function renderHtml(): string {
    const subjects = getFilteredSubjects();
    const archived = getArchivedSubjects();
    const query = ctx.subjectSearchController?.query || '';

    return render(
      h(SubjectsTab, {
        subjects,
        archivedSubjects: archived,
        searchQuery: query,
        subjectExamFilter: ctx.subjectExamFilter,
        subjectProgressFn: ctx.subjectProgress,
        subjectTopicFilters,
        subjectTopicLimits,
        openNotesIds,
        statusOptions: ctx.STATUS_OPTIONS,
        statusClasses: ctx.STATUS_CLASS,
        difficultyOptions: ctx.DIFFICULTY_OPTIONS,
        difficultyClasses: ctx.DIFFICULTY_CLASS,
        topicMatchesExamFn: topicMatchesExam,
        matchesSearchFn: ctx.matchesSubjectSearch,
        pluralizeFn: ctx.pluralize,
        renderFooterFn: ctx.renderCollectionFooter,
        getExamBadgesHtml: ctx.examBadges,
        getAnalyticsStateHtml: ctx.renderTopicAnalyticsState,
        getStrategyEditorHtml: ctx.renderTopicStrategyEditor,
      })
    );
  }

  return {
    subjectTopicFilters,
    subjectTopicLimits,
    openNotesIds,
    renderHtml,
    topicMatchesExam,
    getActiveSubjects,
    getArchivedSubjects,
    getFilteredSubjects,
  };
}
