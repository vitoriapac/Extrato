import type { ActiveTimerState } from '../../core/types.ts';
/**
 * Controller e utilitários puros para o Cronômetro de Estudos e Sessão Ativa.
 */

// The timer reads the same shape as the app state; every field is optional for defensive callers.
export type ActiveTimerData = Partial<ActiveTimerState>;

export function computeTimerSeconds(
  active: ActiveTimerData | null | undefined,
  now = Date.now()
): number {
  if (!active) return 0;
  let seconds = Math.max(0, Number(active.accumulatedSeconds) || 0);
  if (active.isRunning && active.runStartedAt) {
    const runStart = Date.parse(active.runStartedAt);
    if (Number.isFinite(runStart)) {
      seconds += Math.max(0, Math.floor((now - runStart) / 1000));
    }
  }
  return seconds;
}

export function hasActiveTimer(active: ActiveTimerData | null | undefined): boolean {
  if (!active) return false;
  return Boolean(
    active.startedAt || active.isRunning || (Number(active.accumulatedSeconds) || 0) > 0
  );
}

export function activeTimerMatchesRecommendation(
  active: ActiveTimerData | null | undefined,
  recommendation: any,
  getActionKind?: (rec: any) => string
): boolean {
  if (!hasActiveTimer(active) || !recommendation) return false;
  const sameTarget =
    active?.subjectId === recommendation.subjectId && active?.topicId === recommendation.topicId;
  if (!sameTarget) return false;

  const actionType = getActionKind ? getActionKind(recommendation) : recommendation.type || 'study';
  return (
    !active?.recommendationType ||
    active.recommendationType === actionType ||
    active.type === actionType
  );
}

export interface StudyTimerNoticeOptions {
  active: ActiveTimerData | null | undefined;
  recommendation?: any;
  subjectName: string;
  topicName: string;
  elapsed: string;
  targetMinutes?: number | null;
  formatTargetFn?: (minutes: number) => string;
  escapeFn?: (text: string) => string;
  getActionKind?: (rec: any) => string;
}

export function renderActiveStudyTimerNoticeHtml(options: StudyTimerNoticeOptions): string {
  const {
    active,
    recommendation,
    subjectName,
    topicName,
    elapsed,
    targetMinutes = 0,
    formatTargetFn = (m: number) => `${m} min`,
    escapeFn = (s: string) => s,
    getActionKind,
  } = options;

  if (
    !hasActiveTimer(active) ||
    (recommendation && activeTimerMatchesRecommendation(active, recommendation, getActionKind))
  ) {
    return '';
  }

  const validTargetMinutes = Math.max(0, Number(targetMinutes) || 0);
  const targetLabel = validTargetMinutes ? ` · meta ${formatTargetFn(validTargetMinutes)}` : '';
  const statusLabel = active?.isRunning ? 'cronômetro rodando' : 'pausada';

  return `<aside class="active-study-notice" aria-label="Sessão em andamento"><div><strong>Sessão em andamento</strong><span>${escapeFn(
    subjectName
  )} — ${escapeFn(topicName)} · ${elapsed}${targetLabel} · ${statusLabel}</span></div><button class="btn ghost small" type="button" data-delegated-click="openStudyTimerFocus()">Retomar sessão</button></aside>`;
}

export function renderGuidedStrategyHtml(
  strategy: { label: string; steps: Array<{ label: string; minutes: number }> } | null | undefined,
  currentStepIndex: number,
  escapeFn: (s: string) => string = s => s
): string {
  if (!strategy || !Array.isArray(strategy.steps) || strategy.steps.length === 0) {
    return '';
  }
  const index = Math.min(Math.max(0, currentStepIndex || 0), strategy.steps.length - 1);
  const step = strategy.steps[index];
  const isLast = index === strategy.steps.length - 1;
  const buttonLabel = isLast ? 'Concluir etapas' : 'Próxima etapa';

  return `<strong>${escapeFn(strategy.label)} · etapa ${index + 1}/${strategy.steps.length}</strong><span>${escapeFn(
    step.label
  )} · ${step.minutes} min</span><button class="btn ghost small" data-delegated-click="advanceGuidedStrategy()">${buttonLabel}</button>`;
}

