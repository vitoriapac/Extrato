/**
 * Análise Cronobiológica de Energia, Foco e Fadiga (src/domain/analytics/focus-energy-analytics.ts)
 *
 * Cruza o registro de sessões de estudo com turnos do dia (manhã, tarde, noite) e níveis
 * subjetivos de energia e foco para identificar horários de pico cognitivo e prevenir esgotamento.
 */

export interface SessionEnergyRecord {
  id?: string;
  date: string;
  timestamp?: number | string | null;
  startedAt?: string | null;
  durationSeconds: number;
  focusLevel?: 'deep' | 'normal' | 'distracted' | (string & {});
  energyLevel?: 'high' | 'normal' | 'low' | (string & {});
  questionsResolved?: number;
  questionsCorrect?: number;
}

export type DayShift = 'morning' | 'afternoon' | 'night';

export interface ShiftPerformanceStats {
  shift: DayShift;
  shiftLabel: string;
  sessionsCount: number;
  totalStudyMinutes: number;
  averageAccuracy: number | null;
  totalQuestions: number;
  deepFocusPercent: number;
  lowEnergyPercent: number;
}

export interface FocusEnergyDiagnostic {
  sampleSize: number;
  isSampleSufficient: boolean;
  peakShift: DayShift | null;
  peakShiftLabel: string | null;
  shifts: Record<DayShift, ShiftPerformanceStats>;
  fatigueAlert: string | null;
  recommendations: string[];
}

const MINIMUM_RATED_SESSIONS_SAMPLE = 5;

/**
 * Determina o turno do dia a partir de um timestamp ISO ou hora local.
 */
