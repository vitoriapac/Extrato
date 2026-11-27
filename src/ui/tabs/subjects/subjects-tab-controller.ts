import { h } from 'preact';
import { createClock } from '../../../core/clock.js';
import { getRovingTabIndex } from '../../primitives/tabs.js';
import { isSubjectColor } from '../../../domain/subjects/subject-color.js';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { lazyView } from '../../lazy-view.js';
import { buildTopicIntelligence } from '../../../application/topic-intelligence/build-topic-intelligence.js';
import { QuickStatsGrid } from '../dashboard/QuickStatsGrid.js';
import { buildTopicStatusSummary } from '../../../application/subjects/build-topic-status-summary.js';
import { createSubjectsController } from './subjects-controller.js';
import { renderTopicAnalyticsState as renderTopicAnalyticsStateView } from './topic-analytics-view.js';
import { renderTopicStrategyEditor as renderTopicStrategyEditorComponent } from './topic-strategy-editor-view.js';
import type {
  JurisprudenceRecord,
  LawRecord,
  Subject,
  Topic,
  TopicStageChecklist,
  TopicStatus,
} from '../../../core/types.js';
import { runUndoable } from '../../undoable.js';
import { LawNotebookCard } from './LawNotebookCard.js';
import { JurisprudenceNotebookCard } from './JurisprudenceNotebookCard.js';
import { SubjectsSubtabsNav, type SubjectsSubtabKey } from '../../components/SubjectsSubtabsNav.js';
import { completeLawLap, registerLawReading } from '../../../domain/law-notebook.js';
import { registerJurisprudenceReading } from '../../../domain/jurisprudence-notebook.js';

// Edital verticalizado e Inteligência do tópico: só baixam quando abertos.
const VerticalizedSyllabusView = lazyView(() =>
  import('../../views/VerticalizedSyllabusView.js').then(module => module.VerticalizedSyllabusView)
);

