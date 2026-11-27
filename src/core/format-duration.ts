/**
 * Utilitários para formatação de durações e tempos de estudo em pt-BR.
 */

/**
 * Formata duração em segundos no formato único do app:
 * - Menos de 60 segundos: 'X s' (ex: '45 s')
 * - Demais: como formatPlanMinutes ('25 min', '2 h', '1 h 5 min')
 */
export function formatDuration(seconds: number | null | undefined): string {
  const sec = Number(seconds) || 0;
  if (sec > 0 && sec < 60) {
    return Math.max(1, Math.floor(sec)) + ' s';
  }
  return formatPlanMinutes(Math.floor(sec / 60));
}

/**
 * Formato único de duração do app, em minutos:
 * - Menos de 60 minutos: 'X min'
 * - Horas inteiras: 'X h'
 * - Horas e minutos: 'X h Y min'
 */
export function formatPlanMinutes(minutes: number | null | undefined): string {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value < 60) return value + ' min';
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return hours + ' h' + (rest ? ' ' + rest + ' min' : '');
}
