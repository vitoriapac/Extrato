import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { TodayExecutionSummary } from './TodayExecutionSummary.js';
import { TodayExecutionModeSwitch, type ExecutionMode } from './TodayExecutionModeSwitch.js';
import { TodayAgendaSections, type TodayAgendaSectionsProps } from './TodayAgendaSections.js';
import { TodayGoalsCard, type TodayGoalsCardProps } from './TodayGoalsCard.js';
import { TodayWeeklyRhythmCard, type WeeklyRhythmDay } from './TodayWeeklyRhythmCard.js';
import { subjectColorOf } from '../../../domain/subjects/subject-color.js';
import { FirstStepsMission } from '../../components/FirstStepsMission.js';
import {
  buildFirstStepsMission,
  type FirstStepsMissionModel,
} from '../../../application/onboarding/build-first-steps-mission.js';
import { buildFinalStretchBanner } from '../../../domain/planning/final-stretch-policy.js';
import { FinalStretchBanner } from '../../components/FinalStretchBanner.js';
import { RealWeekBanner, type RealWeekBannerProps } from '../../components/RealWeekBanner.js';
import {
  buildTodayViewModel,
  canGenerateAutomaticTodayPlan,
} from '../../../application/planning/build-today-view-model.js';
import { buildNextBestAction } from '../../../application/diagnostics/build-next-best-action.js';
import { createDailyExecutionController } from '../../controllers/daily-execution-controller.js';
import { renderDailyExecution } from '../../renderers/daily-execution-renderer.js';
import { capturePlanPriority } from '../../../domain/planning/plan-priority-snapshot.js';
import { renderIconSvg } from '../../primitives/icon.js';
import { pickPlanAchievementMark } from '../../../application/achievements/achievement-progress-note.js';
import { addLocalDays, parseLocalDate } from '../../../core/date-utils.js';
import {
  TodayStudyAssistantBar,
  type AssistantPanelKind,
  type CycleDraftState,
  type JournalFormState,
} from '../../components/TodayStudyAssistantBar.js';
import { TodayJournalSidebarCard } from '../../components/TodayJournalSidebarCard.js';
import { revealAdvanced } from '../../essential-mode.js';
import {
  applyStudyCycleVersion,
  buildStudyCyclePreview,
  computeDefaultCycleWeights,
  computeStudyCycleLapSummary,
  explainCycleVsPriority,
  getCurrentCycleBlock,
  reorderStudyCycleBlocks,
  setStudyCycleStatus,
  skipStudyCycleBlock,
  type StudyCycleQueue,
} from '../../../domain/planning/study-cycle-engine.js';
import {
  buildQuickStudyProposal,
  type QuickStudyFocusMode,
} from '../../../domain/quick-study/quick-study-engine.js';
import {
  buildJournalReviewProposal,
  deleteLearningJournalEntry,
  filterLearningJournalEntries,
  upsertLearningJournalEntry,
} from '../../../domain/journal/learning-journal-engine.js';
import {
  buildWeeklyClosingRitualViewModel,
  finalizeWeeklyClosingIdempotent,
} from '../../../application/weekly-closing/weekly-closing-ritual.js';
import {
  buildStudyCopilotViewModel,
  revalidateCopilotAction,
  type CopilotAnswer,
  type CopilotQuestionKey,
} from '../../../application/copilot/study-copilot-service.js';
import type { OverdueReviewItem } from '../../../domain/recovery/recovery-mission-engine.js';

const PRIORITY_TIER_EMOJI: Record<string, string> = {
  Alta: 'alert-circle',
  Média: 'alert-triangle',
  Baixa: 'circle-check',
};

