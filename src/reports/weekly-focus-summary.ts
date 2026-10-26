import { addLocalDays } from '../core/date-utils.js';
import { buildWeeklyStrategicFocus } from '../application/analytics/build-weekly-strategic-focus.js';

export function buildReportWeeklyFocus({
  sessions = [],
  candidates = [],
  dailyPlans = [],
  recommendations = [],
  end,
}: any = {}) {
  const start = addLocalDays(end, -6);
  const weeklySessions = sessions.filter((item: any) => item.date >= start && item.date <= end);
  const focus = buildWeeklyStrategicFocus({
    sessions: weeklySessions,
    candidates,
    recommendations,
    start,
    end,
  });
  const plannedMinutes = dailyPlans
    .filter((item: any) => item.date >= start && item.date <= end)
    .flatMap((item: any) => item.items || [])
    .reduce((sum: any, item: any) => sum + Math.max(0, Number(item.plannedMinutes) || 0), 0);
  const executedMinutes = focus.totalMinutes;
  return {
    period: { start, end },
    plannedMinutes,
    executedMinutes,
    executionRate: plannedMinutes ? Math.round((executedMinutes / plannedMinutes) * 100) : null,
    focus,
  };
}
