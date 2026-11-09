import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import {
  buildConsistencyStrip,
  renderConsistencyStrip,
} from '../../renderers/consistency-strip-renderer.js';
import { QuickStatsGrid, type QuickStatsData } from './QuickStatsGrid.js';
import { SubjectProgressList, type SubjectProgressItem } from './SubjectProgressList.js';
import { UpcomingReviewsList, type UpcomingReviewItem } from './UpcomingReviewsList.js';
import { NextActionCard, type NextActionCardProps } from './NextActionCard.js';
import {
  AllocationBalanceGrid,
  type AllocationBalanceGridProps,
} from './AllocationBalanceGrid.js';
import {
  CriticalVulnerabilitiesGrid,
  type CriticalVulnerabilitiesGridProps,
} from './CriticalVulnerabilitiesGrid.js';
import {
  VolatileMasteryGrid,
  type VolatileMasteryGridProps,
} from './VolatileMasteryGrid.js';
import {
  SyllabusHealthCard,
  type SyllabusHealthCardProps,
} from './SyllabusHealthCard.js';
import {
  PerformanceTrendCard,
  type PerformanceTrendCardProps,
} from './PerformanceTrendCard.js';
import {
  CockpitSidebarCards,
  type CockpitSidebarCardsProps,
  TodayGoalCard,
  WeeklyReviewLoadCard,
} from './CockpitSidebarCards.js';
import { subjectColorOf } from '../../../domain/subjects/subject-color.js';
import { buildAllocationBalanceViewModel } from '../../../application/analytics/build-allocation-balance-view-model.js';
import { buildCriticalVulnerabilitiesViewModel } from '../../../application/analytics/build-critical-vulnerabilities-view-model.js';
import { buildVolatileMasteryViewModel } from '../../../application/analytics/build-volatile-mastery-view-model.js';
import { buildSyllabusHealthViewModel } from '../../../application/analytics/build-syllabus-health-view-model.js';
import { buildPerformanceTrendViewModel } from '../../../application/analytics/build-performance-trend-view-model.js';
import { buildCockpitSidebarViewModel } from '../../../application/analytics/build-cockpit-sidebar-view-model.js';
import { buildWeeklyPerformanceBrief } from '../../../application/performance/build-weekly-performance-brief.js';
import { buildHeatmapViewModel } from '../../../application/analytics/build-analytics-view-model.js';
import { renderHeatmap as renderHeatmapView } from '../../renderers/heatmap-renderer.js';
import { buildHeaderViewModel } from '../../../application/analytics/build-header-view-model.js';
import { readinessWeeklyTrend } from '../../../application/analytics/readiness-history.js';
import {
  HEATMAP_METRICS,
  heatmapMetricLevel as defaultHeatmapMetricLevel,
} from '../../../domain/analytics/heatmap.js';
import { resolveExamPhase } from '../../../domain/planning/adaptive-planning.js';
import { renderCollectionFooter } from '../../list-components.js';
import { DEFAULT_LIST_VISIBLE_ITEMS } from '../../progressive-list.js';
import { scrollBehavior } from '../../accessibility.js';
import { renderExamPhaseCompact } from '../../renderers/adaptive-planning-renderer.js';
import { renderCompactHeader, renderHeroHeader } from '../../renderers/header-renderer.js';
import { buildOverviewStanding } from '../../../application/analytics/build-overview-standing.js';
import { renderOverviewEvidence, renderOverviewStanding } from '../../renderers/overview-standing-renderer.js';

