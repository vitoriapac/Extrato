import { parseLocalDate } from '../../core/date-utils.js';

export interface CalendarHeatmapDayVisual {
  date: string;
  dayOfWeek: number; // 0..6 (Segunda = 0 .. Domingo = 6)
  weekIndex: number;
  level: number; // 0..4
  value: number;
  selected: boolean;
  tooltip: string;
  summary: Record<string, any>;
}

export interface MonthLabelVisual {
  label: string;
  weekIndex: number;
}

export interface ActivityCalendarHeatmapVisualModel {
  weeksCount: number;
  days: CalendarHeatmapDayVisual[];
  monthLabels: MonthLabelVisual[];
  weekdayLabels: Array<{ row: number; label: string }>;
  maxLevel: number;
  activeDaysCount: number;
  totalDaysCount: number;
}

export interface HoursHeatmapCellVisual {
  weekdayIndex: number; // 0 (Seg) .. 6 (Dom)
  weekdayName: string;
  hour: number; // 0..23
  hourLabel: string;
  minutes: number;
  sessionsCount: number;
  level: number; // 0..4
}

export interface ActivityHoursHeatmapVisualModel {
  rows: Array<{
    weekdayIndex: number;
    weekdayName: string;
    cells: HoursHeatmapCellVisual[];
    totalMinutes: number;
  }>;
  hourLabels: Array<{ hour: number; label: string }>;
  maxMinutes: number;
  peakHour: number | null;
  peakWeekday: string | null;
  totalStudyMinutes: number;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const WEEKDAY_NAMES_PT = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const WEEKDAY_SHORT_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Normaliza dia da semana para Segunda = 0 .. Domingo = 6.
 */
export function getMondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Constrói o modelo de apresentação para o Heatmap de Calendário Contínuo (estilo GitHub / EasyUI).
 * Puramente algorítmico e determinístico.
 */
export function buildActivityCalendarHeatmapVisual({
  cells = [],
  tooltipForSummary = (s: any) => s.date,
  weekStart = 1, // 1 = Segunda-feira (padrão Brasil)
}: {
  cells: Array<Record<string, any>>;
  tooltipForSummary?: (summary: any) => string;
  weekStart?: number;
}): ActivityCalendarHeatmapVisualModel {
  if (!cells || cells.length === 0) {
    return {
      weeksCount: 0,
      days: [],
      monthLabels: [],
      weekdayLabels: [
        { row: 0, label: 'Seg' },
        { row: 2, label: 'Qua' },
        { row: 4, label: 'Sex' },
      ],
      maxLevel: 4,
      activeDaysCount: 0,
      totalDaysCount: 0,
    };
  }

  // Ordena cronologicamente (mais antigo ao mais recente)
  const sortedCells = [...cells].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  // Primeiro dia para calcular o alinhamento de colunas de semanas
  const firstDate = parseLocalDate(sortedCells[0].date);
  const startDayOffset = firstDate
    ? weekStart === 1
      ? getMondayFirstWeekday(firstDate)
      : firstDate.getDay()
    : 0;

  const days: CalendarHeatmapDayVisual[] = [];
  const monthLabels: MonthLabelVisual[] = [];
  let lastLabeledMonth = -1;
  let lastLabeledWeek = -3;
  let activeDaysCount = 0;

  sortedCells.forEach((summary, index) => {
    const dateObj = parseLocalDate(summary.date);
    const dayOfWeek = dateObj
      ? weekStart === 1
        ? getMondayFirstWeekday(dateObj)
        : dateObj.getDay()
      : index % 7;

    const absoluteDayIndex = startDayOffset + index;
    const weekIndex = Math.floor(absoluteDayIndex / 7);

    // Mapeamento e normalização do nível (0..4)
    let level = Number(summary.level) || 0;
    if (summary.level == null) {
      const val = Number(summary.seconds || summary.minutes || summary.questions || 0);
      level = val <= 0 ? 0 : val < 1800 ? 1 : val < 3600 ? 2 : val < 7200 ? 3 : 4;
    }
    level = Math.max(0, Math.min(4, level));

    if (level > 0) activeDaysCount++;

    // Rótulos de meses no topo
    if (dateObj) {
      const month = dateObj.getMonth();
      const isStartOfMonth = dateObj.getDate() <= 7;
      if (month !== lastLabeledMonth && (isStartOfMonth || index === 0)) {
        if (weekIndex - lastLabeledWeek >= 2) {
          monthLabels.push({
            label: MONTH_NAMES[month],
            weekIndex,
          });
          lastLabeledMonth = month;
          lastLabeledWeek = weekIndex;
        }
      }
    }

    days.push({
      date: summary.date,
      dayOfWeek,
      weekIndex,
      level,
      value: Number(summary.seconds || summary.questions || summary.reviews || summary.simulations || 0),
      selected: Boolean(summary.selected),
      tooltip: tooltipForSummary(summary),
      summary,
    });
  });

  const weeksCount = days.length > 0 ? days[days.length - 1].weekIndex + 1 : 0;

  const weekdayLabels = [
    { row: 0, label: 'Seg' },
    { row: 2, label: 'Qua' },
    { row: 4, label: 'Sex' },
  ];

  return {
    weeksCount,
    days,
    monthLabels,
    weekdayLabels,
    maxLevel: 4,
    activeDaysCount,
    totalDaysCount: days.length,
  };
}

/**
 * Constrói a matriz 7 × 24 (dia da semana × hora de início) para o modo 'hours' do Heatmap.
 * Puramente algorítmico e determinístico.
 */
export function buildActivityHoursHeatmapVisual({
  sessions = [],
}: {
  sessions: Array<Record<string, any>>;
}): ActivityHoursHeatmapVisualModel {
  // Inicializa matriz 7 dias x 24 horas
  const matrix: Array<Array<{ minutes: number; count: number }>> = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ minutes: 0, count: 0 }))
  );

  let totalStudyMinutes = 0;
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  const hourTotals = new Array(24).fill(0);

  for (const session of sessions) {
    const rawSeconds = Number(session.durationSeconds ?? session.seconds ?? 0);
    const durationMins = rawSeconds > 0 ? Math.round(rawSeconds / 60) : Number(session.durationMinutes ?? 0);
    if (durationMins <= 0) continue;

    const timeOrDate = session.startedAt || session.timestamp || session.date;
    if (!timeOrDate) continue;

    let hour = 14; // fallback
    let weekday = 0;

    if (typeof timeOrDate === 'number') {
      const d = new Date(timeOrDate);
      hour = d.getHours();
      weekday = getMondayFirstWeekday(d);
    } else if (typeof timeOrDate === 'string') {
      const timeMatch = /T(\d{2}):(\d{2})/.exec(timeOrDate);
      if (timeMatch) {
        hour = Math.max(0, Math.min(23, Number(timeMatch[1])));
      }
      const datePart = timeOrDate.slice(0, 10);
      const d = parseLocalDate(datePart);
      if (d) weekday = getMondayFirstWeekday(d);
    }

    weekday = Math.max(0, Math.min(6, weekday));
    hour = Math.max(0, Math.min(23, hour));

    matrix[weekday][hour].minutes += durationMins;
    matrix[weekday][hour].count++;
    weekdayTotals[weekday] += durationMins;
    hourTotals[hour] += durationMins;
    totalStudyMinutes += durationMins;
  }

  // Determina o máximo de minutos em qualquer bloco para normalização proporcional
  let maxMinutes = 0;
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      if (matrix[w][h].minutes > maxMinutes) maxMinutes = matrix[w][h].minutes;
    }
  }

  // Monta as linhas estruturadas
  const rows = matrix.map((hourCells, weekdayIndex) => {
    const weekdayName = WEEKDAY_SHORT_PT[weekdayIndex];
    const cells: HoursHeatmapCellVisual[] = hourCells.map((cell, hour) => {
      let level = 0;
      if (cell.minutes > 0 && maxMinutes > 0) {
        const ratio = cell.minutes / maxMinutes;
        level = ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
      }
      const hourStr = String(hour).padStart(2, '0');
      return {
        weekdayIndex,
        weekdayName: WEEKDAY_NAMES_PT[weekdayIndex],
        hour,
        hourLabel: `${hourStr}:00`,
        minutes: cell.minutes,
        sessionsCount: cell.count,
        level,
      };
    });

    return {
      weekdayIndex,
      weekdayName,
      cells,
      totalMinutes: weekdayTotals[weekdayIndex],
    };
  });

  // Identifica pico de horário e dia da semana
  let peakHourVal = -1;
  let peakHour: number | null = null;
  hourTotals.forEach((mins, h) => {
    if (mins > peakHourVal && mins > 0) {
      peakHourVal = mins;
      peakHour = h;
    }
  });

  let peakWeekdayVal = -1;
  let peakWeekdayIndex = -1;
  weekdayTotals.forEach((mins, w) => {
    if (mins > peakWeekdayVal && mins > 0) {
      peakWeekdayVal = mins;
      peakWeekdayIndex = w;
    }
  });

  const peakWeekday = peakWeekdayIndex >= 0 ? WEEKDAY_NAMES_PT[peakWeekdayIndex] : null;

  const hourLabels = [
    { hour: 0, label: '00h' },
    { hour: 4, label: '04h' },
    { hour: 8, label: '08h' },
    { hour: 12, label: '12h' },
    { hour: 16, label: '16h' },
    { hour: 20, label: '20h' },
  ];

  return {
    rows,
    hourLabels,
    maxMinutes,
    peakHour,
    peakWeekday,
    totalStudyMinutes,
  };
}
