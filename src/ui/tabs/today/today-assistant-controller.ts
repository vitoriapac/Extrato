import { h } from 'preact';
import { mountPreact } from '../../preact-mount.js';
import type { ExecutionMode } from './TodayExecutionModeSwitch.js';
import {
  TodayStudyAssistantBar,
  type AssistantPanelKind,
  type CycleDraftState,
} from '../../components/TodayStudyAssistantBar.js';
import { revealAdvanced } from '../../essential-mode.js';
import { orderByDiagnosisQueue } from '../../../application/diagnostics/build-next-best-action.js';
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
import type { TodayTabControllerContext } from './today-tab-controller.js';
import type { createTodayJournalController } from './today-journal-controller.js';

export interface TodayAssistantDeps {
  ctx: TodayTabControllerContext;
  journal: ReturnType<typeof createTodayJournalController>;
  renderPlanoHoje: () => void;
}

/** O Diário fica na dobra "Esforço na semana e Diário"; quem leva até ele abre a dobra. */
function openJournalFold(mount: Element | null | undefined) {
  const fold = mount?.closest?.('details');
  if (!fold) return;
  (fold as HTMLDetailsElement).open = true;
  // Pedido explícito do aluno: o Modo Foco esconde esta dobra, mas não o que foi chamado.
  fold.setAttribute('data-focus-reveal', '');
}

/** Barra do assistente da aba Hoje: ciclo de estudos, estudo rápido, copiloto e fechamento semanal. */
export function createTodayAssistantController({
  ctx,
  journal,
  renderPlanoHoje,
}: TodayAssistantDeps) {
  const {
    document: doc = typeof document !== 'undefined' ? document : (null as any),
    getState = () => ({}),
    isDemoMode = () => false,
    todayISO = () => new Date().toISOString().slice(0, 10),
    nowISO = () => new Date().toISOString(),
    uid = (p = 'id') => `${p}_${Date.now()}`,
    scheduleSave = () => {},
    showToast: _showToast = () => {},
    activateTab: _activateTab = () => {},
    latestStudyPlan = () => null,
    weeklyStrategyCapacity = () => 0,
    getCurrentStudyRecommendations = () => [],
    getRevisoesUnificadas = () => [],
    diasParaRevisao = () => null,
  } = ctx;

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

  function handleOpenPlanningCycle(): void {
    _activateTab('metas');
    (doc?.getElementById('metasTab-semana') as HTMLElement | null)?.click?.();
    const cycleMount = doc?.getElementById('metasCycleCenterMount') as HTMLElement | null;
    if (cycleMount) {
      revealAdvanced(cycleMount);
      cycleMount.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
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
    const executionMode: ExecutionMode = state?.executionMode === 'agenda' ? 'agenda' : 'sequence';
    const subjects = state?.subjects || [];
    const candidates = ctx.intelligenceCandidates ? ctx.intelligenceCandidates() : [];
    const recs = orderByDiagnosisQueue(getCurrentStudyRecommendations() || [], ctx.diagnosisQueue?.());
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
      laws: state.lawNotebook || [],
      jurisprudence: state.jurisprudenceNotebook || [],
      today,
      source: 'today',
    });

    const copilot = buildStudyCopilotViewModel({
      today,
      nowISO: nowISO(),
      isDemo: isDemoMode(),
      executionMode,
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

    const filteredJournal = journal.filterEntries(state.learningJournal || []);

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

    if (executionMode === 'sequence' && !cycle && !cycleDraftState.preview) {
      refreshCycleDraftPreview();
    }

    const timerStartBtn = doc.getElementById('timerStartBtn') as HTMLElement | null;
    if (timerStartBtn) {
      const hasPrimaryCycleAction =
        executionMode === 'sequence' && Boolean(currentBlock || cycleDraftState.preview?.valid);
      timerStartBtn.classList.toggle('tonal', hasPrimaryCycleAction);
    }
    const timerFold = doc.getElementById('timerManualSelectorsFold') as HTMLDetailsElement | null;
    if (timerFold && executionMode === 'sequence' && Boolean(cycle)) {
      timerFold.open = false;
    }

    const startCurrentCycleBlock = (): void => {
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
    };

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
        journalFilters: { ...journal.filters },
        journalForm: { ...journal.getForm() },
        weeklyClosing,
        onTogglePanel: panel => {
          assistantPanel = panel;
          renderStudyAssistantBar();
        },
        onStartCycleBlock: startCurrentCycleBlock,
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
        onOpenJournalSidebar: () => {
          journal.openForm();
          journal.render();
          const sidebarMount = doc?.getElementById(
            'todayJournalSidebarMount'
          ) as HTMLElement | null;
          openJournalFold(sidebarMount);
          sidebarMount?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        },
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
          if (answer.actionKind === 'start_cycle_block') {
            startCurrentCycleBlock();
            return;
          }
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
        onChangeJournalFilter: journal.changeFilter,
        onChangeJournalForm: journal.changeForm,
        onSaveJournalEntry: journal.saveEntry,
        onDeleteJournalEntry: journal.deleteEntry,
        onCreateReviewFromJournal: journal.createReviewFromEntry,
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
    panel: AssistantPanelKind | 'journal' | 'cycle_config',
    opts: { sessionId?: string; quickMinutes?: number } = {}
  ) {
    if (panel === 'cycle_config') {
      handleOpenPlanningCycle();
      return;
    }
    assistantPanel = panel === 'journal' ? 'none' : panel;
    if (typeof opts.quickMinutes === 'number' && Number.isFinite(opts.quickMinutes)) {
      quickMinutes = Math.max(10, Math.min(180, Math.round(opts.quickMinutes)));
    }
    if (panel === 'journal') {
      assistantPanel = 'none';
      journal.openForm(opts.sessionId);
    }
    _activateTab('hoje');
    const subPanel = doc?.getElementById('todaySub-hoje');
    if (subPanel?.hidden) {
      (doc?.getElementById('todayTab-hoje') as HTMLElement | null)?.click?.();
    }
    renderStudyAssistantBar();
    journal.render();
    const targetMount =
      panel === 'journal'
        ? doc?.getElementById('todayJournalSidebarMount') ||
          doc?.getElementById('todayStudyAssistantMount')
        : doc?.getElementById('todayStudyAssistantMount');
    if (panel === 'journal') openJournalFold(targetMount);
    targetMount?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'center',
    });
  }

  return {
    render: renderStudyAssistantBar,
    open: openAssistantPanel,
  };
}
