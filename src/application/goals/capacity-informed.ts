/** Horas por dia que o app assume antes de a pessoa informar a disponibilidade (2,5 h × 7 = 17 h 30). */
export const DEFAULT_DAILY_HOURS = 2.5;

/**
 * A capacidade só conta como informada quando a pessoa a editou (flag gravada no repositório),
 * quando os valores já diferem do padrão ou quando há histórico de uso. Evita mostrar "17 h 30"
 * como se fosse uma escolha.
 */
export function isCapacityInformed(state: Record<string, any> | null | undefined): boolean {
  const metas = state?.metas || {};
  if (metas.horasInformadas === true) return true;
  const hours = Object.values(metas.horasPorDia || {}).map(Number);
  if (hours.some(value => value !== DEFAULT_DAILY_HOURS)) return true;
  return ['studySessions', 'studyPlans', 'dailyPlans'].some(key => (state?.[key] || []).length > 0);
}
