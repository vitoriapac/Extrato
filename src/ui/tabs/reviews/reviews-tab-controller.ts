import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { ReviewsTable, type ReviewItem } from './ReviewsTable.js';
import { createReviewViewModel } from '../../view-models/review-view-model.js';
import { renderReviewRead, renderReviewEdit } from '../../renderers/reviews-renderer.js';
import { createReviewsController } from '../../controllers/reviews-controller.js';
import { DEFAULT_LIST_VISIBLE_ITEMS } from '../../progressive-list.js';
import {
  STATUS_CLASS,
  STATUS_OPTIONS,
  DIFFICULTY_CLASS,
  DIFFICULTY_WEIGHT,
  TIPO_AGENDA_OPTIONS,
} from '../../../state/schema.js';
import {
  AGENDA_INTERVALS,
  DIFFICULTY_INTERVALS,
  REVIEW_RATINGS,
  calculateAdaptiveInterval,
  reviewBaseDaysFromType,
} from '../../../domain/reviews.js';
import { parseLocalDate } from '../../../core/date-utils.js';

export interface ReviewsTabControllerContext {
  state: {
    reviewAgenda: ReviewItem[];
    subjects?: any[];
  };
  filters?: {
    subjectId: string;
    status: string;
    month: string;
    type: string;
  };
  reviewAgendaRepo?: any;
  reviewService?: any;
  diagnoseTopic?: (subjectId: string, topicId: string) => any;
  subjectAccuracyTarget?: (subjectId: string) => number;
  getTopicById?: (topicId: string) => { subject: any; topic: any } | null;
  activeTopics?: () => any[];
  activeSubjects?: () => Array<{ id: string; name: string }>;
  subjectsForSelection?: (selectedId?: any) => Array<{ id: string; name: string }>;
  topicsForSelection?: (subjectId?: any, selectedTopicId?: any) => Array<{ id: string; name: string }>;
  entitySubjectId?: (item: any) => string | null;
  getSubjectName?: (id?: any) => string;
  getTopicName?: (id?: any) => string;
  formatDatePt?: (iso?: any) => string;
  todayISO?: () => string;
  nowISO?: () => string;
  uid?: (prefix?: string) => string;
  addHistoryEvent?: (type: any, subjectId: any, topicId?: any, payload?: any) => void;
  refreshTopicReviewStats?: (topicId: string) => void;
  showToast?: (msg: string) => void;
  showConfirm?: (msg: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  persistAndRender?: () => void;
  monthKey?: (date?: any) => string;
  monthLabel?: (key?: any) => string;
  collectMonthKeys?: (items: any[]) => string[];
  diasParaRevisaoPill?: (date?: any, status?: any) => string;
  DIFFICULTY_WEIGHT?: Record<string, number>;
  getTopicDifficulty?: (topicId?: string | null) => string;
  agendaUiState?: {
    editingId: string | null;
    editingIsNew?: boolean;
    draft?: Record<string, any> | null;
    completedExpanded: boolean;
    upcomingVisible: number;
    completedVisible: number;
  };
  renderAgendaReadRow?: (item: ReviewItem) => string;
  renderAgendaEditRow?: (item: ReviewItem) => string;
  renderGroupHeader?: (opts: any) => string;
  renderCollectionFooter?: (opts: any) => string;
  isMobileHistoryLayout?: () => boolean;
  escapeHtml?: (str?: string | null) => string;
  escapeAttr?: (str?: string | null) => string;
  pluralize?: (count: number, singular: string, plural: string) => string;
  document?: any;
}

const defaultEscapeHtml = (str?: string | null) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const defaultEscapeAttr = defaultEscapeHtml;

const defaultPluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? `1 ${singular}` : `${count} ${plural}`;

const defaultTodayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const defaultNowISO = () => new Date().toISOString();

const cloneRecord = <T>(v: T): T => (v ? JSON.parse(JSON.stringify(v)) : v);

export function createReviewsTabController(ctx: ReviewsTabControllerContext) {
  const getDoc = () => ctx.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = ctx.escapeHtml || defaultEscapeHtml;
  const escapeAttr = ctx.escapeAttr || defaultEscapeAttr;
  const pluralize = ctx.pluralize || defaultPluralize;
  const todayISO = ctx.todayISO || defaultTodayISO;
  const nowISO = ctx.nowISO || defaultNowISO;
  const uid = ctx.uid || ((prefix = 'review') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`);
  const formatDatePt = ctx.formatDatePt || ((iso?: string | null) => iso || '—');
  const entitySubjectId = ctx.entitySubjectId || ((item: any) => item?.subjectId || null);
  const getSubjectName = ctx.getSubjectName || ((id?: string | null) => id || '—');
  const getTopicName = ctx.getTopicName || ((_id?: string | null) => '');
  const monthKey = ctx.monthKey || ((date?: string) => (date ? String(date).slice(0, 7) : ''));
  const monthLabel = ctx.monthLabel || ((k: string) => k);
  const collectMonthKeys =
    ctx.collectMonthKeys ||
    ((items: any[]) =>
      Array.from(
        new Set(
          (items || [])
            .map(x => (x.date ? String(x.date).slice(0, 7) : ''))
            .filter(Boolean)
        )
      ).sort());
  const diasParaRevisaoPill =
    ctx.diasParaRevisaoPill || ((_date?: string | null, _status?: string) => '');
  const isMobileHistoryLayout = ctx.isMobileHistoryLayout || (() => false);
  const showToast = ctx.showToast || (() => {});
  const showConfirm = ctx.showConfirm || ((_msg, onConfirm) => onConfirm());
  const persistAndRender = ctx.persistAndRender || (() => {});
  const renderGroupHeader = ctx.renderGroupHeader || (() => '');
  const renderCollectionFooter = ctx.renderCollectionFooter || (() => '');

  const difficultyWeightMap = ctx.DIFFICULTY_WEIGHT || DIFFICULTY_WEIGHT;

  function getTopicDifficulty(topicId?: string | null): string {
    if (ctx.getTopicDifficulty) return ctx.getTopicDifficulty(topicId);
    if (!topicId) return 'Médio';
    for (const s of ctx.state.subjects || []) {
      const t = (s.topics || []).find((x: any) => x.id === topicId);
      if (t) return t.difficulty || 'Médio';
    }
    return 'Médio';
  }

  const agendaUiState = ctx.agendaUiState || {
    upcomingVisible: DEFAULT_LIST_VISIBLE_ITEMS,
    completedVisible: DEFAULT_LIST_VISIBLE_ITEMS,
    completedExpanded: false,
    editingId: null,
    editingIsNew: false,
    draft: null,
  };

  let pendingReviewRatingId: string | null = null;

  function toLocalDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDays(iso: string, days: number): string {
    const d = parseLocalDate(iso);
    if (!d) return '';
    d.setDate(d.getDate() + Number(days || 0));
    return toLocalDateString(d);
  }

  function getFilters() {
    if (ctx.filters) return ctx.filters;
    const doc = getDoc();
    if (!doc) return { subjectId: '', status: '', month: '', type: '' };
    const subjectId = (doc.getElementById('agendaFilterSubject') as HTMLSelectElement)?.value || '';
    const status = (doc.getElementById('agendaFilterStatus') as HTMLSelectElement)?.value || '';
    const month = (doc.getElementById('agendaFilterMes') as HTMLSelectElement)?.value || '';
    const type = (doc.getElementById('agendaFilterTipo') as HTMLSelectElement)?.value || '';
    return { subjectId, status, month, type };
  }

  function getFilteredAndSortedReviews(): ReviewItem[] {
    const today = todayISO();
    const { subjectId, status, month, type } = getFilters();

    return (ctx.state.reviewAgenda || [])
      .filter(a => !subjectId || entitySubjectId(a) === subjectId)
      .filter(a =>
        !status
          ? true
          : status === 'Atrasadas'
            ? Boolean(a.date && a.date < today && a.status !== 'Concluído')
            : a.status === status
      )
      .filter(a => !month || monthKey(a.date) === month)
      .filter(a => !type || a.tipo === type)
      .sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        const wA = (difficultyWeightMap as Record<string, number>)[getTopicDifficulty(a.topicId || a.topicRef)] || 2;
        const wB = (difficultyWeightMap as Record<string, number>)[getTopicDifficulty(b.topicId || b.topicRef)] || 2;
        return wB - wA;
      });
  }

  function getGroupedReviews(rows: ReviewItem[]) {
    const today = todayISO();
    return {
      overdue: rows.filter(item => item.status !== 'Concluído' && item.date && item.date < today),
      today: rows.filter(item => item.status !== 'Concluído' && item.date === today),
      upcoming: rows.filter(
        item => item.status !== 'Concluído' && (!item.date || item.date > today)
      ),
      completed: rows
        .filter(item => item.status === 'Concluído')
        .sort((a, b) =>
          String(b.completedAt || b.date || '').localeCompare(String(a.completedAt || a.date || ''))
        ),
    };
  }

  function agendaViewModel(item: Record<string, any>) {
    const topicId = item.topicId || item.topicRef;
    return createReviewViewModel(item, {
      subjectName: getSubjectName(entitySubjectId(item)),
      topicName: topicId ? getTopicName(topicId) : '',
      difficulty: getTopicDifficulty(topicId),
      formatDate: formatDatePt,
    });
  }

  function renderAgendaReadRow(item: ReviewItem): string {
    if (ctx.renderAgendaReadRow) return ctx.renderAgendaReadRow(item);
    return renderReviewRead({
      item,
      view: agendaViewModel(item),
      mobile: isMobileHistoryLayout(),
      escapeHtml,
      escapeAttr,
      daysPill: diasParaRevisaoPill(item.date, item.status),
      difficultyClass: DIFFICULTY_CLASS,
      statusClass: STATUS_CLASS,
      ratingLabel: (key: string) => (REVIEW_RATINGS as Record<string, any>)[key]?.label || key,
      today: todayISO(),
    });
  }

  function renderAgendaEditRow(item: ReviewItem): string {
    if (ctx.renderAgendaEditRow) return ctx.renderAgendaEditRow(item);
    const draft = agendaUiState.draft;
    const subjectId = entitySubjectId(draft!);
    if (!draft) return '';
    const subjectOpts = ctx.subjectsForSelection ? ctx.subjectsForSelection(subjectId) : [];
    return renderReviewEdit({
      item,
      draft,
      subjectOptions: subjectOpts
        .map(
          subject =>
            `<option value="${escapeAttr(subject.id)}" ${subject.id === subjectId ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
        )
        .join(''),
      topicName: draft.topicId ? getTopicName(draft.topicId) : draft.topic || '',
      typeOptions: TIPO_AGENDA_OPTIONS.map(
        option =>
          `<option value="${option}" ${option === draft.tipo ? 'selected' : ''}>${option}</option>`
      ).join(''),
      statusOptions: STATUS_OPTIONS.map(
        option =>
          `<option value="${option}" ${option === draft.status ? 'selected' : ''}>${option}</option>`
      ).join(''),
      escapeAttr,
    });
  }

  function renderHtml(): string {
    const rows = getFilteredAndSortedReviews();
    const groups = getGroupedReviews(rows);

    return render(
      h(ReviewsTable, {
        groups,
        totalCount: rows.length,
        editingId: agendaUiState.editingId,
        completedExpanded: agendaUiState.completedExpanded,
        upcomingVisibleLimit: agendaUiState.upcomingVisible,
        completedVisibleLimit: agendaUiState.completedVisible,
        renderReadRow: renderAgendaReadRow,
        renderEditRow: renderAgendaEditRow,
        renderGroupHeader: ctx.renderGroupHeader || renderGroupHeader,
        renderFooter: ctx.renderCollectionFooter || renderCollectionFooter,
      })
    );
  }

  function renderAgenda() {
    const doc = getDoc();
    if (!doc) return;
    const body = doc.getElementById('agendaBody');
    if (!body) return;
    body.innerHTML = renderHtml();
  }

  function renderAgendaFilters() {
    const doc = getDoc();
    if (!doc) return;
    const sel = doc.getElementById('agendaFilterSubject') as HTMLSelectElement | null;
    const selMes = doc.getElementById('agendaFilterMes') as HTMLSelectElement | null;
    const selTipo = doc.getElementById('agendaFilterTipo') as HTMLSelectElement | null;
    if (!sel || !selMes || !selTipo) return;

    const current = sel.value;
    sel.innerHTML =
      `<option value="">Todas as disciplinas</option>` +
      (ctx.state.subjects || [])
        .map((s: any) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`)
        .join('');
    sel.value = current;

    const currentMes = selMes.value;
    const meses = collectMonthKeys(ctx.state.reviewAgenda || []);
    selMes.innerHTML =
      `<option value="">Todos os meses</option>` +
      meses.map(k => `<option value="${k}">${monthLabel(k)}</option>`).join('');
    selMes.value = currentMes;

    const currentTipo = selTipo.value;
    selTipo.innerHTML =
      `<option value="">Todos os tipos</option>` +
      TIPO_AGENDA_OPTIONS.map(o => `<option value="${o}">${o}</option>`).join('');
    selTipo.value = currentTipo;
  }

  function toggleCompletedReviews() {
    agendaUiState.completedExpanded = !agendaUiState.completedExpanded;
    renderAgenda();
  }

  function changeAgendaLimit(group: string, delta: number) {
    const key = `${group}Visible` as 'upcomingVisible' | 'completedVisible';
    const minimum = DEFAULT_LIST_VISIBLE_ITEMS;
    agendaUiState[key] = Number(delta) > 0 ? Number.MAX_SAFE_INTEGER : minimum;
    renderAgenda();
  }

  function resetAgendaLimit(group: string) {
    const key = `${group}Visible` as 'upcomingVisible' | 'completedVisible';
    agendaUiState[key] = DEFAULT_LIST_VISIBLE_ITEMS;
    renderAgenda();
  }

  function addAgendaRow() {
    const activeSub = ctx.activeSubjects ? ctx.activeSubjects()[0]?.id : null;
    const item = ctx.reviewService
      ? ctx.reviewService.createManualReview({ subjectId: activeSub || null })
      : {
          id: uid('review'),
          subjectId: activeSub || null,
          topicId: null,
          date: todayISO(),
          tipo: 'Manual',
          status: 'Não iniciado',
        };
    agendaUiState.editingId = item.id;
    agendaUiState.editingIsNew = true;
    agendaUiState.draft = cloneRecord(item);
    renderAgenda();
  }

  function editAgenda(id: string) {
    if (agendaUiState.editingIsNew && agendaUiState.editingId !== id) {
      ctx.state.reviewAgenda = (ctx.state.reviewAgenda || []).filter(
        item => item.id !== agendaUiState.editingId
      );
    }
    const item = (ctx.state.reviewAgenda || []).find(entry => entry.id === id);
    if (!item) return;
    agendaUiState.editingId = id;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = cloneRecord(item);
    renderAgenda();
  }

  function cancelAgendaEdit() {
    if (agendaUiState.editingIsNew) {
      ctx.state.reviewAgenda = (ctx.state.reviewAgenda || []).filter(
        item => item.id !== agendaUiState.editingId
      );
    }
    agendaUiState.editingId = null;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = null;
    renderAgenda();
  }

  function updateAgendaDraft(field: string, value: any) {
    const draft = agendaUiState.draft;
    if (!draft) return;
    draft[field] = value;
    if (
      field === 'subjectId' &&
      draft.topicId &&
      ctx.topicsForSelection &&
      !ctx.topicsForSelection(value, draft.topicId).some((t: any) => t.id === draft.topicId)
    ) {
      draft.topicId = null;
    }
  }

  function applyAgendaField(item: Record<string, any>, field: string, value: any) {
    const oldStatus = item.status;
    const oldValue = item[field];
    item[field] = value;
    if (field === 'date' && value !== oldValue) {
      item.manualDate = true;
      item.adaptive = false;
    }
    if (field === 'status' && value === 'Concluído' && oldStatus !== 'Concluído') {
      item.completedAt = nowISO();
      const topicId = item.topicId || item.topicRef || null;
      ctx.addHistoryEvent?.('review_completed', entitySubjectId(item), topicId, {
        reviewId: item.id,
        reviewType: item.tipo,
      });
      if (topicId) ctx.refreshTopicReviewStats?.(topicId);
    } else if (field === 'status' && value !== 'Concluído' && oldStatus === 'Concluído') {
      const topicId = item.topicId || item.topicRef || null;
      item.completedAt = null;
      ctx.addHistoryEvent?.('review_reopened', entitySubjectId(item), topicId, {
        reviewId: item.id,
        newStatus: value,
      });
      if (topicId) ctx.refreshTopicReviewStats?.(topicId);
    }
  }

  function saveAgendaEdit() {
    const draft = agendaUiState.draft;
    const item = (ctx.state.reviewAgenda || []).find(entry => entry.id === agendaUiState.editingId);
    if (!draft || !item) return cancelAgendaEdit();

    ['date', 'subjectId', 'topicId', 'topic', 'tipo', 'status'].forEach(field => {
      if ((item as Record<string, any>)[field] !== draft[field]) {
        applyAgendaField(item, field, draft[field]);
      }
    });
    agendaUiState.editingId = null;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = null;
    persistAndRender();
    showToast('Revisão atualizada.');
  }

  function deleteAgendaRow(id: string) {
    showConfirm('Excluir esta revisão?', () => {
      if (ctx.reviewService?.removeReview) {
        ctx.reviewService.removeReview(id);
      } else {
        ctx.state.reviewAgenda = (ctx.state.reviewAgenda || []).filter(item => item.id !== id);
      }
      agendaUiState.editingId = null;
      agendaUiState.editingIsNew = false;
      agendaUiState.draft = null;
      persistAndRender();
      showToast('Revisão excluída.');
    });
  }

  function updateAgenda(id: string, field: string, value: any) {
    const a = (ctx.state.reviewAgenda || []).find(x => x.id === id);
    if (!a) return;
    applyAgendaField(a, field, value);
    persistAndRender();
  }

  // SM-2 / Avaliação Adaptativa
  function adaptiveReviewSuggestion(topicId: string, baseDays: number, baseDate: string) {
    const found = ctx.getTopicById ? ctx.getTopicById(topicId) : null;
    const diagnosis =
      found && ctx.diagnoseTopic ? ctx.diagnoseTopic(found.subject.id, topicId) : null;
    const result = calculateAdaptiveInterval({
      baseDays,
      accuracy: diagnosis?.performance?.accuracy,
      volume: diagnosis?.performance?.resolved || 0,
      target: ctx.subjectAccuracyTarget ? ctx.subjectAccuracyTarget(found?.subject.id) : 80,
      trendKey: diagnosis?.trend?.key,
      dominantErrorKey: diagnosis?.dominantError?.key,
      reviews: Number(found?.topic?.reviewCount) || 0,
    });
    return { ...result, date: addDays(baseDate, result.days) };
  }

  function resetAdaptiveReviewDate(id: string) {
    const repo = ctx.reviewAgendaRepo;
    const review = repo?.findById?.(id) || (ctx.state.reviewAgenda || []).find(x => x.id === id);
    if (!review || !review.topicId) return;
    const found = ctx.getTopicById ? ctx.getTopicById(review.topicId) : null;
    const baseDate = found?.topic?.completedAt || todayISO();
    const suggestion = adaptiveReviewSuggestion(
      review.topicId,
      review.baseIntervalDays || reviewBaseDaysFromType(review.tipo),
      baseDate
    );
    ctx.reviewService?.restoreAdaptiveSchedule(id, suggestion);
    persistAndRender();
  }

  function gerarAgendaAutomatica() {
    const concluidos = ctx.activeTopics
      ? ctx.activeTopics().filter((t: any) => t.status === 'Concluído' && t.completedAt)
      : [];
    if (concluidos.length === 0) {
      showToast(
        'Nenhum tópico concluído com data registrada ainda. Marque tópicos como "Concluído" na aba Disciplinas primeiro.'
      );
      return;
    }
    let adicionados = 0;
    concluidos.forEach((t: any) => {
      const intervalos =
        (t.difficulty && (DIFFICULTY_INTERVALS as Record<string, any>)[t.difficulty]) || AGENDA_INTERVALS;
      intervalos.forEach((intervalo: any) => {
        const jaExiste = (ctx.state.reviewAgenda || []).some(
          a => (a.topicId || a.topicRef) === t.id && a.tipo === intervalo.tipo
        );
        if (!jaExiste) {
          const suggestion = adaptiveReviewSuggestion(t.id, intervalo.dias, t.completedAt);
          (ctx.state.reviewAgenda as any[]).push({
            id: uid('review'),
            subjectId: t.subjectId,
            topicId: t.id,
            date: suggestion.date,
            suggestedDate: suggestion.date,
            baseIntervalDays: intervalo.dias,
            adaptive: true,
            manualDate: false,
            adaptiveReason: suggestion.reason,
            tipo: intervalo.tipo,
            status: 'Não iniciado',
            createdAt: nowISO(),
            completedAt: null,
          });
          adicionados++;
        }
      });
    });
    persistAndRender();
    if (adicionados > 0) {
      showToast(
        `${pluralize(adicionados, 'revisão', 'revisões')} ${adicionados === 1 ? 'adicionada' : 'adicionadas'} à agenda — tópicos difíceis ganham revisões mais próximas.`
      );
    } else {
      showToast('A agenda já está atualizada — nenhuma revisão nova para gerar.');
    }
  }

  function closeReviewRating() {
    pendingReviewRatingId = null;
    const doc = getDoc();
    const overlay = doc?.getElementById('reviewRatingOverlay');
    if (overlay) {
      overlay.classList?.remove('show');
      overlay.setAttribute?.('aria-hidden', 'true');
    }
  }

  function completeAgendaReview(id: string) {
    const repo = ctx.reviewAgendaRepo;
    const item = repo?.findById?.(id) || (ctx.state.reviewAgenda || []).find(x => x.id === id);
    if (!item || item.status === 'Concluído') return;

    if (!(item.topicId || item.topicRef)) {
      ctx.reviewService?.completeReview(id);
      persistAndRender();
      showToast('Revisão concluída.');
      return;
    }
    pendingReviewRatingId = id;
    const doc = getDoc();
    const overlay = doc?.getElementById('reviewRatingOverlay');
    if (overlay) {
      overlay.classList?.add('show');
      overlay.removeAttribute?.('aria-hidden');
      overlay.querySelector?.('[data-review-rating="good"]')?.focus?.();
    }
  }

  function rateCompletedReview(rating: any) {
    const ratingKey = String(rating || '');
    const ratingDef = (REVIEW_RATINGS as Record<string, any>)[ratingKey];
    if (!ratingDef) {
      return closeReviewRating();
    }
    const result = ctx.reviewService?.rateReview(pendingReviewRatingId, ratingKey, {
      label: ratingDef.label,
    });
    if (!result) return closeReviewRating();
    closeReviewRating();
    persistAndRender();
    showToast(`Revisão concluída. Próxima em ${formatDatePt(result.adaptiveState?.nextReviewDate)}.`);
  }

  function bindEvents(doc?: any) {
    const d = doc || getDoc();
    if (!d) return;

    createReviewsController({
      root: d,
      actions: {
        rate: rateCompletedReview,
        cancelRating: closeReviewRating,
        filtersChanged: () => {
          agendaUiState.upcomingVisible = DEFAULT_LIST_VISIBLE_ITEMS;
          agendaUiState.completedVisible = DEFAULT_LIST_VISIBLE_ITEMS;
          renderAgenda();
        },
        createManual: addAgendaRow,
        generateAutomatic: gerarAgendaAutomatica,
      },
    }).register();
  }

  return {
    agendaUiState,
    getTopicDifficulty,
    getFilteredAndSortedReviews,
    getGroupedReviews,
    agendaViewModel,
    renderAgendaReadRow,
    renderAgendaEditRow,
    renderHtml,
    renderAgenda,
    renderAgendaFilters,
    toggleCompletedReviews,
    changeAgendaLimit,
    resetAgendaLimit,
    addAgendaRow,
    editAgenda,
    cancelAgendaEdit,
    updateAgendaDraft,
    applyAgendaField,
    saveAgendaEdit,
    deleteAgendaRow,
    updateAgenda,
    adaptiveReviewSuggestion,
    resetAdaptiveReviewDate,
    gerarAgendaAutomatica,
    completeAgendaReview,
    closeReviewRating,
    rateCompletedReview,
    bindEvents,
  };
}
