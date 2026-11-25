import { h } from 'preact';
import { mountPreact } from '../../preact-mount.js';
import { createQuestionController } from '../../../application/questions/question-controller.js';
import { createEditableCollectionController } from '../../controllers/editable-collection-controller.js';
import { buildQuestionViewModel } from '../../view-models/question-view-model.js';
import { createQuestionsController } from './questions-controller.js';
import { PlateauDetectorCard } from './PlateauDetectorCard.js';
import { buildPlateauDetectorViewModel } from '../../../application/analytics/build-plateau-detector-view-model.js';
import { runUndoable } from '../../undoable.js';
import { DEFAULT_PAGE_SIZE } from '../../progressive-list.js';
import { normalizeBanca, normalizeQuestionMinutes } from '../../../domain/questions/bancas.js';
import { addLocalDays } from '../../../core/date-utils.js';
import {
  normalizeQuestionBlank,
  questionErrorCount,
} from '../../../domain/diagnostics/error-categories.js';
import {
  buildExamFitAnalysis,
  EXAM_FIT_WINDOW_DAYS,
} from '../../../application/questions/build-exam-fit-analysis.js';
import { ExamFitCard, CebraspeRiskStrip } from './ExamFitCard.js';
import {
  QuickQuestionEntryBar,
  type QuickQuestionEntryPayload,
} from '../../components/QuickQuestionEntryBar.js';

export function calcAcertoPct(correct: number, resolved: number): number {
  const r = Number(resolved) || 0;
  const c = Number(correct) || 0;
  if (r <= 0) return 0;
  return Math.round((c / r) * 1000) / 10;
}

export function cloneRecord<T>(record: T): T | null {
  return record ? JSON.parse(JSON.stringify(record)) : null;
}

export interface QuestionsTabControllerContext {
  document: Document;
  window?: Window;
  state: any;
  listViewState: {
    questionsPage: number;
    simulationsPage: number;
    [key: string]: any;
  };
  questionService: any;
  errorCategories: Record<string, { icon: string; label: string }>;
  errorNotebookController?: any;
  renderQuestionAnalytics?: () => void;
  simulationEditController?: any;
  openBreakdownIds?: Set<string>;
  persistAndRender: () => void;
  showToast: (msg: string) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
  formatDatePt: (dateStr: string) => string;
  getSubjectName?: (id: string) => string;
  getTopicName?: (id: string) => string;
  entitySubjectId?: (item: any) => string | null;
  activeSubjects: () => any[];
  subjectsForSelection?: (selectedId?: string | null) => any[];
  topicsForSelection?: (subjectId?: string | null, selectedTopicId?: string | null) => any[];
  isMobileLayout?: () => boolean;
  uid?: (prefix: string) => string;
  todayISO?: () => string;
  nowISO?: () => string;
  activateTab?: (tab: string) => void;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
}

