import { resolveExamPhase } from '../planning/adaptive-planning.js';

export type CandidateProfileId = 'iniciante' | 'intermediario' | 'veterano';

export interface CandidateProfileDefinition {
  id: CandidateProfileId;
  label: string;
  description: string;
  initialPhaseOverride: 'consolidation' | null;
  constructionRatios: { theory: number; questions: number; reviews: number };
}

export const CANDIDATE_PROFILES: Readonly<Record<CandidateProfileId, CandidateProfileDefinition>> =
  Object.freeze({
    iniciante: Object.freeze({
      id: 'iniciante',
      label: 'Iniciante',
      description: 'Primeiro contato com a maior parte do edital; base teórica com questões desde o dia 1 (45/40/15).',
      initialPhaseOverride: null,
      constructionRatios: Object.freeze({ theory: 0.45, questions: 0.4, reviews: 0.15 }),
    }),
    intermediario: Object.freeze({
      id: 'intermediario',
      label: 'Já estudei antes',
      description: 'Já viu parte da base e quer acelerar a prática de questões (35/45/20).',
      initialPhaseOverride: null,
      constructionRatios: Object.freeze({ theory: 0.35, questions: 0.45, reviews: 0.2 }),
    }),
    veterano: Object.freeze({
      id: 'veterano',
      label: 'Veterano no mesmo cargo',
      description: 'Base já formada; pula a Construção e inicia direto em Consolidação (35/40/25).',
      initialPhaseOverride: 'consolidation',
      constructionRatios: Object.freeze({ theory: 0.35, questions: 0.4, reviews: 0.25 }),
    }),
  });

export const CANDIDATE_PROFILE_LIST: readonly CandidateProfileDefinition[] = Object.freeze([
  CANDIDATE_PROFILES.iniciante,
  CANDIDATE_PROFILES.intermediario,
  CANDIDATE_PROFILES.veterano,
]);

export function normalizeCandidateProfile(value: unknown): CandidateProfileId {
  if (value === 'intermediario' || value === 'veterano') return value;
  return 'iniciante';
}

/**
 * Resolve a fase efetiva da preparação considerando o perfil do candidato.
 * Veteranos no mesmo cargo pulam a fase de Construção (>90 dias) e começam em Consolidação.
 */
export function resolveEffectiveExamPhase(
  daysToExam: unknown,
  candidateProfile: unknown = 'iniciante'
) {
  const basePhase = resolveExamPhase(daysToExam);
  const profile = normalizeCandidateProfile(candidateProfile);
  if (profile === 'veterano' && basePhase.state === 'construction') {
    return {
      state: 'consolidation',
      label: 'Consolidação',
      strategy:
        'Perfil veterano: base prévia preservada, começando direto em questões, revisão e lacunas.',
      days: 'days' in basePhase ? basePhase.days : undefined,
      overriddenFrom: 'construction' as const,
    };
  }
  return basePhase;
}
