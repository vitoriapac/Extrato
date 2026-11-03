/**
 * @fileoverview Constrói o view-model da Análise Cronobiológica de Energia, Foco e Turno.
 * Identifica correlações entre horário de estudo (manhã, tarde, noite) e rendimento cognitivo.
 */

import {
  analyzeFocusAndEnergy,
  type DayShift,
  type SessionEnergyRecord,
  type ShiftPerformanceStats,
} from '../../domain/analytics/focus-energy-analytics.js';

export interface ShiftCardItem {
  shift: DayShift;
  shiftLabel: string;
  hoursSpent: number; // Horas com 1 casa decimal
  timePercent: number; // % do tempo total
  sessionsCount: number;
  averageAccuracy: number | null;
  deepFocusPercent: number;
  lowEnergyPercent: number;
  isPeak: boolean;
}

export interface ShiftEnergyViewModel {
  shifts: ShiftCardItem[];
  peakShift: DayShift | null;
  peakShiftLabel: string | null;
  totalStudyHours: number;
  sampleSize: number;
  isSampleSufficient: boolean;
  fatigueAlert: string | null;
  recommendations: string[];
  summary: string;
}

export interface BuildShiftEnergyParams {
  sessions?: Array<{
    id?: string;
    date?: string;
    timestamp?: number | string | null;
    startedAt?: number | string | null;
    durationSeconds?: number;
    focusLevel?: 'deep' | 'normal' | 'distracted' | string;
    energyLevel?: 'high' | 'normal' | 'low' | string;
    questionsResolved?: number;
    questionsCorrect?: number;
  }>;
}

export function buildShiftEnergyViewModel({
  sessions = [],
}: BuildShiftEnergyParams = {}): ShiftEnergyViewModel {
  const energyRecords: SessionEnergyRecord[] = sessions.map(s => ({
    id: s.id,
    date: s.date,
    timestamp: s.timestamp ?? s.startedAt,
    startedAt: s.startedAt,
    durationSeconds: Number(s.durationSeconds) || 0,
    focusLevel: s.focusLevel as any,
    energyLevel: s.energyLevel as any,
    questionsResolved: s.questionsResolved,
    questionsCorrect: s.questionsCorrect,
  }));

  const diagnostic = analyzeFocusAndEnergy(energyRecords);

  const totalSeconds = energyRecords.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalStudyHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const order: DayShift[] = ['morning', 'afternoon', 'night'];

  const shiftCards: ShiftCardItem[] = order.map(shiftKey => {
    const stat: ShiftPerformanceStats = diagnostic.shifts[shiftKey];
    const minutes = stat.totalStudyMinutes || 0;
    const hoursSpent = Math.round((minutes / 60) * 10) / 10;
    const timePercent =
      totalStudyHours > 0 ? Math.min(100, Math.round(((minutes * 60) / totalSeconds) * 100)) : 0;

    return {
      shift: shiftKey,
      shiftLabel: stat.shiftLabel,
      hoursSpent,
      timePercent,
      sessionsCount: stat.sessionsCount,
      averageAccuracy: stat.averageAccuracy,
      deepFocusPercent: stat.deepFocusPercent,
      lowEnergyPercent: stat.lowEnergyPercent,
      isPeak: diagnostic.peakShift === shiftKey,
    };
  });

  let summary = 'Amostra ainda em consolidação para traçar seu perfil de pico cognitivo.';
  if (diagnostic.isSampleSufficient && diagnostic.peakShiftLabel) {
    summary = `Seu melhor rendimento cognitivo ocorre no turno da ${diagnostic.peakShiftLabel}.`;
  }

  return {
    shifts: shiftCards,
    peakShift: diagnostic.peakShift,
    peakShiftLabel: diagnostic.peakShiftLabel,
    totalStudyHours,
    sampleSize: diagnostic.sampleSize,
    isSampleSufficient: diagnostic.isSampleSufficient,
    fatigueAlert: diagnostic.fatigueAlert,
    recommendations: diagnostic.recommendations || [],
    summary,
  };
}
