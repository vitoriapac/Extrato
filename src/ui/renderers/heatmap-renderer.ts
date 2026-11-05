import { renderActivityHeatmap } from '../primitives/charts/charts.js';
import {
  buildActivityCalendarHeatmapVisual,
  buildActivityHoursHeatmapVisual,
} from '../../domain/analytics/activity-heatmap-models.js';

export function renderHeatmap({
  cells = [],
  hasActivity,
  metric = 'hours',
  subjectId = '',
  subjects = [],
  expanded = false,
  onlyActiveDays = false,
  defaultWeeks = 12,
  activityStreak = 0,
  goalStreak = 0,
  selectedDate = null,
  selectedTooltip = '',
  tooltipForSummary = (s: any) => s.date,
  escapeHtml = (s: any) => String(s ?? ''),
  escapeAttr = (s: any) => String(s ?? ''),
  mode = 'calendar',
  sessions = [],
  calendarVisual,
  hoursVisual,
}: any) {
  const subjectOptions = subjects
    .map(
      (subject: any) =>
        `<option value="${escapeAttr(subject.id)}" ${subjectId === subject.id ? 'selected' : ''}>${escapeHtml(subject.name)}</option>`
    )
    .join('');

  const visualCalendar =
    calendarVisual ||
    buildActivityCalendarHeatmapVisual({
      cells,
      tooltipForSummary,
    });

  const visualHours =
    hoursVisual ||
    buildActivityHoursHeatmapVisual({
      sessions,
    });

  const heatmapComponentHtml = renderActivityHeatmap({
    mode,
    calendarVisual: visualCalendar,
    hoursVisual: visualHours,
    metric,
    activityStreak,
    goalStreak,
    selectedDate,
    selectedTooltip,
    hasActivity: hasActivity !== undefined ? hasActivity : cells.some((c: any) => (c.level ?? 0) > 0),
  });

  return `<div class="heatmap-toolbar" aria-label="Período da sequência">
      <select aria-label="Métrica do heatmap" data-delegated-change="setHeatmapFilter('metric',this.value)"><option value="hours" ${metric === 'hours' ? 'selected' : ''}>Horas</option><option value="questions" ${metric === 'questions' ? 'selected' : ''}>Questões</option><option value="reviews" ${metric === 'reviews' ? 'selected' : ''}>Revisões</option><option value="simulations" ${metric === 'simulations' ? 'selected' : ''}>Simulados</option></select>
      <select aria-label="Disciplina do heatmap" data-delegated-change="setHeatmapFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${subjectOptions}</select>
      <span>${expanded ? 'Período completo' : `Últimas ${defaultWeeks} semanas`}</span>
      <button class="btn ghost small" data-delegated-click="toggleStreakExpanded()">${expanded ? 'Mostrar menos' : 'Ver período completo'}</button>
      <button class="btn ghost small" aria-pressed="${onlyActiveDays}" data-delegated-click="toggleStreakActiveDays()">${onlyActiveDays ? 'Mostrar todos os dias' : 'Apenas dias com atividade'}</button>
    </div>
    <div class="mt-3">
      ${heatmapComponentHtml}
    </div>`;
}
