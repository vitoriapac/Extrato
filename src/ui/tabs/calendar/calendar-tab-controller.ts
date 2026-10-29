import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { CalendarTable, type CalendarItem } from './CalendarTable.js';
import {
  buildUnifiedReviews,
  unifiedReviewLabel as defaultUnifiedItemLabel,
} from '../../../application/calendar/build-unified-reviews.js';
import {
  renderCalendarRead,
  renderCalendarEdit,
  renderCalendarIndicators,
  renderCalendarMonth as renderCalendarMonthView,
  renderCalendarFilterOptions,
} from '../../renderers/calendar-renderer.js';
import { buildCalendarItemViewModel } from '../../view-models/calendar-view-model.js';
import { createCalendarState } from '../../calendar/calendar-state.js';
import { createCalendarController } from '../../calendar/calendar-controller.js';
import { STATUS_CLASS, STATUS_OPTIONS, REVIEW_OPTIONS } from '../../../state/schema.js';
import { DEFAULT_LIST_VISIBLE_ITEMS } from '../../progressive-list.js';

export interface CalendarTabControllerContext {
  state: {
    calendar: CalendarItem[];
    reviewAgenda?: any[];
    subjects?: any[];
  };
  filters?: {
    subjectId: string;
    status: string;
    month: string;
    type: string;
  };
  calendarService?: any;
  clock?: { today: () => string };
  formatDatePt?: (iso?: any) => string;
  entitySubjectId?: (item: any) => string | null;
  entitySubjectName?: (item: any) => string;
  getSubjectName?: (id?: any) => string;
  getTopicName?: (id?: any) => string;
  diasParaRevisao?: (date?: any) => any;
  diasParaRevisaoPill?: (date?: any, status?: any) => any;
  activeSubjects?: () => Array<{ id: string; name: string }>;
  subjectsForSelection?: (subjectId?: any) => Array<{ id: string; name: string }>;
  collectMonthKeys?: (items: any[]) => string[];
  monthLabel?: (key: any) => string;
  monthKey?: (date?: any) => string;
  calendarUiState?: {
    visible: number;
    editingId: string | null;
    month?: any;
    view?: string;
    draft?: Record<string, any> | null;
    isNew?: boolean;
    filters?: Record<string, string>;
  };
  calendarController?: any;
  renderCalendarReadRow?: (item: CalendarItem) => string;
  renderCalendarEditRow?: (item: CalendarItem) => string;
  renderCollectionFooter?: (opts: any) => string;
  showToast?: (msg: string) => void;
  showConfirm?: (msg: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  persistAndRender?: () => void;
  onCompleteAgendaReview?: (id: string) => void;
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

export function createCalendarTabController(ctx: CalendarTabControllerContext) {
  const getDoc = () => ctx.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = ctx.escapeHtml || defaultEscapeHtml;
  const escapeAttr = ctx.escapeAttr || defaultEscapeAttr;
  const pluralize = ctx.pluralize || defaultPluralize;
  const todayISO = () => (ctx.clock?.today ? ctx.clock.today() : defaultTodayISO());
  const formatDatePt = ctx.formatDatePt || ((iso?: string | null) => iso || '—');
  const entitySubjectId = ctx.entitySubjectId || ((item: any) => item?.subjectId || null);
  const entitySubjectName =
    ctx.entitySubjectName ||
    ((item: any) => {
      const id = entitySubjectId(item);
      return (ctx.getSubjectName ? ctx.getSubjectName(id) : id) || '—';
    });
  const getTopicName = ctx.getTopicName || ((_id?: string | null) => '');
  const diasParaRevisao = ctx.diasParaRevisao || ((_date?: string | null) => 0);
  const diasParaRevisaoPill =
    ctx.diasParaRevisaoPill || ((_date?: string | null, _status?: string) => '');
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
  const activeSubjects = ctx.activeSubjects || (() => []);
  const subjectsForSelection = ctx.subjectsForSelection || (() => []);
  const isMobileHistoryLayout = ctx.isMobileHistoryLayout || (() => false);
  const showToast = ctx.showToast || (() => {});
  const showConfirm = ctx.showConfirm || ((_msg, onConfirm) => onConfirm());
  const persistAndRender = ctx.persistAndRender || (() => {});
  const renderCollectionFooter = ctx.renderCollectionFooter || (() => '');

  // Estado interno da UI do Calendário
  const calendarUiState = ctx.calendarUiState || createCalendarState();

  // Controlador de entidade de calendário (service wrapper)
  const calendarController =
    ctx.calendarController ||
    (ctx.calendarService
      ? createCalendarController({
          service: ctx.calendarService,
          state: calendarUiState,
          clock: ctx.clock || { today: todayISO },
          onChange: () => {
            renderCalendar();
            renderMonthCalendar();
          },
        })
      : null);

  // Atrasadas agrupadas
  const overdueGroupLimits: Record<string, number> = {
    calAtrasadas: DEFAULT_LIST_VISIBLE_ITEMS,
    hojeAtrasadas: DEFAULT_LIST_VISIBLE_ITEMS,
  };
  const overdueExpandedDates: Record<string, Set<string>> = {
    calAtrasadas: new Set<string>(),
    hojeAtrasadas: new Set<string>(),
  };
  const overdueExpansionInitialized = new Set<string>();

  const MONTH_MAX_EVENTS_PER_DAY = 3;

  function getRevisoesUnificadas() {
    return buildUnifiedReviews({
      calendar: ctx.state.calendar || [],
      reviewAgenda: ctx.state.reviewAgenda || [],
      subjectIdOf: entitySubjectId,
      subjectName: entitySubjectName,
      topicName: getTopicName,
    });
  }

  function getFilters() {
    if (ctx.filters) return ctx.filters;
    const doc = getDoc();
    if (!doc) return { subjectId: '', status: '', month: '', type: '' };
    const subjectId = (doc.getElementById('calFilterSubject') as HTMLSelectElement)?.value || '';
    const status = (doc.getElementById('calFilterStatus') as HTMLSelectElement)?.value || '';
    const month = (doc.getElementById('calFilterMes') as HTMLSelectElement)?.value || '';
    const type = (doc.getElementById('calFilterTipo') as HTMLSelectElement)?.value || '';
    return { subjectId, status, month, type };
  }

  function getFilteredAndSortedRows(): CalendarItem[] {
    const { subjectId, status, month, type } = getFilters();

    return (ctx.state.calendar || [])
      .filter(c => !subjectId || entitySubjectId(c) === subjectId)
      .filter(c => !status || c.status === status)
      .filter(c => !month || monthKey(c.date) === month)
      .filter(c => !type || c.reviewType === type)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  function calendarViewModel(item: Record<string, any>) {
    return buildCalendarItemViewModel(item, {
      formatDate: formatDatePt,
      getSubjectName: ctx.getSubjectName || entitySubjectName,
      subjectIdOf: entitySubjectId,
    });
  }

  function renderCalendarReadRow(item: CalendarItem): string {
    if (ctx.renderCalendarReadRow) return ctx.renderCalendarReadRow(item);
    return renderCalendarRead({
      item,
      view: calendarViewModel(item),
      mobile: isMobileHistoryLayout(),
      escapeHtml,
      daysPill: diasParaRevisaoPill(item.date, item.status),
      statusClass: STATUS_CLASS,
      today: todayISO(),
    });
  }

  function renderCalendarEditRow(item: CalendarItem): string {
    if (ctx.renderCalendarEditRow) return ctx.renderCalendarEditRow(item);
    const draft = calendarUiState.draft;
    const subjectId = entitySubjectId(draft!);
    return renderCalendarEdit({
      item,
      draft,
      subjectOptions: subjectsForSelection(subjectId)
        .map(
          subject =>
            `<option value="${escapeAttr(subject.id)}" ${subject.id === subjectId ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
        )
        .join(''),
      statusOptions: STATUS_OPTIONS.map(
        option =>
          `<option value="${option}" ${option === draft?.status ? 'selected' : ''}>${option}</option>`
      ).join(''),
      reviewOptions: REVIEW_OPTIONS.map(
        option =>
          `<option value="${option}" ${option === draft?.reviewType ? 'selected' : ''}>${option}</option>`
      ).join(''),
      escapeAttr,
    });
  }

  function renderHtml(): string {
    const rows = getFilteredAndSortedRows();

    return render(
      h(CalendarTable, {
        rows,
        visibleLimit: calendarUiState.visible ?? DEFAULT_LIST_VISIBLE_ITEMS,
        editingId: calendarUiState.editingId ?? null,
        renderReadRow: renderCalendarReadRow,
        renderEditRow: renderCalendarEditRow,
        renderFooter: ctx.renderCollectionFooter || renderCollectionFooter,
      })
    );
  }

  function renderCalendar() {
    const doc = getDoc();
    if (!doc) return;
    const body = doc.getElementById('calBody');
    if (!body) return;
    body.innerHTML = renderHtml();
  }

  function renderCalIndicadores() {
    const doc = getDoc();
    if (!doc) return;
    const el = doc.getElementById('calIndicadores');
    if (!el) return;
    el.innerHTML = renderCalendarIndicators({
      items: getRevisoesUnificadas(),
      today: todayISO(),
      daysUntil: diasParaRevisao,
    });
  }

  function renderMonthCalendar() {
    const doc = getDoc();
    if (!doc) return;
    const container = doc.getElementById('monthCalendar');
    if (!container) return;
    const filterSubject =
      (doc.getElementById('calFilterSubject') as HTMLSelectElement)?.value || '';
    const filterStatus =
      (doc.getElementById('calFilterStatus') as HTMLSelectElement)?.value || '';

    const result = renderCalendarMonthView({
      month: calendarUiState.month,
      events: getRevisoesUnificadas(),
      filterSubject,
      filterStatus,
      today: todayISO(),
      daysUntil: diasParaRevisao,
      escapeHtml,
      escapeAttr,
      maxEventsPerDay: MONTH_MAX_EVENTS_PER_DAY,
    });
    const titleEl = doc.getElementById('calendarMonthTitle');
    if (titleEl) titleEl.textContent = result.title;
    container.innerHTML = result.html;
  }

  function renderCalendarFilters() {
    const doc = getDoc();
    if (!doc) return;
    const sel = doc.getElementById('calFilterSubject') as HTMLSelectElement | null;
    const selMes = doc.getElementById('calFilterMes') as HTMLSelectElement | null;
    const selTipo = doc.getElementById('calFilterTipo') as HTMLSelectElement | null;
    if (!sel || !selMes || !selTipo) return;

    const current = sel.value;
    const currentMes = selMes.value;
    const currentTipo = selTipo.value;

    const options = renderCalendarFilterOptions({
      subjects: ctx.state.subjects || [],
      monthKeys: collectMonthKeys(ctx.state.calendar || []),
      reviewTypes: REVIEW_OPTIONS,
      selectedSubject: current,
      selectedMonth: currentMes,
      selectedType: currentTipo,
      escapeHtml,
      escapeAttr,
      monthLabel,
    });

    sel.innerHTML = options.subjects;
    sel.value = current;
    selMes.innerHTML = options.months;
    selMes.value = currentMes;
    selTipo.innerHTML = options.types;
    selTipo.value = currentTipo;
  }

  function setCalendarMobileView(view: string) {
    const doc = getDoc();
    const normalized = view === 'agenda' ? 'agenda' : 'month';
    calendarUiState.view = normalized;
    doc?.getElementById('panel-calendario')?.setAttribute('data-calendar-view', normalized);
    doc?.querySelectorAll('.calendar-view-btn').forEach((button: any) => {
      const active = button.dataset.calendarView === normalized;
      button.classList?.toggle('active', active);
      button.classList?.toggle('ghost', !active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  // CRUD e manipulação de estado do Calendário
  function addCalRow() {
    if (calendarController) {
      calendarController.create({
        date: todayISO(),
        week: '',
        subjectId: activeSubjects()[0]?.id || null,
        topicId: null,
        status: 'Não iniciado',
        reviewType: '—',
      });
      renderCalendar();
    }
  }

  function editCalendarItem(id: string) {
    calendarController?.beginEdit(id);
    renderCalendar();
  }

  function cancelCalendarEdit() {
    calendarController?.cancelEdit();
    renderCalendar();
  }

  function updateCalendarDraft(field: string, value: any) {
    calendarController?.update(field, value);
  }

  function saveCalendarEdit() {
    const result = calendarController?.save();
    if (result) {
      persistAndRender();
      showToast('Item do calendário atualizado.');
    } else {
      cancelCalendarEdit();
    }
  }

  function completeCalendarItem(id: string) {
    const item = calendarController?.complete(id);
    if (item) {
      persistAndRender();
      showToast('Item concluído.');
    }
  }

  function deleteCalRow(id: string) {
    showConfirm('Excluir este item do calendário?', () => {
      calendarController?.remove(id);
      persistAndRender();
      showToast('Item excluído.');
    });
  }

  function updateCal(id: string, field: string, value: any) {
    const c = (ctx.state.calendar || []).find(x => x.id === id);
    if (c) {
      (c as Record<string, any>)[field] = value;
      persistAndRender();
    }
  }

  function changeCalendarLimit(_delta: number) {
    calendarController?.showMore();
    renderCalendar();
  }

  function resetCalendarLimit() {
    calendarController?.showLess();
    renderCalendar();
  }

  // Gestão de Atrasadas e Tarefas de Hoje (Unificadas)
  function changeOverdueGroupLimit(elId: string, delta: number) {
    overdueGroupLimits[elId] =
      (overdueGroupLimits[elId] || DEFAULT_LIST_VISIBLE_ITEMS) + Number(delta || 0);
    renderCalAtrasadas(elId);
  }

  function showAllOverdueGroups(elId: string) {
    overdueGroupLimits[elId] = Number.MAX_SAFE_INTEGER;
    renderCalAtrasadas(elId);
  }

  function resetOverdueGroupLimit(elId: string) {
    overdueGroupLimits[elId] = DEFAULT_LIST_VISIBLE_ITEMS;
    renderCalAtrasadas(elId);
  }

  function toggleOverdueDate(elId: string, date: string) {
    const dates = overdueExpandedDates[elId] || (overdueExpandedDates[elId] = new Set());
    if (dates.has(date)) dates.delete(date);
    else dates.add(date);
    renderCalAtrasadas(elId);
  }

  function quickReviewButton(item: Record<string, any>, elId: string) {
    if (!String(elId || '').startsWith('hoje') || item.status === 'Concluído') return '';
    return `<button type="button" class="btn small quick-review-btn" data-delegated-click="completeUnifiedReview('${escapeAttr(item.id)}','${escapeAttr(item.origem)}')">✓ Revisar</button>`;
  }

  function renderCalTarefasHoje(elId = 'calTarefasHoje') {
    const doc = getDoc();
    if (!doc) return;
    const ul = doc.getElementById(elId);
    if (!ul) return;
    const today = todayISO();
    const items = getRevisoesUnificadas()
      .filter(r => r.date === today)
      .sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));

    if (!items.length) {
      ul.innerHTML = '<li class="upcoming-empty">Nenhuma tarefa para hoje. 🎉</li>';
      return;
    }
    ul.innerHTML = items
      .map(
        x =>
          `<li><span class="dias-pill dias-hoje" style="margin-right:6px">hoje</span><span style="flex:1">${escapeHtml(x.subject || '—')} · ${escapeHtml(defaultUnifiedItemLabel(x))} <span class="item-origin">(${x.origem})</span></span><span class="subject-progress-pill">${escapeHtml(x.status)}</span>${quickReviewButton(x, elId)}</li>`
      )
      .join('');
  }

  function renderCalAtrasadas(elId = 'calAtrasadas') {
    const doc = getDoc();
    if (!doc) return;
    const ul = doc.getElementById(elId);
    if (!ul) return;
    const today = todayISO();
    const items = getRevisoesUnificadas()
      .filter(r => r.date && r.date < today && r.status !== 'Concluído')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (!items.length) {
      ul.innerHTML = '<li class="upcoming-empty">Nenhuma revisão atrasada. Tudo em dia!</li>';
      return;
    }
    const groups = new Map<string, any[]>();
    items.forEach(item => {
      if (!groups.has(item.date)) groups.set(item.date, []);
      groups.get(item.date)!.push(item);
    });
    const entries = [...groups.entries()];
    const limit = overdueGroupLimits[elId] || DEFAULT_LIST_VISIBLE_ITEMS;
    const visible = entries.slice(0, limit);

    if (!overdueExpansionInitialized.has(elId)) {
      (overdueExpandedDates[elId] || (overdueExpandedDates[elId] = new Set())).add(entries[0][0]);
      overdueExpansionInitialized.add(elId);
    }

    ul.innerHTML =
      `<li class="overdue-summary"><strong>${items.length} revisões atrasadas</strong><span>${entries.length} datas · mais antiga em ${formatDatePt(entries[0][0])}</span></li>` +
      visible
        .map(([date, dateItems]) => {
          const expanded = overdueExpandedDates[elId]?.has(date);
          return `<li class="overdue-group"><button type="button" class="overdue-group-title" aria-expanded="${Boolean(expanded)}" data-delegated-click="toggleOverdueDate('${elId}','${date}')"><span><strong>${formatDatePt(date)}</strong><small>${pluralize(dateItems.length, 'revisão', 'revisões')} · ${Math.abs(diasParaRevisao(date) || 0)} dias de atraso</small></span><span class="overdue-chevron" aria-hidden="true">›</span></button><ul ${expanded ? '' : 'hidden'}>${dateItems.map((x: any) => `<li><span style="flex:1">${escapeHtml(x.subject || '—')} — ${escapeHtml(defaultUnifiedItemLabel(x))}<span class="item-origin">${x.origem}</span></span>${quickReviewButton(x, elId)}</li>`).join('')}</ul></li>`;
        })
        .join('') +
      `<li class="overdue-list-footer">${renderCollectionFooter({ variant: 'block', total: entries.length, visible: visible.length, step: DEFAULT_LIST_VISIBLE_ITEMS, label: 'datas', showMoreAction: `changeOverdueGroupLimit('${elId}',3)`, showAllAction: `showAllOverdueGroups('${elId}')`, showLessAction: limit > DEFAULT_LIST_VISIBLE_ITEMS ? `resetOverdueGroupLimit('${elId}')` : '' })}</li>`;
  }

  function completeUnifiedReview(id: string, origin: string) {
    if (origin === 'Agenda de Revisões') {
      if (ctx.onCompleteAgendaReview) {
        ctx.onCompleteAgendaReview(id);
      }
    } else {
      const item = (ctx.state.calendar || []).find(x => x.id === id);
      if (!item || item.status === 'Concluído') return;
      updateCal(id, 'status', 'Concluído');
    }
    showToast('Revisão concluída e indicadores atualizados.');
  }

  function bindEvents(doc?: any) {
    const d = doc || getDoc();
    if (!d) return;

    d.getElementById('monthPrevBtn')?.addEventListener('click', () => {
      calendarController?.goToPreviousMonth();
      renderMonthCalendar();
    });
    d.getElementById('monthNextBtn')?.addEventListener('click', () => {
      calendarController?.goToNextMonth();
      renderMonthCalendar();
    });
    d.getElementById('monthTodayBtn')?.addEventListener('click', () => {
      calendarController?.goToCurrentMonth();
      renderMonthCalendar();
    });

    d.querySelectorAll('.calendar-view-btn').forEach((button: any) =>
      button.addEventListener('click', () => {
        calendarController?.setView(button.dataset.calendarView);
        setCalendarMobileView(calendarUiState.view || 'month');
      })
    );

    d.getElementById('calFilterSubject')?.addEventListener('change', (event: any) => {
      calendarController?.setFilter('subjectId', event.target.value);
      renderCalendar();
      renderMonthCalendar();
    });
    d.getElementById('calFilterStatus')?.addEventListener('change', (event: any) => {
      calendarController?.setFilter('status', event.target.value);
      renderCalendar();
      renderMonthCalendar();
    });
    d.getElementById('calFilterMes')?.addEventListener('change', (event: any) => {
      calendarController?.setFilter('month', event.target.value);
      renderCalendar();
      renderMonthCalendar();
    });
    d.getElementById('calFilterTipo')?.addEventListener('change', (event: any) => {
      calendarController?.setFilter('type', event.target.value);
      renderCalendar();
      renderMonthCalendar();
    });

    d.getElementById('addCalRowBtn')?.addEventListener('click', addCalRow);
  }

  return {
    calendarUiState,
    calendarController,
    getFilteredAndSortedRows,
    getRevisoesUnificadas,
    calendarViewModel,
    renderCalendarReadRow,
    renderCalendarEditRow,
    renderHtml,
    renderCalendar,
    renderCalIndicadores,
    renderMonthCalendar,
    renderCalendarFilters,
    setCalendarMobileView,
    addCalRow,
    editCalendarItem,
    cancelCalendarEdit,
    updateCalendarDraft,
    saveCalendarEdit,
    completeCalendarItem,
    deleteCalRow,
    updateCal,
    changeCalendarLimit,
    resetCalendarLimit,
    changeOverdueGroupLimit,
    showAllOverdueGroups,
    resetOverdueGroupLimit,
    toggleOverdueDate,
    renderCalTarefasHoje,
    renderCalAtrasadas,
    completeUnifiedReview,
    bindEvents,
  };
}
