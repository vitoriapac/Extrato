import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { CalendarTable, type CalendarItem } from './CalendarTable.js';
import { CalendarViewSwitch, type CalendarMobileView } from './CalendarViewSwitch.js';
import {
  buildUnifiedReviews,
  buildUnifiedCalendarItems,
} from '../../../application/calendar/build-unified-reviews.js';
import {
  buildEssayEvolutionSummary,
  computeDailyCalendarLoad,
  getAvailableMinutesForDate,
  sortCalendarItemsForDay,
  type UnifiedCalendarItem,
} from '../../../domain/calendar/calendar-projection.js';
import { buildCalendarIcs } from '../../../domain/calendar/calendar-ics.js';
import { addLocalDays, formatLocalDate } from '../../../core/date-utils.js';
import { CalendarDayDrawer } from './CalendarDayDrawer.js';
import { CalendarWeekView } from './CalendarWeekView.js';
import { EssayEvolutionCard } from './EssayEvolutionCard.js';
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
import { createCalendarPendingLists } from './calendar-pending-lists.js';
import { createCalendarActivityModalController } from './calendar-activity-modal-controller.js';
import { createProgressiveList } from '../../progressive-list.js';
import { filterPanelLabel } from '../../filter-panel.js';
import { runUndoable } from '../../undoable.js';

export interface CalendarTabControllerContext {
  state: {
    calendar: CalendarItem[];
    reviewAgenda?: any[];
    simulados?: any[];
    subjects?: any[];
    metas?: {
      horasDiarias?: number;
      horasPorDia?: Record<string, number>;
    };
  };
  filters?: {
    subjectId: string;
    status: string;
    month: string;
    type: string;
    activityKind?: string;
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
    calendarPage: number;
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
  showToast?: (msg: string) => void;
  showConfirm?: (msg: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  persistAndRender?: () => void;
  onCompleteAgendaReview?: (id: string) => void;
  onStartTimer?: (item: UnifiedCalendarItem) => void;
  onRegisterSimulationResult?: (item: UnifiedCalendarItem) => void;
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
        new Set((items || []).map(x => (x.date ? String(x.date).slice(0, 7) : '')).filter(Boolean))
      ).sort());
  const activeSubjects = ctx.activeSubjects || (() => []);
  const subjectsForSelection = ctx.subjectsForSelection || (() => []);
  const isMobileHistoryLayout = ctx.isMobileHistoryLayout || (() => false);
  const showToast = ctx.showToast || (() => {});
  const persistAndRender = ctx.persistAndRender || (() => {});

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

  const MONTH_MAX_EVENTS_PER_DAY = 3;

  const { toggleOverdueDate, renderCalTarefasHoje, renderCalAtrasadas, completeUnifiedReview } =
    createCalendarPendingLists({
      ctx,
      getDoc,
      escapeHtml,
      escapeAttr,
      pluralize,
      todayISO,
      formatDatePt,
      diasParaRevisao,
      showToast,
      getUnifiedCalendarItems,
      getRevisoesUnificadas,
      updateCal,
    });

  const {
    renderActivityModal,
    openActivityModalForDate,
    openActivityModalForEdit,
    saveActivityModal,
  } = createCalendarActivityModalController({
    ctx,
    getDoc,
    calendarUiState,
    calendarController,
    canMountPreact,
    activeSubjects,
    getUnifiedCalendarItems: () => getUnifiedCalendarItems(),
    deleteCalRow,
    todayISO,
    showToast,
    persistAndRender,
  });

  function getRevisoesUnificadas() {
    return buildUnifiedReviews({
      calendar: ctx.state.calendar || [],
      reviewAgenda: ctx.state.reviewAgenda || [],
      subjectIdOf: entitySubjectId,
      subjectName: entitySubjectName,
      topicName: getTopicName,
    });
  }

