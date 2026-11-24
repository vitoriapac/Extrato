import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { FirstStepsMission } from '../../components/FirstStepsMission.js';
import {
  buildFirstStepsMission,
  type FirstStepsMissionModel,
} from '../../../application/onboarding/build-first-steps-mission.js';
import { buildFinalStretchBanner } from '../../../domain/planning/final-stretch-policy.js';
import { FinalStretchBanner } from '../../components/FinalStretchBanner.js';
import { ExamProtocolCard } from '../../components/ExamProtocolCard.js';
import {
  buildExamProtocol,
  toggleExamProtocolCheck,
} from '../../../domain/planning/exam-protocol.js';
import { examMinutesPerQuestion } from '../../../domain/exams/simulation-score.js';
import { SleepCheckin } from '../../components/SleepCheckin.js';
import { PostExamCard } from '../../components/PostExamCard.js';
import {
  appealTaskDate,
  buildPostExamModel,
  normalizePostExam,
} from '../../../domain/planning/post-exam.js';
import { recordSleep } from '../../../domain/sleep-log.js';
import { RealWeekBanner, type RealWeekBannerProps } from '../../components/RealWeekBanner.js';
import type { TodayTabControllerContext } from './today-tab-controller.js';

/** Faixas de topo da aba Hoje: primeiros passos, reta final e semana real. */
export function createTodayBannersController(ctx: TodayTabControllerContext) {
  const {
    document: doc = typeof document !== 'undefined' ? document : (null as any),
    getState = () => ({}),
    isDemoMode = () => false,
    todayISO = () => new Date().toISOString().slice(0, 10),
    activateTab: _activateTab = () => {},
    whatIfController,
    getRevisoesUnificadas = () => [],
    diasParaRevisao = () => null,
    startOfWeek = (iso: string) => iso,
  } = ctx;

  let demoFirstStepsDismissed = false;

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

  function renderPostExam(slot: HTMLElement): boolean {
    const state = getState();
    const blueprint = state.examBlueprint || {};
    const examDate: string | null = state.examDate || null;
    const model = buildPostExamModel({
      examDate,
      today: todayISO(),
      record: blueprint.postExam || null,
      scoring: blueprint.scoringMode || null,
      cutoff: blueprint.cutoff,
      targetScore: blueprint.targetScore ?? null,
    });
    if (!model) return false;
    const appealTitle = `Prazo de recurso da prova de ${model.examDate.split('-').reverse().join('/')}`;
    const save = (change: Record<string, unknown>) => {
      const latest = getState();
      if (!latest.examBlueprint) return;
      latest.examBlueprint.postExam = normalizePostExam({ ...model.record, ...change });
      ctx.persistAndRender?.();
      renderExamProtocol();
    };
    mountPreact(
      h(PostExamCard, {
        model,
        appealScheduled: (state.calendar || []).some(
          (item: { kind?: string; title?: string }) =>
            item?.kind === 'task' && item.title === appealTitle
        ),
        onSaveAnswers: answers => save(answers),
        onSaveAppeal: deadline => save({ appealDeadline: deadline || null }),
        onScheduleAppeal: () => {
          const latest = getState();
          const deadline = model.record.appealDeadline;
          if (!deadline) return;
          (latest.calendar ||= []).push({
            id: ctx.uid ? ctx.uid('cal') : `cal-${Date.now()}`,
            kind: 'task',
            title: appealTitle,
            date: appealTaskDate(deadline, todayISO()),
            status: 'Não iniciado',
            estimatedMinutes: 60,
            subjectId: null,
            description: `Prazo final: ${deadline.split('-').reverse().join('/')}. Confira o gabarito preliminar e o edital antes de recorrer.`,
            recurrence: 'none',
            reviewType: '—',
          });
          ctx.persistAndRender?.();
          renderExamProtocol();
        },
      }),
      slot
    );
    return true;
  }

  function renderExamProtocol() {
    const slot = doc?.getElementById('examProtocolSlot');
    if (!slot) return;
    const state = getState();
    const blueprint = state.examBlueprint || {};
    const examDate = state.examDate || null;
    const protocol = buildExamProtocol({
      daysToExam: examDate ? diasParaRevisao(examDate) : null,
      examDate,
      checks: blueprint.protocolChecks,
      examMinutesPerQuestion: examMinutesPerQuestion(blueprint),
      netScoring: blueprint.scoringMode === 'certo-errado',
    });
    if (!protocol) {
      // Depois da data da prova, o mesmo lugar mostra o gabarito, o recurso e o próximo concurso.
      if (renderPostExam(slot)) return;
      unmountPreact(slot);
      slot.replaceChildren();
      return;
    }
    mountPreact(
      h(ExamProtocolCard, {
        protocol,
        onToggle: (key: string) => {
          const current = getState();
          if (!current.examBlueprint || !examDate) return;
          current.examBlueprint.protocolChecks = toggleExamProtocolCheck(
            current.examBlueprint.protocolChecks,
            examDate,
            key
          );
          ctx.persistAndRender?.();
        },
      }),
      slot
    );
  }

  function renderSleepCheckin() {
    const mount = doc?.getElementById('sleepCheckinMount');
    if (!mount) return;
    const state = getState();
    const today = todayISO();
    const current = (state.sleepLog || []).find((entry: { date: string }) => entry.date === today);
    mountPreact(
      h(SleepCheckin, {
        quality: current?.quality || null,
        onChoose: quality => {
          const latest = getState();
          latest.sleepLog = recordSleep(latest.sleepLog || [], todayISO(), quality);
          ctx.persistAndRender?.();
          // O render geral pode pular a aba Hoje; o toque precisa refletir na hora.
          renderSleepCheckin();
        },
      }),
      mount
    );
  }

  function renderFinalStretchBanner() {
    // Os avisos diários da semana (protocolo da prova e sono) seguem o mesmo ciclo de render.
    renderExamProtocol();
    renderSleepCheckin();
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
            doc
              .getElementById('weeklyReplan')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  return {
    renderFirstStepsMissionHtml,
    mountFirstStepsMission,
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
  };
}