export function createQuestionsTabController(ctx: QuestionsTabControllerContext) {
  const openQuestionErrorIds = new Set<string>();

  const uid =
    ctx.uid ||
    ((prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const nowISO = ctx.nowISO || (() => new Date().toISOString());
  const todayISO = ctx.todayISO || (() => new Date().toISOString().slice(0, 10));
  const escapeHtml =
    ctx.escapeHtml ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
      ));
  const escapeAttr =
    ctx.escapeAttr ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
      ));
  const entitySubjectId =
    ctx.entitySubjectId || ((item: any) => item?.subjectId || item?.subjectRef || null);
  const getSubjectName = ctx.getSubjectName || ((_id: string) => 'Disciplina');
  const getTopicName = ctx.getTopicName || ((_id: string) => 'Tópico');

  function emptyErrorBreakdown(): Record<string, number> {
    return Object.fromEntries(Object.keys(ctx.errorCategories).map(key => [key, 0]));
  }

  function normalizeErrorBreakdown(question: Record<string, any>): Record<string, number> {
    const normalized = emptyErrorBreakdown();
    Object.keys(normalized).forEach(key => {
      normalized[key] = Math.max(0, Math.floor(Number(question?.errorBreakdown?.[key]) || 0));
    });
    const realErrors = questionErrorCount(question);
    let excess = Object.values(normalized).reduce((sum, value) => sum + value, 0) - realErrors;
    [...Object.keys(normalized)].reverse().forEach(key => {
      if (excess <= 0) return;
      const cut = Math.min(normalized[key], excess);
      normalized[key] -= cut;
      excess -= cut;
    });
    question.errorBreakdown = normalized;
    return normalized;
  }

  const questionCrudController = createQuestionController({
    service: ctx.questionService,
    onChange: () => {},
  });

  const questionEditController = createEditableCollectionController({
    service: ctx.questionService,
    clone: cloneRecord,
    render: renderQuestoes,
    normalize: (draft: Record<string, any>) => {
      draft.resolved = Math.max(0, Math.floor(Number(draft.resolved) || 0));
      draft.correct = Math.max(0, Math.min(Math.floor(Number(draft.correct) || 0), draft.resolved));
      draft.blank = normalizeQuestionBlank(draft);
      normalizeErrorBreakdown(draft);
      draft.banca = normalizeBanca(draft.banca);
      draft.minutes = normalizeQuestionMinutes(draft.minutes);
      draft.retry = draft.retry === true;
      return draft;
    },
    onSaved: () => {
      ctx.persistAndRender();
      ctx.showToast('Registro atualizado.');
    },
  });

  function toggleQuestionErrors(id: string): void {
    if (openQuestionErrorIds.has(id)) {
      openQuestionErrorIds.delete(id);
    } else {
      openQuestionErrorIds.add(id);
    }
    renderQuestoes();
    if (ctx.renderQuestionAnalytics) {
      ctx.renderQuestionAnalytics();
    }
  }

  function questionCategorizedErrors(question: Record<string, any>): number {
    return Object.values(normalizeErrorBreakdown(question)).reduce((sum, value) => sum + value, 0);
  }

  function questionViewModel(q: Record<string, any>) {
    return buildQuestionViewModel(q, {
      formatDate: ctx.formatDatePt,
      getSubjectName,
      getTopicName,
      subjectIdOf: entitySubjectId,
      accuracy: calcAcertoPct,
    });
  }

  function editQuestion(id: string): void {
    questionEditController.begin(id);
  }

  function cancelQuestionEdit(): void {
    questionEditController.cancel();
  }

  function updateQuestionDraft(field: string, value: any): void {
    const draft = questionEditController.state.draft;
    if (!draft) return;
    questionEditController.update(
      field,
      field === 'resolved' || field === 'correct' || field === 'blank'
        ? Math.max(0, Math.floor(Number(value) || 0))
        : value
    );
    if (
      field === 'subjectId' &&
      draft.topicId &&
      ctx.topicsForSelection &&
      !ctx.topicsForSelection(value, draft.topicId).some((t: any) => t.id === draft.topicId)
    ) {
      draft.topicId = null;
    }
    if (field === 'resolved' || field === 'correct') clampDraftCorrect();
    if (field === 'subjectId') renderQuestoes();
  }

  // Correct answers never exceed resolved ones; typing keeps focus, so only the other field is patched.
  function clampDraftCorrect(): void {
    const draft = questionEditController.state.draft;
    if (!draft || draft.correct <= draft.resolved) return;
    draft.correct = draft.resolved;
    const input = ctx.document.getElementById('questionDraft-correct') as HTMLInputElement | null;
    if (input) input.value = String(draft.correct);
  }

  function stepQuestionDraft(field: 'resolved' | 'correct', delta: number): void {
    const draft = questionEditController.state.draft;
    if (!draft) return;
    const next = Math.max(0, (Number(draft[field]) || 0) + delta);
    questionEditController.update(
      field,
      field === 'correct' ? Math.min(next, draft.resolved) : next
    );
    clampDraftCorrect();
    renderQuestoes();
    (ctx.document.getElementById(`questionDraft-${field}`) as HTMLInputElement | null)?.focus();
  }

  function saveQuestionEdit(): void {
    if (!questionEditController.save()) cancelQuestionEdit();
  }

  function renderQuestoes(): void {
    const body = ctx.document.getElementById('questoesBody');
    if (!body) return;

    if (ctx.errorNotebookController && ctx.errorNotebookController.syncView?.()) {
      return;
    }

    const controller = createQuestionsController({
      state: ctx.state,
      listViewState: ctx.listViewState,
      questionEditController,
      simulationEditController: ctx.simulationEditController || {
        state: { editingId: null, draft: null },
      },
      openQuestionErrorIds,
      openBreakdownIds: ctx.openBreakdownIds || new Set(),
      errorCategories: ctx.errorCategories,
      isMobileLayout: ctx.isMobileLayout,
      questionViewModel,
      questionCategorizedErrors,
      getSubjectOptionsHtml: subjectId =>
        (ctx.subjectsForSelection ? ctx.subjectsForSelection(subjectId) : [])
          .map(
            (s: any) =>
              `<option value="${escapeAttr(s.id)}" ${s.id === subjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
          )
          .join(''),
      getTopicOptionsHtml: (subjectId, topicId) =>
        (ctx.topicsForSelection ? ctx.topicsForSelection(subjectId, topicId) : [])
          .map(
            (t: any) =>
              `<option value="${escapeAttr(t.id)}" ${t.id === topicId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`
          )
          .join(''),
    });

    body.innerHTML = controller.renderQuestionsHtml();

    const quickEntryMount = ctx.document.getElementById('quickQuestionEntryMount');
    if (quickEntryMount) {
      const activeSubjects = (
        ctx.subjectsForSelection ? ctx.subjectsForSelection() : ctx.activeSubjects()
      ) as Array<{ id: string; name: string }>;
      const newestWithSubject = [
        ...((ctx.state.questoes || []) as Array<{
          createdAt?: string;
          date?: string;
          subjectId?: string | null;
          banca?: string | null;
        }>),
      ]
        .sort((a, b) =>
          String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || ''))
        )
        .find(q => q.subjectId && activeSubjects.some(s => s.id === q.subjectId));
      const defaultBanca = ctx.state.examBlueprint?.banca || newestWithSubject?.banca || null;
      mountPreact(
        h(QuickQuestionEntryBar, {
          subjects: activeSubjects,
          topicsForSubject: (subId: string) =>
            ctx.topicsForSelection ? ctx.topicsForSelection(subId, null) : [],
          defaultSubjectId: newestWithSubject?.subjectId || activeSubjects[0]?.id || null,
          defaultBanca,
          onSaveEntry: (entry: QuickQuestionEntryPayload) => {
            runUndoable('Questões registradas no histórico.', () => {
              questionCrudController.create({
                id: uid('question'),
                date: todayISO(),
                subjectId: entry.subjectId,
                topicId: entry.topicId,
                resolved: entry.resolved,
                correct: entry.correct,
                blank:
                  entry.blank != null
                    ? entry.blank
                    : ctx.state.examBlueprint?.scoringMode === 'certo-errado'
                      ? 0
                      : null,
                errorBreakdown: emptyErrorBreakdown(),
                banca: entry.banca,
                minutes: entry.minutes,
                retry: entry.retry,
                recommendationId: null,
                createdAt: nowISO(),
              });
            });
          },
        }),
        quickEntryMount
      );
    }

    const examFitModel = buildExamFitAnalysis({
      questions: ctx.state.questoes || [],
      subjects: ctx.state.subjects || [],
      blueprint: ctx.state.examBlueprint || null,
      fromDate: addLocalDays(todayISO(), 1 - EXAM_FIT_WINDOW_DAYS) || todayISO(),
    });
    const cebraspeStripMount = ctx.document.getElementById('cebraspeRiskStripMount');
    if (cebraspeStripMount) {
      if (examFitModel.risk) {
        cebraspeStripMount.hidden = false;
        mountPreact(h(CebraspeRiskStrip, { risk: examFitModel.risk }), cebraspeStripMount);
      } else {
        cebraspeStripMount.hidden = true;
        if (typeof cebraspeStripMount.replaceChildren === 'function') {
          cebraspeStripMount.replaceChildren();
        }
      }
    }
    const examFitMount = ctx.document.getElementById('examFitMount');
    if (examFitMount) {
      mountPreact(h(ExamFitCard, { model: examFitModel }), examFitMount);
    }

    const plateauMount = ctx.document.getElementById('plateauDetectorMount');
    if (plateauMount) {
      const plateauModel = buildPlateauDetectorViewModel({
        subjects: ctx.state.subjects || [],
        questoes: ctx.state.questoes || [],
      });
      mountPreact(
        h(PlateauDetectorCard, {
          model: plateauModel,
          onOpenErrorNotebook: () => {
            const toggle = ctx.document.getElementById('errorNotebookToggleBtn');
            toggle?.click();
          },
          onScheduleReview: () => {
            if (ctx.activateTab) ctx.activateTab('agenda');
          },
        }),
        plateauMount
      );
    }
  }

  function addQuestaoRow(initial: any = {}) {
    // The subject of the latest record comes first: most sessions log the same subject in a row.
    const active = ctx.activeSubjects();
    const newestFirst = [...(ctx.state.questoes || [])].sort((x: any, y: any) =>
      String(y.createdAt || y.date).localeCompare(String(x.createdAt || x.date))
    );
    const lastSubjectId = newestFirst.find(
      (q: any) => q.subjectId && active.some((s: any) => s.id === q.subjectId)
    )?.subjectId;
    // Quem treina para uma prova costuma repetir a banca: a última usada já vem preenchida.
    const lastBanca = newestFirst.find((q: any) => q.banca)?.banca || null;
    const subjectId = initial.subjectId || lastSubjectId || active[0]?.id || null;
    // Com um único tópico possível, já o seleciona para reduzir o atrito do primeiro registro.
    let topicId = initial.topicId || null;
    if (!topicId && subjectId && ctx.topicsForSelection) {
      const options = ctx.topicsForSelection(subjectId, null) || [];
      if (options.length === 1) topicId = options[0].id;
    }
    const question = {
      id: uid('question'),
      date: todayISO(),
      subjectId,
      topicId,
      resolved: 0,
      correct: 0,
      errorBreakdown: emptyErrorBreakdown(),
      banca: initial.banca || lastBanca,
      minutes: null,
      retry: false,
      // Na prova certo/errado o branco é parte do registro; nas demais fica ausente.
      blank: ctx.state.examBlueprint?.scoringMode === 'certo-errado' ? 0 : null,
      recommendationId: initial.recommendationId || null,
      createdAt: nowISO(),
    };
    questionCrudController.create(question);
    // A linha nova entra em edição na página em que a ordenação por data a colocar.
    const index = [...(ctx.state.questoes || [])]
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
      .findIndex((item: any) => item.id === question.id);
    ctx.listViewState.questionsPage = Math.floor(Math.max(0, index) / DEFAULT_PAGE_SIZE) + 1;
    questionEditController.begin(question.id, { isNew: true });
    return question;
  }

  function deleteQuestaoRow(id: string): void {
    runUndoable('Registro excluído.', () => {
      questionCrudController.remove(id);
      openQuestionErrorIds.delete(id);
      questionEditController.reset();
    });
  }

  function updateQuestionError(id: string, key: string, value: any): void {
    const question = (ctx.state.questoes || []).find((q: any) => q.id === id);
    if (!question || !ctx.errorCategories[key]) return;
    normalizeErrorBreakdown(question);
    const realErrors = questionErrorCount(question);
    const others = Object.entries(question.errorBreakdown!).reduce(
      (sum, [category, count]) => (category === key ? sum : sum + (count as number)),
      0
    );
    const requested = Math.max(0, Math.floor(Number(value) || 0));
    const allowed = Math.max(0, realErrors - others);
    question.errorBreakdown![key] = Math.min(requested, allowed);
    if (requested > allowed) ctx.showToast('A categorização foi limitada ao total real de erros.');
    ctx.persistAndRender();
  }

  function bindEvents(): void {
    ctx.document
      .getElementById('addQuestaoRowBtn')
      ?.addEventListener('click', () => addQuestaoRow());
    ctx.document.getElementById('errorNotebookToggleBtn')?.addEventListener('click', () => {
      ctx.errorNotebookController?.toggle();
      renderQuestoes();
    });
    ctx.document.getElementById('pastePlatformStatsBtn')?.addEventListener('click', () => {
      const toggle = ctx.document.getElementById('quickQuestionPasteToggleBtn') as HTMLButtonElement | null;
      if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
        toggle.click();
      }
      queueMicrotask(() => {
        (ctx.document.getElementById('quickQuestionPasteTextarea') as HTMLTextAreaElement | null)?.focus?.();
      });
    });
  }

  return {
    bindEvents,
    openQuestionErrorIds,
    questionEditController,
    questionCrudController,
    emptyErrorBreakdown,
    normalizeErrorBreakdown,
    toggleQuestionErrors,
    questionCategorizedErrors,
    questionViewModel,
    editQuestion,
    cancelQuestionEdit,
    updateQuestionDraft,
    stepQuestionDraft,
    saveQuestionEdit,
    renderQuestoes,
    addQuestaoRow,
    deleteQuestaoRow,
    updateQuestionError,
  };
}
