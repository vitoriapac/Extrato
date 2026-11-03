import { parseLocalDate, formatLocalDate, addLocalDays } from '../../core/date-utils.js';

export interface TodayGoalData {
  percent: number;
  studiedFormatted: string;
  plannedFormatted: string;
  questionsDone: number;
  questionsTarget: number;
  dateLabel: string;
}

export interface ReviewLoadDay {
  dayName: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  dateISO: string;
  count: number;
  heightPct: number;
  isPeak: boolean;
  isToday: boolean;
}

export interface WeeklyReviewLoadData {
  days: ReviewLoadDay[];
  overdueCount: number;
  tip: string;
}

export interface MiniHeatmapDay {
  dateISO: string;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  title: string;
}

export interface ConsistencyMiniHeatmapData {
  days: MiniHeatmapDay[];
  activeDaysCount: number;
  totalDays: number;
}

export interface CockpitSidebarViewModel {
  todayGoal: TodayGoalData;
  reviewLoad: WeeklyReviewLoadData;
  consistency: ConsistencyMiniHeatmapData;
}

function formatMinutesDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h00`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/**
 * Same sources as the Hoje tab: `studySessions` (date, durationSeconds), `questoes` (date, resolved),
 * the weekly question goal and the unified review list. `goalMinutes` and `overdueCount` come from the
 * goals service and the review selector, so both tabs answer the same question with the same number.
 */
export interface CockpitSidebarSources {
  goalMinutes?: number;
  reviews?: Array<Record<string, any>>;
  overdueCount?: number;
}

export function buildCockpitSidebarViewModel(
  state: any,
  explicitToday?: string,
  sources: CockpitSidebarSources = {}
): CockpitSidebarViewModel {
  const safeState = state || {};
  const todayISO = explicitToday || safeState.currentDate || formatLocalDate(new Date());
  const parsedToday = parseLocalDate(todayISO) || new Date();

  // 1. TODAY'S GOAL DATA
  const dayOfMonth = parsedToday.getDate();
  const monthName = MONTH_NAMES[parsedToday.getMonth()] || '';
  const dateLabel = `${dayOfMonth} de ${monthName}`;

  const sessions = Array.isArray(safeState.studySessions) ? safeState.studySessions : [];
  const questoes = Array.isArray(safeState.questoes) ? safeState.questoes : [];
  const minutesOn = (iso: string) =>
    sessions
      .filter((s: any) => s.date === iso)
      .reduce((sum: number, s: any) => sum + (Number(s.durationSeconds) || 0), 0) / 60;
  const questionsOn = (iso: string) =>
    questoes
      .filter((q: any) => q.date === iso)
      .reduce((sum: number, q: any) => sum + (Number(q.resolved) || 0), 0);

  const studiedMinutesToday = minutesOn(todayISO);
  const plannedMinutesToday = Math.max(0, Math.round(Number(sources.goalMinutes) || 0));

  const percent =
    plannedMinutesToday > 0
      ? Math.min(100, Math.round((studiedMinutesToday / plannedMinutesToday) * 100))
      : 0;

  const questionsTargetToday = Math.max(1, Math.round((safeState.metas?.questoesSemanal || 70) / 7));

  const todayGoal: TodayGoalData = {
    percent,
    studiedFormatted: formatMinutesDuration(studiedMinutesToday),
    plannedFormatted: formatMinutesDuration(plannedMinutesToday),
    questionsDone: questionsOn(todayISO),
    questionsTarget: questionsTargetToday,
    dateLabel,
  };

  // 2. WEEKLY REVIEW LOAD DATA (7 days: Monday to Sunday of the week)
  const dayOfWeek = parsedToday.getDay(); // 0 is Sunday, 1 is Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayISO = addLocalDays(todayISO, mondayOffset) || todayISO;

  const dayNames: Array<'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'> = [
    'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom',
  ];

  const revisoes = (Array.isArray(sources.reviews) ? sources.reviews : []).filter(
    (r: any) => r.date && r.status !== 'Concluído'
  );
  const days: ReviewLoadDay[] = [];
  let maxCount = 0;
  let peakDayName = '';

  for (let i = 0; i < 7; i++) {
    const dayDateISO = addLocalDays(mondayISO, i) || todayISO;
    const count = revisoes.filter((r: any) => r.date === dayDateISO).length;

    if (count > maxCount) {
      maxCount = count;
      peakDayName = dayNames[i];
    }

    days.push({
      dayName: dayNames[i],
      dateISO: dayDateISO,
      count,
      heightPct: 0, // will compute below
      isPeak: false,
      isToday: dayDateISO === todayISO,
    });
  }

  days.forEach(d => {
    d.heightPct = maxCount > 0 ? Math.max(15, Math.round((d.count / maxCount) * 100)) : 8;
    if (d.count === maxCount && maxCount >= 3) {
      d.isPeak = true;
    }
  });

  const overdueCount =
    sources.overdueCount ?? revisoes.filter((r: any) => r.date < todayISO).length;

  let tip = 'Carga de revisões bem distribuída para a semana.';
  if (maxCount === 0 && overdueCount === 0) tip = 'Nenhuma revisão agendada para esta semana.';
  if (peakDayName && maxCount >= 3) {
    const fullDayName =
      peakDayName === 'Seg' ? 'Segunda-feira' :
      peakDayName === 'Ter' ? 'Terça-feira' :
      peakDayName === 'Qua' ? 'Quarta-feira' :
      peakDayName === 'Qui' ? 'Quinta-feira' :
      peakDayName === 'Sex' ? 'Sexta-feira' :
      peakDayName === 'Sáb' ? 'Sábado' : 'Domingo';
    tip = `${fullDayName} tem pico de ${maxCount} revisões agendadas.`;
  } else if (overdueCount > 0) {
    tip = `${overdueCount} ${overdueCount === 1 ? 'revisão atrasada' : 'revisões atrasadas'}.`;
  }

  const reviewLoad: WeeklyReviewLoadData = {
    days,
    overdueCount,
    tip,
  };

  // 3. CONSISTENCY MINI-HEATMAP (28 days = 4 weeks ending today)
  const heatmapDays: MiniHeatmapDay[] = [];
  let activeDaysCount = 0;

  for (let i = 27; i >= 0; i--) {
    const dISO = addLocalDays(todayISO, -i) || todayISO;
    const studiedMinutes = Math.round(minutesOn(dISO));
    const questionsDone = questionsOn(dISO);

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (studiedMinutes >= 180) level = 4;
    else if (studiedMinutes >= 120) level = 3;
    else if (studiedMinutes >= 60) level = 2;
    else if (studiedMinutes > 0 || questionsDone > 0) level = 1;

    if (level > 0) activeDaysCount++;

    heatmapDays.push({
      dateISO: dISO,
      level,
      isToday: dISO === todayISO,
      title: `${dISO}: ${formatMinutesDuration(studiedMinutes)}${questionsDone > 0 ? ` · ${questionsDone} questões` : ''}`,
    });
  }

  const consistency: ConsistencyMiniHeatmapData = {
    days: heatmapDays,
    activeDaysCount,
    totalDays: 28,
  };

  return {
    todayGoal,
    reviewLoad,
    consistency,
  };
}