export interface DashboardTabControllerDeps {
  document?: any;
  window?: any;
  getState?: () => any;
  todayISO?: () => string;
  parseLocalDate?: (dateStr: string) => any;
  addDays?: (dateStr: string, days: number) => string;
  formatDecimal?: (val: number | null | undefined) => string;
  formatDatePt?: (dateStr: string) => string;
  formatDuration?: (seconds: number) => string;
  pluralize?: (count: number, singular: string, plural?: string) => string;
  escapeHtml?: (text: any) => string;
  escapeAttr?: (text: any) => string;
  recentPerformance?: () => { current?: { accuracy: number | null } | null } | any;
  projectPerformance?: () => { central?: number | null } | any;
  examMatrixRows?: () => any[];
  revisoesAtrasadas?: () => number;
  getRevisoesUnificadas?: () => any[];
  metaHoursToday?: () => number;
  getTodayPlannedMinutes?: () => number;
  diasParaRevisao?: (dateStr: string) => number | null;
  activateTab?: (tab: string) => void;
  renderAgenda?: () => void;
  getActivityDates?: () => Set<string> | string[];
  getGoalDates?: () => Set<string> | string[] | any;
  getDailyStudySummary?: (dateStr: string, options?: { subjectId?: string }) => any;
  heatmapMetricLevel?: (summary: any, metric: string) => number;
  computeStreak?: (dates: any) => number;
  activeSubjects?: () => any[];
  activeTopics?: () => any[];
  subjectProgress?: (subject: any) => number;
  entitySubjectName?: (item: any) => string;
  getTopicName?: (id: string) => string;
  readinessResult?: (metrics?: any) => any;
  computeApprovalMetrics?: () => any;
  recordProgressSnapshot?: (pct: number) => void;
  selectSessionHistoryDate?: (dateStr: string) => void;
  planStartDate?: () => string;
}