export function resolveDayShift(dateOrTimestamp?: number | string | null): DayShift {
  if (!dateOrTimestamp) return 'morning';

  let hour: number;
  if (typeof dateOrTimestamp === 'number') {
    hour = new Date(dateOrTimestamp).getHours();
  } else if (typeof dateOrTimestamp === 'string') {
    const timeMatch = /T(\d{2}):(\d{2})/.exec(dateOrTimestamp);
    if (timeMatch) {
      hour = Number(timeMatch[1]);
    } else {
      // Data pura (ex: "2026-10-01"): fallback neutro para manhã
      return 'morning';
    }
  } else {
    return 'morning';
  }

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

const SHIFT_LABELS: Record<DayShift, string> = {
  morning: 'Manhã (05h - 12h)',
  afternoon: 'Tarde (12h - 18h)',
  night: 'Noite (18h - 05h)',
};

/**
 * Analisa as correlações cronobiológicas de foco, energia e rendimento.
 */
export function analyzeFocusAndEnergy(sessions: SessionEnergyRecord[] = []): FocusEnergyDiagnostic {
  const ratedSessions = sessions.filter(
    s =>
      s.durationSeconds > 0 &&
      (s.focusLevel != null || s.energyLevel != null || s.questionsResolved)
  );

  const sampleSize = ratedSessions.length;
  const isSampleSufficient = sampleSize >= MINIMUM_RATED_SESSIONS_SAMPLE;

  const initialStats = (): Record<DayShift, ShiftPerformanceStats> => ({
    morning: {
      shift: 'morning',
      shiftLabel: SHIFT_LABELS.morning,
      sessionsCount: 0,
      totalStudyMinutes: 0,
      averageAccuracy: null,
      totalQuestions: 0,
      deepFocusPercent: 0,
      lowEnergyPercent: 0,
    },
    afternoon: {
      shift: 'afternoon',
      shiftLabel: SHIFT_LABELS.afternoon,
      sessionsCount: 0,
      totalStudyMinutes: 0,
      averageAccuracy: null,
      totalQuestions: 0,
      deepFocusPercent: 0,
      lowEnergyPercent: 0,
    },
    night: {
      shift: 'night',
      shiftLabel: SHIFT_LABELS.night,
      sessionsCount: 0,
      totalStudyMinutes: 0,
      averageAccuracy: null,
      totalQuestions: 0,
      deepFocusPercent: 0,
      lowEnergyPercent: 0,
    },
  });

  const shifts = initialStats();
  const shiftQuestions: Record<DayShift, { resolved: number; correct: number }> = {
    morning: { resolved: 0, correct: 0 },
    afternoon: { resolved: 0, correct: 0 },
    night: { resolved: 0, correct: 0 },
  };
  const shiftFocusCounts: Record<DayShift, { deep: number; total: number; lowEnergy: number }> = {
    morning: { deep: 0, total: 0, lowEnergy: 0 },
    afternoon: { deep: 0, total: 0, lowEnergy: 0 },
    night: { deep: 0, total: 0, lowEnergy: 0 },
  };

  for (const session of ratedSessions) {
    const shift = resolveDayShift(session.startedAt || session.timestamp);
    const durationMins = Math.round(session.durationSeconds / 60);

    shifts[shift].sessionsCount++;
    shifts[shift].totalStudyMinutes += durationMins;

    if (session.questionsResolved && session.questionsResolved > 0) {
      shiftQuestions[shift].resolved += session.questionsResolved;
      shiftQuestions[shift].correct += session.questionsCorrect ?? 0;
    }

    if (session.focusLevel != null || session.energyLevel != null) {
      shiftFocusCounts[shift].total++;
      if (session.focusLevel === 'deep') shiftFocusCounts[shift].deep++;
      if (session.energyLevel === 'low') shiftFocusCounts[shift].lowEnergy++;
    }
  }

  // Consolida as métricas derivadas por turno
  for (const key of ['morning', 'afternoon', 'night'] as DayShift[]) {
    const q = shiftQuestions[key];
    if (q.resolved > 0) {
      shifts[key].totalQuestions = q.resolved;
      shifts[key].averageAccuracy = Math.round((q.correct / q.resolved) * 100);
    }
    const f = shiftFocusCounts[key];
    if (f.total > 0) {
      shifts[key].deepFocusPercent = Math.round((f.deep / f.total) * 100);
      shifts[key].lowEnergyPercent = Math.round((f.lowEnergy / f.total) * 100);
    }
  }

  if (!isSampleSufficient) {
    return {
      sampleSize,
      isSampleSufficient: false,
      peakShift: null,
      peakShiftLabel: null,
      shifts,
      fatigueAlert: null,
      recommendations: [
        `Amostra atual (${sampleSize} sessões) ainda insuficiente. Registre foco e energia no encerramento de mais ${MINIMUM_RATED_SESSIONS_SAMPLE - sampleSize} sessões para gerar diagnósticos cronobiológicos.`,
      ],
    };
  }

  // Identifica o turno de pico cognitivo (maior acerto com volume ou maior foco profundo)
  const activeShifts = (['morning', 'afternoon', 'night'] as DayShift[]).filter(
    k => shifts[k].sessionsCount > 0
  );

  let peakShift: DayShift | null = null;
  let highestAccuracy = -1;

  for (const s of activeShifts) {
    const acc = shifts[s].averageAccuracy;
    if (acc !== null && acc > highestAccuracy) {
      highestAccuracy = acc;
      peakShift = s;
    }
  }

  if (peakShift === null && activeShifts.length > 0) {
    // Se não houver questões resolvidas, usa o foco profundo como critério
    peakShift = activeShifts.reduce((best, cur) =>
      shifts[cur].deepFocusPercent > shifts[best].deepFocusPercent ? cur : best
    );
  }

  const recommendations: string[] = [];
  let fatigueAlert: string | null = null;

  if (peakShift) {
    const accLabel = highestAccuracy >= 0 ? ` com ${highestAccuracy}% de acerto médio` : '';
    recommendations.push(
      `Seu melhor rendimento cognitivo ocorre no turno da ${SHIFT_LABELS[peakShift].split(' ')[0].toLowerCase()}${accLabel}. Priorize conteúdos densos e novas teorias nesse horário.`
    );
  }

  // Detecção de Fadiga Cognitiva:
  // Se o turno da noite tem acerto significativamente menor (>= 20 p.p. abaixo do pico) ou alta taxa de baixa energia
  const night = shifts.night;
  if (night.sessionsCount >= 2 && peakShift && peakShift !== 'night') {
    const peakAcc = shifts[peakShift].averageAccuracy ?? 0;
    const nightAcc = night.averageAccuracy;

    if (nightAcc !== null && peakAcc - nightAcc >= 20) {
      fatigueAlert = `Queda de ${peakAcc - nightAcc} p.p. no acerto em questões durante a noite em relação ao seu horário de pico.`;
      recommendations.push(
        'Evite baterias extensas de questões ou novos tópicos complexos no turno da noite. Concentre esse período em revisões ativas leves ou leitura de lei seca.'
      );
    } else if (night.lowEnergyPercent >= 50) {
      fatigueAlert = 'Mais de 50% das sessões noturnas foram registradas com cansaço mental.';
      recommendations.push(
        'Sinais de esgotamento noturno: considere reduzir a duração dos blocos à noite para 30-40 minutos ou priorizar o descanso reparador.'
      );
    }
  }

  return {
    sampleSize,
    isSampleSufficient: true,
    peakShift,
    peakShiftLabel: peakShift ? SHIFT_LABELS[peakShift] : null,
    shifts,
    fatigueAlert,
    recommendations,
  };
}
