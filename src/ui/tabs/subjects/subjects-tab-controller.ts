import { h } from 'preact';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { VerticalizedSyllabusView } from '../../views/VerticalizedSyllabusView.js';
import { createSubjectsController } from './subjects-controller.js';
import { renderTopicAnalyticsState as renderTopicAnalyticsStateView } from './topic-analytics-view.js';
import { renderTopicStrategyEditor as renderTopicStrategyEditorComponent } from './topic-strategy-editor-view.js';
import type { Subject, Topic, TopicStageChecklist, TopicStatus } from '../../../core/types.js';

export interface SubjectsTabControllerContext {
  document: Document;
  window?: Window;
  state: any;
  appContext?: any;
  subjectService: any;
  topicHistoryService?: any;
  topicStrategyController?: any;
  subjectSearchController?: any;
  persistAndRender: () => void;
  renderAll?: () => void;
  showToast: (msg: string) => void;
  showPrompt: (title: string, config: any, onConfirm: (val: string) => void) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
  activeSubjects: () => any[];
  allTopics: () => any[];
  getTopicById: (topicId: string) => { subject: Subject; topic: Topic } | null;
  getSubjectById: (subjectId: string) => Subject | null | undefined;
  getTopicName?: (id: string) => string | null;
  isCommonTopic: (topic: any, tags: string[]) => boolean;
  matchesSubjectSearch: (subject: any, topic: any, query: string) => boolean;
  subjectProgress: (subject: any) => number;
  pluralize: (count: number, singular: string, plural?: string) => string;
  renderCollectionFooter?: (options: any) => string;
  topicMasteryIndex?: (subjectId: string, topicId: string) => any;
  topicRetentionScore?: (subjectId: string, topicId: string) => any;
  diagnoseTopic?: (subjectId: string, topicId: string) => any;
  topicReviewHealthScore?: (
    topic: any,
    masteryResult: any,
    retentionResult: any,
    diagnosis: any
  ) => any;
  diasParaRevisao?: (date: string) => number | null;
  localDateFromTimestamp?: (ts: string | null | undefined) => string | null;
  prerequisiteBlockers?: (topic: any, all: any[]) => string[];
  needsMaintenance?: (opts: any) => boolean;
  evidenceScopeForTopic?: (topicId: string | null) => any;
  entitySubjectId?: (item: any) => string | null;
  startTimer?: () => void;
  populateTimerContextControls?: () => void;
  openStudyTimerFocus?: () => void;
  activeTabName?: () => string;
  uid?: (prefix: string) => string;
  nowISO?: () => string;
  todayISO?: () => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
  EXAM_TAGS: Record<string, string>;
  STATUS_OPTIONS: readonly string[];
  STATUS_CLASS: Record<string, string>;
  DIFFICULTY_OPTIONS: readonly string[];
  DIFFICULTY_CLASS: Record<string, string>;
}