  function getUnifiedCalendarItems(
    opts: { includeRecurring?: boolean } = {}
  ): UnifiedCalendarItem[] {
    const today = todayISO();
    const monthDate = calendarUiState.month instanceof Date ? calendarUiState.month : new Date();
    const monthStart = formatLocalDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12, 0, 0, 0)
    );
    const monthEnd = formatLocalDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12, 0, 0, 0)
    );
    const rangeStart =
      opts.includeRecurring === false ? '' : addLocalDays(monthStart || today, -7) || '';
    const rangeEnd =
      opts.includeRecurring === false ? '' : addLocalDays(monthEnd || today, 14) || '';
    return buildUnifiedCalendarItems({
      calendar: ctx.state.calendar || [],
      reviewAgenda: ctx.state.reviewAgenda || [],
      simulados: ctx.state.simulados || [],
      today,
      rangeStart,
      rangeEnd,
      subjectIdOf: entitySubjectId,
      subjectName: entitySubjectName,
      topicName: getTopicName,
    });
  }

  function getActivityKindFilter(): string {
    if (ctx.filters?.activityKind) return ctx.filters.activityKind;
    const doc = getDoc();
    const sel = doc?.getElementById('agendaFilterActivityKind') as HTMLSelectElement | null;
    return sel?.value || calendarUiState.filters?.activityKind || '';
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

  function getCalendarRowModel(item: CalendarItem) {
    const view = calendarViewModel(item);
    const days = diasParaRevisao(item.date);
    let daysLabel = '—';
    if (item.status === 'Concluído') daysLabel = 'Concluído';
    else if (days === 0) daysLabel = 'Hoje';
    else if (typeof days === 'number' && days < 0)
      daysLabel = `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'} em atraso`;
    else if (typeof days === 'number' && days > 0)
      daysLabel = `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
    return {
      date: view.date,
      week: view.week,
      subject: view.subject,
      status: view.status,
      reviewType: view.reviewType,
      pending: view.pending,
      daysLabel,
      statusClass: STATUS_CLASS[item.status as keyof typeof STATUS_CLASS] || '',
      isToday: item.date === todayISO(),
    };
  }

  // Grava a página já limitada: apagar o último item da última página cai na anterior.
  function clampCalendarPage(rows: CalendarItem[]) {
    const page = createProgressiveList({
      items: rows,
      mode: 'pages',
      page: calendarUiState.calendarPage,
    }).page;
    calendarUiState.calendarPage = page;
    return page;
  }

  function renderHtml(): string {
    const rows = getFilteredAndSortedRows();

    return render(
      h(CalendarTable, {
        rows,
        page: clampCalendarPage(rows),
        editingId: calendarUiState.editingId ?? null,
        renderReadRow: renderCalendarReadRow,
        renderEditRow: renderCalendarEditRow,
      })
    );
  }

  function renderCalendar() {
    const doc = getDoc();
    if (!doc) return;
    const body = doc.getElementById('calBody');
    if (!body) return;
    if (canMountPreact(body)) {
      const rows = getFilteredAndSortedRows();
      mountPreact(
        h(CalendarTable, {
          rows,
          page: clampCalendarPage(rows),
          editingId: calendarUiState.editingId ?? null,
          mobile: isMobileHistoryLayout(),
          getRowModel: getCalendarRowModel,
          onCompleteItem: completeCalendarItem,
          onEditItem: editCalendarItem,
          onAddItem: () =>
            openActivityModalForDate((calendarUiState as any).selectedDate || todayISO()),
          renderReadRow: renderCalendarReadRow,
          renderEditRow: renderCalendarEditRow,
        }),
        body
      );
      renderEssayEvolution();
      return;
    }
    body.innerHTML = renderHtml();
    renderEssayEvolution();
  }

  function renderEssayEvolution() {
    const doc = getDoc();
    const mount = doc?.getElementById('essayEvolutionMount');
    if (!canMountPreact(mount)) return;
    const summary = buildEssayEvolutionSummary(
      getUnifiedCalendarItems({ includeRecurring: false })
    );
    mountPreact(
      h(EssayEvolutionCard, {
        summary,
        formatDatePt,
        onEditEssay: (id: string) => openActivityModalForEdit(id),
      }),
      mount
    );
  }

  function renderCalIndicadores() {
    const doc = getDoc();
    if (!doc) return;
    const el = doc.getElementById('calIndicadores');
    if (!el) return;
    el.innerHTML = renderCalendarIndicators({
      items: getRevisoesUnificadas(),
      today: todayISO(),
    });
  }

  function canMountPreact(el: Element | null | undefined): el is Element {
    return Boolean(
      el && typeof globalThis.document !== 'undefined' && el.ownerDocument === globalThis.document
    );
  }

  function getFilteredUnifiedItems(): UnifiedCalendarItem[] {
    const doc = getDoc();
    const filterSubject =
      (doc?.getElementById('calFilterSubject') as HTMLSelectElement)?.value || '';
    const filterStatus = (doc?.getElementById('calFilterStatus') as HTMLSelectElement)?.value || '';
    const filterKind = getActivityKindFilter();
    return getUnifiedCalendarItems().filter(
      item =>
        (!filterSubject || item.subjectId === filterSubject) &&
        (!filterStatus || item.status === filterStatus) &&
        (!filterKind || item.kind === filterKind)
    );
  }

  function renderMonthCalendar() {
    const doc = getDoc();
    if (!doc) return;
    const container = doc.getElementById('monthCalendar');
    if (!container) return;
    const filterSubject =
      (doc.getElementById('calFilterSubject') as HTMLSelectElement)?.value || '';
    const filterStatus = (doc.getElementById('calFilterStatus') as HTMLSelectElement)?.value || '';
    const filterActivityKind = getActivityKindFilter();

    const result = renderCalendarMonthView({
      month: calendarUiState.month,
      events: getUnifiedCalendarItems(),
      filterSubject,
      filterStatus,
      filterActivityKind,
      selectedDate: (calendarUiState as any).selectedDate || null,
      today: todayISO(),
      daysUntil: diasParaRevisao,
      escapeHtml,
      escapeAttr,
      maxEventsPerDay: MONTH_MAX_EVENTS_PER_DAY,
    });
    const titleEl = doc.getElementById('calendarMonthTitle');
    if (titleEl) titleEl.textContent = result.title;
    container.innerHTML = result.html;
    renderWeekCalendar();
    renderDayDrawer();
  }

  function renderWeekCalendar() {
    const doc = getDoc();
    const mount = doc?.getElementById('calendarWeekMount');
    if (!canMountPreact(mount)) return;
    const today = todayISO();
    const anchor = (calendarUiState as any).weekAnchorDate || today;
    mountPreact(
      h(CalendarWeekView, {
        anchorDate: anchor,
        today,
        selectedDate: (calendarUiState as any).selectedDate || null,
        items: getFilteredUnifiedItems(),
        onPrevWeek: () => {
          (calendarUiState as any).weekAnchorDate = addLocalDays(anchor, -7) || anchor;
          renderWeekCalendar();
        },
        onNextWeek: () => {
          (calendarUiState as any).weekAnchorDate = addLocalDays(anchor, 7) || anchor;
          renderWeekCalendar();
        },
        onTodayWeek: () => {
          (calendarUiState as any).weekAnchorDate = today;
          (calendarUiState as any).selectedDate = today;
          renderWeekCalendar();
          renderDayDrawer();
        },
        onSelectDate: (date: string) => {
          (calendarUiState as any).selectedDate = date;
          renderMonthCalendar();
        },
        onAddForDate: (date: string) => openActivityModalForDate(date),
        onEditItem: (id: string) => openActivityModalForEdit(id),
        onRescheduleItem: (id: string, newDate: string) => rescheduleCalendarItem(id, newDate),
      }),
      mount
    );
  }

  function renderDayDrawer() {
    const doc = getDoc();
    const mount = doc?.getElementById('calendarDayDrawerMount');
    if (!canMountPreact(mount)) return;
    const selectedDate = (calendarUiState as any).selectedDate || null;
    const allItems = getFilteredUnifiedItems();
    const dayItems = selectedDate
      ? sortCalendarItemsForDay(allItems.filter(item => item.date === selectedDate))
      : [];
    const load = selectedDate
      ? computeDailyCalendarLoad(allItems, selectedDate)
      : { date: '', totalMinutes: 0, itemCount: 0, actionableCount: 0, conflicts: [] };
    const availableMinutes = selectedDate
      ? getAvailableMinutesForDate(ctx.state.metas, selectedDate)
      : 0;
    mountPreact(
      h(CalendarDayDrawer, {
        date: selectedDate,
        formattedDate: selectedDate ? formatDatePt(selectedDate) : '',
        items: dayItems,
        load,
        availableMinutes,
        onAddForDate: (date: string) => openActivityModalForDate(date),
        onEditItem: (id: string) => openActivityModalForEdit(id),
        onCompleteItem: (item: UnifiedCalendarItem) => completeUnifiedReview(item.id, item.origem),
        onRescheduleItem: (id: string, newDate: string) => rescheduleCalendarItem(id, newDate),
        onStartTimer: ctx.onStartTimer,
        onRegisterSimulationResult: ctx.onRegisterSimulationResult,
        onClose: () => {
          (calendarUiState as any).selectedDate = null;
          renderMonthCalendar();
        },
      }),
      mount
    );
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
    const normalized: CalendarMobileView =
      view === 'agenda' ? 'agenda' : view === 'week' ? 'week' : 'month';
    calendarUiState.view = normalized;
    doc?.getElementById('panel-agenda')?.setAttribute('data-calendar-view', normalized);
    if (normalized === 'week') renderWeekCalendar();
    const mount = doc?.getElementById('calendarViewSwitchMount') as Element | null;
    if (
      mount &&
      typeof globalThis.document !== 'undefined' &&
      mount.ownerDocument === globalThis.document
    ) {
      mountPreact(
        h(CalendarViewSwitch, {
          value: normalized,
          onChange: (nextView: CalendarMobileView) => {
            calendarController?.setView(nextView);
            setCalendarMobileView(calendarUiState.view || nextView);
          },
        }),
        mount
      );
      return;
    }
    doc?.querySelectorAll('.calendar-view-btn').forEach((button: any) => {
      const active = button.dataset.calendarView === normalized;
      button.classList?.toggle('active', active);
      button.classList?.toggle('ghost', !active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function rescheduleCalendarItem(id: string, newDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    const item = (ctx.state.calendar || []).find(c => c.id === id);
    if (!item || item.date === newDate) return;

    const applyMove = () => {
      const previousDate = item.date;
      const moveFn = () => {
        if (ctx.calendarService) {
          ctx.calendarService.update(id, { ...item, date: newDate });
        } else {
          item.date = newDate;
        }
        (calendarUiState as any).selectedDate = newDate;
        persistAndRender();
      };
      runUndoable('Compromisso reagendado.', () => {
        moveFn();
        return () => {
          if (ctx.calendarService) {
            ctx.calendarService.update(id, { ...item, date: previousDate });
          } else {
            item.date = previousDate;
          }
          persistAndRender();
        };
      });
    };

    if (item.kind === 'event' && ctx.showConfirm) {
      ctx.showConfirm(
        `Mover o evento "${item.title || 'Evento'}" para ${formatDatePt(newDate)}?`,
        applyMove
      );
      return;
    }
    applyMove();
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
    const doc = getDoc();
    if (canMountPreact(doc?.getElementById('calendarActivityModalMount'))) {
      openActivityModalForEdit(id);
      return;
    }
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
    runUndoable('Item excluído.', () => calendarController?.remove(id));
  }

  function updateCal(id: string, field: string, value: any) {
    const c = (ctx.state.calendar || []).find(x => x.id === id);
    if (c) {
      (c as Record<string, any>)[field] = value;
      persistAndRender();
    }
  }

  function exportCalendarIcs() {
    const doc = getDoc();
    const items = getUnifiedCalendarItems({ includeRecurring: false }).filter(
      item => item.origem === 'Calendário'
    );
    const ics = buildCalendarIcs(items);
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      !doc?.createElement
    ) {
      return ics;
    }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = 'extrato-agenda.ics';
    doc.body?.appendChild?.(link);
    link.click?.();
    link.remove?.();
    URL.revokeObjectURL?.(url);
    showToast('Arquivo .ics da Agenda exportado.');
    return ics;
  }

  function updateAgendaFiltersUi() {
    const doc = getDoc();
    if (!doc) return;
    const values = [
      (doc.getElementById('calFilterSubject') as HTMLSelectElement)?.value || '',
      (doc.getElementById('agendaFilterStatus') as HTMLSelectElement)?.value || '',
      (doc.getElementById('agendaFilterMes') as HTMLSelectElement)?.value || '',
      (doc.getElementById('agendaFilterTipo') as HTMLSelectElement)?.value || '',
      getActivityKindFilter(),
    ];
    const activeCount = values.filter(Boolean).length;
    const toggleBtn = doc.getElementById('agendaFiltersToggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = filterPanelLabel(activeCount);
    }
    const clearBtn = doc.getElementById('clearAgendaFiltersBtn') as HTMLElement | null;
    if (clearBtn) {
      clearBtn.hidden = activeCount === 0;
    }
  }

  function clearAgendaFilters() {
    const doc = getDoc();
    if (!doc) return;
    for (const id of [
      'agendaFilterSubject',
      'agendaFilterStatus',
      'agendaFilterMes',
      'agendaFilterTipo',
      'agendaFilterActivityKind',
      'calFilterSubject',
      'calFilterStatus',
      'calFilterMes',
      'calFilterTipo',
    ]) {
      const el = doc.getElementById(id) as HTMLSelectElement | null;
      if (el) el.value = '';
    }
    if (calendarUiState.filters) {
      calendarUiState.filters.activityKind = '';
    }
    calendarController?.clearFilters();
    updateAgendaFiltersUi();
    renderCalendar();
    renderMonthCalendar();
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

    // Disciplina, status e mês são filtros da Agenda inteira: os selects visíveis são os das revisões
    // e a ponte copia o valor para os espelhos que este controlador lê.
    for (const [sharedId, mirrorId] of [
      ['agendaFilterSubject', 'calFilterSubject'],
      ['agendaFilterStatus', 'calFilterStatus'],
      ['agendaFilterMes', 'calFilterMes'],
    ]) {
      d.getElementById(sharedId)?.addEventListener('change', (event: any) => {
        const mirror = d.getElementById(mirrorId) as HTMLSelectElement | null;
        if (!mirror) return;
        const wanted =
          event.detail?.value !== undefined
            ? event.detail.value
            : event.target?.dataset?.selectedValue !== undefined
              ? event.target.dataset.selectedValue
              : event.target?.value || '';
        mirror.value = Array.from(mirror.options || []).some(option => option.value === wanted)
          ? wanted
          : '';
        mirror.dispatchEvent?.(new Event('change', { bubbles: true }));
      });
    }

    d.getElementById('agendaFilterActivityKind')?.addEventListener('change', (event: any) => {
      if (!calendarUiState.filters) calendarUiState.filters = {};
      calendarUiState.filters.activityKind = event.target?.value || '';
      updateAgendaFiltersUi();
      renderMonthCalendar();
    });

    for (const id of [
      'agendaFilterSubject',
      'agendaFilterStatus',
      'agendaFilterMes',
      'agendaFilterTipo',
    ]) {
      d.getElementById(id)?.addEventListener('change', updateAgendaFiltersUi);
    }

    d.getElementById('clearAgendaFiltersBtn')?.addEventListener('click', clearAgendaFilters);

    const closePopovers = () => {
      for (const id of ['agendaMoreActions', 'agendaMoreFilters']) {
        const el = d.getElementById(id) as HTMLDetailsElement | null;
        if (el?.open) el.open = false;
      }
    };
    d.addEventListener?.('keydown', (event: any) => {
      if (event.key === 'Escape') closePopovers();
    });
    d.addEventListener?.('click', (event: any) => {
      for (const id of ['agendaMoreActions', 'agendaMoreFilters']) {
        const el = d.getElementById(id) as HTMLDetailsElement | null;
        if (el?.open && !el.contains?.(event.target)) {
          el.open = false;
        }
      }
    });

    const monthContainer = d.getElementById('monthCalendar');
    if (monthContainer) {
      monthContainer.addEventListener('click', (event: any) => {
        const dayEl = event.target?.closest?.('[data-calendar-date]');
        if (!dayEl) return;
        const date = dayEl.getAttribute('data-calendar-date');
        if (date) {
          (calendarUiState as any).selectedDate = date;
          renderMonthCalendar();
          d.getElementById('calendarDayDrawerMount')?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      });
      monthContainer.addEventListener('keydown', (event: any) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const dayEl = event.target?.closest?.('[data-calendar-date]');
        if (!dayEl) return;
        event.preventDefault();
        const date = dayEl.getAttribute('data-calendar-date');
        if (date) {
          (calendarUiState as any).selectedDate = date;
          renderMonthCalendar();
          d.getElementById('calendarDayDrawerMount')?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      });
      monthContainer.addEventListener('dragstart', (event: any) => {
        const dragEl = event.target?.closest?.('[data-calendar-drag-id]');
        const id = dragEl?.getAttribute('data-calendar-drag-id');
        if (id && event.dataTransfer) {
          event.dataTransfer.setData('text/plain', id);
          event.dataTransfer.effectAllowed = 'move';
        }
      });
      monthContainer.addEventListener('dragover', (event: any) => {
        const dropEl = event.target?.closest?.('[data-calendar-drop-date]');
        if (dropEl) event.preventDefault();
      });
      monthContainer.addEventListener('drop', (event: any) => {
        const dropEl = event.target?.closest?.('[data-calendar-drop-date]');
        if (!dropEl) return;
        event.preventDefault();
        const targetDate = dropEl.getAttribute('data-calendar-drop-date');
        const draggedId = event.dataTransfer?.getData('text/plain');
        if (draggedId && targetDate) {
          rescheduleCalendarItem(draggedId, targetDate);
        }
      });
    }

    d.getElementById('calAtrasadas')?.addEventListener('click', (event: any) => {
      const moveBtn = event.target?.closest?.('[data-calendar-move-today]');
      const id = moveBtn?.getAttribute('data-calendar-move-today');
      if (id) {
        rescheduleCalendarItem(id, todayISO());
      }
    });

    d.addEventListener('click', (event: any) => {
      const viewEventBtn = event.target?.closest?.('[data-calendar-view-event]');
      const viewEventId = viewEventBtn?.getAttribute('data-calendar-view-event');
      if (viewEventId) {
        if (canMountPreact(d.getElementById('calendarActivityModalMount'))) {
          openActivityModalForEdit(viewEventId);
        } else {
          d.getElementById('tab-agenda')?.click?.();
        }
        return;
      }
      const startTimerBtn = event.target?.closest?.('[data-calendar-start-timer]');
      const startTimerId = startTimerBtn?.getAttribute('data-calendar-start-timer');
      if (startTimerId && ctx.onStartTimer) {
        const item = getUnifiedCalendarItems().find(x => x.id === startTimerId);
        if (item) ctx.onStartTimer(item);
      }
    });

    d.getElementById('exportCalendarIcsBtn')?.addEventListener('click', exportCalendarIcs);

    d.getElementById('addCalRowBtn')?.addEventListener('click', () => {
      if (canMountPreact(d.getElementById('calendarActivityModalMount'))) {
        openActivityModalForDate((calendarUiState as any).selectedDate || todayISO());
      } else {
        addCalRow();
      }
    });
  }

  return {
    calendarUiState,
    calendarController,
    getFilteredAndSortedRows,
    getRevisoesUnificadas,
    getUnifiedCalendarItems,
    calendarViewModel,
    renderCalendarReadRow,
    renderCalendarEditRow,
    renderHtml,
    renderCalendar,
    renderCalIndicadores,
    renderMonthCalendar,
    renderWeekCalendar,
    renderDayDrawer,
    renderActivityModal,
    renderCalendarFilters,
    setCalendarMobileView,
    openActivityModalForDate,
    openActivityModalForEdit,
    saveActivityModal,
    rescheduleCalendarItem,
    exportCalendarIcs,
    addCalRow,
    editCalendarItem,
    cancelCalendarEdit,
    updateCalendarDraft,
    saveCalendarEdit,
    completeCalendarItem,
    deleteCalRow,
    updateCal,
    toggleOverdueDate,
    renderCalTarefasHoje,
    renderCalAtrasadas,
    completeUnifiedReview,
    registerSimulationResult: (item: UnifiedCalendarItem) => ctx.onRegisterSimulationResult?.(item),
    bindEvents,
  };
}