export function advanceGuidedStrategyStep(active: ActiveTimerData): {
  isComplete: boolean;
  nextIndex: number;
} {
  const strategy = active.strategy;
  if (!strategy || !Array.isArray(strategy.steps) || strategy.steps.length === 0) {
    return { isComplete: true, nextIndex: 0 };
  }
  const currentIndex = Math.min(Math.max(0, active.strategyStep || 0), strategy.steps.length - 1);
  if (strategy.steps[currentIndex]) {
    strategy.steps[currentIndex].status = 'completed';
  }
  const isComplete = currentIndex >= strategy.steps.length - 1;
  const nextIndex = isComplete ? currentIndex : currentIndex + 1;
  active.strategyStep = nextIndex;
  return { isComplete, nextIndex };
}

export interface TimerControllerOptions {
  getActiveTimer: () => ActiveTimerData;
  nowISO: () => string;
  onTick?: (seconds: number) => void;
  onSave?: () => void;
  onControlsUpdate?: (isRunning: boolean, seconds: number) => void;
  onReset?: () => void;
  showConfirmLongRun?: (seconds: number, onKeep: () => void, onDiscard: () => void) => void;
}

export function createTimerController(opts: TimerControllerOptions) {
  let timerIntervalId: any = null;
  let isRunning = false;
  let currentSeconds = 0;

  function tick() {
    currentSeconds = computeTimerSeconds(opts.getActiveTimer());
    opts.onTick?.(currentSeconds);
  }

  function start() {
    const active = opts.getActiveTimer();
    if (isRunning) return;

    if (currentSeconds === 0) {
      active.startedAt = opts.nowISO();
      active.accumulatedSeconds = 0;
    }
    active.runStartedAt = opts.nowISO();
    active.isRunning = true;
    active.hiddenAt = null;
    isRunning = true;

    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(tick, 1000);
    tick();

    opts.onControlsUpdate?.(isRunning, currentSeconds);
    opts.onSave?.();
  }

  function pause(shouldSave = true) {
    const active = opts.getActiveTimer();
    currentSeconds = computeTimerSeconds(active);
    active.accumulatedSeconds = currentSeconds;
    active.runStartedAt = null;
    active.isRunning = false;
    active.hiddenAt = null;
    isRunning = false;

    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }

    opts.onTick?.(currentSeconds);
    opts.onControlsUpdate?.(isRunning, currentSeconds);
    if (shouldSave) opts.onSave?.();
  }

  function reset() {
    pause(false);
    const active = opts.getActiveTimer();
    currentSeconds = 0;
    Object.assign(active, {
      startedAt: null,
      runStartedAt: null,
      accumulatedSeconds: 0,
      isRunning: false,
      hiddenAt: null,
      planItemId: null,
      targetMinutes: null,
      strategy: null,
      strategyStep: 0,
      recommendationId: null,
      recommendationSource: null,
      recommendationType: null,
      prioritySnapshot: null,
    });
    opts.onReset?.();
    opts.onTick?.(0);
    opts.onControlsUpdate?.(false, 0);
    opts.onSave?.();
  }

  function restore() {
    const active = opts.getActiveTimer();
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    currentSeconds = computeTimerSeconds(active);
    isRunning = Boolean(active.isRunning);

    const runStart = active.runStartedAt ? Date.parse(active.runStartedAt) : 0;
    const isLongRun = isRunning && runStart && Date.now() - runStart > 4 * 60 * 60 * 1000;

    if (isLongRun && opts.showConfirmLongRun) {
      pause(false);
      opts.onSave?.();
      opts.showConfirmLongRun(
        currentSeconds,
        () => {
          /* usuário manteve */
        },
        () => {
          reset();
        }
      );
    } else if (isRunning) {
      timerIntervalId = setInterval(tick, 1000);
    }

    opts.onTick?.(currentSeconds);
    opts.onControlsUpdate?.(isRunning, currentSeconds);
  }

  function getSeconds(): number {
    return currentSeconds;
  }

  function isTimerRunning(): boolean {
    return isRunning;
  }

  return {
    start,
    pause,
    reset,
    restore,
    tick,
    getSeconds,
    isTimerRunning,
  };
}
