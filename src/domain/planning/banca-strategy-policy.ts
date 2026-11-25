import { normalizeBanca } from '../questions/bancas.js';
import { PHASE_ACTIVITY_RATIOS } from './phase-strategy-policy.js';
import {
  CANDIDATE_PROFILES,
  normalizeCandidateProfile,
  type CandidateProfileId,
} from '../onboarding/candidate-profile.js';

export interface ActivityRatios {
  theory: number;
  questions: number;
  reviews: number;
}

export interface BancaStrategySuggestion {
  banca: string | null;
  phaseState: string;
  candidateProfile: CandidateProfileId;
  ratios: ActivityRatios;
  focusNote: string;
  recommendedBlocks: readonly string[];
  editable: true;
}

interface BancaProfileSpec {
  ratios: ActivityRatios;
  focusNote: string;
  recommendedBlocks: readonly string[];
}

export const BANCA_STRATEGY_PROFILES: Readonly<Record<string, BancaProfileSpec>> = Object.freeze({
  Cebraspe: Object.freeze({
    ratios: Object.freeze({ theory: 0.3, questions: 0.45, reviews: 0.25 }),
    focusNote:
      'Cebraspe: ênfase em itens Certo/Errado, treino de deixar em branco vs. arriscar e jurisprudência.',
    recommendedBlocks: Object.freeze(['Treino de branco/chute', 'Jurisprudência']),
  }),
  FGV: Object.freeze({
    ratios: Object.freeze({ theory: 0.3, questions: 0.5, reviews: 0.2 }),
    focusNote:
      'FGV: enunciados longos e casos práticos; carga elevada de questões comentadas da banca.',
    recommendedBlocks: Object.freeze(['Questões comentadas FGV']),
  }),
  FCC: Object.freeze({
    ratios: Object.freeze({ theory: 0.35, questions: 0.4, reviews: 0.25 }),
    focusNote:
      'FCC: cobrança recorrente de literalidade normativa; reserve um bloco fixo de Lei Seca.',
    recommendedBlocks: Object.freeze(['Bloco de Lei Seca']),
  }),
  Cesgranrio: Object.freeze({
    ratios: Object.freeze({ theory: 0.35, questions: 0.45, reviews: 0.2 }),
    focusNote:
      'Cesgranrio: cobrança direta do conteúdo programático; equilibre cobertura e baterias da banca.',
    recommendedBlocks: Object.freeze(['Bateria Cesgranrio']),
  }),
  Vunesp: Object.freeze({
    ratios: Object.freeze({ theory: 0.35, questions: 0.45, reviews: 0.2 }),
    focusNote:
      'Vunesp: literalidade de lei e questões objetivas clássicas; combine questões e Lei Seca.',
    recommendedBlocks: Object.freeze(['Bloco de Lei Seca']),
  }),
});

function tupleToRatios(tuple: readonly number[]): ActivityRatios {
  return {
    theory: tuple[0] ?? 0.45,
    questions: tuple[1] ?? 0.4,
    reviews: tuple[2] ?? 0.15,
  };
}

/**
 * Sugere proporções editáveis de Teoria / Questões / Revisões para a prévia do plano,
 * combinando fase da prova, perfil do candidato e perfil da banca examinadora.
 * Em Reta Final e Revisão Final, preserva o piso de prática/revisão (85%+).
 */
export function suggestBancaRatios({
  banca = null,
  phaseState = 'construction',
  candidateProfile = 'iniciante',
}: {
  banca?: string | null;
  phaseState?: string;
  candidateProfile?: unknown;
} = {}): BancaStrategySuggestion {
  const profileId = normalizeCandidateProfile(candidateProfile);
  const normalizedBanca = normalizeBanca(banca);
  const bancaSpec = normalizedBanca ? BANCA_STRATEGY_PROFILES[normalizedBanca] || null : null;

  const baseTuple =
    (PHASE_ACTIVITY_RATIOS as Record<string, readonly number[]>)[phaseState] ||
    PHASE_ACTIVITY_RATIOS.construction;
  let ratios = tupleToRatios(baseTuple);

  if (phaseState === 'construction') {
    ratios = { ...CANDIDATE_PROFILES[profileId].constructionRatios };
  }

  if (bancaSpec && (phaseState === 'construction' || phaseState === 'consolidation' || phaseState === 'undated')) {
    ratios = { ...bancaSpec.ratios };
  }

  return {
    banca: normalizedBanca,
    phaseState,
    candidateProfile: profileId,
    ratios,
    focusNote: bancaSpec
      ? bancaSpec.focusNote
      : 'Proporção padrão da fase atual. Você pode ajustar os percentuais na prévia do plano.',
    recommendedBlocks: bancaSpec ? bancaSpec.recommendedBlocks : Object.freeze([]),
    editable: true,
  };
}

export function normalizeEditableRatios(input: Partial<ActivityRatios>): ActivityRatios {
  const t = Math.max(0, Number(input.theory) || 0);
  const q = Math.max(0, Number(input.questions) || 0);
  const r = Math.max(0, Number(input.reviews) || 0);
  const sum = t + q + r;
  if (sum <= 0) return { theory: 0.45, questions: 0.4, reviews: 0.15 };
  const theory = Number((t / sum).toFixed(2));
  const questions = Number((q / sum).toFixed(2));
  const reviews = Number((1 - theory - questions).toFixed(2));
  return { theory, questions, reviews };
}
