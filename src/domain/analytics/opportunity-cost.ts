/**
 * @fileoverview Custo de Oportunidade do Estudo.
 * Calcula o retorno marginal de pontos por hora investida (PPH),
 * orientando o concurseiro a priorizar disciplinas de alto peso
 * com grandes lacunas recuperáveis antes do teto de 85% de domínio.
 */

export interface SubjectOpportunityInput {
  subjectId: string;
  subjectName: string;
  examWeightPercent: number; // Peso da disciplina no edital (ex: 15 ou 20 para 15% ou 20%)
  currentMastery: number; // Domínio atual de 0 a 100
  estimatedEffortHours?: number; // Horas estimadas para fechar a lacuna
  remainingHours?: number; // Carga horária restante/planejada
}

export type OpportunityTier = 'top_priority' | 'secondary' | 'marginal';

export interface OpportunityMetric {
  subjectId: string;
  subjectName: string;
  examWeightPercent: number;
  currentMastery: number;
  potentialScoreGain: number; // Pontos líquidos recuperáveis na nota final
  estimatedEffortHours: number; // Horas estimadas para fechar lacuna
  pointsPerHourRatio: number; // PPH = potentialScoreGain / estimatedEffortHours
  tier: OpportunityTier;
  rationale: string;
}

const MASTERY_CEILING = 85;

/**
 * Normaliza o peso da prova para a escala 0 a 100 (se vier fracionário <= 1, multiplica por 100).
 */
function normalizeWeightPercent(weight: number): number {
  if (weight <= 0) return 0;
  if (weight <= 1) return weight * 100;
  return Math.min(100, weight);
}

/**
 * Calcula o custo de oportunidade para uma disciplina individual.
 */
export function calculateSubjectOpportunity(input: SubjectOpportunityInput): OpportunityMetric {
  const normalizedWeight = normalizeWeightPercent(Number(input.examWeightPercent) || 0);
  const mastery = Math.max(0, Math.min(100, Number(input.currentMastery) || 0));

  // Lacuna até o teto de 85% de domínio
  const gap = Math.max(0, MASTERY_CEILING - mastery);

  // Pontos líquidos recuperáveis no exame: Peso (%) * Gap (%) / 100
  const potentialScoreGain =
    Math.round(((normalizedWeight * gap) / 100) * 100) / 100;

  // Horas de esforço estimadas:
  // Se informado explicitamente, usa o valor.
  // Se remainingHours informado, usa max(1, remainingHours).
  // Caso contrário, estima com base pedagógica: ~3 horas para cada 5 pontos percentuais de gap (mínimo 1h).
  let effortHours: number;
  if (input.estimatedEffortHours != null && Number(input.estimatedEffortHours) > 0) {
    effortHours = Math.max(1, Math.round(Number(input.estimatedEffortHours) * 10) / 10);
  } else if (input.remainingHours != null && Number(input.remainingHours) > 0) {
    effortHours = Math.max(1, Math.round(Number(input.remainingHours) * 10) / 10);
  } else {
    effortHours = gap > 0 ? Math.max(1, Math.round((gap / 5) * 3)) : 1;
  }

  // PPH = potentialScoreGain / estimatedEffortHours
  const pointsPerHourRatio =
    effortHours > 0 ? Math.round((potentialScoreGain / effortHours) * 1000) / 1000 : 0;

  // Classificação inicial de Tier
  let tier: OpportunityTier = 'secondary';
  let rationale = '';

  if (gap === 0 || potentialScoreGain <= 0.2) {
    tier = 'marginal';
    rationale =
      mastery >= MASTERY_CEILING
        ? `Domínio consolidado (${Math.round(mastery)}% >= 85%). Retorno marginal por hora adicional é decrescente.`
        : 'Baixo peso relativo no concurso com retorno marginal insignificante.';
  } else if (pointsPerHourRatio >= 0.35) {
    tier = 'top_priority';
    rationale = `Alto retorno pedagógico: potencial de recuperar +${potentialScoreGain.toFixed(1)} pontos com ${effortHours}h de estudo focado (${pointsPerHourRatio.toFixed(2)} pts/h).`;
  } else if (pointsPerHourRatio < 0.12) {
    tier = 'marginal';
    rationale = `Retorno marginal baixo (${pointsPerHourRatio.toFixed(2)} pts/h) devido ao peso modesto ou esforço elevado.`;
  } else {
    tier = 'secondary';
    rationale = `Retorno intermediário (+${potentialScoreGain.toFixed(1)} pontos recuperáveis). Alinhar com o cronograma regular.`;
  }

  return {
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    examWeightPercent: Math.round(normalizedWeight * 10) / 10,
    currentMastery: Math.round(mastery * 10) / 10,
    potentialScoreGain,
    estimatedEffortHours: effortHours,
    pointsPerHourRatio,
    tier,
    rationale,
  };
}

/**
 * Calcula e classifica o custo de oportunidade para um conjunto de disciplinas,
 * ordenando da maior eficiência (PPH) para a menor e calibrando os tiers relativos.
 */
export function calculateOpportunityCostMatrix(
  inputs: SubjectOpportunityInput[]
): OpportunityMetric[] {
  if (!inputs || inputs.length === 0) return [];

  const metrics = inputs.map(calculateSubjectOpportunity);

  // Ordena por PPH decrescente (e desempate por potentialScoreGain)
  metrics.sort((a, b) => b.pointsPerHourRatio - a.pointsPerHourRatio || b.potentialScoreGain - a.potentialScoreGain);

  // Se houver pelo menos 3 disciplinas com ganho potencial > 0, garante que o top 25-33% seja top_priority
  const activeOpportunities = metrics.filter(m => m.potentialScoreGain > 0.5);

  if (activeOpportunities.length >= 3) {
    const topCount = Math.max(1, Math.ceil(activeOpportunities.length * 0.34));
    activeOpportunities.forEach((item, index) => {
      if (index < topCount && item.pointsPerHourRatio > 0.15) {
        item.tier = 'top_priority';
      }
    });
  }

  return metrics;
}

/**
 * Filtra as principais oportunidades de estudo para exibição em cards de destaque.
 */
export function getTopStudyOpportunities(
  metrics: OpportunityMetric[],
  limit: number = 3
): OpportunityMetric[] {
  return metrics
    .filter(m => m.tier === 'top_priority')
    .slice(0, limit);
}

/**
 * Converte disciplinas e métricas de exame do estado na matriz de custo de oportunidade.
 */
export function computeStateOpportunityCosts(
  subjects: Array<{
    id: string;
    name: string;
    examWeightPercent?: number;
    questionWeight?: number;
    mastery?: number;
    remainingHours?: number;
    estimatedEffortHours?: number;
  }>,
  subjectMasteryMap?: Map<string, number>
): OpportunityMetric[] {
  if (!subjects || subjects.length === 0) return [];

  const inputs: SubjectOpportunityInput[] = subjects.map(s => {
    const mastery =
      subjectMasteryMap?.get(s.id) ??
      (s.mastery != null ? Number(s.mastery) : 50);

    const weight =
      s.examWeightPercent ??
      (s.questionWeight != null ? Number(s.questionWeight) * 10 : 10);

    return {
      subjectId: s.id,
      subjectName: s.name,
      examWeightPercent: weight,
      currentMastery: mastery,
      remainingHours: s.remainingHours,
      estimatedEffortHours: s.estimatedEffortHours,
    };
  });

  return calculateOpportunityCostMatrix(inputs);
}
