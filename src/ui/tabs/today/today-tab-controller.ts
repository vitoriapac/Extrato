import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { TodayExecutionSummary } from './TodayExecutionSummary.js';
import { TodayAgendaSections, type TodayAgendaSectionsProps } from './TodayAgendaSections.js';
import { FirstStepsMission } from '../../components/FirstStepsMission.js';
import type { FirstStepsMissionModel } from '../../../application/onboarding/build-first-steps-mission.js';

export interface TodayTabControllerContext {
  formatPlanMinutes: (mins: number) => string;
  formatDatePt: (date: string) => string;
  onDismissFirstSteps?: () => void;
  onRestoreFirstSteps?: () => void;
  onStartTour?: () => void;
  onExecuteFirstStepsMission?: (action: string) => void;
}

export function createTodayTabController(ctx: TodayTabControllerContext) {
  function createExecutionSummaryVNode(model: {
    availableMinutes: number;
    plannedMinutes: number;
    executedMinutes: number;
    date: string;
    progress: number | null;
  }) {
    const availableMinutesFormatted = ctx.formatPlanMinutes(model.availableMinutes);
    const plannedMinutesFormatted = ctx.formatPlanMinutes(model.plannedMinutes);
    const executedMinutesFormatted = ctx.formatPlanMinutes(model.executedMinutes);
    const dateFormatted = ctx.formatDatePt(model.date);

    return h(TodayExecutionSummary, {
      availableMinutesFormatted,
      plannedMinutesFormatted,
      executedMinutesFormatted,
      dateFormatted,
      progressPercent: model.progress,
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

  return {
    renderExecutionSummaryHtml,
    mountExecutionSummary,
    renderAgendaSectionsHtml,
    mountAgendaSections,
    renderFirstStepsMissionHtml,
    mountFirstStepsMission,
  };
}
