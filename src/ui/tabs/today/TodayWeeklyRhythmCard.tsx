import { h, type JSX } from 'preact';
import { render } from 'preact-render-to-string';
import { ColumnChart, type ColumnChartColumn } from '../../primitives/charts/charts.js';

export interface WeeklyRhythmDay {
  dayName: string;
  dateISO: string;
  studiedMinutes: number;
  studiedFormatted: string;
  isToday: boolean;
  isPast: boolean;
}

export interface TodayWeeklyRhythmCardProps {
  days: WeeklyRhythmDay[];
  dailyTargetMinutes: number;
  dailyTargetFormatted: string;
  totalWeekMinutes: number;
  totalWeekFormatted: string;
  activeDaysCount: number;
}

export function TodayWeeklyRhythmCard({
  days,
  dailyTargetMinutes,
  dailyTargetFormatted,
  totalWeekFormatted,
  activeDaysCount,
}: TodayWeeklyRhythmCardProps): JSX.Element {
  const columns: ColumnChartColumn[] = days.map((day, idx) => ({
    value: day.studiedMinutes,
    title: `${day.dayName} (${day.isToday ? 'Hoje' : day.dateISO}): ${day.studiedFormatted}`,
    tone: day.isToday ? 'attention' : day.isPast && day.studiedMinutes > 0 ? 'primary' : 'muted',
    separated: idx > 0,
  }));

  const chartSummary = days.map(d => `${d.dayName}: ${d.studiedFormatted}`).join('; ');

  return (
    <section class="chart-card today-rhythm-card" aria-labelledby="todayRhythmHeading">
      <header class="module-heading module-heading--compact mb-2">
        <span class="module-heading__eyebrow">Ritmo semanal</span>
        <h3 class="module-heading__title" id="todayRhythmHeading">Esforço na semana</h3>
      </header>
      <div class="flex items-center justify-between text-xs text-content-secondary mb-3">
        <span>
          <strong class="text-content-primary font-medium">{activeDaysCount} de 7 dias</strong> com estudo
        </span>
        <span class="font-data text-content-secondary font-medium">{totalWeekFormatted} total</span>
      </div>
      <div class="today-rhythm-plot">
        <ColumnChart
          columns={columns}
          label={`Esforço na semana: ${chartSummary}`}
          target={dailyTargetMinutes > 0 ? dailyTargetMinutes : undefined}
          height={48}
        />
        <div class="plan-execution-axis mt-2" aria-hidden="true">
          {days.map(day => (
            <span class={day.isToday ? 'font-semibold text-content-primary' : 'text-content-secondary'}>
              {day.dayName}
            </span>
          ))}
        </div>
      </div>
      {dailyTargetMinutes > 0 && (
        <small class="block mt-2 text-content-secondary text-xs">
          Linha pontilhada: meta diária de {dailyTargetFormatted}
        </small>
      )}
    </section>
  );
}

export function renderTodayWeeklyRhythmHtml(props: TodayWeeklyRhythmCardProps): string {
  return render(h(TodayWeeklyRhythmCard, props));
}
