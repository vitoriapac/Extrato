/**
 * Controlador de interface para o Histórico de Sessões de Estudo.
 *
 * Gerencia a filtragem por período, disciplina e tipo, expansão de dias e detalhes,
 * edição inline de sessões, exclusão segura e renderização de linhas de tabela.
 *
 * Camada: UI Controller / Tab Controller.
 */

import {
  filterStudySessions,
  groupStudySessionsByDate,
} from '../../session-history.js';
import {
  buildSessionHistoryPresentation,
  renderStudySessionRead,
  renderStudySessionEdit,
  renderStudySessionDayHeader,
} from '../../renderers/study-sessions-renderer.js';
import { renderCollectionFooter } from '../../list-components.js';
import { countActiveFilters, filterPanelLabel } from '../../filter-panel.js';
import { formatDuration } from '../../../core/format-duration.js';
import { parseLocalDate } from '../../../core/date-utils.js';

export const SESSION_TYPES: Record<string, string> = Object.freeze({
  study: 'Estudo teórico',
  review: 'Revisão',
  questions: 'Questões',
  simulation: 'Simulado',
});

export const DEFAULT_SESSION_DAYS_VISIBLE = 5;

export interface SessionHistoryControllerOptions {
  state: {
    studySessions: any[];
    subjects: any[];
  };
  listViewState?: { sessionDaysVisible: number; [key: string]: any };
  LIST_VIEW_STEPS?: { sessionDays: number; [key: string]: any };
  sessionService?: any;
  clock?: { today: () => string };
  todayISO?: () => string;
  addDays?: (iso: string, days: number) => string;
  formatDatePt?: (iso?: string | null) => string;
  formatDuration?: (seconds: number) => string;
  entitySubjectId?: (item: any) => string | null;
  getSubjectName?: (id?: string | null) => string;
  getTopicName?: (id?: string | null) => string;
  getSubjectById?: (id: string) => any;
  subjectsForSelection?: (subjectId?: string | null) => any[];
  isMobileHistoryLayout?: () => boolean;
  showToast?: (msg: string) => void;
  showConfirm?: (msg: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  persistAndRender?: () => void;
  onFilterChange?: () => void;
  renderHeatmap?: () => void;
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

const defaultAddDays = (iso: string, days: number): string => {
  const d = parseLocalDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + Number(days || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const cloneRecord = <T>(v: T): T => (v ? JSON.parse(JSON.stringify(v)) : v);

export function createSessionHistoryController(opts: SessionHistoryControllerOptions) {
  const getDoc = () => opts.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = opts.escapeHtml || defaultEscapeHtml;
  const escapeAttr = opts.escapeAttr || defaultEscapeAttr;
  const pluralize = opts.pluralize || defaultPluralize;
  const todayISO = opts.todayISO || (opts.clock?.today ? opts.clock.today : defaultTodayISO);
  const formatDatePt = opts.formatDatePt || ((iso?: string | null) => iso || '—');
  const fmtDuration = opts.formatDuration || formatDuration;
  const entitySubjectId = opts.entitySubjectId || ((item: any) => item?.subjectId || null);
  const getSubjectName = opts.getSubjectName || ((id?: string | null) => id || '—');
  const getTopicName = opts.getTopicName || ((_id?: string | null) => '');
  const getSubjectById = opts.getSubjectById || ((_id: string) => null);
  const subjectsForSelection = opts.subjectsForSelection || (() => []);
  const isMobileHistoryLayout = opts.isMobileHistoryLayout || (() => false);
  const showToast = opts.showToast || (() => {});
  const showConfirm = opts.showConfirm || ((_msg, onConfirm) => onConfirm());
  const persistAndRender = opts.persistAndRender || (() => {});
  const renderHeatmap = opts.renderHeatmap || (() => {});

  const sessionHistoryFilters = {
    period: '30',
    subjectId: '',
    type: '',
    date: '',
  };

  let expandedSessionDays = new Set<string>();
  let expandedSessionDetails = new Set<string>();
  let sessionHistoryExpansionInitialized = false;
  let sessionDaysVisible = DEFAULT_SESSION_DAYS_VISIBLE;
  const getStep = () => opts.LIST_VIEW_STEPS?.sessionDays || DEFAULT_SESSION_DAYS_VISIBLE;
  const getVisibleLimit = () =>
    opts.listViewState ? opts.listViewState.sessionDaysVisible : sessionDaysVisible;
  const setVisibleLimit = (val: number) => {
    sessionDaysVisible = val;
    if (opts.listViewState) opts.listViewState.sessionDaysVisible = val;
  };

  const historyEditState = {
    sessionId: null as string | null,
  };

  const historyEditDraft = {
    session: null as Record<string, any> | null,
  };

  const addDays = opts.addDays || defaultAddDays;

  function totalStudySeconds(filterFn?: (session: any) => boolean) {
    const fn = filterFn || (() => true);
    return (opts.state.studySessions || [])
      .filter(fn)
      .reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0);
  }

  function segundosEstudadosHoje() {
    return totalStudySeconds((s: Record<string, any>) => s.date === todayISO());
  }

  function studyTimeByTopic(topicId: string) {
    return totalStudySeconds((s: Record<string, any>) => s.topicId === topicId);
  }

  function studySecondsByDate(sessions = opts.state.studySessions) {
    const map: Record<string, number> = {};
    (sessions || []).forEach(s => {
      if (!s.date) return;
      map[s.date] = (map[s.date] || 0) + (Number(s.durationSeconds) || 0);
    });
    return map;
  }

  function sessionTypeLabel(type: string) {
    return SESSION_TYPES[type] || SESSION_TYPES.study;
  }

  function sessionTypeOptions(selected: string) {
    return Object.entries(SESSION_TYPES)
      .map(
        ([value, label]) =>
          `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`
      )
      .join('');
  }

  function sessionStartTime(session: Record<string, any>) {
    if (!session.startedAt) return '—';
    const date = new Date(session.startedAt);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function sessionViewModel(session: Record<string, any>) {
    const resolved = Number(session.questionsResolved) || 0;
    const correct = Number(session.correctAnswers) || 0;
    return {
      date: session.date ? formatDatePt(session.date) : 'Sem data',
      time: sessionStartTime(session),
      subject: getSubjectName(entitySubjectId(session)) || 'Sem disciplina',
      topic: session.topicId ? getTopicName(session.topicId) : 'Sem tópico',
      type: sessionTypeLabel(session.type || 'study'),
      duration: fmtDuration(Number(session.durationSeconds) || 0),
      questions: resolved,
      correct,
      accuracy: resolved ? Math.round((correct / resolved) * 100) : null,
      notes: session.notes || '',
    };
  }

  function filteredStudySessions() {
    return filterStudySessions(opts.state.studySessions || [], sessionHistoryFilters, {
      today: todayISO(),
      addDays,
      subjectIdOf: entitySubjectId,
    });
  }

  function updateSessionHistoryFilter(field: string, value: any) {
    (sessionHistoryFilters as Record<string, any>)[field] = value;
    if (field === 'period') sessionHistoryFilters.date = '';
    setVisibleLimit(getStep());
    expandedSessionDays.clear();
    sessionHistoryExpansionInitialized = false;
    renderStudySessionsHistory();
    renderHeatmap();
    opts.onFilterChange?.();
  }

  function clearSessionHistoryFilters() {
    sessionHistoryFilters.period = '30';
    sessionHistoryFilters.subjectId = '';
    sessionHistoryFilters.type = '';
    sessionHistoryFilters.date = '';
    setVisibleLimit(getStep());
    expandedSessionDays.clear();
    sessionHistoryExpansionInitialized = false;
    renderStudySessionsHistory();
    renderHeatmap();
    opts.onFilterChange?.();
  }

  function selectSessionHistoryDate(date: string) {
    sessionHistoryFilters.date = date;
    sessionHistoryFilters.period = 'all';
    setVisibleLimit(getStep());
    expandedSessionDays = new Set([date]);
    sessionHistoryExpansionInitialized = true;
    renderStudySessionsHistory();
    renderHeatmap();
    const card = getDoc()?.getElementById('studySessionsCard');
    card?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    opts.onFilterChange?.();
  }

  function toggleSessionDay(date: string) {
    sessionHistoryExpansionInitialized = true;
    if (expandedSessionDays.has(date)) expandedSessionDays.delete(date);
    else expandedSessionDays.add(date);
    renderStudySessionsHistory();
  }

  function toggleSessionDetails(id: string) {
    if (expandedSessionDetails.has(id)) expandedSessionDetails.delete(id);
    else expandedSessionDetails = new Set([id]);
    renderStudySessionsHistory();
  }

  function changeSessionDaysLimit(delta: number) {
    setVisibleLimit(delta > 0 ? Number.MAX_SAFE_INTEGER : getStep());
    renderStudySessionsHistory();
  }

  function renderSessionHistoryFilterControls() {
    const doc = getDoc();
    if (!doc) return;
    const period = doc.getElementById('studySessionsPeriod') as HTMLSelectElement | null;
    const subject = doc.getElementById('studySessionsSubjectFilter') as HTMLSelectElement | null;
    const type = doc.getElementById('studySessionsTypeFilter') as HTMLSelectElement | null;
    if (!period || !subject || !type) return;

    period.value = sessionHistoryFilters.period;
    subject.innerHTML =
      `<option value="">Todas as disciplinas</option>` +
      (opts.state.subjects || [])
        .map((s: any) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`)
        .join('');
    subject.value = sessionHistoryFilters.subjectId;
    type.value = sessionHistoryFilters.type;

    const active = countActiveFilters(sessionHistoryFilters, {
      period: '30',
      subjectId: '',
      type: '',
      date: '',
    });
    const toggle = doc.getElementById('studySessionsFilterToggle');
    if (toggle) {
      toggle.textContent =
        filterPanelLabel(active) + (toggle.getAttribute('aria-expanded') === 'true' ? ' ▴' : ' ▾');
    }
  }

  function renderStudySessionReadRow(session: Record<string, any>) {
    const vm = sessionViewModel(session);
    const detailsId = `session-details-${session.id}`;
    const expanded = expandedSessionDetails.has(session.id);
    return renderStudySessionRead({
      session,
      view: vm,
      detailsId,
      expanded,
      mobile: isMobileHistoryLayout(),
      escapeHtml,
      escapeAttr,
      pluralize,
    });
  }

  function renderStudySessionEditRow(session: Record<string, any>) {
    const draft = historyEditDraft.session;
    if (!draft) return '';
    const subjectId = entitySubjectId(draft);
    const subject = getSubjectById(subjectId || '');
    const topics = subject ? subject.topics || [] : [];
    const subjectOptions = subjectsForSelection(subjectId)
      .map(
        (item: any) =>
          `<option value="${escapeAttr(item.id)}" ${item.id === subjectId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`
      )
      .join('');
    const topicOptions = topics
      .map(
        (topic: any) =>
          `<option value="${escapeAttr(topic.id)}" ${topic.id === draft.topicId ? 'selected' : ''}>${escapeHtml(topic.name)}</option>`
      )
      .join('');
    return renderStudySessionEdit({
      session,
      draft,
      typeOptions: sessionTypeOptions(draft.type || 'study'),
      subjectOptions,
      topicOptions,
      escapeHtml,
    });
  }

  function renderStudySessionsHistory() {
    const doc = getDoc();
    if (!doc) return;
    const body = doc.getElementById('studySessionsBody');
    const count = doc.getElementById('studySessionsCount');
    const summary = doc.getElementById('studySessionsFilterSummary');
    const tableWrap = doc.getElementById('studySessionsTableWrap');
    const emptyState = doc.getElementById('studySessionsEmpty');
    if (!body || !count) return;

    renderSessionHistoryFilterControls();
    const rows = filteredStudySessions();
    const presentation = buildSessionHistoryPresentation({
      total: (opts.state.studySessions || []).length,
      filtered: rows.length,
      dateLabel: sessionHistoryFilters.date ? formatDatePt(sessionHistoryFilters.date) : '',
    });
    count.textContent = presentation.count;
    if (summary) {
      summary.textContent = presentation.summary;
      summary.hidden = !presentation.summary;
    }
    if (rows.length === 0) {
      body.innerHTML = '';
      if (tableWrap) tableWrap.hidden = true;
      if (emptyState) {
        emptyState.hidden = false;
        const titleEl = emptyState.querySelector('strong');
        if (titleEl) titleEl.textContent = presentation.emptyTitle;
        const pEl = emptyState.querySelector('p');
        if (pEl) pEl.textContent = presentation.emptyMessage;
      }
      return;
    }
    if (tableWrap) tableWrap.hidden = false;
    if (emptyState) emptyState.hidden = true;

    const currentLimit = getVisibleLimit();
    const currentStep = getStep();
    const visibleGroups = groupStudySessionsByDate(rows.slice(0, currentLimit));
    if (!sessionHistoryExpansionInitialized && visibleGroups.length) {
      expandedSessionDays.add(visibleGroups[0][0]);
      sessionHistoryExpansionInitialized = true;
    }

    const html: string[] = [];
    visibleGroups.forEach(([date, sessions]) => {
      const expanded = expandedSessionDays.has(date);
      html.push(
        renderStudySessionDayHeader({
          date,
          sessions,
          expanded,
          formatDate: formatDatePt,
          formatDuration: fmtDuration,
          pluralize,
          escapeAttr,
        })
      );
      if (!expanded) return;
      sessions.forEach((session: any) =>
        html.push(
          historyEditState.sessionId === session.id
            ? renderStudySessionEditRow(session)
            : renderStudySessionReadRow(session)
        )
      );
    });

    html.push(
      renderCollectionFooter({
        total: rows.length,
        visible: currentLimit,
        step: currentStep,
        showMoreAction: "changeListLimit('sessionDays',LIST_VIEW_STEPS.sessionDays,renderStudySessionsHistory)",
        showLessAction:
          currentLimit > currentStep
            ? "changeListLimit('sessionDays',-listViewState.sessionDaysVisible,renderStudySessionsHistory)"
            : '',
        colspan: 10,
        label: 'sessões',
      })
    );
    body.innerHTML = html.join('');
  }

  function editStudySession(id: string) {
    const session = (opts.state.studySessions || []).find(s => s.id === id);
    if (!session) return;
    historyEditState.sessionId = id;
    historyEditDraft.session = cloneRecord(session);
    renderStudySessionsHistory();
  }

  function cancelStudySessionEdit() {
    historyEditState.sessionId = null;
    historyEditDraft.session = null;
    renderStudySessionsHistory();
  }

  function updateStudySessionDraft(field: string, value: any) {
    const d = historyEditDraft.session;
    if (!d) return;
    if (field === 'durationMinutes') d.durationSeconds = Math.max(0, Number(value) || 0) * 60;
    else if (field === 'questionsResolved' || field === 'correctAnswers')
      d[field] = Math.max(0, Math.floor(Number(value) || 0));
    else d[field] = value;
    if (field === 'subjectId') {
      const sub = getSubjectById(d.subjectId);
      if (sub && !sub.topics?.some((t: any) => t.id === d.topicId)) {
        d.topicId = null;
      }
      renderStudySessionsHistory();
    }
  }

  function saveStudySessionEdit() {
    const d = historyEditDraft.session;
    if (!d) return;
    d.durationSeconds = Math.max(0, Number(d.durationSeconds) || 0);
    d.questionsResolved = Math.max(0, Math.floor(Number(d.questionsResolved) || 0));
    d.correctAnswers = Math.max(
      0,
      Math.min(Math.floor(Number(d.correctAnswers) || 0), d.questionsResolved)
    );
    const index = (opts.state.studySessions || []).findIndex(s => s.id === d.id);
    if (index < 0) return cancelStudySessionEdit();

    if (opts.sessionService?.edit) {
      opts.sessionService.edit(d.id, d);
    } else {
      opts.state.studySessions[index] = cloneRecord(d);
    }
    historyEditState.sessionId = null;
    historyEditDraft.session = null;
    persistAndRender();
    showToast('Sessão atualizada.');
  }

  function deleteStudySession(id: string) {
    showConfirm('Excluir esta sessão e as questões vinculadas a ela?', () => {
      if (opts.sessionService?.remove) {
        opts.sessionService.remove(id);
      } else {
        opts.state.studySessions = (opts.state.studySessions || []).filter(s => s.id !== id);
      }
      persistAndRender();
      showToast('Sessão excluída.');
    });
  }

  function syncQuestionFromStudySession(session: Record<string, any>) {
    return opts.sessionService?.edit
      ? opts.sessionService.edit(session.id, session)
      : null;
  }

  return {
    sessionHistoryFilters,
    historyEditState,
    historyEditDraft,
    getSessionDaysVisible: () => sessionDaysVisible,
    setSessionDaysVisible: (v: number) => { sessionDaysVisible = v; },
    totalStudySeconds,
    segundosEstudadosHoje,
    studyTimeByTopic,
    studySecondsByDate,
    sessionTypeLabel,
    sessionTypeOptions,
    sessionStartTime,
    sessionViewModel,
    filteredStudySessions,
    updateSessionHistoryFilter,
    clearSessionHistoryFilters,
    selectSessionHistoryDate,
    toggleSessionDay,
    toggleSessionDetails,
    changeSessionDaysLimit,
    renderSessionHistoryFilterControls,
    renderStudySessionReadRow,
    renderStudySessionEditRow,
    renderStudySessionsHistory,
    editStudySession,
    cancelStudySessionEdit,
    updateStudySessionDraft,
    saveStudySessionEdit,
    deleteStudySession,
    syncQuestionFromStudySession,
  };
}
