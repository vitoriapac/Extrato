import { sameStudyActionTarget } from '../../application/recommendations/recommendation-action.js';
import { buildSessionResultViewModel } from '../../application/sessions/build-session-result-view-model.js';
import {
  buildCompletedSessionRecord,
  findDailyPlanItem as findDailyPlanItemCoordinator,
  formatTimer,
  releaseActivePlanItem as releaseActivePlanItemCoordinator,
} from '../../application/sessions/timer-coordinator.js';
import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import type { ActiveTimerState, AppState } from '../../core/types.js';
import { announceTimerEvent } from '../primitives/a11y.js';
import { renderSessionResult } from '../renderers/session-result-renderer.js';
import {
  buildTimerMiniView,
  createPipTimerController,
  shouldMarkHidden,
} from './pip-timer-controller.js';
import { createSessionModalController } from './session-modal-controller.js';
import { createStudyTimerViewController } from './study-timer-view-controller.js';
import {
  activeTimerMatchesRecommendation as activeTimerMatchesRecommendationModule,
  advanceGuidedStrategyStep,
  computeTimerSeconds,
  hasActiveTimer,
  renderActiveStudyTimerNoticeHtml,
} from './timer-controller.js';
import { scrollBehavior } from '../accessibility.js';

export interface StudyTimerRuntimeControllerOptions {
  document: Document;
  window: Window;
  getState: () => AppState;
  nowISO: () => string;
  todayISO: () => string;
  uid: (prefix: string) => string;
  localDateFromTimestamp: (value: any) => string;
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
  getSubjectName: (id: string) => string;
  getTopicName: (id: string) => string;
  getSubjectById: (id: string) => any;
  getTopicById: (id: string | null | undefined) => { subject: any; topic: any } | null;
  subjectsForSelection: (selectedId?: string | null) => any[];
  topicsForSelection: (subjectOrId: any, selectedTopicId?: string | null) => any[];
  recommendationActionKind: (rec: any) => string;
  intelligenceCandidates: () => any[];
  getDailyExecutionItems: () => any;
  getCurrentStudyRecommendations: () => any[];
  guidedStudyService: {
    current: () => any;
    resume: () => void;
    pause: () => void;
    reset: () => void;
    complete: (session: any) => void;
  };
  sessionService: {
    complete: (session: any) => void;
  };
  timerUiController: {
    openStudyTimerFocus: () => void;
    toggleTimerFocus: (force?: boolean | null) => any;
    clearTimerFocusReturnTab: () => void;
    topicResumeLabel: (topicId: string) => string;
    saveSessionBookmark: (topicId: string, endedAt: string) => void;
  };
  activeTabName: () => string;
  activateTab: (tabName: string, updateHash?: boolean) => void;
  scheduleSave: () => void;
  persistAndRender: () => void;
  renderPlanoHoje: () => void;
  renderStudyRecommendation: () => void;
  renderDiagnosisCenter: () => void;
  addSimuladoRow: () => void;
  showToast: (message: string) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: Record<string, any>
  ) => void;
}

