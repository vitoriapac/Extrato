import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { TodayExecutionSummary } from './TodayExecutionSummary.js';
import { TodayAgendaSections, type TodayAgendaSectionsProps } from './TodayAgendaSections.js';

export interface TodayTabControllerContext {
  formatPlanMinutes: (mins: number) => string;
  formatDatePt: (date: string) => string;
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

  return {
    renderExecutionSummaryHtml,
    mountExecutionSummary,
    renderAgendaSectionsHtml,
    mountAgendaSections,
  };
}
