import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { createClock } from '../../../core/clock.js';
import { SubjectsTab } from './SubjectsTab.js';
import { buildSubjectWeeklyAccuracy } from '../../../application/analytics/build-subject-accuracy.js';
import { subjectColorOf } from '../../../domain/subjects/subject-color.js';
import { buildSyllabusHealthViewModel } from '../../../application/analytics/build-syllabus-health-view-model.js';

export interface SubjectsControllerContext {
  state: any;
  subjectSearchController: any;
  subjectExamFilter: string;
  subjectTopicFilters?: Map<string, { status: string; difficulty: string }>;
  subjectTopicPages?: Map<string, number>;
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
  getAnalyticsStateModel?: (subject: any, topic: any) => any;
  getStrategyEditorModel?: (subject: any, topic: any) => any;
  onSelectSubtab?: (key: 'materias' | 'verticalizado' | 'leis' | 'jurisprudencia') => void;
  today?: string;
}

export function createSubjectsController(ctx: SubjectsControllerContext) {
  const subjectTopicFilters =
    ctx.subjectTopicFilters || new Map<string, { status: string; difficulty: string }>();
  const subjectTopicPages = ctx.subjectTopicPages || new Map<string, number>();
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

  function buildVNode() {
    const subjects = getFilteredSubjects();
    const archived = getArchivedSubjects();
    const query = ctx.subjectSearchController?.query || '';
    const effectiveToday = ctx.today || createClock().today();

    return h(SubjectsTab, {
      subjects,
      archivedSubjects: archived,
      searchQuery: query,
      subjectExamFilter: ctx.subjectExamFilter,
      subjectProgressFn: ctx.subjectProgress,
      subjectColorFn: (subject: any) => subjectColorOf(subject, ctx.state.subjects || []),
      accuracyTrends: buildSubjectWeeklyAccuracy(
        ctx.state.questoes || [],
        effectiveToday
      ),
      accuracy30: new Map(
        buildSyllabusHealthViewModel(
          ctx.state,
          effectiveToday
        ).subjects.map(item => [
          item.id,
          item.accuracySource === 'questions' ? item.accuracy : null,
        ])
      ),
      subjectTopicFilters,
      subjectTopicPages,
      openNotesIds,
      statusOptions: ctx.STATUS_OPTIONS,
      statusClasses: ctx.STATUS_CLASS,
      difficultyOptions: ctx.DIFFICULTY_OPTIONS,
      difficultyClasses: ctx.DIFFICULTY_CLASS,
      topicMatchesExamFn: topicMatchesExam,
      matchesSearchFn: ctx.matchesSubjectSearch,
      pluralizeFn: ctx.pluralize,
      getAnalyticsStateModel: ctx.getAnalyticsStateModel,
      getStrategyEditorModel: ctx.getStrategyEditorModel,
      onSelectSubtab: ctx.onSelectSubtab,
    });
  }

  function renderHtml(): string {
    return render(buildVNode());
  }

  return {
    subjectTopicFilters,
    subjectTopicPages,
    openNotesIds,
    buildVNode,
    renderHtml,
    topicMatchesExam,
    getActiveSubjects,
    getArchivedSubjects,
    getFilteredSubjects,
  };
}
