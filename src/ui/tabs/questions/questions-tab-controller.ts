import { createQuestionController } from '../../../application/questions/question-controller.js';
import { createEditableCollectionController } from '../../controllers/editable-collection-controller.js';
import { buildQuestionViewModel } from '../../view-models/question-view-model.js';
import { createQuestionsController } from './questions-controller.js';

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
    questionsVisible: number;
    simulationsVisible: number;
    [key: string]: any;
  };
  LIST_VIEW_STEPS: {
    questions: number;
    simulations: number;
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
  renderListViewFooter?: (
    total: number,
    visible: number,
    step: number,
    moreAction: string,
    lessAction: string,
    colSpan: number,
    label: string
  ) => string;
  isMobileLayout?: () => boolean;
  uid?: (prefix: string) => string;
  todayISO?: () => string;
  nowISO?: () => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
}

export function createQuestionsTabController(ctx: QuestionsTabControllerContext) {
  const openQuestionErrorIds = new Set<string>();

  const uid = ctx.uid || ((prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const nowISO = ctx.nowISO || (() => new Date().toISOString());
  const todayISO = ctx.todayISO || (() => new Date().toISOString().slice(0, 10));
  const escapeHtml = ctx.escapeHtml || ((str: string) => String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c));
  const escapeAttr = ctx.escapeAttr || ((str: string) => String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c));
  const entitySubjectId = ctx.entitySubjectId || ((item: any) => item?.subjectId || item?.subjectRef || null);
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
    const realErrors = Math.max(
      0,
      (Number(question?.resolved) || 0) - (Number(question?.correct) || 0)
    );
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
      normalizeErrorBreakdown(draft);
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
      field === 'resolved' || field === 'correct'
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
    if (field === 'subjectId') renderQuestoes();
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
      simulationEditController: ctx.simulationEditController || { state: { editingId: null, draft: null } },
      openQuestionErrorIds,
      openBreakdownIds: ctx.openBreakdownIds || new Set(),
      errorCategories: ctx.errorCategories,
      isMobileLayout: ctx.isMobileLayout,
      questionViewModel,
      questionCategorizedErrors,
      renderListViewFooter: ctx.renderListViewFooter,
      LIST_VIEW_STEPS: ctx.LIST_VIEW_STEPS,
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
  }

  function addQuestaoRow(initial: any = {}) {
    ctx.listViewState.questionsVisible = ctx.LIST_VIEW_STEPS.questions;
    const question = {
      id: uid('question'),
      date: todayISO(),
      subjectId: initial.subjectId || ctx.activeSubjects()[0]?.id || null,
      topicId: initial.topicId || null,
      resolved: 0,
      correct: 0,
      errorBreakdown: emptyErrorBreakdown(),
      recommendationId: initial.recommendationId || null,
      createdAt: nowISO(),
    };
    questionCrudController.create(question);
    questionEditController.begin(question.id, { isNew: true });
    return question;
  }

  function deleteQuestaoRow(id: string): void {
    ctx.showConfirm('Excluir este registro de questões?', () => {
      questionCrudController.remove(id);
      openQuestionErrorIds.delete(id);
      questionEditController.reset();
      ctx.persistAndRender();
      ctx.showToast('Registro excluído.');
    });
  }

  function updateQuestionError(id: string, key: string, value: any): void {
    const question = (ctx.state.questoes || []).find((q: any) => q.id === id);
    if (!question || !ctx.errorCategories[key]) return;
    normalizeErrorBreakdown(question);
    const realErrors = Math.max(
      0,
      (Number(question.resolved) || 0) - (Number(question.correct) || 0)
    );
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
    ctx.document.getElementById('addQuestaoRowBtn')?.addEventListener('click', () => addQuestaoRow());
    ctx.document.getElementById('errorNotebookToggleBtn')?.addEventListener('click', () => {
      ctx.errorNotebookController?.toggle();
      renderQuestoes();
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
    saveQuestionEdit,
    renderQuestoes,
    addQuestaoRow,
    deleteQuestaoRow,
    updateQuestionError,
  };
}
