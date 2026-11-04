// One factor is not a balance: an empty account would open at ~45/100.
export const MIN_READINESS_FACTORS = 2;

// Única regra de exibição da Prontidão: abaixo do mínimo de fatores, toda superfície mostra "—".
// Cobertura (0% logo no início) e consistência (basta 1s de estudo) não medem aprendizado:
// sozinhas produziriam uma nota falsamente precisa.
const STRUCTURAL_READINESS_FACTORS = new Set(['coverage', 'consistency']);

export function hasEnoughReadinessEvidence(factorKeys: readonly string[] = []): boolean {
  if (factorKeys.length < MIN_READINESS_FACTORS) return false;
  return factorKeys.some(key => !STRUCTURAL_READINESS_FACTORS.has(key));
}

export function displayReadinessValue(readiness: any): number | null {
  return hasEnoughReadinessEvidence(readiness?.availableFactors || [])
    ? (readiness?.value ?? null)
    : null;
}

export function buildHeaderViewModel({
  readiness = {},
  subjects = [],
  topics = [],
  upcomingReviews = 0,
  streak = 0,
  examDate = null,
  planNumber = '',
  today = null,
  brand = 'Extrato de Estudos',
}: any = {}) {
  const activeTopics = topics.filter((item: any) => !item.archived),
    completed = activeTopics.filter((item: any) => item.status === 'Concluído').length,
    inProgress = activeTopics.filter((item: any) => item.status === 'Em andamento').length,
    availableFactors = readiness.availableFactors?.length || 0,
    totalFactors = availableFactors + (readiness.missingFactors?.length || 0),
    contentPercent = activeTopics.length ? Math.round((completed / activeTopics.length) * 100) : 0,
    daysRemaining =
      examDate && today
        ? Math.max(
            0,
            Math.ceil(
              (Date.parse(examDate + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000
            )
          )
        : null,
    flat = {
      readinessValue: displayReadinessValue(readiness),
      readinessConfidence: readiness.confidenceLabel || 'Baixa',
      availableFactors,
      totalFactors,
      contentPercent,
      subjects: subjects.filter((item: any) => !item.archived).length,
      topics: activeTopics.length,
      completed,
      inProgress,
      upcomingReviews,
      streak,
      examDate,
      planNumber,
    };
  return {
    ...flat,
    brand: { name: brand, kicker: 'Cada estudo soma' },
    readiness: {
      value: flat.readinessValue,
      confidence: flat.readinessConfidence,
      availableFactors,
      totalFactors,
      missingFactors: [...(readiness.missingFactors || [])] as string[],
    },
    exam: { date: examDate, daysRemaining },
    plan: { number: planNumber },
    stats: { subjects: flat.subjects, contentPercent, inProgress, completed, upcomingReviews },
    streak: { days: streak },
  };
}
