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
  weeks = 52,
  onlyActiveDays = false,
  activityStreak = 0,
  goalStreak = 0,
  selectedDate = null,
  selectedTooltip = '',
  tooltipForSummary = (s: any) => s.date,
  mode = 'calendar',
  sessions = [],
  calendarVisual,
  hoursVisual,
}: any) {
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

  return renderActivityHeatmap({
    mode,
    calendarVisual: visualCalendar,
    hoursVisual: visualHours,
    metric,
    activityStreak,
    goalStreak,
    selectedDate,
    selectedTooltip,
    hasActivity: hasActivity !== undefined ? hasActivity : cells.some((c: any) => (c.level ?? 0) > 0),
    controls: { subjects, subjectId, weeks, onlyActiveDays },
  });
}
