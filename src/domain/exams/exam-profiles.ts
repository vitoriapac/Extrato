import profilesData from './exam-profiles-data.json' with { type: 'json' };

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

/** Perfis de prova (notas de corte por concurso), separados do catálogo para não pesar no bundle do app. */
export const EXAM_PROFILES = deepFreeze(structuredClone(profilesData)) as Record<string, any>;
