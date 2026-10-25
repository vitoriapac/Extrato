import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { TodayExecutionSummary } from './TodayExecutionSummary.js';
import { TodayAgendaSections, type TodayAgendaSectionsProps } from './TodayAgendaSections.js';

export interface TodayTabControllerContext {
  formatPlanMinutes: (mins: number) => string;
  formatDatePt: (date: string) => string;
}

export function createTodayTabController(ctx: TodayTabControllerContext) {
  function renderExecutionSummaryHtml(model: {
    availableMinutes: number;
    plannedMinutes: number;
    executedMinutes: number;
    date: string;
    progress: number | null;
  }): string {
    const availableMinutesFormatted = ctx.formatPlanMinutes(model.availableMinutes);
    const plannedMinutesFormatted = ctx.formatPlanMinutes(model.plannedMinutes);
    const executedMinutesFormatted = ctx.formatPlanMinutes(model.executedMinutes);
    const dateFormatted = ctx.formatDatePt(model.date);

    return render(
      h(TodayExecutionSummary, {
        availableMinutesFormatted,
        plannedMinutesFormatted,
        executedMinutesFormatted,
        dateFormatted,
        progressPercent: model.progress,
      })
    );
  }

  function renderAgendaSectionsHtml(props: TodayAgendaSectionsProps): string {
    return render(h(TodayAgendaSections, props));
  }

  return {
    renderExecutionSummaryHtml,
    renderAgendaSectionsHtml,
  };
}
