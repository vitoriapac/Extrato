export function createSettingsRepository({
  getState,
}: { getState?: () => Record<string, any> } = {}) {
  if (typeof getState !== 'function')
    throw new TypeError('Repositório de configurações requer estado.');
  const state = () => getState();
  return Object.freeze({
    getGoals: () => state().metas,
    updateGoal: (key: string, value: any) => {
      state().metas[key] = value;
      return state().metas;
    },
    updateDailyHours: (day: number | string, value: number) => {
      state().metas.horasPorDia[String(day)] = value;
      // A pessoa mexeu na disponibilidade: a capacidade deixa de ser o padrão assumido.
      state().metas.horasInformadas = true;
      return state().metas;
    },
    getSubjectGoals: () => state().metasPorDisciplina,
  });
}
