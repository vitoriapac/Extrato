type Row = Record<string, any>;

const FACTOR_LABELS: Record<string, string> = {
  coverage: 'cobertura',
  mastery: 'domínio',
  retention: 'retenção',
  consistency: 'consistência',
  simulations: 'simulados',
};
// Mesmo corte de "Incidência × Domínio": presença em metade das provas e domínio 70.
const PRESENCE_CUT = 50;
const MASTERY_CUT = 70;
const PRIORITY_LIMIT = 4;

/** Só existe com evidência suficiente de simulados; sem ela o cartão simplesmente não aparece. */
function buildTrajectory(calibration: Row | null | undefined) {
  if (!calibration?.available || !(calibration.observations || []).length) return null;
  return {
    observations: (calibration.observations as Row[]).map(item => ({
      date: String(item.date),
      value: Number(item.value),
    })),
    central: Number(calibration.central),
    low: Number(calibration.low),
    high: Number(calibration.high),
    target: Number(calibration.target),
    status: calibration.status as 'below' | 'overlap' | 'above',
    confidenceLabel: String(calibration.confidenceLabel || ''),
  };
}

function buildMatrix(rows: Row[]) {
  const positioned = rows.filter(
    row =>
      row.mastery != null &&
      row.presencePercent != null &&
      ['moderate', 'high'].includes(row.confidence)
  );
  const priority = positioned
    .filter(row => row.presencePercent >= PRESENCE_CUT && row.mastery < MASTERY_CUT)
    .sort((a, b) => b.presencePercent - a.presencePercent || a.mastery - b.mastery)
    .slice(0, PRIORITY_LIMIT);
  const rankOf = new Map(priority.map((row, index) => [row.topicId, index + 1]));
  return {
    total: rows.length,
    positioned: positioned.length,
    priority: priority.map((row, index) => ({
      rank: index + 1,
      topicId: String(row.topicId),
      name: String(row.name),
      subjectName: String(row.subjectName || ''),
      presencePercent: Math.round(row.presencePercent),
      mastery: Math.round(row.mastery),
    })),
    dots: positioned.map(row => ({
      topicId: String(row.topicId),
      presencePercent: Number(row.presencePercent),
      mastery: Number(row.mastery),
      rank: rankOf.get(row.topicId) || 0,
    })),
  };
}

function buildEvidence(readiness: Row | null | undefined) {
  // O resultado do índice traz as listas de fatores; o total é a soma das duas.
  const availableKeys: string[] = readiness?.availableFactors || [],
    missingKeys: string[] = readiness?.missingFactors || [],
    total = availableKeys.length + missingKeys.length;
  if (!total) return null;
  return {
    available: availableKeys.length,
    total,
    missing: missingKeys.map(key => FACTOR_LABELS[key] || key),
  };
}

export function buildOverviewStanding({
  calibration,
  matrixRows = [],
  readiness,
}: {
  calibration?: Row | null;
  matrixRows?: Row[];
  readiness?: Row | null;
} = {}) {
  return {
    trajectory: buildTrajectory(calibration),
    matrix: buildMatrix(matrixRows),
    evidence: buildEvidence(readiness),
  };
}

export type OverviewStanding = ReturnType<typeof buildOverviewStanding>;
