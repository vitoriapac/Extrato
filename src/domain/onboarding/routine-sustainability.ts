export interface RoutineSustainabilityResult {
  isExcessive: boolean;
  hasRestDay: boolean;
  totalWeeklyHours: number;
  statusTag: 'Sustentável' | 'Carga intensa' | 'Sem descanso' | 'Carga leve';
  feedbackMessage: string;
}

/**
 * Avalia de forma pura e determinística a viabilidade e sustentabilidade da rotina semanal.
 * Alerta preventivamente contra sobrecarga que frequentemente leva ao abandono dos estudos.
 */
export function validateRoutineSustainability({
  hoursByDay = {},
  weeklyHours = 0,
}: {
  hoursByDay?: Record<string, number>;
  weeklyHours?: number;
} = {}): RoutineSustainabilityResult {
  const calculatedWeekly =
    weeklyHours > 0
      ? weeklyHours
      : Object.values(hoursByDay).reduce((acc, h) => acc + Math.max(0, Number(h) || 0), 0);

  const roundedWeekly = Math.round(calculatedWeekly * 10) / 10;
  const daysWithStudy = Object.values(hoursByDay).filter(h => Number(h) > 0).length;
  const hasRestDay = daysWithStudy < 7;

  if (roundedWeekly > 35) {
    return {
      isExcessive: true,
      hasRestDay,
      totalWeeklyHours: roundedWeekly,
      statusTag: 'Carga intensa',
      feedbackMessage:
        'Cuidado com metas muito agressivas no início. Constância vence intensidade: alunos com rotinas de 14h a 25h/semana mantêm o plano por mais meses.',
    };
  }

  if (roundedWeekly >= 15 && !hasRestDay) {
    const allDaysHeavy = Object.values(hoursByDay).every(h => Number(h) >= 3);
    if (allDaysHeavy) {
      return {
        isExcessive: true,
        hasRestDay: false,
        totalWeeklyHours: roundedWeekly,
        statusTag: 'Sem descanso',
        feedbackMessage:
          'Estudar os 7 dias sem pausa eleva o risco de esgotamento. Reservar o domingo para descanso e recuperação mental melhora a retenção da memória.',
      };
    }
  }

  if (roundedWeekly < 5 && roundedWeekly > 0) {
    return {
      isExcessive: false,
      hasRestDay: true,
      totalWeeklyHours: roundedWeekly,
      statusTag: 'Carga leve',
      feedbackMessage:
        'Ritmo inicial tranquilo. Excelente para destravar o hábito antes de subir gradativamente a carga.',
    };
  }

  return {
    isExcessive: false,
    hasRestDay,
    totalWeeklyHours: roundedWeekly,
    statusTag: 'Sustentável',
    feedbackMessage:
      'Ritmo sustentável e equilibrado para conciliar estudos com trabalho e vida pessoal.',
  };
}

/**
 * Zera o domingo e redistribui as horas de forma equilibrada entre segunda e sábado.
 */
export function applySundayRestDay(
  hoursByDay: Record<string, number> = {}
): Record<string, number> {
  const result: Record<string, number> = { ...hoursByDay };
  const sundayHours = Number(result['0']) || 0;
  if (sundayHours <= 0) return result;

  result['0'] = 0;
  // Redistribui as horas do domingo nos dias úteis (1 a 5) em parcelas de 15 min
  const weekdays = ['1', '2', '3', '4', '5'];
  const extraPerDay = Math.round((sundayHours / weekdays.length) * 4) / 4;
  for (const day of weekdays) {
    result[day] = Math.round(((Number(result[day]) || 0) + extraPerDay) * 4) / 4;
  }
  return result;
}
