export interface IdleTimerGuardianInput {
  elapsedSeconds: number;
  targetMinutes?: number | null;
  hiddenSeconds?: number;
}

export interface IdleTimerGuardianResult {
  anomalous: boolean;
  elapsedMinutes: number;
  suggestedMinutes: number;
  reason: 'exceeded_target' | 'background_idle' | null;
  message: string | null;
}

const MIN_ABSOLUTE_IDLE_MINUTES = 150;
const TARGET_MULTIPLIER = 2.2;
const BACKGROUND_IDLE_MINUTES = 120;

/**
 * Detecta sessões anormalmente longas (cronômetro esquecido aberto ou em segundo plano)
 * para proteger horas líquidas e métricas de fadiga cognitiva.
 */
export function detectAnomalousTimerSession({
  elapsedSeconds,
  targetMinutes = null,
  hiddenSeconds = 0,
}: IdleTimerGuardianInput): IdleTimerGuardianResult {
  const elapsedMinutes = Math.max(0, Math.round((Number(elapsedSeconds) || 0) / 60));
  const hasTarget = targetMinutes != null && Number.isFinite(Number(targetMinutes)) && Number(targetMinutes) > 0;
  const suggestedMinutes = hasTarget ? Math.round(Number(targetMinutes)) : 60;
  const exceededThreshold = Math.max(
    MIN_ABSOLUTE_IDLE_MINUTES,
    Math.round(suggestedMinutes * TARGET_MULTIPLIER)
  );
  const hiddenMinutes = Math.max(0, Math.round((Number(hiddenSeconds) || 0) / 60));

  if (hiddenMinutes >= BACKGROUND_IDLE_MINUTES && elapsedMinutes > suggestedMinutes) {
    return {
      anomalous: true,
      elapsedMinutes,
      suggestedMinutes,
      reason: 'background_idle',
      message: `O cronômetro ficou em segundo plano por ${hiddenMinutes} min. Confirme se estudou os ${elapsedMinutes} min reais ou ajuste para ${suggestedMinutes} min.`,
    };
  }

  if (elapsedMinutes >= exceededThreshold) {
    return {
      anomalous: true,
      elapsedMinutes,
      suggestedMinutes,
      reason: 'exceeded_target',
      message: `Sessão longa (${elapsedMinutes} min para meta de ${suggestedMinutes} min). O cronômetro pode ter ficado ligado sem pausa — ajuste antes de salvar se necessário.`,
    };
  }

  return {
    anomalous: false,
    elapsedMinutes,
    suggestedMinutes,
    reason: null,
    message: null,
  };
}