const TopicIntelligenceModal = lazyView(() =>
  import('../../modals/TopicIntelligenceModal.js').then(module => module.TopicIntelligenceModal)
);

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
  showConfirm: (
    msg: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: Record<string, unknown>
  ) => void;
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
  openExamImport?: () => void;
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
  let activeSubtab: SubjectsSubtabKey = 'materias';
  let subjectExamFilter = 'all';
  const openNotesIds = new Set<string>();
  const subjectTopicPages = new Map<string, number>();
  const subjectTopicFilters = new Map<string, { status: string; difficulty: string }>();

  const uid =
    ctx.uid ||
    ((prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const nowISO = ctx.nowISO || (() => new Date().toISOString());
  const todayISO = ctx.todayISO || (() => createClock().today());
  const escapeHtml =
    ctx.escapeHtml ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
      ));
  const entitySubjectId =
    ctx.entitySubjectId || ((item: any) => item?.subjectId || item?.subjectRef || null);

  function isVerticalizedSyllabusActive(): boolean {
    return verticalizedSyllabusActive;
  }

  function setVerticalizedSyllabusActive(active: boolean): void {
    verticalizedSyllabusActive = active;
    activeSubtab = active ? 'verticalizado' : 'materias';
  }

  function selectSubjectsSubtab(key: SubjectsSubtabKey): void {
    verticalizedSyllabusActive = key === 'verticalizado';
    activeSubtab = key;
    renderSubjects();
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

  function clearSubjectFilters(): void {
    ctx.subjectSearchController?.clear();
    subjectExamFilter = 'all';
    renderSubjects();
    (ctx.document.getElementById('subjectContentSearch') as HTMLInputElement | null)?.focus();
  }

  function toggleNotes(topicId: string): void {
    if (openNotesIds.has(topicId)) {
      openNotesIds.clear();
    } else {
      openNotesIds.clear();
      openNotesIds.add(topicId);
    }
    renderSubjects();
    ctx.document
      .getElementById(`topic-row-${topicId}`)
      ?.querySelector<HTMLButtonElement>('.notes-toggle-btn')
      ?.focus({ preventScroll: true });
  }

  function setSubjectTopicFilter(subjectId: string, field: string, value: any): void {
    const current = subjectTopicFilters.get(subjectId) || { status: '', difficulty: '' };
    if (field === 'status' || field === 'difficulty') {
      current[field] = value;
    }
    subjectTopicFilters.set(subjectId, current);
    subjectTopicPages.set(subjectId, 1);
    renderSubjects();
  }

  function examBadges(topic: Record<string, any>): string {
    const tags = topic.examTags || [];
    return `${tags.includes(ctx.EXAM_TAGS.BB) ? '<span class="exam-tag exam-tag--bb">BB</span>' : ''}${tags.includes(ctx.EXAM_TAGS.CAIXA) ? '<span class="exam-tag exam-tag--caixa">CAIXA</span>' : ''}${tags.includes(ctx.EXAM_TAGS.CAIXA_TI) ? '<span class="exam-tag exam-tag--caixa">CAIXA TI</span>' : ''}`;
  }

  function renderTopicStrategyEditor(
    subject: Record<string, any>,
    topic: Record<string, any>
  ): string {
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
        : () => null,
      diasParaRevisao: ctx.diasParaRevisao || (() => null),
      localDateFromTimestamp: ctx.localDateFromTimestamp || (() => null),
      prerequisiteBlockers: ctx.prerequisiteBlockers || (() => []),
      allTopics: ctx.allTopics,
      needsMaintenance: ctx.needsMaintenance || (() => false),
      getTopicName: ctx.getTopicName || (() => null),
      escapeHtml,
    });
  }

  function openTopicIntelligenceModal(subjectId: string, topicId: string): void {
    const subject = (ctx.state.subjects || []).find((s: Subject) => s.id === subjectId);
    const topic = subject?.topics?.find((t: Topic) => t.id === topicId);
    if (!subject || !topic) return;

    const topicQuestions = (ctx.state.questoes || []).filter((q: any) => q.topicId === topicId);
    const totalQuestions = topicQuestions.reduce(
      (sum: number, q: any) => sum + (Number(q.total) || 0),
      0
    );
    const correctCount = topicQuestions.reduce(
      (sum: number, q: any) => sum + (Number(q.correct) || 0),
      0
    );
    const reviewsCount = (ctx.state.reviewAgenda || []).filter(
      (r: any) => r.topicId === topicId && r.status === 'Concluído'
    ).length;
    const errorCount = (ctx.state.errorNotebook || []).filter(
      (e: any) => e.topicId === topicId
    ).length;
    const lastSession = [...(ctx.state.studySessions || [])]
      .filter((s: any) => s.topicId === topicId)
      .sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')))[0];
    const lastSessionSummary = lastSession
      ? `Última sessão em ${lastSession.date} (${Math.max(1, Math.round((Number(lastSession.duration) || 0) / 60))} min)`
      : null;

    const snapshot = buildTopicIntelligence({
      subject,
      topic,
      questionStats: { totalQuestions, correctCount },
      reviewsCount,
      retentionInfo: lastSession?.date ? { lastActivityLocalDate: lastSession.date } : null,
      source: 'subjects',
    });

    let modalMount = ctx.document.getElementById('topicIntelligenceModalMount');
    if (!modalMount && ctx.document.body) {
      modalMount = ctx.document.createElement('div');
      modalMount.id = 'topicIntelligenceModalMount';
      ctx.document.body.appendChild(modalMount);
    }
    if (!modalMount) return;

    const close = () => {
      mountPreact(
        h(TopicIntelligenceModal, {
          open: false,
          snapshot: null,
          onClose: close,
        }),
        modalMount!
      );
    };

    mountPreact(
      h(TopicIntelligenceModal, {
        open: true,
        snapshot,
        lastSessionSummary,
        errorCount,
        onStartTopic: (subId: string, topId: string) => {
          close();
          if (ctx.state.activeTimer) {
            Object.assign(ctx.state.activeTimer, {
              subjectId: subId,
              topicId: topId,
              type: 'study',
            });
          }
          if (ctx.populateTimerContextControls) ctx.populateTimerContextControls();
          if (ctx.startTimer) ctx.startTimer();
          if (ctx.openStudyTimerFocus) ctx.openStudyTimerFocus();
        },
        onClose: close,
      }),
      modalMount
    );
  }

  function startTopicStudy(subjectId: string, topicId: string): void {
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
        link: t.link || '',
        customPracticeUrl: t.customPracticeUrl || '',
        lastLawReadAt: t.lastLawReadAt || null,
        legislativeUpdatePending: Boolean(t.legislativeUpdatePending),
        legislativeUpdateNote: t.legislativeUpdateNote || null,
      })),
    }));

    mountPreact(
      h(VerticalizedSyllabusView, {
        subjects: subjectsData,
        todayDate: ctx.todayISO?.() || '',
        targetBanca: ctx.state.examBlueprint?.banca || null,
        onMarkLawRead: (topicId: string) => {
          const found = ctx.getTopicById?.(topicId);
          if (!found) return;
          const currentChecklist = found.topic.stageChecklist || {
            theoryDone: false,
            summaryDone: false,
            lawOrNotesDone: false,
            questionsDone: false,
          };
          ctx.subjectService.updateTopic(found.subject.id, topicId, {
            lastLawReadAt: ctx.todayISO?.() || null,
            legislativeUpdatePending: false,
            legislativeUpdateNote: null,
            stageChecklist: { ...currentChecklist, lawOrNotesDone: true },
          });
          ctx.persistAndRender();
          ctx.showToast?.('Leitura de lei seca registrada para hoje.');
        },
        onToggleLegislativeUpdate: (topicId: string, pending: boolean) => {
          const found = ctx.getTopicById?.(topicId);
          if (!found) return;
          ctx.subjectService.updateTopic(found.subject.id, topicId, {
            legislativeUpdatePending: pending,
            status: pending && found.topic.status === 'Concluído' ? 'Revisão' : found.topic.status,
          });
          ctx.persistAndRender();
        },
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
        onStartStudy: startTopicStudy,
        onOpenTopicIntelligence: (subjectId: string, topicId: string) => {
          openTopicIntelligenceModal(subjectId, topicId);
        },
        postEditalContext: {
          equivalences: ctx.state.topicEquivalences || [],
          sessions: ctx.state.studySessions || [],
          questions: ctx.state.questoes || [],
          blueprintSubjects: ctx.state.examBlueprint?.subjects || [],
          daysToExam:
            ctx.state.examDate && ctx.diasParaRevisao
              ? ctx.diasParaRevisao(ctx.state.examDate)
              : null,
          weeklyAvailableMinutes: Math.round(
            (Object.values(ctx.state.metas?.horasPorDia || {}).reduce<number>(
              (s, h) => s + (Number(h) || 0),
              0
            ) || (Number(ctx.state.metas?.horasDiarias) || 0) * 7) * 60
          ),
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
                  (existing: Topic) =>
                    existing.name.trim().toLowerCase() === t.name.trim().toLowerCase()
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

  function updateLaw(id: string, change: (law: LawRecord) => LawRecord, message: string): void {
    const laws: LawRecord[] = ctx.state.lawNotebook || [];
    const index = laws.findIndex(law => law.id === id);
    if (index < 0) return;
    laws[index] = change(laws[index]);
    ctx.persistAndRender();
    ctx.showToast(message);
  }

  function renderLawNotebook(): void {
    const mount = ctx.document.getElementById('lawNotebookMount');
    if (!mount) return;
    if (!Array.isArray(ctx.state.lawNotebook)) ctx.state.lawNotebook = [];
    mountPreact(
      h(LawNotebookCard, {
        laws: ctx.state.lawNotebook,
        subjects: (ctx.state.subjects || [])
          .filter((subject: Subject) => !subject.archived)
          .map((subject: Subject) => ({ id: subject.id, name: subject.name })),
        today: todayISO(),
        onAdd: input => {
          ctx.state.lawNotebook!.push({
            id: uid('law'),
            ...input,
            currentArticle: 0,
            laps: 0,
            lastReadAt: null,
            lapCompletedAt: null,
            createdAt: nowISO(),
          });
          ctx.persistAndRender();
          ctx.showToast('Lei adicionada ao caderno.');
        },
        onRead: (id, article) =>
          updateLaw(id, law => registerLawReading(law, article, todayISO()), 'Leitura registrada.'),
        onCompleteLap: id =>
          updateLaw(id, law => completeLawLap(law, todayISO()), 'Volta concluída.'),
        onDelete: id => {
          const law = ctx.state.lawNotebook!.find((item: LawRecord) => item.id === id);
          runUndoable(`Lei "${law?.name || ''}" excluída.`, () => {
            ctx.state.lawNotebook = ctx.state.lawNotebook!.filter(
              (item: LawRecord) => item.id !== id
            );
          });
        },
      }),
      mount
    );
  }

  function renderJurisprudenceNotebook(): void {
    const mount = ctx.document.getElementById('jurisprudenceNotebookMount');
    if (!mount) return;
    if (!Array.isArray(ctx.state.jurisprudenceNotebook)) {
      ctx.state.jurisprudenceNotebook = [];
    }
    const list: JurisprudenceRecord[] = ctx.state.jurisprudenceNotebook;
    mountPreact(
      h(JurisprudenceNotebookCard, {
        records: list,
        subjects: (ctx.state.subjects || [])
          .filter((subject: Subject) => !subject.archived)
          .map((subject: Subject) => ({ id: subject.id, name: subject.name })),
        today: todayISO(),
        onAdd: entry => {
          ctx.state.jurisprudenceNotebook!.push({
            id: uid('juris'),
            ...entry,
            topicId: null,
            laps: 0,
            lastReadAt: null,
            nextReviewDate: null,
            createdAt: nowISO(),
          });
          ctx.persistAndRender();
          ctx.showToast('Julgado adicionado ao caderno de jurisprudência.');
        },
        onReview: id => {
          const idx = ctx.state.jurisprudenceNotebook!.findIndex(
            (item: JurisprudenceRecord) => item.id === id
          );
          if (idx < 0) return;
          ctx.state.jurisprudenceNotebook![idx] = registerJurisprudenceReading(
            ctx.state.jurisprudenceNotebook![idx],
            todayISO()
          );
          ctx.persistAndRender();
          ctx.showToast('Revisão de jurisprudência registrada.');
        },
        onDelete: id => {
          const target = ctx.state.jurisprudenceNotebook!.find(
            (item: JurisprudenceRecord) => item.id === id
          );
          runUndoable(`Julgado "${target?.code || ''}" excluído.`, () => {
            ctx.state.jurisprudenceNotebook = ctx.state.jurisprudenceNotebook!.filter(
              (item: JurisprudenceRecord) => item.id !== id
            );
          });
        },
      }),
      mount
    );
  }

  function renderSubjects(): void {
    const currentSubtab: SubjectsSubtabKey = verticalizedSyllabusActive
      ? 'verticalizado'
      : activeSubtab;
    const subtabsMount = ctx.document.getElementById('subjectsSubtabsMount');
    if (subtabsMount) {
      mountPreact(
        h(SubjectsSubtabsNav, {
          activeSubtab: currentSubtab,
          onSelectSubtab: selectSubjectsSubtab,
        }),
        subtabsMount
      );
    }
    const materiasPanel = ctx.document.getElementById('subjectsPanel-materias');
    const container = ctx.document.getElementById('subjectsContainer');
    const mount = ctx.document.getElementById('verticalizedSyllabusMount');
    const lawCard = ctx.document.getElementById('lawNotebookCard');
    const jurisCard = ctx.document.getElementById('jurisprudenceNotebookCard');
    const addSubjectBtn = ctx.document.getElementById('addSubjectBtn');
    const importMenuMount = ctx.document.getElementById('subjectsImportMenuMount');

    if (materiasPanel) materiasPanel.hidden = currentSubtab !== 'materias';
    if (mount) mount.hidden = currentSubtab !== 'verticalizado';
    if (lawCard) lawCard.hidden = currentSubtab !== 'leis';
    if (jurisCard) jurisCard.hidden = currentSubtab !== 'jurisprudencia';
    if (addSubjectBtn) addSubjectBtn.hidden = currentSubtab !== 'materias';
    if (importMenuMount) importMenuMount.hidden = currentSubtab !== 'materias';

    if (currentSubtab === 'verticalizado') {
      if (container) container.hidden = true;
      if (mount) renderVerticalizedSyllabus();
      return;
    }

    if (mount) {
      unmountPreact(mount);
      mount.hidden = true;
    }

    if (currentSubtab === 'leis') {
      if (container) container.hidden = true;
      renderLawNotebook();
      return;
    }

    if (currentSubtab === 'jurisprudencia') {
      if (container) container.hidden = true;
      renderJurisprudenceNotebook();
      return;
    }

    const quickStatsEl = ctx.document.getElementById('quickStats');
    if (quickStatsEl && ctx.allTopics) {
      mountPreact(h(QuickStatsGrid, buildTopicStatusSummary(ctx.allTopics())), quickStatsEl);
    }
    if (!container) return;
    container.hidden = false;

    const controller = createSubjectsController({
      state: ctx.state,
      subjectSearchController: ctx.subjectSearchController,
      subjectExamFilter,
      subjectTopicFilters,
      subjectTopicPages,
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
      today: todayISO(),
    });

    if (typeof document !== 'undefined') {
      mountPreact(controller.buildVNode(), container);
    } else {
      container.innerHTML = controller.renderHtml();
    }
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

  function updateTopicStrategy(
    subjectId: string,
    topicId: string,
    field: string,
    value: any
  ): void {
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

  function toggleAllSubjects(): void {
    const active = (ctx.state.subjects || []).filter((s: any) => !s.archived);
    if (!active.length) return;
    const anyExpanded = active.some((s: any) => !s.collapsed);
    active.forEach((s: any) => {
      s.collapsed = anyExpanded;
    });
    ctx.persistAndRender();
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

  function promptRenameSubject(id: string): void {
    const found = ctx.getSubjectById(id);
    ctx.showPrompt(
      'Renomear disciplina',
      {
        label: 'Nome da disciplina',
        initialValue: found?.name || '',
        confirmLabel: 'Salvar',
        validate: (name: string) => (!name.trim() ? 'Informe o nome da disciplina.' : null),
      },
      newName => renameSubject(id, newName)
    );
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

  function setSubjectColor(id: string, value: unknown): void {
    const color = Number(value);
    const subject = ctx.getSubjectById(id);
    if (!subject || !isSubjectColor(color) || subject.color === color) return;
    subject.color = color;
    ctx.persistAndRender();
  }

  function archiveSubject(id: string): void {
    const subject = ctx.getSubjectById(id);
    if (!subject) return ctx.showToast('Disciplina não encontrada.');
    runUndoable(`"${subject.name}" foi arquivada.`, () => ctx.subjectService.archive(id));
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
        (item: any) =>
          entitySubjectId(item) === subjectId || topicIds.has((item.topicId || item.topicRef)!)
      ).length,
      goals: (ctx.state.metasPorDisciplina || []).filter(
        (item: any) => entitySubjectId(item) === subjectId
      ).length,
      history: ctx.topicHistoryService
        ? ctx.topicHistoryService
            .list({ includeLifecycle: false })
            .filter((item: any) => item.subjectId === subjectId || topicIds.has(item.topicId))
            .length
        : 0,
      simulatedBreakdowns: (ctx.state.simulados || []).reduce(
        (sum: number, sim: any) =>
          sum +
          (sim.breakdown || []).filter((item: any) => entitySubjectId(item) === subjectId).length,
        0
      ),
      activeTimer:
        ctx.state.activeTimer?.subjectId === subjectId ||
        topicIds.has(ctx.state.activeTimer?.topicId!)
          ? 1
          : 0,
    };
  }

  function dependencyTotal(dependencies: Record<string, any>): number {
    return Object.values(dependencies).reduce<number>(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
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
    ctx.showConfirm(
      `Excluir definitivamente "${subject.name}"? Esta ação não pode ser desfeita.`,
      () => {
        ctx.subjectService.remove(id);
        ctx.persistAndRender();
        ctx.showToast('Disciplina excluída definitivamente.');
      },
      undefined,
      { title: 'Excluir disciplina?', confirmLabel: 'Excluir disciplina' }
    );
  }

  function addTopic(subjectId: string): void {
    ctx.subjectService.addTopic(subjectId);
    // O tópico novo entra no fim: abre a última página da disciplina (limitada ao renderizar).
    subjectTopicPages.set(subjectId, Number.MAX_SAFE_INTEGER);
    ctx.persistAndRender();
    // Leva o usuário direto a nomear o tópico recém-criado.
    const body = ctx.document.getElementById(`subject-body-${subjectId}`);
    const inputs = body?.querySelectorAll?.<HTMLInputElement>('input[aria-label="Nome do tópico"]');
    const last = inputs && inputs.length ? inputs[inputs.length - 1] : null;
    if (last) {
      last.focus();
      last.select();
    }
  }

  function archiveTopic(subjectId: string, topicId: string): void {
    const found = ctx.getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    runUndoable(`Tópico "${found.topic.name || 'sem nome'}" arquivado.`, () =>
      ctx.subjectService.archiveTopic(subjectId, topicId)
    );
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
      sessions: (ctx.state.studySessions || []).filter((item: any) => item.topicId === topicId)
        .length,
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
    runUndoable(`Tópico "${found.topic.name || 'sem nome'}" excluído.`, () =>
      ctx.subjectService.removeTopic(subjectId, topicId)
    );
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
      (review: any) =>
        (review.topicId || review.topicRef) === topicId && review.status === 'Concluído'
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
    if (newStatus === 'Concluído') {
      ctx.showToast?.('Tópico concluído. Gere as revisões na aba Agenda de revisões.');
    }
  }

  function bindEvents(): void {
    ctx.document.getElementById('addSubjectBtn')?.addEventListener('click', () => addSubject());
    ctx.document
      .getElementById('loadDefaultSubjectsBtn')
      ?.addEventListener('click', () => ctx.openExamImport?.());
    ctx.document
      .getElementById('subjectsContainer')
      ?.addEventListener('keydown', (event: KeyboardEvent) => {
        const target = (event.target as HTMLElement | null)?.closest?.(
          '.exam-scope-filter.ui-segmented .ui-segmented__item'
        ) as HTMLElement | null;
        if (!target || event.altKey || event.ctrlKey || event.metaKey) return;
        const group = target.closest('.exam-scope-filter.ui-segmented');
        if (!group) return;
        const items = [...group.querySelectorAll<HTMLElement>('.ui-segmented__item')];
        const nextIndex = getRovingTabIndex(
          items.indexOf(target),
          event.key,
          items.length,
          'horizontal',
          idx => Boolean((items[idx] as HTMLButtonElement | undefined)?.disabled)
        );
        if (nextIndex === null) return;
        event.preventDefault();
        const nextValue = items[nextIndex]?.dataset?.examFilter;
        if (!nextValue) return;
        setSubjectExamFilter(nextValue);
        (
          ctx.document.querySelector(
            `.exam-scope-filter [data-exam-filter="${nextValue}"]`
          ) as HTMLElement | null
        )?.focus();
      });
  }

  return {
    bindEvents,
    isVerticalizedSyllabusActive,
    setVerticalizedSyllabusActive,
    renderVerticalizedSyllabus,
    renderSubjects,
    getSubjectExamFilter,
    setSubjectExamFilter,
    clearSubjectFilters,
    toggleNotes,
    setSubjectTopicFilter,
    examBadges,
    updateTopicTags,
    updateTopicStrategy,
    toggleTopicPrerequisite,
    renderTopicStrategyEditor,
    renderTopicAnalyticsState,
    moveSubject,
    duplicateSubject,
    setSubjectColor,
    toggleSubject,
    toggleAllSubjects,
    startTopicStudy,
    renameSubject,
    promptRenameSubject,
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
    subjectTopicPages,
    subjectTopicFilters,
  };
}