export interface TodayTabControllerContext {
  formatPlanMinutes: (mins: number) => string;
  formatDatePt: (date: string) => string;
  formatDuration?: (seconds: number) => string;
  formatHoras?: (hours: number) => string;
  onDismissFirstSteps?: () => void;
  onRestoreFirstSteps?: () => void;
  onStartTour?: () => void;
  onExecuteFirstStepsMission?: (action: string) => void;
  document?: Document | any;
  getState?: () => any;
  getUiState?: () => any;
  isDemoMode?: () => boolean;
  todayISO?: () => string;
  nowISO?: () => string;
  uid?: (prefix?: string) => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
  scheduleSave?: () => void;
  showToast?: (msg: string) => void;
  activateTab?: (tab: string) => void;
  getSubjectName?: (id: string) => string;
  getTopicName?: (id: string) => string;
  motivoPrioridade?: (item: any) => string;
  freezePlanExecution?: (item: any, ctx: any) => void;
  metaHoursToday?: () => number;
  hasStartedStudyTimer?: () => boolean;
  openStudyTimerFocus?: () => void;
  startPlannedActivity?: (planItemId: string) => void;
  openGuidedOnboarding?: (opts?: any) => void;
  guidedTourController?: { start: () => void };
  whatIfController?: { open: () => void };
  latestStudyPlan?: () => any;
  weeklyStrategyCapacity?: () => number;
  computeStudyPriorities?: () => any[];
  getCurrentStudyRecommendations?: () => any[];
  refreshStudyRecommendationItems?: (opts?: any) => any;
  renderOverviewDecisionArea?: () => void;
  uniqueTopicsCompletedBetween?: (start: string, end: string) => number;
  getRevisoesUnificadas?: () => any[];
  segundosEstudadosHoje?: () => number;
  diasParaRevisao?: (date: string) => number | null;
  startOfWeek?: (iso: string) => string;
  /** Conquistas avaliadas, para marcar a atividade do plano que completa uma. */
  getAchievements?: () => any[];
  /** Hoje já conta na sequência de dias (mesma regra da sequência). */
  hasActivityToday?: () => boolean;
  onOpenRecoveryMission?: () => void;
  onRecalibrateWeek?: () => void;
  intelligenceCandidates?: () => any[];
  startGuidedTimerSession?: (opts: any) => boolean;
  createManualReview?: (payload: any) => any;
  calculateStudyPlanPreview?: () => void;
  openWeeklyClose?: () => void;
  addDays?: (iso: string, days: number) => string;
  showConfirm?: (message: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  persistAndRender?: () => void;
}

export function createTodayTabController(ctx: TodayTabControllerContext) {
  const {
    formatPlanMinutes,
    formatDatePt,
    formatDuration = (s: number) => `${Math.floor(s / 60)}m`,
    formatHoras = (h: number) => `${h}h`,
    document: doc = typeof document !== 'undefined' ? document : (null as any),
    getState = () => ({}),
    isDemoMode = () => false,
    todayISO = () => new Date().toISOString().slice(0, 10),
    nowISO = () => new Date().toISOString(),
    uid = (p = 'id') => `${p}_${Date.now()}`,
    escapeHtml = (s: string) => String(s ?? ''),
    escapeAttr = (s: string) => String(s ?? ''),
    scheduleSave = () => {},
    showToast: _showToast = () => {},
    activateTab: _activateTab = () => {},
    getSubjectName = () => '',
    getTopicName = () => '',
    motivoPrioridade = () => '',
    freezePlanExecution = () => {},
    metaHoursToday = () => 0,
    hasStartedStudyTimer = () => false,
    openStudyTimerFocus = () => {},
    startPlannedActivity = () => {},
    openGuidedOnboarding: _openGuidedOnboarding = () => {},
    guidedTourController: _guidedTourController,
    whatIfController,
    latestStudyPlan = () => null,
    weeklyStrategyCapacity = () => 0,
    computeStudyPriorities = () => [],
    getCurrentStudyRecommendations = () => [],
    refreshStudyRecommendationItems = () => ({ availableMinutes: 0 }),
    renderOverviewDecisionArea: _renderOverviewDecisionArea = () => {},
    uniqueTopicsCompletedBetween = () => 0,
    getRevisoesUnificadas = () => [],
    segundosEstudadosHoje = () => 0,
    diasParaRevisao = () => null,
    startOfWeek = (iso: string) => iso,
    getAchievements = () => [],
    hasActivityToday = () => false,
  } = ctx;

  let demoFirstStepsDismissed = false;
  let assistantPanel: AssistantPanelKind = 'none';
  let quickMinutes = 30;
  let quickFocus: QuickStudyFocusMode = 'priority';
  let copilotQuestion: CopilotQuestionKey = 'what_now';
  let cycleSkipReason = '';
  let cycleDraftState: CycleDraftState = {
    mode: 'adaptive',
    blockDurationMinutes: 60,
    preview: null,
  };
  const journalFilters = { subjectId: '', tag: '', query: '' };
  let journalSidebarFormOpen = false;
  let journalForm: JournalFormState = {
    sessionId: null,
    subjectId: '',
    topicId: '',
    difficultyRating: '',
    energyRating: '',
    tags: [],
    note: '',
    nextStep: '',
  };

  function createExecutionSummaryVNode(model: {
    availableMinutes: number;
    plannedMinutes: number;
    executedMinutes: number;
    date: string;
    progress: number | null;
    planCompletedMinutes?: number;
    planRemainingMinutes?: number;
    execution?: { needsPlanReview?: boolean } | null;
  }) {
    const plannedMinutesFormatted = formatPlanMinutes(model.plannedMinutes);
    const executedMinutesFormatted = formatPlanMinutes(model.executedMinutes);
    const dateFormatted = formatDatePt(model.date);

    return h(TodayExecutionSummary, {
      plannedMinutesFormatted,
      executedMinutesFormatted,
      dateFormatted,
      progressPercent: model.progress,
      availableMinutes: model.availableMinutes,
      plannedMinutes: model.plannedMinutes,
      executedMinutes: model.executedMinutes,
      planCompletedMinutes: model.planCompletedMinutes,
      planRemainingMinutes: model.planRemainingMinutes,
      needsPlanReview: Boolean(model.execution?.needsPlanReview),
    });
  }

  function renderExecutionSummaryHtml(model: {
    availableMinutes: number;
    plannedMinutes: number;
    executedMinutes: number;
    date: string;
    progress: number | null;
  }): string {
    return render(createExecutionSummaryVNode(model));
  }

  function mountExecutionSummary(
    container: Element,
    model: {
      availableMinutes: number;
      plannedMinutes: number;
      executedMinutes: number;
      date: string;
      progress: number | null;
    }
  ): void {
    mountPreact(createExecutionSummaryVNode(model), container);
  }

  function renderAgendaSectionsHtml(props: TodayAgendaSectionsProps): string {
    return render(h(TodayAgendaSections, props));
  }

  function mountAgendaSections(container: Element, props: TodayAgendaSectionsProps): void {
    mountPreact(h(TodayAgendaSections, props), container);
  }

  function renderTodayGoalsHtml(props: TodayGoalsCardProps): string {
    return render(h(TodayGoalsCard, props));
  }

  function mountTodayGoals(container: Element, props: TodayGoalsCardProps): void {
    mountPreact(h(TodayGoalsCard, props), container);
  }

  function renderWeeklyRhythmCard(): void {
    if (!doc) return;
    const slot = doc.getElementById('todayWeeklyRhythmSlot');
    if (!slot) return;
    const state = getState();
    const today = todayISO();
    const mondayISO = startOfWeek(today);
    const sessions = state.studySessions || [];
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    let totalWeekMinutes = 0;
    let activeDaysCount = 0;

    const days: WeeklyRhythmDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${mondayISO}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      const dateISO = d.toISOString().slice(0, 10);

      const dayStudiedSeconds = sessions
        .filter((s: any) => s.date === dateISO)
        .reduce((sum: number, s: any) => sum + (Number(s.durationSeconds) || 0), 0);
      const studiedMinutes = Math.round(dayStudiedSeconds / 60);

      if (studiedMinutes > 0) activeDaysCount++;
      totalWeekMinutes += studiedMinutes;

      days.push({
        dayName: dayLabels[i],
        dateISO,
        studiedMinutes,
        studiedFormatted: formatPlanMinutes(studiedMinutes),
        isToday: dateISO === today,
        isPast: dateISO < today,
      });
    }

    const dailyTargetMinutes = Math.round(metaHoursToday() * 60);
    const dailyTargetFormatted = formatHoras(metaHoursToday());
    const totalWeekFormatted = formatPlanMinutes(totalWeekMinutes);

    mountPreact(
      h(TodayWeeklyRhythmCard, {
        days,
        dailyTargetMinutes,
        dailyTargetFormatted,
        totalWeekMinutes,
        totalWeekFormatted,
        activeDaysCount,
      }),
      slot
    );
  }

  function renderFirstStepsMissionHtml(model: FirstStepsMissionModel): string {
    if (!model.visible && !model.canRestore) return '';
    return render(
      h(FirstStepsMission, {
        model,
        onDismiss: ctx.onDismissFirstSteps,
        onRestore: ctx.onRestoreFirstSteps,
        onStartTour: ctx.onStartTour,
        onExecuteMission: ctx.onExecuteFirstStepsMission,
      })
    );
  }

  function mountFirstStepsMission(container: Element, model: FirstStepsMissionModel): void {
    if (!model.visible && !model.canRestore) {
      container.innerHTML = '';
      return;
    }
    mountPreact(
      h(FirstStepsMission, {
        model,
        onDismiss: ctx.onDismissFirstSteps,
        onRestore: ctx.onRestoreFirstSteps,
        onStartTour: ctx.onStartTour,
        onExecuteMission: ctx.onExecuteFirstStepsMission,
      }),
      container
    );
  }

  function buildDailyStudyPlan(priorities: any[], availableMinutes: number) {
    let remaining = Math.max(0, Math.round(Number(availableMinutes) || 0));
    const items = [];
    for (const priority of (priorities || []).slice(0, 5)) {
      if (remaining < 15) break;
      const desired = Math.max(
        15,
        Math.min(60, Math.round(Number(priority.estimatedMinutes) || 30))
      );
      let minutes = Math.min(desired, remaining);
      if (remaining - minutes > 0 && remaining - minutes < 15) minutes = remaining;
      items.push({ ...priority, minutes });
      remaining -= minutes;
      if (remaining <= 0) break;
    }
    return {
      items,
      plannedMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
      flexMinutes: remaining,
    };
  }

  function materializeDailyStudyPlan(priorities: any[], availableMinutes: number) {
    const calculated = buildDailyStudyPlan(priorities, availableMinutes);
    if (!calculated.items.length) return null;
    const createdAt = nowISO();
    const state = getState();
    const plan = {
      id: uid('plan'),
      date: todayISO(),
      availableMinutes,
      plannedMinutes: calculated.plannedMinutes,
      flexMinutes: calculated.flexMinutes,
      createdAt,
      updatedAt: createdAt,
      items: calculated.items.map((item, index) => ({
        id: uid('plan-item'),
        subjectId: item.subjectId || null,
        topicId: item.topicId || null,
        subjectName: item.subjectName || getSubjectName(item.subjectId),
        topicName: item.topicName || getTopicName(item.topicId),
        type: item.studyType || 'study',
        prioritySnapshot: capturePlanPriority(item, {
          capturedAt: createdAt,
          algorithmVersion: state.algorithmVersions?.recommendations || 1,
        }),
        plannedMinutes: item.minutes,
        executedSeconds: 0,
        status: 'planned',
        sessionIds: [] as any[],
        score: Number(item.score) || 0,
        tier: item.tier || 'Baixa',
        position: index + 1,
        statusIcon: item.diagnosis?.statusIcon || PRIORITY_TIER_EMOJI[item.tier] || 'bookmark',
        statusLabel: item.diagnosis?.status || 'Prioridade ' + (index + 1),
        reason: motivoPrioridade(item),
        action: item.recommendedAction || 'Estudar o tópico',
        recommendedQuestions: Number(item.recommendedQuestions) || 0,
        originalDate: todayISO(),
        currentDate: todayISO(),
        rescheduleCount: 0,
        skippedReason: null as any,
        recommendationId: null as any,
        createdAt,
      })),
    };
    plan.items.forEach(item =>
      freezePlanExecution(item, {
        date: plan.date,
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        capturedAt: createdAt,
      })
    );
    state.dailyPlans = state.dailyPlans || [];
    state.dailyPlans.push(plan);
    scheduleSave();
    return plan;
  }

