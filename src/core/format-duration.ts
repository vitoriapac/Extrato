/**
 * Utilitários para formatação de durações e tempos de estudo em pt-BR.
 */

/**
 * Formata duração em segundos para string legível:
 * - Menos de 60 segundos: 'X s' (ex: '45 s')
 * - Menos de 1 hora: 'Xmin' (ex: '25min')
 * - Horas inteiras: 'Xh' (ex: '2h')
 * - Horas e minutos: 'XhYY' (ex: '1h05')
 */
export function formatDuration(seconds: number | null | undefined): string {
  const sec = Number(seconds) || 0;
  if (sec > 0 && sec < 60) {
    return Math.max(1, Math.floor(sec)) + ' s';
  }
  const minutes = Math.floor(sec / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}min`;
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`;
}

/**
 * Formata minutos de planejamento diário/semanal:
 * - Menos de 60 minutos: 'Xmin'
 * - Horas inteiras: 'Xh'
 * - Horas e minutos: 'XhYY'
 */
export function formatPlanMinutes(minutes: number | null | undefined): string {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value < 60) return value + 'min';
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return hours + 'h' + (rest ? String(rest).padStart(2, '0') : '');
}