export function createStudyTimerRuntimeController(options: StudyTimerRuntimeControllerOptions) {
  const {
    document,
    window,
    getState,
    nowISO,
    todayISO,
    uid,
    localDateFromTimestamp,
    escapeHtml,
    escapeAttr,
    getSubjectName,
    getTopicName,
    getSubjectById,
    getTopicById,
    subjectsForSelection,
    topicsForSelection,
    recommendationActionKind,
    intelligenceCandidates,
    getDailyExecutionItems,
    getCurrentStudyRecommendations,
    guidedStudyService,
    sessionService,
    timerUiController,
    activeTabName,
    activateTab,
    scheduleSave,
    persistAndRender,
    renderPlanoHoje,
    renderStudyRecommendation,
    renderDiagnosisCenter,
    addSimuladoRow,
    showToast,
    showConfirm,
  } = options;

  let timerSeconds = 0;
  let timerRunning = false;
  let timerIntervalId: any = null;
  let timerStartedAt: any = null;

  function isTimerRunning() {
    return timerRunning;
  }

  function topicResumeLabel(topicId: string) {
    return timerUiController.topicResumeLabel(topicId);
  }

  function saveSessionBookmark(topicId: string, endedAt: string) {
    timerUiController.saveSessionBookmark(topicId, endedAt);
  }

  function findDailyPlanItem(itemId: string) {
    return findDailyPlanItemCoordinator(getState().dailyPlans, itemId);
  }

  function releaseActivePlanItem() {
    const state = getState();
    return releaseActivePlanItemCoordinator(
      state.dailyPlans,
      state.activeTimer?.planItemId,
      nowISO
    );
  }

  function currentTimerSeconds() {
    return computeTimerSeconds(getState().activeTimer);
  }

  function hasStartedStudyTimer() {
    return hasActiveTimer(getState().activeTimer);
  }

  function activeTimerMatchesRecommendation(recommendation: Record<string, any>) {
    return activeTimerMatchesRecommendationModule(
      getState().activeTimer,
      recommendation,
      recommendationActionKind
    );
  }

  function renderActiveStudyTimerNotice(recommendation: Record<string, any> | null) {
    const active = (getState().activeTimer || {}) as Partial<ActiveTimerState>;
    return renderActiveStudyTimerNoticeHtml({
      active,
      recommendation,
      subjectName: active.subjectId
        ? getSubjectName(active.subjectId)
        : 'Disciplina não selecionada',
      topicName: active.topicId ? getTopicName(active.topicId) : 'Tópico não selecionado',
      elapsed: formatDuration(currentTimerSeconds()),
      targetMinutes: active.targetMinutes,
      formatTargetFn: formatPlanMinutes,
      escapeFn: escapeHtml,
      getActionKind: recommendationActionKind,
    });
  }

  const pipTimer = createPipTimerController({
    getView: () => {
      const active = (getState().activeTimer || {}) as Partial<ActiveTimerState>,
        steps = active.strategy?.steps || [],
        index = Math.min(active.strategyStep || 0, Math.max(0, steps.length - 1)),
        step = steps[index];
      return buildTimerMiniView({
        running: timerRunning,
        seconds: currentTimerSeconds(),
        targetMinutes: active.targetMinutes,
        subjectName: active.subjectId ? getSubjectName(active.subjectId) : '',
        topicName: active.topicId ? getTopicName(active.topicId) : '',
        bookmarkLabel: topicResumeLabel(active.topicId!),
        stepLabel: step
          ? `Etapa ${index + 1}/${steps.length}: ${step.label} · ${step.minutes} min`
          : '',
        formatTime: formatTimer,
        formatMinutes: formatPlanMinutes,
      });
    },
    onToggle: () => (timerRunning ? pauseTimer() : startTimer()),
    onFinish: () => {
      finishStudyTimer();
      window.focus();
    },
    copyStyles: doc => {
      for (const node of document.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"],style'
      )) {
        const copy = doc.importNode(node, true);
        if (node.href) copy.href = node.href;
        doc.head.append(copy);
      }
      doc.documentElement.setAttribute(
        'data-theme',
        document.documentElement.getAttribute('data-theme') || 'light'
      );
      doc.body.classList.add('pip-timer-window');
      doc.title = 'StudyTrack';
    },
  });

  const studyTimerViewController = createStudyTimerViewController({
    document,
    formatTimer,
    escapeHtml,
    escapeAttr,
    getSubjectName,
    getTopicName,
    getSubjectById,
    subjectsForSelection,
    topicsForSelection,
    topicResumeLabel,
    findDailyPlanItem,
    getActiveTimer: () => (getState().activeTimer || {}) as Partial<ActiveTimerState>,
    onPipRender: () => pipTimer.render(),
  });

  function updateTimerDisplay() {
    studyTimerViewController.updateTimerDisplay(timerSeconds, timerRunning);
  }

  function renderTimerFocusContext() {
    studyTimerViewController.renderTimerFocusContext();
  }

  function renderGuidedStrategy() {
    studyTimerViewController.renderGuidedStrategy();
  }

  function advanceGuidedStrategy() {
    const state = getState();
    if (state.activeTimer?.strategy) {
      advanceGuidedStrategyStep(state.activeTimer);
      renderGuidedStrategy();
      scheduleSave();
    }
  }

  function updateTimerControls() {
    studyTimerViewController.updateTimerControls(timerSeconds, timerRunning);
  }

  function refreshStudyActionViews() {
    if (document.getElementById('studyRecommendation')) renderStudyRecommendation();
  }

  function populateTimerTopicSelect(subjectId: string, selectedTopicId: string | null) {
    studyTimerViewController.populateTimerTopicSelect(subjectId, selectedTopicId);
  }

  function populateTimerContextControls() {
    studyTimerViewController.populateTimerContextControls();
    updateTimerControls();
  }

  function timerTick() {
    timerSeconds = currentTimerSeconds();
    updateTimerDisplay();
  }

  function startTimer() {
    if (timerRunning) return;
    if (timerSeconds === 0) {
      const result = document.getElementById('sessionResult');
      if (result) result.hidden = true;
    }
    const active = getState().activeTimer;
    if (timerSeconds === 0) {
      active.startedAt = nowISO();
      active.accumulatedSeconds = 0;
    }
    active.subjectId =
      (document.getElementById('timerSubjectSelect') as HTMLSelectElement).value || null;
    active.topicId =
      (document.getElementById('timerTopicSelect') as HTMLSelectElement).value || null;
    active.type =
      (document.getElementById('timerTypeSelect') as HTMLSelectElement).value || 'study';
    active.runStartedAt = nowISO();
    active.isRunning = true;
    active.hiddenAt = null;
    timerStartedAt = active.startedAt;
    timerRunning = true;
    if (guidedStudyService.current()) guidedStudyService.resume();
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(timerTick, 1000);
    timerTick();
    updateTimerControls();
    announceTimerEvent('start');
    scheduleSave();
    refreshStudyActionViews();
  }

  function pauseTimer(shouldSave = true) {
    const state = getState();
    timerSeconds = currentTimerSeconds();
    state.activeTimer.accumulatedSeconds = timerSeconds;
    state.activeTimer.runStartedAt = null;
    state.activeTimer.isRunning = false;
    state.activeTimer.hiddenAt = null;
    timerRunning = false;
    if (guidedStudyService.current()) guidedStudyService.pause();
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    updateTimerDisplay();
    updateTimerControls();
    announceTimerEvent('pause');
    if (shouldSave) {
      scheduleSave();
      refreshStudyActionViews();
    }
  }

  function resetTimer() {
    const state = getState();
    pauseTimer(false);
    releaseActivePlanItem();
    timerSeconds = 0;
    timerStartedAt = null;
    Object.assign(state.activeTimer, {
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
    guidedStudyService.reset();
    pipTimer.close();
    updateTimerDisplay();
    updateTimerControls();
    announceTimerEvent('reset');
    scheduleSave();
    refreshStudyActionViews();
  }

  function restoreTimerFromState() {
    const state = getState();
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerSeconds = currentTimerSeconds();
    timerStartedAt = state.activeTimer.startedAt || null;
    timerRunning = Boolean(state.activeTimer.isRunning);
    const runStart = state.activeTimer.runStartedAt
      ? Date.parse(state.activeTimer.runStartedAt)
      : 0;
    const recoveredLongRun = timerRunning && runStart && Date.now() - runStart > 4 * 60 * 60 * 1000;
    if (recoveredLongRun) {
      pauseTimer(false);
      scheduleSave();
      setTimeout(
        () =>
          showConfirm(
            `Uma sessão longa foi recuperada com ${formatDuration(timerSeconds)}. Manter esse tempo e continuar com o cronômetro pausado?`,
            () => showToast('Tempo recuperado. Você pode continuar ou finalizar a sessão.'),
            () => {
              resetTimer();
              showToast('Intervalo recuperado descartado.');
            }
          ),
        0
      );
    } else if (timerRunning) {
      timerIntervalId = setInterval(timerTick, 1000);
    }
    updateTimerDisplay();
    populateTimerContextControls();
    updateTimerControls();
  }

  function startPlannedActivity(itemId: string) {
    const state = getState();
    const found = findDailyPlanItem(itemId);
    if (!found) {
      showToast('Esta atividade não está mais disponível no plano.');
      return;
    }
    const execution = getDailyExecutionItems().items!.find((item: any) => item.id === itemId);
    if (!execution || execution.remainingSeconds <= 0) {
      showToast('Esta atividade não está disponível para iniciar.');
      return;
    }
    if (timerSeconds > 0) {
      showToast('Finalize ou zere a sessão atual antes de iniciar outra atividade.');
      return;
    }
    const { plan, item } = found;
    if (item.topicId) {
      const candidate = intelligenceCandidates().find(
        (candidate: any) => candidate.topicId === item.topicId
      );
      if (!candidate || candidate.archived || candidate.blockedPrerequisites.length) {
        showToast(
          'Esta atividade aguarda pré-requisitos ou possui um tópico arquivado. Recalcule o plano.'
        );
        return;
      }
    }
    Object.assign(state.activeTimer, {
      subjectId: item.subjectId || null,
      topicId: item.topicId || null,
      type: item.type || 'study',
      planItemId: item.id,
      targetMinutes: Math.ceil(execution.remainingSeconds / 60),
    });
    item.executedSeconds = execution.executedSeconds;
    item.status = 'in_progress';
    item.startedAt = item.startedAt || nowISO();
    plan.updatedAt = nowISO();
    populateTimerContextControls();
    startTimer();
    renderPlanoHoje();
    if (activeTabName() !== 'dashboard') timerUiController.openStudyTimerFocus();
    else {
      document
        .querySelector('#panel-dashboard .timer-block')
        ?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
      requestAnimationFrame(() => document.getElementById('timerPauseBtn')?.focus());
    }
  }

  const sessionModalController = createSessionModalController({
    document,
    formatTimer,
    escapeHtml,
    escapeAttr,
    getSubjectById,
    getTopicById,
    subjectsForSelection,
    topicsForSelection,
  });

  function showSessionModal() {
    sessionModalController.show(timerSeconds, getState().activeTimer);
  }

  function closeSessionModal() {
    sessionModalController.hide();
    resetTimer();
  }

  function dismissSessionModal() {
    sessionModalController.hide();
    document.getElementById('timerFinishBtn')?.focus();
  }

  function discardSessionFromModal() {
    const overlay = document.getElementById('sessionModalOverlay');
    overlay!.classList.remove('show');
    showConfirm(
      `Descartar esta sessão de ${formatDuration(timerSeconds)}? O tempo não será registrado.`,
      closeSessionModal,
      () => {
        overlay!.classList.add('show');
        document.getElementById('sessionModalSkipBtn')?.focus();
      },
      { confirmLabel: 'Descartar sessão' }
    );
  }

  function finishStudyTimer() {
    if (timerSeconds === 0) {
      showToast('O cronômetro ainda não começou.');
      return;
    }
    pauseTimer();
    announceTimerEvent('finish');
    showSessionModal();
  }

  function showSessionResult(
    session: Record<string, any>,
    nextPriority: Record<string, any> | null,
    priorityChanged: boolean,
    day: any = null,
    planNext: Record<string, any> | null = null
  ) {
    const result = document.getElementById('sessionResult');
    if (!result) return;
    result.innerHTML = renderSessionResult(
      buildSessionResultViewModel(session, nextPriority, priorityChanged, {
        subjectName: getSubjectName,
        topicName: getTopicName,
        formatMinutes: formatPlanMinutes,
        day,
        planNext,
      }),
      { escapeHtml }
    );
    if (document.body.classList.contains('timer-focus-active')) {
      timerUiController.clearTimerFocusReturnTab();
      timerUiController.toggleTimerFocus(false);
    }
    result.hidden = false;
    activateTab('dashboard');
    result.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    result.focus({ preventScroll: true });
  }

  function bindEvents() {
    document.getElementById('timerStartBtn')!.addEventListener('click', startTimer);
    document.getElementById('timerPauseBtn')!.addEventListener('click', () => pauseTimer());
    document
      .getElementById('timerSubjectSelect')!
      .addEventListener('change', function (this: HTMLSelectElement) {
        const state = getState();
        state.activeTimer.subjectId = this.value || null;
        state.activeTimer.topicId = null;
        populateTimerTopicSelect(state.activeTimer.subjectId!, null);
        renderTimerFocusContext();
        scheduleSave();
      });
    document
      .getElementById('timerTopicSelect')!
      .addEventListener('change', function (this: HTMLSelectElement) {
        const state = getState();
        state.activeTimer.topicId = this.value || null;
        renderTimerFocusContext();
        scheduleSave();
      });
    document
      .getElementById('timerTypeSelect')!
      .addEventListener('change', function (this: HTMLSelectElement) {
        const state = getState();
        state.activeTimer.type = (this.value as any) || 'study';
        renderTimerFocusContext();
        scheduleSave();
      });
    document.getElementById('timerResetBtn')!.addEventListener('click', () => {
      if (timerSeconds === 0) {
        return;
      }
      showConfirm('Zerar o cronômetro? O tempo desta sessão será perdido.', resetTimer);
    });
    document.getElementById('timerFinishBtn')!.addEventListener('click', finishStudyTimer);
    const timerPipBtn = document.getElementById('timerPipBtn');
    timerPipBtn!.hidden = !pipTimer.supported;
    timerPipBtn!.addEventListener('click', () =>
      pipTimer.open().catch(error => {
        console.warn('Janela flutuante indisponível', error);
        showToast('Não foi possível abrir a janela flutuante.');
      })
    );

    sessionModalController.bindEvents({
      onSkip: discardSessionFromModal,
      onDismiss: dismissSessionModal,
      onSave: formValues => {
        const currentRecs = getCurrentStudyRecommendations();
        const previousPriority = currentRecs[0] ? { ...currentRecs[0] } : null;
        const session = buildCompletedSessionRecord({
          timerSeconds,
          timerStartedAt,
          activeTimer: getState().activeTimer,
          formValues,
          nowISO,
          localDateFromTimestamp,
          uid,
        });
        saveSessionBookmark(formValues.topicId!, session.endedAt);
        const dayBefore = session.date === todayISO() ? getDailyExecutionItems() : null;
        if (guidedStudyService.current()) guidedStudyService.complete(session);
        else sessionService.complete(session);
        persistAndRender();
        const dayAfter = dayBefore ? getDailyExecutionItems() : null;
        renderStudyRecommendation();
        renderDiagnosisCenter();
        const nextPriority = getCurrentStudyRecommendations()[0] || null;
        const priorityChanged =
          previousPriority && nextPriority && !sameStudyActionTarget(previousPriority, nextPriority);
        const openSimulationFlow = formValues.type === 'simulation';
        closeSessionModal();
        showSessionResult(
          session,
          nextPriority,
          priorityChanged,
          dayBefore?.progress && dayAfter?.progress
            ? { before: dayBefore.progress, after: dayAfter.progress, total: dayAfter.items.length }
            : null,
          (dayAfter || getDailyExecutionItems()).priority?.nextItem || null
        );
        if (openSimulationFlow) {
          activateTab('questoes');
          addSimuladoRow();
          showToast('Complete agora os resultados do simulado.');
        }
      },
    });

    document.addEventListener('visibilitychange', () => {
      const state = getState();
      if (document.hidden) {
        if (
          shouldMarkHidden({ isRunning: state.activeTimer.isRunning, pipOpen: pipTimer.isOpen() })
        ) {
          state.activeTimer.hiddenAt = nowISO();
          scheduleSave();
        }
        return;
      }
      const hiddenAt = state.activeTimer.hiddenAt ? Date.parse(state.activeTimer.hiddenAt) : 0;
      if (!state.activeTimer.isRunning || !hiddenAt) return;
      const awaySeconds = Math.max(0, Math.floor((Date.now() - hiddenAt) / 1000));
      if (awaySeconds >= 2 * 60 * 60) {
        pauseTimer();
        showConfirm(
          `O cronômetro ficou em segundo plano por ${formatDuration(awaySeconds)}. Manter o intervalo no tempo da sessão?`,
          () => showToast('Intervalo mantido. O cronômetro ficou pausado.'),
          () => {
            resetTimer();
            showToast('Intervalo descartado.');
          }
        );
      } else {
        state.activeTimer.hiddenAt = null;
        scheduleSave();
      }
    });
  }

  function refreshTimerDisplay() {
    timerSeconds = currentTimerSeconds();
    updateTimerDisplay();
  }

  return {
    isTimerRunning,
    currentTimerSeconds,
    hasStartedStudyTimer,
    activeTimerMatchesRecommendation,
    renderActiveStudyTimerNotice,
    updateTimerDisplay,
    renderTimerFocusContext,
    renderGuidedStrategy,
    advanceGuidedStrategy,
    updateTimerControls,
    populateTimerTopicSelect,
    populateTimerContextControls,
    startPlannedActivity,
    startTimer,
    pauseTimer,
    resetTimer,
    restoreTimerFromState,
    finishStudyTimer,
    refreshTimerDisplay,
    bindEvents,
  };
}