  function todayDailyStudyPlan() {
    const state = getState();
    return (state.dailyPlans || []).find((plan: any) => plan.date === todayISO()) || null;
  }

  function ensureTodayDailyStudyPlan(priorities: any[], availableMinutes: number) {
    return (
      todayDailyStudyPlan() ||
      (canGenerateAutomaticTodayPlan(getState(), latestStudyPlan())
        ? materializeDailyStudyPlan(priorities, availableMinutes)
        : null)
    );
  }

  function planItemStatusLabel(status: string) {
    return (
      (
        {
          planned: 'Planejada',
          in_progress: 'Em andamento',
          partial: 'Parcial',
          completed: 'Concluída',
          deferred: 'Adiada',
          replaced: 'Substituída',
          skipped: 'Ignorada',
        } as Record<string, string>
      )[status] || 'Planejada'
    );
  }

  function renderTodayExecutionSummary(model: any) {
    if (!doc) return;
    const container = doc.getElementById('todayExecutionSummary');
    if (!container) return;
    mountExecutionSummary(container, model);
  }

  function isFirstStepsDismissed(): boolean {
    if (isDemoMode()) {
      return demoFirstStepsDismissed;
    }
    try {
      return (
        typeof localStorage !== 'undefined' &&
        Boolean(
          localStorage.getItem('extrato_first_steps_dismissed') ??
          localStorage.getItem('studytrack_first_steps_dismissed')
        )
      );
    } catch {
      return false;
    }
  }

  function dismissFirstSteps(): void {
    if (isDemoMode()) {
      demoFirstStepsDismissed = true;
    } else {
      try {
        if (typeof localStorage !== 'undefined')
          localStorage.setItem('extrato_first_steps_dismissed', '1');
      } catch {}
    }
  }

