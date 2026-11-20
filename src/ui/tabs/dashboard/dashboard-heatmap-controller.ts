import { buildHeatmapViewModel } from '../../../application/analytics/build-analytics-view-model.js';
import { renderHeatmap as renderHeatmapView } from '../../renderers/heatmap-renderer.js';
import {
  HEATMAP_METRICS,
  heatmapMetricLevel as defaultHeatmapMetricLevel,
} from '../../../domain/analytics/heatmap.js';
import type { DashboardTabControllerDeps } from './dashboard-tab-controller.js';

export interface DashboardHeatmapHelpers {
  doc: any;
  todayISO: () => string;
  parseLocalDate: (s: string) => any;
  addDays: (s: string, d: number) => string;
  formatDatePt: (s: string) => string;
  formatDuration: (s: number) => string;
  pluralize: (c: number, s: string, p?: string) => string;
  escapeHtml: (s: any) => string;
  escapeAttr: (s: any) => string;
}

/** Mapa de constância da Visão geral: filtros, seleção de dia, teclado e render. */
export function createDashboardHeatmapController(
  deps: DashboardTabControllerDeps,
  helpers: DashboardHeatmapHelpers
) {
  const {
    doc,
    todayISO,
    parseLocalDate,
    addDays,
    formatDatePt,
    formatDuration,
    pluralize,
    escapeHtml,
    escapeAttr,
  } = helpers;

  const HEATMAP_WEEK_OPTIONS = [12, 24, 52, 0];
  const heatmapMetricLevel = deps.heatmapMetricLevel || defaultHeatmapMetricLevel;

  const streakView = {
    metric: 'hours',
    subjectId: '',
    weeks: 52, // 0 = todo o histórico
    onlyActiveDays: false,
    selectedDate: null as string | null,
    mode: 'calendar' as 'calendar' | 'hours',
  };

  function heatmapTooltip(summary: Record<string, any>): string {
    const parts = [
      formatDatePt(summary.date),
      formatDuration(summary.seconds),
      pluralize(summary.sessions?.length || 0, 'sessão', 'sessões'),
    ];
    if (summary.targetSeconds > 0) parts.push(`${summary.goalPct}% da meta`);
    if (summary.questions > 0)
      parts.push(`${summary.questions} questões · ${summary.accuracy}% de acerto`);
    if (summary.reviews > 0) parts.push(pluralize(summary.reviews, 'revisão', 'revisões'));
    if (summary.simulations > 0) parts.push(pluralize(summary.simulations, 'simulado'));
    if (summary.subjectNames?.length) parts.push(summary.subjectNames.join(', '));
    return parts.join(' · ');
  }

  function renderHeatmap(): void {
    if (!doc) return;
    const container = doc.getElementById('heatmapContainer');
    if (!container) return;

    const activityDates = deps.getActivityDates ? deps.getActivityDates() : [];
    const earliest = [...activityDates].sort()[0];
    const historyDays = earliest
      ? Math.max(
          1,
          Math.round(
            (Number(parseLocalDate(todayISO())) - Number(parseLocalDate(earliest))) / 86400000
          ) + 1
        )
      : 52 * 7;
    const days = streakView.weeks === 0 ? historyDays : streakView.weeks * 7;
    const today = todayISO();
    const cells: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const summary = deps.getDailyStudySummary
        ? deps.getDailyStudySummary(d, { subjectId: streakView.subjectId })
        : {
            date: d,
            seconds: 0,
            sessions: [],
            questions: 0,
            reviews: 0,
            simulations: 0,
            subjectNames: [],
          };
      const active = heatmapMetricLevel(summary, streakView.metric) > 0;
      if (!streakView.onlyActiveDays || active) cells.push(summary);
    }

    const heatmapModel = buildHeatmapViewModel({
      summaries: cells,
      metric: streakView.metric,
      selectedDate: streakView.selectedDate,
    });
    const activityStreak = deps.computeStreak ? deps.computeStreak(activityDates) : 0;
    const goalStreak =
      deps.computeStreak && deps.getGoalDates ? deps.computeStreak(deps.getGoalDates()) : 0;
    const selectedSummary =
      streakView.selectedDate && deps.getDailyStudySummary
        ? deps.getDailyStudySummary(streakView.selectedDate, { subjectId: streakView.subjectId })
        : null;

    const state = deps.getState ? deps.getState() : {};
    const sessions = state.studySessions || state.sessions || [];

    // O innerHTML recria os botões: guarda o dia focado para devolver o foco ao teclado.
    const focusedDate = (doc.activeElement as HTMLElement | null)
      ?.closest?.('[data-heatmap-date]')
      ?.getAttribute('data-heatmap-date');
    bindHeatmapKeys(container);

    container.innerHTML = renderHeatmapView({
      cells: heatmapModel.cells,
      hasActivity: heatmapModel.hasActivity,
      metric: streakView.metric,
      subjectId: streakView.subjectId,
      subjects: deps.activeSubjects ? deps.activeSubjects() : [],
      weeks: streakView.weeks,
      onlyActiveDays: streakView.onlyActiveDays,
      activityStreak,
      goalStreak,
      selectedDate: streakView.selectedDate,
      selectedTooltip: selectedSummary ? heatmapTooltip(selectedSummary) : '',
      tooltipForSummary: heatmapTooltip,
      escapeHtml,
      escapeAttr,
      pluralize,
      mode: streakView.mode,
      sessions,
    });

    if (focusedDate) {
      (
        container.querySelector(`[data-heatmap-date="${focusedDate}"]`) as HTMLElement | null
      )?.focus({
        preventScroll: true,
      });
    }
  }

  // Setas em grade de 7 linhas (colunas = semanas): ↑↓ trocam o dia, ←→ trocam a semana.
  let heatmapKeysBound: Element | null = null;
  function bindHeatmapKeys(container: Element): void {
    if (heatmapKeysBound === container || typeof container.addEventListener !== 'function') return;
    heatmapKeysBound = container;
    container.addEventListener('keydown', (event: Event) => {
      const e = event as KeyboardEvent;
      const current = (e.target as HTMLElement | null)?.closest(
        '[data-heatmap-date]'
      ) as HTMLElement | null;
      if (!current) return;
      const cells = Array.from(
        container.querySelectorAll<HTMLElement>('[data-heatmap-grid] [data-heatmap-date]')
      );
      const index = cells.indexOf(current);
      const step: Record<string, number> = {
        ArrowUp: -1,
        ArrowDown: 1,
        ArrowLeft: -7,
        ArrowRight: 7,
      };
      let next = index;
      if (e.key in step) next = index + step[e.key];
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = cells.length - 1;
      else return;
      e.preventDefault();
      next = Math.max(0, Math.min(cells.length - 1, next));
      if (next === index) return;
      current.tabIndex = -1;
      cells[next].tabIndex = 0;
      cells[next].focus();
    });
  }

  function setHeatmapFilter(field: string, value: any): void {
    if (field === 'metric' && HEATMAP_METRICS.includes(value)) streakView.metric = value;
    if (field === 'subjectId') streakView.subjectId = value;
    if (field === 'weeks' && HEATMAP_WEEK_OPTIONS.includes(Number(value)))
      streakView.weeks = Number(value);
    streakView.selectedDate = null;
    renderHeatmap();
  }

  function setHeatmapMode(mode: 'calendar' | 'hours'): void {
    streakView.mode = mode === 'hours' ? 'hours' : 'calendar';
    renderHeatmap();
  }

  function selectHeatmapDay(date: string): void {
    streakView.selectedDate = streakView.selectedDate === date ? null : date;
    renderHeatmap();
  }

  function viewSelectedHeatmapSessions(): void {
    if (streakView.selectedDate && deps.selectSessionHistoryDate) {
      deps.selectSessionHistoryDate(streakView.selectedDate);
    }
  }

  function toggleStreakActiveDays(): void {
    streakView.onlyActiveDays = !streakView.onlyActiveDays;
    renderHeatmap();
  }

  function getStreakView() {
    return streakView;
  }

  return {
    heatmapTooltip,
    renderHeatmap,
    setHeatmapFilter,
    setHeatmapMode,
    selectHeatmapDay,
    viewSelectedHeatmapSessions,
    toggleStreakActiveDays,
    getStreakView,
  };
}