export function createSubjectsTabController(ctx: SubjectsTabControllerContext) {
  let verticalizedSyllabusActive = false;
  let subjectExamFilter = 'all';
  const openNotesIds = new Set<string>();
  const subjectTopicLimits = new Map<string, number>();
  const subjectTopicFilters = new Map<string, { status: string; difficulty: string }>();

  const uid = ctx.uid || ((prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const nowISO = ctx.nowISO || (() => new Date().toISOString());
  const todayISO = ctx.todayISO || (() => new Date().toISOString().slice(0, 10));
  const escapeHtml = ctx.escapeHtml || ((str: string) => String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c));
  const entitySubjectId = ctx.entitySubjectId || ((item: any) => item?.subjectId || item?.subjectRef || null);

  function isVerticalizedSyllabusActive(): boolean {
    return verticalizedSyllabusActive;
  }

  function setVerticalizedSyllabusActive(active: boolean): void {
    verticalizedSyllabusActive = active;
  }

  function getSubjectExamFilter(): string {
    return subjectExamFilter;
  }

  function setSubjectExamFilter(value: any): void {
    if (['all', 'bb', 'caixa', 'caixa-ti', 'common'].includes(value)) {
      subjectExamFilter = value;
    }
    renderSubjects();
  }

  function toggleNotes(topicId: string): void {
    if (openNotesIds.has(topicId)) {
      openNotesIds.clear();
    } else {
      openNotesIds.clear();
      openNotesIds.add(topicId);
    }
    renderSubjects();
  }

  function changeSubjectTopicLimit(subjectId: string, delta: number): void {
    subjectTopicLimits.set(subjectId, (subjectTopicLimits.get(subjectId) || 10) + Number(delta || 0));
    renderSubjects();
  }

  function showAllSubjectTopics(subjectId: string): void {
    subjectTopicLimits.set(subjectId, Number.MAX_SAFE_INTEGER);
    renderSubjects();
  }

  function resetSubjectTopicLimit(subjectId: string): void {
    subjectTopicLimits.set(subjectId, 10);
    renderSubjects();
  }

  function setSubjectTopicFilter(subjectId: string, field: string, value: any): void {
    const current = subjectTopicFilters.get(subjectId) || { status: '', difficulty: '' };
    if (field === 'status' || field === 'difficulty') {
      current[field] = value;
    }
    subjectTopicFilters.set(subjectId, current);
    subjectTopicLimits.set(subjectId, 10);
    renderSubjects();
  }

  function examBadges(topic: Record<string, any>): string {
    const tags = topic.examTags || [];
    return `${tags.includes(ctx.EXAM_TAGS.BB) ? '<span class="exam-tag exam-tag--bb">BB</span>' : ''}${tags.includes(ctx.EXAM_TAGS.CAIXA) ? '<span class="exam-tag exam-tag--caixa">CAIXA</span>' : ''}${tags.includes(ctx.EXAM_TAGS.CAIXA_TI) ? '<span class="exam-tag exam-tag--caixa">CAIXA TI</span>' : ''}`;
  }

  function renderTopicStrategyEditor(subject: Record<string, any>, topic: Record<string, any>): string {
    const subjectConfig =
      ctx.state.examBlueprint?.subjects?.find((item: any) => item.subjectId === subject.id) || null;
    return renderTopicStrategyEditorComponent({
      subject,
      topic,
      subjectConfig,
      activeExamTags: ctx.state.examBlueprint?.activeExamTags || [],
      topics: ctx.allTopics(),
      exams: ctx.state.exams || [],
      examQuestions: ctx.state.examQuestions || [],
    });
  }

  function renderTopicAnalyticsState(subject: Subject, topic: Topic): string {
    return renderTopicAnalyticsStateView({
      subject,
      topic,
      topicMasteryIndex: ctx.topicMasteryIndex || (() => null),
      topicRetentionScore: ctx.topicRetentionScore || (() => null),
      diagnoseTopic: ctx.diagnoseTopic || (() => null),
      topicReviewHealthScore: ctx.topicReviewHealthScore
        ? (t: any, m: any, r: any, d: any) => (ctx.topicReviewHealthScore as any)(t, m, r, d)
        : (() => null),
      diasParaRevisao: ctx.diasParaRevisao || (() => null),
      localDateFromTimestamp: ctx.localDateFromTimestamp || (() => null),
      prerequisiteBlockers: ctx.prerequisiteBlockers || (() => []),
      allTopics: ctx.allTopics,
      needsMaintenance: ctx.needsMaintenance || (() => false),
      getTopicName: ctx.getTopicName || (() => null),
      escapeHtml,
    });
  }

  function renderVerticalizedSyllabus(): void {
    const mount = ctx.document.getElementById('verticalizedSyllabusMount');
    if (!mount) return;

    const subjectsData = (ctx.state.subjects || []).map((s: Subject) => ({
      id: s.id,
      name: s.name,
      topics: (s.topics || []).map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        stageChecklist: t.stageChecklist || null,
        bookmark: t.bookmark || null,
      })),
    }));

    mountPreact(
      h(VerticalizedSyllabusView, {
        subjects: subjectsData,
        onToggleStage: (topicId: string, stage: keyof TopicStageChecklist, done: boolean) => {
          const found = ctx.getTopicById(topicId);
          if (found) {
            const currentChecklist = found.topic.stageChecklist || {
              theoryDone: false,
              summaryDone: false,
              lawOrNotesDone: false,
              questionsDone: false,
            };
            ctx.subjectService.updateTopic(found.subject.id, topicId, {
              stageChecklist: {
                ...currentChecklist,
                [stage]: done,
              },
            });
            ctx.persistAndRender();
          }
        },
        onStartStudy: (subjectId: string, topicId: string) => {
          if (ctx.state.activeTimer) {
            Object.assign(ctx.state.activeTimer, {
              subjectId,
              topicId,
              type: 'study',
            });
          }
          if (ctx.populateTimerContextControls) ctx.populateTimerContextControls();
          if (ctx.startTimer) ctx.startTimer();
          if (ctx.activeTabName && ctx.activeTabName() !== 'dashboard' && ctx.openStudyTimerFocus) {
            ctx.openStudyTimerFocus();
          }
        },
        onImportParsedSyllabus: (result: any) => {
          let addedSubjects = 0;
          let addedTopics = 0;
          for (const item of result.subjects || []) {
            let targetSubject = (ctx.state.subjects || []).find(
              (s: Subject) => s.name.trim().toLowerCase() === item.name.trim().toLowerCase()
            );
            if (!targetSubject) {
              targetSubject = ctx.subjectService.create(item.name);
              addedSubjects++;
            }
            if (targetSubject) {
              for (const t of item.topics || []) {
                const topicExists = (targetSubject.topics || []).some(
                  (existing: Topic) => existing.name.trim().toLowerCase() === t.name.trim().toLowerCase()
                );
                if (!topicExists) {
                  ctx.subjectService.addTopic(targetSubject.id, { name: t.name });
                  addedTopics++;
                }
              }
            }
          }
          ctx.persistAndRender();
          ctx.showToast(
            `Edital importado: ${addedSubjects} disciplinas e ${addedTopics} tópicos adicionados.`
          );
        },
      }),
      mount
    );
  }

  function renderSubjects(): void {
    const container = ctx.document.getElementById('subjectsContainer');
    const mount = ctx.document.getElementById('verticalizedSyllabusMount');
    const toggleBtn = ctx.document.getElementById('verticalizedSyllabusToggleBtn');
    if (!container) return;

    if (verticalizedSyllabusActive && mount) {
      container.hidden = true;
      mount.hidden = false;
      if (toggleBtn) {
        toggleBtn.textContent = 'Visão padrão';
        toggleBtn.classList.add('btn-primary');
      }
      renderVerticalizedSyllabus();
      return;
    }

    if (mount) {
      unmountPreact(mount);
      mount.hidden = true;
    }
    container.hidden = false;
    if (toggleBtn) {
      toggleBtn.textContent = 'Edital verticalizado';
      toggleBtn.classList.remove('btn-primary');
    }

    const controller = createSubjectsController({
      state: ctx.state,
      subjectSearchController: ctx.subjectSearchController,
      subjectExamFilter,
      subjectTopicFilters,
      subjectTopicLimits,
      openNotesIds,
      isCommonTopic: ctx.isCommonTopic,
      EXAM_TAGS: ctx.EXAM_TAGS,
      STATUS_OPTIONS: ctx.STATUS_OPTIONS,
      STATUS_CLASS: ctx.STATUS_CLASS,
      DIFFICULTY_OPTIONS: ctx.DIFFICULTY_OPTIONS,
      DIFFICULTY_CLASS: ctx.DIFFICULTY_CLASS,
      subjectProgress: ctx.subjectProgress,
      matchesSubjectSearch: ctx.matchesSubjectSearch,
      pluralize: ctx.pluralize,
      renderCollectionFooter: ctx.renderCollectionFooter,
      examBadges,
      renderTopicAnalyticsState,
      renderTopicStrategyEditor,
    });

    container.innerHTML = controller.renderHtml();
  }

  function updateTopicTags(subjectId: string, topicId: string, value: any): void {
    const found = ctx.getTopicById(topicId);
    const fieldOrigins = { ...(found?.topic?.fieldOrigins || {}), tags: 'manual' };
    ctx.subjectService.updateTopic(subjectId, topicId, {
      tags: String(value || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      fieldOrigins,
    });
    ctx.persistAndRender();
  }

  function updateTopicStrategy(subjectId: string, topicId: string, field: string, value: any): void {
    if (ctx.topicStrategyController) {
      ctx.topicStrategyController.update(subjectId, topicId, field, value);
    }
  }

  function toggleTopicPrerequisite(
    subjectId: string,
    topicId: string,
    prerequisiteId: string,
    checked: boolean
  ): void {
    if (ctx.topicStrategyController) {
      ctx.topicStrategyController.togglePrerequisite(subjectId, topicId, prerequisiteId, checked);
    }
  }

  function moveSubject(id: string, direction: number): void {
    const active = ctx.activeSubjects();
    const activeIdx = active.findIndex(s => s.id === id);
    const target = active[activeIdx + direction];
    if (activeIdx === -1 || !target) return;
    const idx = ctx.state.subjects.findIndex((s: Subject) => s.id === id);
    const targetIdx = ctx.state.subjects.findIndex((s: Subject) => s.id === target.id);
    [ctx.state.subjects[idx], ctx.state.subjects[targetIdx]] = [
      ctx.state.subjects[targetIdx],
      ctx.state.subjects[idx],
    ];
    ctx.persistAndRender();
  }

  function duplicateSubject(id: string): void {
    const idx = ctx.state.subjects.findIndex((s: Subject) => s.id === id);
    if (idx === -1) return;
    const original = ctx.state.subjects[idx];
    const copy: Subject = {
      id: uid('subject'),
      name: original.name + ' (cópia)',
      collapsed: false,
      archived: false,
      archivedAt: null,
      createdAt: nowISO(),
      topics: (original.topics || []).map((t: Topic) => ({
        id: uid('topic'),
        name: t.name,
        link: t.link || '',
        status: 'Não iniciado',
        archived: false,
        archivedAt: null as any,
        notes: '',
        tags: [...(t.tags || [])],
        difficulty: t.difficulty || 'Médio',
        createdAt: nowISO(),
        firstCompletedAt: null as any,
        lastCompletedAt: null as any,
        completionCount: 0,
        lastReviewedAt: null as any,
        reviewCount: 0,
        examImportance: t.examImportance ?? null,
        estimatedStudyMinutes: t.estimatedStudyMinutes ?? null,
        prerequisites: [] as any[],
      })),
    };
    ctx.state.subjects.splice(idx + 1, 0, copy);
    ctx.persistAndRender();
    ctx.showToast(`"${copy.name}" criada com os mesmos tópicos (progresso zerado).`);
  }

  function toggleSubject(id: string): void {
    const isMobile =
      typeof ctx.window !== 'undefined' &&
      (ctx.window.innerWidth <= 768 || ctx.window.matchMedia?.('(max-width: 768px)').matches);
    ctx.subjectService.toggle(id, { exclusive: isMobile });
    renderSubjects();
  }

  function renameSubject(id: string, name: string): void {
    const clean = name.trim() || 'Disciplina sem nome';
    const s = ctx.appContext?.repositories?.subjects?.findById
      ? ctx.appContext.repositories.subjects.findById(id)
      : ctx.getSubjectById(id);
    if (s?.name !== clean) {
      ctx.subjectService.rename(id, clean);
      ctx.persistAndRender();
    } else if (ctx.renderAll) {
      ctx.renderAll();
    }
  }

  function addSubject(): void {
    ctx.showPrompt(
      'Criar uma nova disciplina',
      {
        label: 'Nome da disciplina',
        placeholder: 'Ex.: Conhecimentos Bancários',
        confirmLabel: 'Criar',
        validate: (name: string) => {
          if (!name) return 'Informe o nome da disciplina.';
          if (
            (ctx.state.subjects || []).some(
              (subject: Subject) =>
                subject.name.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')
            )
          ) {
            return 'Já existe uma disciplina com esse nome.';
          }
          return '';
        },
      },
      (name: string) => {
        ctx.subjectService.create(name);
        ctx.persistAndRender();
        ctx.showToast(`Disciplina "${name}" criada.`);
      }
    );
  }

  function archiveSubject(id: string): void {
    const subject = ctx.getSubjectById(id);
    if (!subject) return ctx.showToast('Disciplina não encontrada.');
    ctx.subjectService.archive(id);
    ctx.persistAndRender();
    ctx.showToast(`"${subject.name}" foi arquivada.`);
  }

  function restoreSubject(id: string): void {
    const subject = ctx.getSubjectById(id);
    if (!subject) return;
    ctx.subjectService.restore(id);
    ctx.persistAndRender();
    ctx.showToast(`"${subject.name}" foi restaurada.`);
  }

  function getSubjectDependencies(subjectId: string) {
    const subject = ctx.getSubjectById(subjectId);
    const topicIds = new Set((subject?.topics || []).map(t => t.id));
    return {
      questoes: (ctx.state.questoes || []).filter(
        (item: any) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId!)
      ).length,
      sessions: (ctx.state.studySessions || []).filter(
        (item: any) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId!)
      ).length,
      calendar: (ctx.state.calendar || []).filter(
        (item: any) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId!)
      ).length,
      reviews: (ctx.state.reviewAgenda || []).filter(
        (item: any) => entitySubjectId(item) === subjectId || topicIds.has((item.topicId || item.topicRef)!)
      ).length,
      goals: (ctx.state.metasPorDisciplina || []).filter((item: any) => entitySubjectId(item) === subjectId).length,
      history: ctx.topicHistoryService
        ? ctx.topicHistoryService
            .list({ includeLifecycle: false })
            .filter((item: any) => item.subjectId === subjectId || topicIds.has(item.topicId)).length
        : 0,
      simulatedBreakdowns: (ctx.state.simulados || []).reduce(
        (sum: number, sim: any) =>
          sum + (sim.breakdown || []).filter((item: any) => entitySubjectId(item) === subjectId).length,
        0
      ),
      activeTimer:
        ctx.state.activeTimer?.subjectId === subjectId || topicIds.has(ctx.state.activeTimer?.topicId!) ? 1 : 0,
    };
  }

  function dependencyTotal(dependencies: Record<string, any>): number {
    return Object.values(dependencies).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
  }

  function requestPermanentSubjectDelete(id: string): void {
    const subject = ctx.getSubjectById(id);
    if (!subject) return;
    if (!subject.archived) {
      return ctx.showToast('Arquive a disciplina antes de solicitar a exclusão definitiva.');
    }
    const total = dependencyTotal(getSubjectDependencies(id));
    if (total > 0) {
      return ctx.showToast(
        `A disciplina possui ${ctx.pluralize(total, 'registro')} ${total === 1 ? 'vinculado' : 'vinculados'} e não pode ser excluída.`
      );
    }
    ctx.showConfirm(`Excluir definitivamente "${subject.name}"? Esta ação não pode ser desfeita.`, () => {
      ctx.subjectService.remove(id);
      ctx.persistAndRender();
      ctx.showToast('Disciplina excluída definitivamente.');
    });
  }

  function addTopic(subjectId: string): void {
    ctx.subjectService.addTopic(subjectId);
    ctx.persistAndRender();
  }

  function archiveTopic(subjectId: string, topicId: string): void {
    const found = ctx.getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    ctx.subjectService.archiveTopic(subjectId, topicId);
    ctx.persistAndRender();
    ctx.showToast('Tópico arquivado.');
  }

  function restoreTopic(subjectId: string, topicId: string): void {
    const found = ctx.getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    ctx.subjectService.restoreTopic(subjectId, topicId);
    ctx.persistAndRender();
    ctx.showToast('Tópico restaurado.');
  }

  function getTopicDependencies(topicId: string) {
    return {
      questions: (ctx.state.questoes || []).filter((item: any) => item.topicId === topicId).length,
      sessions: (ctx.state.studySessions || []).filter((item: any) => item.topicId === topicId).length,
      reviews: (ctx.state.reviewAgenda || []).filter(
        (item: any) => item.topicId === topicId || item.topicRef === topicId
      ).length,
      calendar: (ctx.state.calendar || []).filter((item: any) => item.topicId === topicId).length,
      history: ctx.topicHistoryService
        ? ctx.topicHistoryService.list({ topicId, includeLifecycle: false }).length
        : 0,
      activeTimer: ctx.state.activeTimer?.topicId === topicId ? 1 : 0,
    };
  }

  function requestPermanentTopicDelete(subjectId: string, topicId: string): void {
    const found = ctx.getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    if (!found.topic.archived) {
      return ctx.showToast('Arquive o tópico antes de solicitar a exclusão definitiva.');
    }
    const total = dependencyTotal(getTopicDependencies(topicId));
    if (total > 0) {
      return ctx.showToast(
        `O tópico possui ${ctx.pluralize(total, 'registro')} ${total === 1 ? 'vinculado' : 'vinculados'} e não pode ser excluído.`
      );
    }
    ctx.showConfirm(`Excluir definitivamente "${found.topic.name || 'este tópico'}"?`, () => {
      ctx.subjectService.removeTopic(subjectId, topicId);
      ctx.persistAndRender();
      ctx.showToast('Tópico excluído definitivamente.');
    });
  }

  function updateTopic(subjectId: string, topicId: string, field: string, value: any): void {
    const found = ctx.getTopicById(topicId);
    const patch: Record<string, any> = { [field]: value };
    if (found && ['difficulty', 'examImportance', 'estimatedStudyMinutes'].includes(field)) {
      patch.fieldOrigins = { ...(found.topic.fieldOrigins || {}), [field]: 'manual' };
    }
    ctx.subjectService.updateTopic(subjectId, topicId, patch);
    ctx.persistAndRender();
  }

  function addHistoryEvent(
    type: string,
    subjectId: string,
    topicId: string | null = null,
    metadata: any = {}
  ) {
    if (!ctx.topicHistoryService) return null;
    return ctx.topicHistoryService.add(type, subjectId, topicId, metadata, {
      examScope: ctx.evidenceScopeForTopic ? ctx.evidenceScopeForTopic(topicId) : null,
    });
  }

  function completedReviewsForTopic(topicId: string) {
    return (ctx.state.reviewAgenda || []).filter(
      (review: any) => (review.topicId || review.topicRef) === topicId && review.status === 'Concluído'
    );
  }

  function refreshTopicReviewStats(topicId: string): void {
    const found = ctx.getTopicById(topicId);
    if (!found) return;
    const completed = completedReviewsForTopic(topicId);
    const dates = completed
      .map((review: any) => review.completedAt)
      .filter(Boolean)
      .sort();
    found.topic.reviewCount = completed.length;
    found.topic.lastReviewedAt = dates.length ? dates[dates.length - 1] : null;
  }

  function refreshAllTopicReviewStats(): void {
    (ctx.state.subjects || []).forEach((subject: Subject) =>
      (subject.topics || []).forEach((topic: Topic) => refreshTopicReviewStats(topic.id))
    );
  }

  function markTopicCompleted(topic: Record<string, any>): void {
    const now = nowISO();
    if (!topic.firstCompletedAt) topic.firstCompletedAt = now;
    topic.lastCompletedAt = now;
    topic.completedAt = todayISO();
    topic.completionCount = (Number(topic.completionCount) || 0) + 1;
  }

  function updateTopicStatus(
    subjectId: string,
    topicId: string,
    selectEl: HTMLSelectElement | { value: string }
  ): void {
    const s = ctx.getSubjectById(subjectId);
    const t = s?.topics.find(x => x.id === topicId);
    if (!t) return;
    const oldStatus = t.status;
    const newStatus = selectEl.value;
    if (oldStatus === newStatus) return;
    t.status = newStatus as TopicStatus;
    if (newStatus === 'Concluído') {
      markTopicCompleted(t);
      addHistoryEvent('topic_completed', subjectId, topicId);
    } else if (oldStatus === 'Concluído') {
      t.completedAt = null;
      addHistoryEvent('topic_reopened', subjectId, topicId, { newStatus });
    } else if (newStatus === 'Em andamento' && oldStatus === 'Não iniciado') {
      addHistoryEvent('topic_started', subjectId, topicId);
    }
    ctx.persistAndRender();
  }

  return {
    isVerticalizedSyllabusActive,
    setVerticalizedSyllabusActive,
    renderVerticalizedSyllabus,
    renderSubjects,
    getSubjectExamFilter,
    setSubjectExamFilter,
    toggleNotes,
    changeSubjectTopicLimit,
    showAllSubjectTopics,
    resetSubjectTopicLimit,
    setSubjectTopicFilter,
    examBadges,
    updateTopicTags,
    updateTopicStrategy,
    toggleTopicPrerequisite,
    renderTopicStrategyEditor,
    renderTopicAnalyticsState,
    moveSubject,
    duplicateSubject,
    toggleSubject,
    renameSubject,
    addSubject,
    archiveSubject,
    restoreSubject,
    getSubjectDependencies,
    requestPermanentSubjectDelete,
    addTopic,
    archiveTopic,
    restoreTopic,
    getTopicDependencies,
    requestPermanentTopicDelete,
    updateTopic,
    updateTopicStatus,
    markTopicCompleted,
    refreshTopicReviewStats,
    refreshAllTopicReviewStats,
    addHistoryEvent,
    openNotesIds,
    subjectTopicLimits,
    subjectTopicFilters,
  };
}