  function restoreFirstSteps(): void {
    if (isDemoMode()) {
      demoFirstStepsDismissed = false;
    } else {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('extrato_first_steps_dismissed');
          localStorage.removeItem('studytrack_first_steps_dismissed');
        }
      } catch {}
    }
  }

  function renderFirstStepsMissionCard() {
    if (!doc) return;
    let slot = doc.getElementById('firstStepsMissionSlot');
    if (!slot) {
      const summary = doc.getElementById('todayExecutionSummary');
      if (summary) {
        slot = doc.createElement('div');
        slot.id = 'firstStepsMissionSlot';
        summary.parentNode?.insertBefore(slot, summary);
      }
    }
    if (!slot) return;

    const state = getState();
    const dismissed = isFirstStepsDismissed();

    // Mesma regra do assistente de configuração: o plano diário automático não conta,
    // então a missão só aparece quando a configuração termina e as duas listas não coexistem.
    const hasPlan = Array.isArray(state.studyPlans)
      ? state.studyPlans.length > 0
      : (state.dailyPlans || []).some((p: any) => Array.isArray(p.items) && p.items.length > 0);
    const sessionsCount = Array.isArray(state.studySessions) ? state.studySessions.length : 0;
    const questionsCount = Array.isArray(state.questoes) ? state.questoes.length : 0;

    const missionModel = buildFirstStepsMission({
      hasPlan,
      sessionsCount,
      questionsCount,
      dismissed,
    });

    mountFirstStepsMission(slot, missionModel);
  }

  function renderFinalStretchBanner() {
    if (!doc) return;
    const slot = doc.getElementById('finalStretchBannerSlot');
    if (!slot) return;
    const state = getState();
    const days = state.examDate ? diasParaRevisao(state.examDate) : null;
    const bannerModel = buildFinalStretchBanner(
      days,
      state.examBlueprint?.activeExamTags?.[0] || 'sua prova'
    );
    if (!bannerModel.active) {
      unmountPreact(slot);
      slot.replaceChildren();
      return;
    }
    mountPreact(
      h(FinalStretchBanner, {
        banner: bannerModel,
        onOpenWhatIf: () => whatIfController?.open(),
      }),
      slot
    );
  }

  function renderRealWeekBannerHtml(props: RealWeekBannerProps): string {
    return render(h(RealWeekBanner, props));
  }

  function mountRealWeekBanner(container: Element, props: RealWeekBannerProps): void {
    mountPreact(h(RealWeekBanner, props), container);
  }

  let demoRealWeekBannerDismissed = false;

  function isRealWeekBannerDismissed(): boolean {
    if (isDemoMode()) return demoRealWeekBannerDismissed;
    try {
      return (
        typeof sessionStorage !== 'undefined' &&
        Boolean(sessionStorage.getItem('extrato_real_week_banner_dismissed'))
      );
    } catch {
      return false;
    }
  }

  function dismissRealWeekBanner(): void {
    if (isDemoMode()) {
      demoRealWeekBannerDismissed = true;
    } else {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('extrato_real_week_banner_dismissed', '1');
        }
      } catch {}
    }
    renderRealWeekBanner();
  }

  function restoreRealWeekBanner(): void {
    if (isDemoMode()) {
      demoRealWeekBannerDismissed = false;
    } else {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('extrato_real_week_banner_dismissed');
        }
      } catch {}
    }
    renderRealWeekBanner();
  }

  function renderRealWeekBanner(): void {
    if (!doc) return;
    let slot = doc.getElementById('todayRealWeekBannerSlot');
    if (!slot) {
      const summary = doc.getElementById('todayExecutionSummary');
      if (summary) {
        slot = doc.createElement('div');
        slot.id = 'todayRealWeekBannerSlot';
        summary.parentNode?.insertBefore(slot, summary);
      }
    }
    if (!slot) return;

    if (isRealWeekBannerDismissed()) {
      unmountPreact(slot);
      slot.replaceChildren();
      return;
    }

    const state = getState();
    const today = todayISO();
    const overdueCount = getRevisoesUnificadas().filter(
      (r: any) => r.date && r.date < today && r.status !== 'Concluído'
    ).length;

    const startWeek = startOfWeek(today);
    const pastPlans = (state.dailyPlans || []).filter(
      (p: any) => p.date >= startWeek && p.date < today
    );
    const plannedPastMinutes = pastPlans.reduce(
      (sum: number, p: any) =>
        sum +
        (p.items || [])
          .filter(
            (it: any) => !['skipped', 'replaced', 'deferred', 'discarded'].includes(it.status)
          )
          .reduce((t: number, it: any) => t + (Number(it.plannedMinutes) || 0), 0),
      0
    );
    const executedPastMinutes = (state.studySessions || [])
      .filter((s: any) => s.date >= startWeek && s.date < today)
      .reduce((sum: number, s: any) => sum + (Number(s.durationSeconds) || 0) / 60, 0);

    const deficitMinutes = Math.max(0, Math.round(plannedPastMinutes - executedPastMinutes));

    if (overdueCount === 0 && deficitMinutes === 0) {
      unmountPreact(slot);
      slot.replaceChildren();
      return;
    }

    const bannerProps: RealWeekBannerProps = {
      overdueCount,
      deficitMinutes,
      onOpenRecoveryMission: () => {
        if (ctx.onOpenRecoveryMission) {
          ctx.onOpenRecoveryMission();
        } else {
          const btn = doc.querySelector?.(
            '[data-action="open-recovery-mission"]'
          ) as HTMLElement | null;
          btn?.click();
        }
      },
      onRecalibrateWeek: () => {
        if (ctx.onRecalibrateWeek) {
          ctx.onRecalibrateWeek();
        } else {
          _activateTab('metas');
          setTimeout(() => {
            doc.getElementById('metasTab-semana')?.click();
            doc.getElementById('weeklyReplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      },
      onDismiss: dismissRealWeekBanner,
    };

    if (typeof document !== 'undefined') {
      mountRealWeekBanner(slot, bannerProps);
    } else {
      slot.innerHTML = renderRealWeekBannerHtml(bannerProps);
    }
  }

  const dailyExecutionController = createDailyExecutionController({
    getContext: () => {
      const state = getState();
      return {
        today: todayISO(),
        dailyPlans: state.dailyPlans || [],
        sessions: state.studySessions || [],
        subjects: state.subjects || [],
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        activePlan: latestStudyPlan(),
        availableMinutes: Math.round(metaHoursToday() * 60),
      };
    },
    getNextBestAction: () =>
      buildNextBestAction({
        recommendations: getCurrentStudyRecommendations(),
        activePlan: latestStudyPlan(),
        weeklyCapacityMinutes: weeklyStrategyCapacity(),
      }),
    onStart: startPlannedActivity,
    onResume: openStudyTimerFocus,
    getTimer: () => {
      const state = getState();
      return { active: hasStartedStudyTimer(), planItemId: state.activeTimer?.planItemId };
    },
  });

  function renderDailyExecutionCard() {
    if (!doc) return;
    const container = doc.getElementById('dailyExecutionDashboard');
    if (!container) return;
    const state = getState();
    const hasConfigured = Boolean(
      state.examDate ||
      (Array.isArray(state.subjects) && state.subjects.length > 0) ||
      (Array.isArray(state.studyPlans) && state.studyPlans.length > 0) ||
      (Array.isArray(state.studySessions) && state.studySessions.length > 0)
    );
    if (!hasConfigured) {
      container.innerHTML = '';
      container.hidden = true;
      return;
    }
    container.hidden = false;
    refreshStudyRecommendationItems({ recordHistory: false });
    container.innerHTML = renderDailyExecution(dailyExecutionController.build(), {
      escapeHtml,
      formatMinutes: formatPlanMinutes,
    });
  }

  function setExecutionMode(mode: ExecutionMode): void {
    const normalized: ExecutionMode = mode === 'sequence' ? 'sequence' : 'agenda';
    const state = getState();
    if (state) state.executionMode = normalized;
    scheduleSave();
    renderPlanoHoje();
  }

  function refreshCycleDraftPreview() {
    const state = getState();
    const activeSubs = (state.subjects || []).filter((s: any) => s && !s.archived);
    const candidates = ctx.intelligenceCandidates ? ctx.intelligenceCandidates() : [];
    const customBlocks =
      cycleDraftState.mode === 'manual' && state.studyCycle?.blocks?.length
        ? state.studyCycle.blocks
        : activeSubs.map((s: any, idx: number) => ({
            id: `block-${s.id}-${idx + 1}`,
            subjectId: s.id,
            subjectName: s.name,
            durationMinutes: cycleDraftState.blockDurationMinutes,
            order: idx + 1,
          }));
    cycleDraftState.preview = buildStudyCyclePreview({
      id: state.studyCycle?.id || 'default-cycle',
      name: state.studyCycle?.name || 'Ciclo de Estudos Principal',
      examId: state.examBlueprint?.activeExamTags?.[0] || null,
      mode: cycleDraftState.mode,
      subjects: activeSubs,
      subjectWeights: computeDefaultCycleWeights(state?.examBlueprint?.subjects, candidates),
      blockDurationMinutes: cycleDraftState.blockDurationMinutes,
      customBlocks,
      activeSubjectIds: activeSubs.map((s: any) => s.id),
      nowISO: nowISO(),
    });
  }

  function collectOverdueReviewsForQuickStudy(): OverdueReviewItem[] {
    const today = todayISO();
    const list = getRevisoesUnificadas() || [];
    return list
      .filter((r: any) => r?.date && r.date < today && r.status !== 'Concluído')
      .map((r: any) => ({
        id: String(r.id || uid('rev')),
        origin: r.origem || 'Agenda de Revisões',
        date: r.date,
        subjectId: r.subjectId || null,
        subjectName: r.subject || 'Disciplina',
        topicId: r.topicId || r.topicRef || null,
        topicName: r.label ? String(r.label).split('·')[0].trim() : 'Revisão',
        daysOverdue: Math.max(1, Math.abs(diasParaRevisao(r.date) || 1)),
      }));
  }

  function handleJournalFilterChange(
    patch: Partial<{ subjectId: string; tag: string; query: string }>
  ): void {
    Object.assign(journalFilters, patch);
    renderStudyAssistantBar();
    renderTodayJournalSidebar();
  }

  function handleJournalFormChange(patch: Partial<JournalFormState>): void {
    Object.assign(journalForm, patch);
    renderStudyAssistantBar();
    renderTodayJournalSidebar();
  }

  function handleSaveJournalEntry(): void {
    const state = getState();
    const subjects = state?.subjects || [];
    if (!journalForm.note.trim() && !journalForm.tags.length && !journalForm.nextStep.trim()) {
      _showToast('Escreva uma observação ou selecione uma etiqueta antes de salvar.');
      return;
    }
    const sub = subjects.find((s: any) => s.id === journalForm.subjectId);
    const top = sub?.topics?.find((t: any) => t.id === journalForm.topicId);
    const res = upsertLearningJournalEntry(
      state.learningJournal || [],
      {
        examId: state.examBlueprint?.activeExamTags?.[0] || null,
        sessionId: journalForm.sessionId,
        subjectId: journalForm.subjectId || null,
        subjectNameSnapshot: sub?.name || '',
        topicId: journalForm.topicId || null,
        topicNameSnapshot: top?.name || '',
        localDate: todayISO(),
        difficultyRating: journalForm.difficultyRating || null,
        energyRating: journalForm.energyRating || null,
        tags: journalForm.tags,
        note: journalForm.note,
        nextStep: journalForm.nextStep,
      },
      { nowISO, todayISO, idGenerator: uid }
    );
    state.learningJournal = res.entries;
    journalForm = {
      sessionId: null,
      subjectId: '',
      topicId: '',
      difficultyRating: '',
      energyRating: '',
      tags: [],
      note: '',
      nextStep: '',
    };
    journalSidebarFormOpen = false;
    scheduleSave();
    _showToast(res.updated ? 'Anotação da sessão atualizada no diário.' : 'Anotação salva no Diário.');
    renderStudyAssistantBar();
    renderTodayJournalSidebar();
  }

  function handleDeleteJournalEntry(entryId: string): void {
    const remove = () => {
      const state = getState();
      state.learningJournal = deleteLearningJournalEntry(state.learningJournal || [], entryId);
      scheduleSave();
      _showToast('Anotação removida do Diário.');
      renderStudyAssistantBar();
      renderTodayJournalSidebar();
    };
    if (ctx.showConfirm) {
      ctx.showConfirm('Remover esta anotação do Diário de Aprendizagem?', remove, undefined, {
        confirmLabel: 'Remover anotação',
      });
    } else {
      remove();
    }
  }

  function handleCreateReviewFromJournal(entry: any): void {
    const proposal = buildJournalReviewProposal(entry, {
      todayISO,
      addDays: (iso, d) => ctx.addDays?.(iso, d) || addLocalDays(iso, d) || iso,
    });
    if (!proposal || !ctx.createManualReview) return;
    const create = () => {
      ctx.createManualReview?.({
        topicId: proposal.topicId,
        subjectId: proposal.subjectId,
        date: proposal.scheduledDate,
        tipo: proposal.tipo,
      });
      ctx.persistAndRender?.();
      _showToast(`Revisão agendada para ${formatDatePt(proposal.scheduledDate)}.`);
    };
    if (ctx.showConfirm) {
      ctx.showConfirm(
        `Criar tarefa de revisão (${proposal.tipo}) para "${proposal.topicName}" em ${formatDatePt(proposal.scheduledDate)}?`,
        create,
        undefined,
        { confirmLabel: 'Confirmar revisão' }
      );
    } else {
      create();
    }
  }

  function handleOpenPlanningCycle(): void {
    _activateTab('metas');
    (doc?.getElementById('metasTab-semana') as HTMLElement | null)?.click?.();
    const cycleMount = doc?.getElementById('metasCycleCenterMount') as HTMLElement | null;
    if (cycleMount) {
      revealAdvanced(cycleMount);
      cycleMount.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderTodayJournalSidebar(): void {
    if (!doc || typeof globalThis.document === 'undefined') return;
    const rhythmSlot = doc.getElementById('todayWeeklyRhythmSlot');
    const sideCol =
      (rhythmSlot?.parentNode as HTMLElement | null) ||
      (doc.querySelector('#todaySub-hoje .today-layout-grid__side') as HTMLElement | null);
    if (!sideCol || sideCol.ownerDocument !== globalThis.document) return;

    let mount = doc.getElementById('todayJournalSidebarMount') as Element | null;
    if (!mount) {
      const created = doc.createElement('div') as HTMLElement;
      created.id = 'todayJournalSidebarMount';
      if (rhythmSlot && rhythmSlot.parentNode === sideCol) {
        sideCol.insertBefore(created, rhythmSlot.nextSibling);
      } else {
        sideCol.appendChild(created);
      }
      mount = created;
    }
    if (!mount || mount.ownerDocument !== globalThis.document) return;

    const state = getState();
    const allEntries = state?.learningJournal || [];
    const filtered = filterLearningJournalEntries(allEntries, {
      subjectId: journalFilters.subjectId || null,
      tag: journalFilters.tag || null,
      query: journalFilters.query || null,
    });

    mountPreact(
      h(TodayJournalSidebarCard, {
        subjects: state?.subjects || [],
        entries: filtered,
        totalEntriesCount: allEntries.length,
        filters: { ...journalFilters },
        form: { ...journalForm },
        formOpen: journalSidebarFormOpen,
        onToggleForm: open => {
          journalSidebarFormOpen = open;
          renderTodayJournalSidebar();
        },
        onChangeFilter: handleJournalFilterChange,
        onChangeForm: handleJournalFormChange,
        onSaveEntry: handleSaveJournalEntry,
        onDeleteEntry: handleDeleteJournalEntry,
        onCreateReviewFromEntry: handleCreateReviewFromJournal,
      }),
      mount
    );
  }

  function renderStudyAssistantBar(): void {
    if (!doc || typeof globalThis.document === 'undefined') return;
    const container = doc.getElementById('planoHojeContent');
    const parent = container?.parentNode as HTMLElement | null;
    if (!container || !parent || parent.ownerDocument !== globalThis.document) return;

    let mount = doc.getElementById('todayStudyAssistantMount') as Element | null;
    if (!mount) {
      const created = doc.createElement('div') as HTMLElement;
      created.id = 'todayStudyAssistantMount';
      parent.insertBefore(created, container.nextSibling);
      mount = created;
    }
    if (!mount) return;

    const state = getState();
    const executionMode: ExecutionMode = state?.executionMode === 'sequence' ? 'sequence' : 'agenda';
    const subjects = state?.subjects || [];
    const candidates = ctx.intelligenceCandidates ? ctx.intelligenceCandidates() : [];
    const recs = getCurrentStudyRecommendations() || [];
    const cycle = (state?.studyCycle || null) as StudyCycleQueue | null;
    const currentBlock = cycle ? getCurrentCycleBlock(cycle) : null;
    const overdueReviews = collectOverdueReviewsForQuickStudy();
    const today = todayISO();

    const quickProposal = buildQuickStudyProposal({
      durationMinutes: quickMinutes,
      focusMode: quickFocus,
      candidates,
      overdueReviews,
      currentCycleBlock: currentBlock,
      subjects,
      source: 'today',
    });

    const copilot = buildStudyCopilotViewModel({
      today,
      nowISO: nowISO(),
      isDemo: isDemoMode(),
      recommendations: recs,
      candidates,
      activePlan: latestStudyPlan(),
      weeklyCapacityMinutes: weeklyStrategyCapacity(),
      studyCycle: cycle,
      overdueReviews,
      subjects,
      sessions: state.studySessions || [],
      questions: state.questoes || [],
      dailyPlans: state.dailyPlans || [],
      weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
      recommendationFeedback: state.recommendationFeedback || [],
      activeExamTags: state.examBlueprint?.activeExamTags || [],
    });

    const filteredJournal = filterLearningJournalEntries(state.learningJournal || [], {
      subjectId: journalFilters.subjectId || null,
      tag: journalFilters.tag || null,
      query: journalFilters.query || null,
    });

    const weeklyClosing =
      assistantPanel === 'weekly_closing'
        ? buildWeeklyClosingRitualViewModel({
            today,
            sessions: state.studySessions || [],
            questions: state.questoes || [],
            dailyPlans: state.dailyPlans || [],
            reviews: getRevisoesUnificadas(),
            simulations: state.simulados || [],
            subjects,
            weeklyCloseSnapshots: state.weeklyCloseSnapshots || [],
            learningJournal: state.learningJournal || [],
            recommendations: recs,
            activeExamTags: state.examBlueprint?.activeExamTags || [],
            studyCycle: cycle,
          })
        : null;

    if (assistantPanel === 'cycle_config' && !cycleDraftState.preview) {
      refreshCycleDraftPreview();
    }

    mountPreact(
      h(TodayStudyAssistantBar, {
        activePanel: assistantPanel,
        executionMode,
        subjects,
        cycle,
        cycleLap: computeStudyCycleLapSummary(cycle),
        cycleDivergence: explainCycleVsPriority(cycle, recs[0] || null),
        cycleSkipReason,
        cycleDraft: cycleDraftState,
        quickMinutes,
        quickFocus,
        quickProposal,
        copilot,
        copilotQuestion,
        journalEntries: filteredJournal,
        journalFilters: { ...journalFilters },
        journalForm: { ...journalForm },
        weeklyClosing,
        onTogglePanel: panel => {
          assistantPanel = panel;
          if (panel === 'cycle_config') refreshCycleDraftPreview();
          renderStudyAssistantBar();
        },
        onStartCycleBlock: () => {
          if (!cycle || !currentBlock || cycle.status === 'paused') return;
          if (!ctx.startGuidedTimerSession) return;
          const match = candidates.find((c: any) => c.subjectId === currentBlock.subjectId);
          ctx.startGuidedTimerSession({
            subjectId: currentBlock.subjectId,
            topicId: currentBlock.topicId || match?.topicId || null,
            type: currentBlock.preferredActivity || 'study',
            targetMinutes: currentBlock.remainingMinutes ?? currentBlock.durationMinutes,
            sessionOrigin: 'cycle',
            cycleId: cycle.id,
            cycleBlockId: currentBlock.id,
          });
        },
        onToggleCyclePause: () => {
          if (!cycle) return;
          state.studyCycle = setStudyCycleStatus(
            cycle,
            cycle.status === 'paused' ? 'active' : 'paused',
            nowISO()
          );
          scheduleSave();
          renderStudyAssistantBar();
        },
        onSkipReasonChange: value => {
          cycleSkipReason = value;
          renderStudyAssistantBar();
        },
        onSkipCycleBlock: () => {
          if (!cycle) return;
          const skipped = skipStudyCycleBlock(cycle, {
            reason: cycleSkipReason || null,
            nowISO: nowISO(),
            executionId: uid('cycle-skip'),
          });
          state.studyCycle = skipped.cycle;
          cycleSkipReason = '';
          scheduleSave();
          _showToast('Bloco pulado na sequência sem gerar atraso no calendário.');
          renderStudyAssistantBar();
        },
        onChangeCycleDraftConfig: (mode, duration) => {
          cycleDraftState.mode = mode;
          cycleDraftState.blockDurationMinutes = duration;
          refreshCycleDraftPreview();
          renderStudyAssistantBar();
        },
        onMoveCycleDraftBlock: (fromIdx, toIdx) => {
          if (!cycleDraftState.preview?.cycle) return;
          cycleDraftState.preview = {
            ...cycleDraftState.preview,
            cycle: reorderStudyCycleBlocks(cycleDraftState.preview.cycle, fromIdx, toIdx, nowISO()),
          };
          renderStudyAssistantBar();
        },
        onConfirmCycleDraft: () => {
          if (!cycleDraftState.preview?.valid) return;
          state.studyCycle = applyStudyCycleVersion(
            state.studyCycle,
            cycleDraftState.preview.cycle,
            nowISO()
          );
          state.executionMode = 'sequence';
          assistantPanel = 'none';
          cycleDraftState.preview = null;
          scheduleSave();
          _showToast('Nova versão do ciclo confirmada sem reescrever o histórico.');
          renderPlanoHoje();
        },
        onChangeQuickConfig: (minutes, focus) => {
          quickMinutes = minutes;
          quickFocus = focus;
          renderStudyAssistantBar();
        },
        onOpenQuickPreset: minutes => {
          quickMinutes = minutes;
          assistantPanel = 'quick';
          renderStudyAssistantBar();
        },
        onOpenPlanningCycle: handleOpenPlanningCycle,
        onStartQuickStudy: () => {
          if (!ctx.startGuidedTimerSession) return;
          ctx.startGuidedTimerSession({
            subjectId: quickProposal.subjectId,
            topicId: quickProposal.topicId,
            type: quickProposal.activityType,
            targetMinutes: quickProposal.plannedMinutes,
            strategy: quickProposal.strategy,
            recommendationId: quickProposal.action?.recommendationId || null,
            recommendationSource: quickProposal.action?.source || 'today',
            recommendationType: quickProposal.activityType,
            prioritySnapshot: quickProposal.action?.priority ?? null,
            sessionOrigin: quickProposal.origin,
            cycleId: quickProposal.cycleBlockId ? cycle?.id || null : null,
            cycleBlockId: quickProposal.cycleBlockId,
          });
        },
        onSelectCopilotQuestion: key => {
          copilotQuestion = key;
          renderStudyAssistantBar();
        },
        onExecuteCopilotAnswer: (answer: CopilotAnswer) => {
          if (answer.actionKind === 'open_quick_study') {
            quickMinutes = 30;
            assistantPanel = 'quick';
            renderStudyAssistantBar();
            return;
          }
          if (answer.actionKind === 'open_planning_preview') {
            _activateTab('metas');
            ctx.calculateStudyPlanPreview?.();
            return;
          }
          if (answer.actionKind === 'open_weekly_close') {
            if (ctx.openWeeklyClose) ctx.openWeeklyClose();
            else {
              assistantPanel = 'weekly_closing';
              renderStudyAssistantBar();
            }
            return;
          }
          if (answer.actionKind === 'execute_action') {
            const check = revalidateCopilotAction(
              copilot.action || {
                subjectId: answer.targetSubjectId,
                topicId: answer.targetTopicId,
                activityType: 'study',
              },
              { candidates, recommendations: recs, subjects }
            );
            if (!check.valid) {
              _showToast(check.reason || 'A orientação precisa ser atualizada.');
              renderStudyAssistantBar();
              return;
            }
            ctx.startGuidedTimerSession?.({
              subjectId: answer.targetSubjectId || copilot.action?.subjectId || null,
              topicId: answer.targetTopicId || copilot.action?.topicId || null,
              type: copilot.action?.activityType || 'study',
              targetMinutes: copilot.action?.suggestedMinutes || null,
              recommendationId: copilot.recommendationId,
              recommendationSource: 'today',
              sessionOrigin: 'copilot',
            });
          }
        },
        onChangeJournalFilter: handleJournalFilterChange,
        onChangeJournalForm: handleJournalFormChange,
        onSaveJournalEntry: handleSaveJournalEntry,
        onDeleteJournalEntry: handleDeleteJournalEntry,
        onCreateReviewFromJournal: handleCreateReviewFromJournal,
        onConfirmWeeklyClosingSnapshot: () => {
          if (!weeklyClosing) return;
          state.weeklyCloseSnapshots = state.weeklyCloseSnapshots || [];
          const outcome = finalizeWeeklyClosingIdempotent(
            state.weeklyCloseSnapshots,
            weeklyClosing,
            { nowISO, idGenerator: uid }
          );
          scheduleSave();
          _showToast(
            outcome.status === 'already_finalized'
              ? 'Este fechamento semanal já estava registrado e permanece imutável.'
              : 'Fechamento semanal registrado no histórico.'
          );
          renderStudyAssistantBar();
        },
        onTestWeeklyImprovement: () => {
          _activateTab('metas');
          ctx.calculateStudyPlanPreview?.();
        },
      }),
      mount
    );
  }

  function openAssistantPanel(
    panel: AssistantPanelKind,
    opts: { sessionId?: string; quickMinutes?: number } = {}
  ) {
    assistantPanel = panel;
    if (typeof opts.quickMinutes === 'number' && Number.isFinite(opts.quickMinutes)) {
      quickMinutes = Math.max(10, Math.min(180, Math.round(opts.quickMinutes)));
    }
    if (panel === 'journal') {
      journalSidebarFormOpen = true;
      if (opts.sessionId) {
        const state = getState();
        const session = (state.studySessions || []).find((s: any) => s.id === opts.sessionId);
        const existing = (state.learningJournal || []).find(
          (e: any) => e.sessionId === opts.sessionId
        );
        journalForm = {
          sessionId: opts.sessionId,
          subjectId: existing?.subjectId || session?.subjectId || '',
          topicId: existing?.topicId || session?.topicId || '',
          difficultyRating: existing?.difficultyRating || '',
          energyRating: existing?.energyRating || '',
          tags: existing?.tags ? [...existing.tags] : [],
          note: existing?.note || '',
          nextStep: existing?.nextStep || '',
        };
      }
    }
    if (panel === 'cycle_config') refreshCycleDraftPreview();
    _activateTab('hoje');
    const subPanel = doc?.getElementById('todaySub-hoje');
    if (subPanel?.hidden) {
      (doc?.getElementById('todayTab-hoje') as HTMLElement | null)?.click?.();
    }
    renderStudyAssistantBar();
    renderTodayJournalSidebar();
    const targetMount =
      panel === 'journal'
        ? doc?.getElementById('todayJournalSidebarMount') || doc?.getElementById('todayStudyAssistantMount')
        : doc?.getElementById('todayStudyAssistantMount');
    targetMount?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function renderExecutionModeSwitch(): void {
    if (!doc) return;
    const state = getState();
    const mode: ExecutionMode = state?.executionMode === 'sequence' ? 'sequence' : 'agenda';
    const mount = doc.getElementById('todayExecutionModeMount') as Element | null;
    if (
      mount &&
      typeof globalThis.document !== 'undefined' &&
      mount.ownerDocument === globalThis.document
    ) {
      mountPreact(
        h(TodayExecutionModeSwitch, {
          value: mode,
          onChange: setExecutionMode,
        }),
        mount
      );
      return;
    }
    const agendaBtn = doc.getElementById('executionAgendaBtn');
    const sequenceBtn = doc.getElementById('executionSequenceBtn');
    if (agendaBtn && sequenceBtn) {
      agendaBtn.setAttribute('aria-pressed', String(mode === 'agenda'));
      sequenceBtn.setAttribute('aria-pressed', String(mode === 'sequence'));
    }
  }

  function renderPlanoHoje() {
    if (!doc) return;
    renderExecutionModeSwitch();
    const container = doc.getElementById('planoHojeContent');
    if (!container) return;
    const state = getState();
    const priorities = computeStudyPriorities();
    const availableMinutes = Math.max(0, Math.round(metaHoursToday() * 60));
    const plan = ensureTodayDailyStudyPlan(priorities, availableMinutes);
    const todayModel = buildTodayViewModel({
      date: todayISO(),
      availableMinutes,
      plan,
      priorities,
      pastPlans: (state.dailyPlans || []).filter((row: any) => row.date >= startOfWeek(todayISO())),
      sessions: state.studySessions || [],
      subjects: state.subjects || [],
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      activePlan: latestStudyPlan(),
      nextBestAction: buildNextBestAction({
        recommendations: getCurrentStudyRecommendations(),
        activePlan: latestStudyPlan(),
        weeklyCapacityMinutes: weeklyStrategyCapacity(),
      }),
    });
    renderTodayExecutionSummary(todayModel);
    renderWeeklyRhythmCard();
    renderFirstStepsMissionCard();
    renderRealWeekBanner();
    renderStudyAssistantBar();
    renderTodayJournalSidebar();

    if (!plan && priorities.length === 0) {
      container.innerHTML =
        '<div class="upcoming-empty">Nenhuma atividade elegível para o tempo disponível. Confira os pré-requisitos e a meta de hoje.</div>';
      return;
    }
    if (!plan) {
      container.innerHTML = latestStudyPlan()
        ? '<div class="upcoming-empty">Nenhuma atividade do plano semanal foi distribuída para hoje. Confira a distribuição em Planejamento.</div>'
        : '<div class="upcoming-empty">Confirme um plano em Planejamento para organizar as atividades de hoje.</div>';
      return;
    }

    const reconciled = new Map(
      (todayModel.execution?.items || []).map((item: any) => [item.id, item])
    );
    const eligibleItems = plan.items
      .filter((item: any) => !['discarded'].includes(item.status))
      .map((item: any) =>
        reconciled.has(item.id)
          ? {
              ...item,
              ...reconciled.get(item.id),
              status:
                state.activeTimer?.planItemId === item.id && hasStartedStudyTimer()
                  ? 'in_progress'
                  : reconciled.get(item.id).status,
            }
          : item
      );
    const items =
      state.executionMode === 'sequence'
        ? [...eligibleItems].sort(
            (a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0)
          )
        : eligibleItems;

    const subjectMap = new Map<string, { id: string; name: string; minutes: number }>();
    for (const it of plan.items) {
      if (['skipped', 'replaced', 'deferred', 'discarded'].includes(it.status)) continue;
      const sId = it.subjectId || 'unassigned';
      const sName = it.subjectName || getSubjectName(it.subjectId) || 'Disciplina';
      const cur = subjectMap.get(sId) || { id: sId, name: sName, minutes: 0 };
      cur.minutes += Number(it.plannedMinutes) || 0;
      subjectMap.set(sId, cur);
    }
    const subjectList = [...subjectMap.values()].filter(s => s.minutes > 0);
    const subjectsDistributionHtml =
      subjectList.length > 0
        ? `
      <div class="today-plan-distribution mb-3 p-3 rounded bg-surface-subtle border border-border-subtle">
        <div class="flex items-center justify-between text-xs text-content-secondary mb-2 font-medium">
          <span>Disciplinas planejadas hoje</span>
          <span class="font-data">${subjectList.length} ${subjectList.length === 1 ? 'matéria' : 'matérias'}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          ${subjectList
            .map(s => {
              const slot = subjectColorOf(s, state.subjects || []);
              return `
              <span class="inline-flex items-center gap-2 text-xs bg-surface-card px-2 py-1 rounded border border-border-subtle">
                <span class="subject-color-swatch subject-color-${slot}" aria-hidden="true"></span>
                <strong class="font-medium text-content-primary">${escapeHtml(s.name)}</strong>
                <span class="text-content-secondary font-data">${formatPlanMinutes(s.minutes)}</span>
              </span>
            `;
            })
            .join('')}
        </div>
      </div>
    `
        : '';

    const achievementMark = pickPlanAchievementMark(items, getAchievements(), {
      studiedToday: hasActivityToday(),
    });
    const listaHtml = items
      .map((item: any) => {
        const progress =
          item.plannedMinutes > 0
            ? Math.min(100, Math.round((item.executedSeconds / (item.plannedMinutes * 60)) * 100))
            : 0;
        const hasTimer = hasStartedStudyTimer(),
          active = hasTimer && state.activeTimer?.planItemId === item.id,
          running = active && state.activeTimer?.isRunning;
        const canStart =
            !['completed', 'deferred', 'replaced', 'skipped'].includes(item.status) && !active,
          blocked = hasTimer && !active;
        const colorSlot = subjectColorOf(item, state.subjects || []);
        const statusIconName =
          item.status === 'completed'
            ? 'circle-check'
            : active
              ? 'player-play'
              : PRIORITY_TIER_EMOJI[item.tier] || 'clock';
        const statusIconClass =
          item.status === 'completed'
            ? 'text-green'
            : active
              ? 'text-brand dark:text-accent'
              : 'text-content-secondary';
        const actionButton = active
          ? `<button type="button" class="btn small" data-delegated-click="openStudyTimerFocus()">${renderIconSvg('focus-2', { size: 13, className: 'icon-inline' })}Retomar sessão</button>`
          : canStart && !blocked
            ? `<button type="button" class="btn small tonal" data-delegated-click="startPlannedActivity('${escapeAttr(item.id)}')">${renderIconSvg('player-play', { size: 13, className: 'icon-inline' })}${item.executedSeconds > 0 ? 'Continuar' : 'Iniciar'}</button>`
            : canStart && blocked
              ? '<button type="button" class="btn small" disabled title="Retome ou finalize a sessão em andamento antes de iniciar outra.">Finalize a sessão atual</button>'
              : '';
        return `
      <div class="plano-item ${active ? 'is-active' : ''} ${item.status === 'completed' ? 'is-completed' : ''}">
        <div class="plano-item-head flex items-center gap-2">
          <span class="inline-flex shrink-0 ${statusIconClass}">${renderIconSvg(statusIconName, { size: 13 })}</span>
          <span>${escapeHtml(item.statusLabel || planItemStatusLabel(item.status))}${Number.isFinite(Number(item.score)) ? ' · ' + Math.round(Number(item.score)) + '/100' : ''}</span>
        </div>
        <div class="plano-item-title flex items-center gap-2 flex-wrap">
          <span class="subject-color-swatch subject-color-${colorSlot} shrink-0" aria-hidden="true"></span>
          <span>${escapeHtml(item.subjectName || getSubjectName(item.subjectId) || 'Disciplina')} — ${escapeHtml(item.topicName || getTopicName(item.topicId) || 'Tópico')}</span>
        </div>
        <div class="plano-item-reason">${escapeHtml(item.reason)}</div>
        <div class="plano-item-reason">${[formatPlanMinutes(item.plannedMinutes), item.action && escapeHtml(item.action), item.recommendedQuestions && item.recommendedQuestions + ' questões'].filter(Boolean).join(' · ')}</div>
        ${achievementMark && achievementMark.itemId === item.id ? `<div class="plano-item-achievement" data-achievement-mark="${escapeAttr(achievementMark.achievementId)}">${renderIconSvg('award', { size: 13, className: 'icon-inline' })}<span>${escapeHtml(achievementMark.text)}</span></div>` : ''}
        <div class="plano-item-progress" title="${progress}% executado"><span style="width:${progress}%"></span></div>
        <div class="plano-item-actions">
          ${actionButton}
          <span class="plano-item-status">${active ? (running ? 'Sessão em andamento · cronômetro rodando' : 'Sessão em andamento · pausada') + ' · ' : planItemStatusLabel(item.status) === (item.statusLabel || planItemStatusLabel(item.status)) ? '' : escapeHtml(planItemStatusLabel(item.status)) + ' · '}${formatDuration(item.executedSeconds)} executado</span>
        </div>
      </div>
    `;
      })
      .join('');

    const executedSeconds = plan.items.reduce(
      (sum: number, item: any) => sum + (Number(item.executedSeconds) || 0),
      0
    );
    const executionPct =
      plan.plannedMinutes > 0
        ? Math.min(100, Math.round((executedSeconds / (plan.plannedMinutes * 60)) * 100))
        : 0;

    const executionHint = `
      <div class="today-plan-hint text-xs text-content-secondary mb-3 p-3 rounded bg-surface-subtle border border-border-subtle flex items-center gap-2">
        <span class="text-brand dark:text-accent shrink-0 inline-flex">${renderIconSvg('bulb', { size: 15 })}</span>
        <span>Clique em <strong>Iniciar</strong> no bloco para estudar com o cronômetro integrado ou registre seu tempo após finalizar a sessão.</span>
      </div>
    `;

    container.innerHTML = `
      ${todayModel.recoveryMinutes ? `<div class="replan-group is-warning"><strong>${formatPlanMinutes(todayModel.recoveryMinutes)} pendentes de dias anteriores</strong><span>Revise a redistribuição abaixo antes de aplicar qualquer ajuste.</span></div>` : ''}
      ${listaHtml}
      ${subjectsDistributionHtml}
      ${executionHint}
      ${plan.flexMinutes! > 0 ? `<div class="plano-depois"><div class="plano-depois-label">Tempo flexível:</div><div class="plano-depois-item">${formatPlanMinutes(plan.flexMinutes!)} para pausas, correção ou continuidade</div></div>` : ''}
      <div class="plano-meta">
        <div class="plano-depois-label">Planejamento:</div>
        <div class="plano-depois-item">${formatPlanMinutes(plan.plannedMinutes)} planejados · ${formatDuration(executedSeconds)} executado (${executionPct}%)</div>
      </div>
    `;
  }

  function renderMetasHoje() {
    if (!doc) return;
    const container = doc.getElementById('hojeMetas');
    if (!container) return;
    const state = getState();
    const today = todayISO();

    const topicosHoje = uniqueTopicsCompletedBetween(today, today);
    const metaTopicosHoje = Math.max(1, Math.round((state.metas?.semanal || 7) / 7));

    const questoesHoje = (state.questoes || [])
      .filter((q: any) => q.date === today)
      .reduce((sum: number, q: any) => sum + (Number(q.resolved) || 0), 0);
    const metaQuestoesHoje = Math.max(1, Math.round((state.metas?.questoesSemanal || 70) / 7));

    const revisoesHoje = getRevisoesUnificadas().filter((r: any) => r.date === today);
    const revisoesConcluidasHoje = revisoesHoje.filter((r: any) => r.status === 'Concluído').length;
    const paginasHoje = (state.studySessions || [])
      .filter((s: any) => s.date === today)
      .reduce((sum: number, s: any) => sum + (Number(s.pagesRead) || 0), 0);
    const tempoHoje = segundosEstudadosHoje();
    const metaTempo = metaHoursToday() * 3600;
    const pctTempo = metaTempo > 0 ? Math.round((tempoHoje / metaTempo) * 100) : 0;
    const todayDayOfWeek = parseLocalDate(today)?.getDay?.() ?? new Date().getDay();

    mountTodayGoals(container, {
      topicosHoje,
      metaTopicosHoje,
      questoesHoje,
      metaQuestoesHoje,
      revisoesConcluidasHoje,
      totalRevisoesHoje: revisoesHoje.length,
      tempoHojeSegundos: tempoHoje,
      tempoHojeFormatado: formatDuration(tempoHoje),
      metaHorasHoje: metaHoursToday(),
      metaHorasFormatado: formatHoras(metaHoursToday()),
      pctTempo,
      todayDayOfWeek,
      paginasHoje,
    });
  }

  function renderSimuladosPlanejados() {
    if (!doc) return;
    const ul = doc.getElementById('hojeSimuladosPlanejados');
    if (!ul) return;
    const state = getState();
    const today = todayISO();
    const planejados = (state.simulados || [])
      .filter(
        (s: any) =>
          s.date >= today &&
          (Number(s.correct) || 0) === 0 &&
          (Number(s.total) || 0) === 0 &&
          (!s.breakdown || s.breakdown.length === 0)
      )
      .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

    if (planejados.length === 0) {
      ul.innerHTML = `<li class="upcoming-empty">Nenhum simulado planejado. Registre um com data futura na aba Questões &amp; Simulados para ele aparecer aqui.</li>`;
    } else {
      ul.innerHTML = planejados
        .map(
          (s: any) => `
      <li>
        <span class="upcoming-date">${formatDatePt(s.date)}</span>
        <span style="flex:1;">${escapeHtml(s.nome || 'Simulado sem nome')}</span>
        <span class="subject-progress-pill">${s.date === today ? 'hoje' : 'planejado'}</span>
      </li>
    `
        )
        .join('');
    }
  }

  function bindEvents() {
    if (!doc) return;
    renderExecutionModeSwitch();
    doc.addEventListener('click', (event: any) => {
      const start = (event.target as HTMLElement)?.closest?.<HTMLElement>('[data-daily-start]');
      if (start) {
        const result = dailyExecutionController.start(start.dataset.dailyStart!);
        if (result.state === 'unavailable') _showToast('A atividade mudou. Confira o plano atual.');
        if (result.state === 'blocked')
          _showToast('Finalize a sessão atual antes de iniciar outra.');
        renderDailyExecutionCard();
        _renderOverviewDecisionArea();
      }
      if ((event.target as HTMLElement)?.closest?.('[data-daily-resume]')) openStudyTimerFocus();
      if ((event.target as HTMLElement)?.closest?.('[data-open-what-if]')) whatIfController?.open();

      const firstStepsBtn = (event.target as HTMLElement)?.closest?.<HTMLElement>(
        '[data-first-steps-action]'
      );
      if (firstStepsBtn) {
        const action = firstStepsBtn.dataset.firstStepsAction;
        if (action === 'open-onboarding') {
          _openGuidedOnboarding();
        } else if (action === 'open-questions') {
          _activateTab('questoes');
          if (!(getState().questoes || []).length) {
            (doc.getElementById('addQuestaoRowBtn') as HTMLElement | null)?.click();
          }
        } else if (action === 'start-first-session' || action === 'start-quick-warmup') {
          const currentPlan = todayDailyStudyPlan();
          const firstItem = currentPlan?.items?.find(
            (it: any) => it.status !== 'completed' && it.status !== 'skipped'
          );
          if (firstItem) {
            const startResult = dailyExecutionController.start(firstItem.id);
            if (startResult.state === 'blocked') {
              _showToast('Finalize a sessão atual antes de iniciar outra.');
            }
            renderDailyExecutionCard();
            _renderOverviewDecisionArea();
          } else {
            _activateTab('hoje');
            doc.getElementById('study-timer')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }

  return {
    renderExecutionSummaryHtml,
    mountExecutionSummary,
    renderAgendaSectionsHtml,
    mountAgendaSections,
    renderTodayGoalsHtml,
    mountTodayGoals,
    renderFirstStepsMissionHtml,
    mountFirstStepsMission,
    buildDailyStudyPlan,
    materializeDailyStudyPlan,
    todayDailyStudyPlan,
    ensureTodayDailyStudyPlan,
    planItemStatusLabel,
    renderTodayExecutionSummary,
    isFirstStepsDismissed,
    dismissFirstSteps,
    restoreFirstSteps,
    renderFirstStepsMissionCard,
    renderFinalStretchBanner,
    renderRealWeekBannerHtml,
    mountRealWeekBanner,
    renderRealWeekBanner,
    isRealWeekBannerDismissed,
    dismissRealWeekBanner,
    restoreRealWeekBanner,
    dailyExecutionController,
    renderDailyExecutionCard,
    renderPlanoHoje,
    renderMetasHoje,
    renderWeeklyRhythmCard,
    renderSimuladosPlanejados,
    renderStudyAssistantBar,
    openAssistantPanel,
    bindEvents,
  };
}
