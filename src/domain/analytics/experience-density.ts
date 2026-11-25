export type ExperienceDensityMode = 'essential' | 'full';

export interface ExperienceDensityInput {
  mode?: ExperienceDensityMode | string | null;
  questionCount?: number;
  daysSinceStart?: number;
}

export interface ExperienceDensityProfile {
  mode: ExperienceDensityMode;
  isEssential: boolean;
  showAdvancedOverviewGrids: boolean;
  showChronobiology: boolean;
  showWhatIfShortcut: boolean;
  label: string;
  description: string;
}

/**
 * Resolve o nível de densidade analítica da interface.
 * Iniciantes (< 30 questões e < 14 dias) ou usuários que escolhem "Modo Essencial"
 * veem apenas o fluxo diário (Hoje, Revisões e Corte), reduzindo a carga cognitiva.
 */
export function resolveExperienceDensity({
  mode = null,
  questionCount = 0,
  daysSinceStart = 0,
}: ExperienceDensityInput = {}): ExperienceDensityProfile {
  let resolved: ExperienceDensityMode;
  if (mode === 'essential' || mode === 'full') {
    resolved = mode;
  } else {
    resolved = questionCount < 30 && daysSinceStart < 14 ? 'essential' : 'full';
  }

  const isEssential = resolved === 'essential';
  return {
    mode: resolved,
    isEssential,
    showAdvancedOverviewGrids: !isEssential,
    showChronobiology: !isEssential,
    showWhatIfShortcut: !isEssential,
    label: isEssential ? 'Modo Essencial' : 'Modo Analítico',
    description: isEssential
      ? 'Foco no que estudar agora, registro rápido, revisões do dia e distância até o corte.'
      : 'Painel completo com matriz pedagógica, cronobiologia, platô e simulador "E se?".',
  };
}