export function createDashboardTabController(deps: DashboardTabControllerDeps = {}) {
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  const todayISO = deps.todayISO || (() => new Date().toISOString().slice(0, 10));
  const parseLocalDate = deps.parseLocalDate || ((s: string) => new Date(s + 'T00:00:00'));
  const addDays =
    deps.addDays ||
    ((s: string, d: number) => {
      const dt = new Date(s + 'T00:00:00');
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().slice(0, 10);
    });
  const formatDecimal =
    deps.formatDecimal || ((v: any) => (v != null ? Number(v).toLocaleString('pt-BR') : '0'));
  const formatDatePt = deps.formatDatePt || ((s: string) => s);
  const formatDuration = deps.formatDuration || ((s: number) => `${Math.round(s / 60)} min`);
  const pluralize =
    deps.pluralize || ((c: number, s: string, p?: string) => `${c} ${c === 1 ? s : p || s + 's'}`);
  const escapeHtml =
    deps.escapeHtml ||
    ((str: any) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'));
  const escapeAttr = deps.escapeAttr || ((str: any) => String(str ?? '').replace(/"/g, '&quot;'));
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

  function renderNextActionCardHtml(props: NextActionCardProps): string {
    return render(h(NextActionCard, props));
  }

  function mountNextActionCard(container: Element, props: NextActionCardProps): void {
    mountPreact(h(NextActionCard, props), container);
  }

  function renderQuickStatsHtml(data: QuickStatsData): string {
    return render(h(QuickStatsGrid, data));
  }

  function mountQuickStats(container: Element, data: QuickStatsData): void {
    mountPreact(h(QuickStatsGrid, data), container);
  }

  function renderProgressBarsHtml(subjects: SubjectProgressItem[]): string {
    return render(h(SubjectProgressList, { subjects }));
  }

  function mountProgressBars(container: Element, subjects: SubjectProgressItem[]): void {
    mountPreact(h(SubjectProgressList, { subjects }), container);
  }

  function renderUpcomingListHtml(items: UpcomingReviewItem[]): string {
    return render(h(UpcomingReviewsList, { items }));
  }

  function mountUpcomingList(container: Element, items: UpcomingReviewItem[]): void {
    mountPreact(h(UpcomingReviewsList, { items }), container);
  }

  function renderAllocationBalanceHtml(props: AllocationBalanceGridProps): string {
    return render(h(AllocationBalanceGrid, props));
  }

  function mountAllocationBalance(container: Element, props: AllocationBalanceGridProps): void {
    mountPreact(h(AllocationBalanceGrid, props), container);
  }

  function renderCriticalVulnerabilitiesHtml(props: CriticalVulnerabilitiesGridProps): string {
    return render(h(CriticalVulnerabilitiesGrid, props));
  }

  function mountCriticalVulnerabilities(
    container: Element,
    props: CriticalVulnerabilitiesGridProps
  ): void {
    mountPreact(h(CriticalVulnerabilitiesGrid, props), container);
  }

  function renderVolatileMasteryHtml(props: VolatileMasteryGridProps): string {
    return render(h(VolatileMasteryGrid, props));
  }

  function mountVolatileMastery(container: Element, props: VolatileMasteryGridProps): void {
    mountPreact(h(VolatileMasteryGrid, props), container);
  }

  function mountSyllabusHealth(container: Element, props: SyllabusHealthCardProps): void {
    mountPreact(h(SyllabusHealthCard, props), container);
  }

  function mountPerformanceTrend(container: Element, props: PerformanceTrendCardProps): void {
    mountPreact(h(PerformanceTrendCard, props), container);
  }

  function mountCockpitSidebar(container: Element, props: CockpitSidebarCardsProps): void {
    mountPreact(h(CockpitSidebarCards, props), container);
  }

  function renderCockpitDecisionGrids(): void {
    if (!doc) return;
    const state = deps.getState ? deps.getState() : {};
    const today = todayISO();

    const hasConfigured = Boolean(
      state.examDate ||
        (Array.isArray(state.subjects) && state.subjects.length > 0) ||
        (Array.isArray(state.studyPlans) && state.studyPlans.length > 0) ||
        (Array.isArray(state.studySessions) && state.studySessions.length > 0)
    );

    // Gestão de visibilidade de seções secundárias no estado zero para evitar sobrecarga de alertas vazios
    const decisionGrids = doc.querySelector('.cockpit-decision-grids');
    if (decisionGrids) {
      (decisionGrids as HTMLElement).hidden = !hasConfigured;
    }

    const performanceGrid = doc.querySelector('.cockpit-performance-grid');
    if (performanceGrid) {
      (performanceGrid as HTMLElement).hidden = !hasConfigured;
    }

    const attentionCard = doc.querySelector('.overview-now-attention');
    if (attentionCard) {
      (attentionCard as HTMLElement).hidden = !hasConfigured;
    }

    const reviewLoadSlot = doc.getElementById('cockpitReviewLoadMount');
    if (reviewLoadSlot) (reviewLoadSlot as HTMLElement).hidden = !hasConfigured;

    const analyticsDisclosure = doc.getElementById('cockpitAnalyticsDisclosure');
    if (analyticsDisclosure) {
      analyticsDisclosure.hidden = !hasConfigured;
    }

    // Camada 2: Saúde do Edital por Disciplina
    const healthMount = doc.getElementById('cockpitSyllabusHealthMount');
    if (healthMount) {
      healthMount.hidden = !hasConfigured;
      if (hasConfigured) {
        const healthModel = buildSyllabusHealthViewModel(state);
        mountSyllabusHealth(healthMount, {
          model: healthModel,
          onNavigateSubjects: () => navigateKpi('disciplinas'),
        });
      }
    }

    // Camada 2: Tendência de Desempenho (Questões & Simulados)
    const perfMount = doc.getElementById('cockpitPerformanceMount');
    if (perfMount) {
      perfMount.hidden = !hasConfigured;
      if (hasConfigured) {
        const perfModel = buildPerformanceTrendViewModel(state, today);
        mountPerformanceTrend(perfMount, {
          model: perfModel,
          onNavigateQuestions: () => navigateKpi('questoes'),
        });
      }
    }

        // Meta diária e questões ficam dentro de "Próxima ação"; Carga de Revisões na coluna de Atenção
    const sidebarModel = buildCockpitSidebarViewModel(state, today, {
      goalMinutes: (deps.metaHoursToday?.() ?? 0) * 60,
      planMinutes: deps.getTodayPlannedMinutes?.() ?? 0,
      reviews: deps.getRevisoesUnificadas?.() ?? [],
      overdueCount: deps.revisoesAtrasadas?.(),
    });

    const todayGoalMount = doc.getElementById('cockpitTodayGoalMount');
    if (todayGoalMount) {
      mountPreact(h(TodayGoalCard, { data: sidebarModel.todayGoal, variant: 'inline' }), todayGoalMount);
    }

    const reviewLoadMount = doc.getElementById('cockpitReviewLoadMount');
    if (reviewLoadMount) {
      mountPreact(h(WeeklyReviewLoadCard, { data: sidebarModel.reviewLoad }), reviewLoadMount);
    }

    // Suporte legado se cockpitRightColumnMount ainda existir em algum lugar
    const rightMount = doc.getElementById('cockpitRightColumnMount');
    if (rightMount) {
      mountCockpitSidebar(rightMount, {
        model: sidebarModel,
      });
    }

    const weeklyBrief = buildWeeklyPerformanceBrief({
      today,
      questions: state.questoes || [],
      sessions: state.studySessions || [],
      dailyPlans: state.dailyPlans || [],
      reviews: state.reviewAgenda || [],
      simulations: state.simulados || [],
      subjects: state.subjects || [],
      overdueReviewsCount: deps.revisoesAtrasadas?.(),
    });

    const periodEl = doc.getElementById('overviewWeeklyPeriod');
    if (periodEl) {
      periodEl.textContent = weeklyBrief.periodLabel;
      periodEl.hidden = !hasConfigured;
    }

    const note = doc.getElementById('overviewClosingNote');
    if (note) {
      note.textContent = weeklyBrief.shortParagraph;
      note.hidden = !hasConfigured;
    }

    const standingMount = doc.getElementById('overviewStanding');
    const evidenceMount = doc.getElementById('overviewEvidence');
    if (standingMount || evidenceMount) {
      if (standingMount) standingMount.hidden = !hasConfigured;
      if (evidenceMount) evidenceMount.hidden = !hasConfigured;
      if (hasConfigured) {
        let readiness: any = null;
        try {
          readiness =
            deps.readinessResult && deps.computeApprovalMetrics
              ? deps.readinessResult(deps.computeApprovalMetrics())
              : null;
        } catch {
          readiness = null;
        }
        const standing = buildOverviewStanding({
          calibration: deps.projectPerformance?.()?.calibration,
          matrixRows: deps.examMatrixRows ? deps.examMatrixRows() : [],
          readiness,
        });
        if (standingMount)
          standingMount.innerHTML = renderOverviewStanding(standing, {
            escapeHtml,
            formatDate: formatDatePt,
          });
        // A evidência fica na coluna de Atenção, abaixo da Carga de revisões.
        if (evidenceMount) evidenceMount.innerHTML = renderOverviewEvidence(standing.evidence);
      }
    }
    // O mural histórico mora em Desempenho > Consistência; a Visão geral mostra só as últimas 4 semanas.
    renderHeatmap();
    const consistencyMount = doc.getElementById('overviewConsistency');
    if (consistencyMount)
      consistencyMount.innerHTML = renderConsistencyStrip(
        buildConsistencyStrip({
          sessions: state.studySessions || [],
          questions: state.questoes || [],
          today,
        }),
        { formatDate: formatDatePt }
      );

    // 1. Balanço de Alocação de Tempo vs. Peso no Edital
    const allocMount = doc.getElementById('cockpitAllocationMount');
    if (allocMount) {
      const allocModel = buildAllocationBalanceViewModel({
        subjects: state.subjects || [],
        sessions: state.studySessions || [],
        blueprint: state.examBlueprint || {},
        today,
        addDays,
      });
      mountAllocationBalance(allocMount, {
        model: allocModel,
        onNavigatePlanning: () => navigateKpi('metas'),
      });
    }

    // 2. Radar de Vulnerabilidades Críticas
    const vulMount = doc.getElementById('cockpitVulnerabilitiesMount');
    if (vulMount) {
      const vulModel = buildCriticalVulnerabilitiesViewModel({
        subjects: state.subjects || [],
        blueprint: state.examBlueprint || {},
        metricsByTopic: state.metricsByTopic || {},
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        limit: 4,
      });
      mountCriticalVulnerabilities(vulMount, {
        model: vulModel,
        onTrainTopic: (_topicId, _subjectId) => navigateKpi('questoes'),
        onViewIntelligence: () => goToPerformance('examIntelligenceHub'),
      });
    }

    // 3. Diagnóstico de Domínio Volátil / Falsa Consolidação
    const volMount = doc.getElementById('cockpitVolatileMount');
    if (volMount) {
      const volModel = buildVolatileMasteryViewModel({
        subjects: state.subjects || [],
        questoes: state.questoes || [],
        limit: 4,
      });
      mountVolatileMastery(volMount, {
        model: volModel,
        onScheduleReview: (_topicId, _subjectId) => navigateKpi('agenda'),
        onViewRetentionAnalysis: () => goToPerformance('topicRetentionDashboard'),
      });
    }
  }

  // Os cards de decisão moram em Desempenho: o link leva à seção, não só à aba.
  function goToPerformance(sectionId: string): void {
    navigateKpi('desempenho');
    setTimeout(
      () => doc?.getElementById(sectionId)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }),
      150
    );
  }

  function renderKPIs(): void {
    if (!doc) return;
    const grid = doc.getElementById('kpiGrid');
    if (!grid) return;

    const state = deps.getState ? deps.getState() : { questoes: [], metas: { metaAprovacao: 80 } };
    const resolved = (state.questoes || []).reduce(
      (n: number, q: any) => n + (Number(q.resolved) || 0),
      0
    );
    const accuracy = deps.recentPerformance ? deps.recentPerformance().current?.accuracy : null;
    const simulations = deps.projectPerformance ? deps.projectPerformance().central : null;
    const late = deps.revisoesAtrasadas ? deps.revisoesAtrasadas() : 0;
    const target = state.metas?.metaAprovacao ?? 80;

    const hasResults = accuracy != null;
    const shown = (value: any) => (value == null ? '—' : `${formatDecimal(value)}%`);

    grid.innerHTML = `
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('questoes')"><div class="n">${formatDecimal(resolved)}</div><div class="l">Questões resolvidas</div></button>
    <button type="button" class="kpi-cell kpi-link ${hasResults ? (accuracy >= target ? 'ok' : 'warn') : ''}" data-delegated-click="navigateKpi('desempenho')"><div class="n">${shown(accuracy)}</div><div class="l">Precisão · 30 dias</div></button>
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('desempenho')"><div class="n">${shown(simulations)}</div><div class="l">Simulados comparáveis</div></button>
    <button type="button" class="kpi-cell kpi-link ${late > 0 ? 'warn' : ''}" data-delegated-click="navigateKpi('agenda','overdue')"><div class="n">${late}</div><div class="l">Revisões atrasadas</div></button>
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('metas')"><div class="n">${target}%</div><div class="l">Meta de acerto</div></button>`;
  }

  function renderExamProgress(): void {
    if (!doc) return;
    const el = doc.getElementById('examProgress');
    if (!el) return;

    const state = deps.getState ? deps.getState() : {};
    if (!state.examDate) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'grid';
    const today = todayISO();
    const start = deps.planStartDate ? deps.planStartDate() : today;
    const exam = state.examDate;

    const diff = (a: any, b: any) =>
      Math.max(0, Math.round((Number(parseLocalDate(b)) - Number(parseLocalDate(a))) / 86400000));
    const total = Math.max(1, diff(start, exam));
    const elapsed = Math.min(total, diff(start, today));
    const remaining = Math.max(0, (deps.diasParaRevisao ? deps.diasParaRevisao(exam) : 0) ?? 0);
    const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));

    el.innerHTML = `<span class="exam-progress-label">Hoje</span><div class="exam-progress-track" role="progressbar" aria-label="Progresso até a prova" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="exam-progress-fill" style="width:${pct}%"></div></div><strong>${pct}%</strong><span class="exam-progress-days">${total} dias totais · ${elapsed} passaram · ${remaining} faltam</span>`;
  }

  function renderExamCountdown(): void {
    if (!doc) return;
    const state = deps.getState ? deps.getState() : {};
    const input = doc.getElementById('examDateInput') as HTMLInputElement | null;
    if (input && doc.activeElement !== input) {
      input.value = state.examDate || '';
    }
    const fig = doc.getElementById('examCountdownFigure');
    renderExamProgress();
    if (!fig) return;

    if (!state.examDate) {
      fig.textContent = 'defina a data da prova';
      fig.classList.remove('urgent');
      return;
    }
    const dias = deps.diasParaRevisao ? deps.diasParaRevisao(state.examDate) : null;
    fig.classList.toggle('urgent', dias !== null && dias <= 7);
    if (dias === null) fig.textContent = '';
    else if (dias < 0) fig.textContent = 'prova foi há ' + pluralize(Math.abs(dias), 'dia');
    else if (dias === 0) fig.textContent = 'a prova é hoje!';
    else fig.textContent = 'faltam ' + pluralize(dias, 'dia') + ' para a prova';
  }

  function navigateKpi(tab: string, filter?: string): void {
    if (deps.activateTab) deps.activateTab(tab);
    if (tab === 'agenda' && filter === 'overdue' && doc) {
      const select = doc.getElementById('agendaFilterStatus') as HTMLSelectElement | null;
      if (select) {
        select.value = 'Atrasadas';
        if (deps.renderAgenda) deps.renderAgenda();
      }
    }
    if (!doc) return;
    // A lista unificada, na Agenda, soma Calendário + Agenda: o mesmo total do KPI.
    const target =
      tab === 'agenda' && filter === 'overdue' ? doc.getElementById('agendaAtrasadasCard') : null;
    (target || doc.getElementById('panel-' + tab))?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    });
  }

  // Opens the place where the missing readiness factor gets its first evidence (F8).
  function unlockReadinessFactor(factor: string): void {
    const destinations: Record<string, [string, string | null]> = {
      coverage: ['disciplinas', null],
      mastery: ['questoes', 'addQuestaoRowBtn'],
      retention: ['agenda', null],
      consistency: ['hoje', 'timerSubjectSelect'],
      simulations: ['questoes', 'addSimuladoRowBtn'],
    };
    const [tab, controlId] = destinations[factor] || [];
    if (!tab) return;
    if (deps.activateTab) deps.activateTab(tab);
    const control = controlId ? (doc?.getElementById(controlId) as HTMLElement | null) : null;
    if (control?.tagName === 'BUTTON') control.click();
    else control?.focus();
  }

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
    const focusedDate = (doc.activeElement as HTMLElement | null)?.closest?.('[data-heatmap-date]')
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
      (container.querySelector(`[data-heatmap-date="${focusedDate}"]`) as HTMLElement | null)?.focus({
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
      const current = (e.target as HTMLElement | null)?.closest('[data-heatmap-date]') as HTMLElement | null;
      if (!current) return;
      const cells = Array.from(
        container.querySelectorAll<HTMLElement>('[data-heatmap-grid] [data-heatmap-date]')
      );
      const index = cells.indexOf(current);
      const step: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
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
    if (field === 'weeks' && HEATMAP_WEEK_OPTIONS.includes(Number(value))) streakView.weeks = Number(value);
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

  let upcomingVisible = DEFAULT_LIST_VISIBLE_ITEMS;

  function changeUpcomingLimit(_delta: number): void {
    upcomingVisible = Number.MAX_SAFE_INTEGER;
    renderDashboard();
  }

  function showAllUpcoming(): void {
    upcomingVisible = Number.MAX_SAFE_INTEGER;
    renderDashboard();
  }

  function resetUpcomingLimit(): void {
    upcomingVisible = 5;
    renderDashboard();
  }

  function resetUpcomingListDefault(): void {
    upcomingVisible = DEFAULT_LIST_VISIBLE_ITEMS;
  }

  function renderHeader(): void {
    if (!doc) return;
    const state = deps.getState ? deps.getState() : {};
    const topics = deps.activeTopics ? deps.activeTopics() : [];
    const total = topics.length;
    const done = topics.filter((t: any) => t.status === 'Concluído').length;
    const andamento = topics.filter((t: any) => t.status === 'Em andamento').length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const readiness =
      deps.readinessResult && deps.computeApprovalMetrics
        ? deps.readinessResult(deps.computeApprovalMetrics())
        : { value: null, statusLabel: '', summary: '' };
    const statAndamentoEl = doc.getElementById('statAndamento');
    const statConcluidoEl = doc.getElementById('statConcluido');
    if (statAndamentoEl) statAndamentoEl.textContent = String(andamento);
    if (statConcluidoEl) statConcluidoEl.textContent = String(done);

    const today = todayISO();
    const revisoesPrevistas =
      (state.calendar || []).filter((c: any) => c.date >= today && c.status !== 'Concluído')
        .length +
      (state.reviewAgenda || []).filter((a: any) => a.date >= today && a.status !== 'Concluído')
        .length;
    const activityDates = deps.getActivityDates ? deps.getActivityDates() : new Set<string>();
    const model = buildHeaderViewModel({
      readiness,
      subjects: state.subjects || [],
      topics,
      upcomingReviews: revisoesPrevistas,
      streak: deps.computeStreak ? deps.computeStreak(activityDates) : 0,
      examDate: state.examDate || '',
      planNumber: doc.getElementById('planNumber')?.textContent || '',
      today,
    });
    const readinessTrend = readinessWeeklyTrend(
      state.readinessSnapshots || [],
      state.examBlueprint?.activeExamTags || [],
      today,
      8,
      readiness.value
    );
    renderHeroHeader({ ...model, readinessTrend }, { document: doc });
    renderCompactHeader(model, { document: doc, formatDate: formatDatePt });

    if (deps.recordProgressSnapshot) deps.recordProgressSnapshot(pct);
    renderExamCountdown();
    const emptyCta = doc.getElementById('demoEmptyCta');
    if (emptyCta) {
      const demoBanner = doc.getElementById('demoBanner');
      const inDemo = Boolean(demoBanner && !demoBanner.hidden);
      emptyCta.hidden =
        inDemo ||
        (state.subjects?.length || 0) > 0 ||
        (state.studySessions?.length || 0) > 0 ||
        (state.studyPlans?.length || 0) > 0 ||
        Boolean(state.dailyPlans?.some((p: any) => p.items?.length > 0));
    }
  }

  // Lives in Desempenho > Progresso e conquistas since C2; rendered with that tab, not the overview.
  function renderSubjectProgressBars(): void {
    if (!doc) return;
    const bars = doc.getElementById('progressBars');
    if (bars && deps.activeSubjects) {
      const allSubjects = deps.activeSubjects();
      mountProgressBars(
        bars,
        allSubjects.map((s: any) => ({
          id: s.id,
          name: s.name,
          colorSlot: subjectColorOf(s, allSubjects),
          percentage: deps.subjectProgress ? deps.subjectProgress(s) : 0,
        }))
      );
    }
  }

  function renderDashboard(): void {
    if (!doc) return;
    const state = deps.getState ? deps.getState() : {};
    const phaseDays =
      state.examDate && deps.diasParaRevisao ? deps.diasParaRevisao(state.examDate) : null;
    const phaseChip = doc.getElementById('examPhaseChip');
    if (phaseChip) {
      const phase = resolveExamPhase(phaseDays);
      phaseChip.textContent = state.examDate && phase?.label ? `Fase: ${phase.label}` : '';
      phaseChip.hidden = !phaseChip.textContent;
    }
    const phaseContainer = doc.getElementById('overviewExamPhase');
    if (phaseContainer) {
      phaseContainer.innerHTML = renderExamPhaseCompact(resolveExamPhase(phaseDays), {
        escapeHtml,
      });
    }
    const topics = deps.activeTopics ? deps.activeTopics() : [];
    const total = topics.length;
    const naoIniciado = topics.filter((t: any) => t.status === 'Não iniciado').length;

    const qs = doc.getElementById('quickStats');
    if (qs) mountQuickStats(qs, { total, naoIniciado });

    const today = todayISO();
    const entitySubjectName = deps.entitySubjectName || ((item: any) => item?.subject || '—');
    const getTopicName = deps.getTopicName || (() => 'Tópico');

    const calItems = (state.calendar || [])
      .filter((c: any) => c.date >= today)
      .map((c: any) => ({
        id: c.id,
        date: c.date,
        dateFormatted: formatDatePt(c.date),
        subject: entitySubjectName(c),
        label: c.reviewType && c.reviewType !== '—' ? c.reviewType : 'Revisão',
        status: c.status,
        origem: 'Calendário',
      }));
    const agendaItems = (state.reviewAgenda || [])
      .filter((a: any) => a.date >= today)
      .map((a: any) => ({
        id: a.id,
        date: a.date,
        dateFormatted: formatDatePt(a.date),
        subject: entitySubjectName(a),
        label: `${a.topicId ? getTopicName(a.topicId) : a.topic || 'Tópico'} · ${a.tipo}`,
        status: a.status,
        origem: 'Agenda de Revisões',
      }));

    const allUpcoming = [...calItems, ...agendaItems].sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = allUpcoming.slice(0, upcomingVisible);

    const ul = doc.getElementById('upcomingList');
    const title = doc.getElementById('upcomingTitle');
    const footer = doc.getElementById('upcomingFooter');
    if (title) title.textContent = `Próximas revisões · ${allUpcoming.length}`;
    if (ul) {
      mountUpcomingList(ul, upcoming);
    }
    if (footer) {
      if (upcoming.length === 0) {
        footer.innerHTML = '';
      } else {
        footer.innerHTML =
          renderCollectionFooter({
            variant: 'block',
            total: allUpcoming.length,
            visible: upcoming.length,
            step: 5,
            label: 'revisões',
            showMoreAction: 'changeUpcomingLimit(5)',
            showAllAction: 'showAllUpcoming()',
            showLessAction: upcomingVisible > 5 ? 'resetUpcomingLimit()' : '',
          }) +
          `<button class="btn ghost small upcoming-calendar-link" data-delegated-click="navigateKpi('calendario')">Ver todas no calendário</button>`;
      }
    }

    renderCockpitDecisionGrids();
  }

  return {
    renderNextActionCardHtml,
    mountNextActionCard,
    renderQuickStatsHtml,
    mountQuickStats,
    renderProgressBarsHtml,
    renderSubjectProgressBars,
    mountProgressBars,
    renderUpcomingListHtml,
    mountUpcomingList,
    renderAllocationBalanceHtml,
    mountAllocationBalance,
    renderCriticalVulnerabilitiesHtml,
    mountCriticalVulnerabilities,
    renderVolatileMasteryHtml,
    mountVolatileMastery,
    mountSyllabusHealth,
    mountCockpitSidebar,
    renderCockpitDecisionGrids,
    renderKPIs,
    renderExamProgress,
    renderExamCountdown,
    navigateKpi,
    unlockReadinessFactor,
    heatmapTooltip,
    renderHeatmap,
    setHeatmapFilter,
    setHeatmapMode,
    selectHeatmapDay,
    viewSelectedHeatmapSessions,
    toggleStreakActiveDays,
    getStreakView,
    changeUpcomingLimit,
    showAllUpcoming,
    resetUpcomingLimit,
    resetUpcomingListDefault,
    renderHeader,
    renderDashboard,
  };
}
