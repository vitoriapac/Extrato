/**
 * @fileoverview Constrói o view-model do Grid Analítico 1: Balanço de Alocação de Tempo vs. Peso no Edital.
 * Identifica desalinhamento entre onde o concurseiro gasta suas horas e a relevância real na prova.
 */

export interface AllocationBalanceRow {
  subjectId: string;
  subjectName: string;
  hoursSpent: number; // Horas nos últimos 30 dias
  timePercent: number; // % do tempo total
  examWeightPercent: number; // % do edital
  difference: number; // timePercent - examWeightPercent
  status: 'suballocated' | 'balanced' | 'overallocated';
  statusLabel: string;
  statusVariant: 'warning' | 'success' | 'info';
  recommendation: string;
}

export interface AllocationBalanceViewModel {
  rows: AllocationBalanceRow[];
  totalHours: number;
  hasBlueprint: boolean;
  suballocatedCount: number;
  overallocatedCount: number;
  balancedCount: number;
  summary: string;
}

export interface BuildAllocationBalanceParams {
  subjects?: Array<{
    id: string;
    name: string;
    archived?: boolean;
    examWeightPercent?: number;
    weight?: number;
  }>;
  sessions?: Array<{
    subjectId?: string;
    subject?: string;
    durationSeconds?: number;
    date?: string;
  }>;
  blueprint?: {
    subjects?: Array<{
      subjectId: string;
      examWeightPercent?: number;
      weight?: number;
    }>;
  };
  today?: string;
  addDays?: (dateStr: string, days: number) => string;
}

const defaultAddDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};

export function buildAllocationBalanceViewModel({
  subjects = [],
  sessions = [],
  blueprint = {},
  today = new Date().toISOString().slice(0, 10),
  addDays = defaultAddDays,
}: BuildAllocationBalanceParams = {}): AllocationBalanceViewModel {
  const activeSubjects = subjects.filter(s => !s.archived);
  if (!activeSubjects.length) {
    return {
      rows: [],
      totalHours: 0,
      hasBlueprint: false,
      suballocatedCount: 0,
      overallocatedCount: 0,
      balancedCount: 0,
      summary: 'Nenhuma disciplina ativa encontrada.',
    };
  }

  const startDate = addDays(today, -29);
  const recentSessions = sessions.filter(s => s.date && s.date >= startDate && s.date <= today);

  // Mapear segundos por disciplina
  const secondsBySubjectId: Record<string, number> = {};
  for (const session of recentSessions) {
    const dur = Number(session.durationSeconds) || 0;
    if (dur <= 0) continue;

    let subId = session.subjectId;
    if (!subId && session.subject) {
      const match = activeSubjects.find(s => s.name.toLowerCase() === session.subject?.toLowerCase());
      if (match) subId = match.id;
    }
    if (subId) {
      secondsBySubjectId[subId] = (secondsBySubjectId[subId] || 0) + dur;
    }
  }

  const totalSeconds = Object.values(secondsBySubjectId).reduce((sum, s) => sum + s, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  // Extrair pesos do blueprint ou das disciplinas
  const bpSubjects = blueprint.subjects || [];
  const hasExplicitWeights =
    bpSubjects.some(b => Number(b.examWeightPercent ?? b.weight) > 0) ||
    activeSubjects.some(s => Number(s.examWeightPercent ?? s.weight) > 0);

  // Obter peso bruto para cada matéria
  const rawWeights: Record<string, number> = {};
  let totalRawWeight = 0;

  for (const s of activeSubjects) {
    const bpConfig = bpSubjects.find(b => b.subjectId === s.id);
    const weightVal = Number(bpConfig?.examWeightPercent ?? bpConfig?.weight ?? s.examWeightPercent ?? s.weight ?? 0);
    rawWeights[s.id] = weightVal;
    totalRawWeight += weightVal;
  }

  const rows: AllocationBalanceRow[] = activeSubjects.map(s => {
    const seconds = secondsBySubjectId[s.id] || 0;
    const hoursSpent = Math.round((seconds / 3600) * 10) / 10;
    const timePercent = totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 1000) / 10 : 0;

    let examWeightPercent = 0;
    if (totalRawWeight > 0) {
      examWeightPercent = Math.round(((rawWeights[s.id] || 0) / totalRawWeight) * 1000) / 10;
    } else {
      // Proporcional uniforme se não especificado
      examWeightPercent = Math.round((100 / activeSubjects.length) * 10) / 10;
    }

    const difference = Math.round((timePercent - examWeightPercent) * 10) / 10;

    let status: AllocationBalanceRow['status'] = 'balanced';
    let statusLabel = 'Equilibrada';
    let statusVariant: AllocationBalanceRow['statusVariant'] = 'success';
    let recommendation = 'Dedicação compatível com a proporção no concurso.';

    if (hasExplicitWeights && difference <= -5) {
      status = 'suballocated';
      statusLabel = 'Subalocada';
      statusVariant = 'warning';
      recommendation = `Dedicação (${timePercent}%) abaixo do peso no edital (${examWeightPercent}%). Recomenda-se aumentar horas.`;
    } else if (hasExplicitWeights && difference >= 10) {
      status = 'overallocated';
      statusLabel = 'Superalocada';
      statusVariant = 'info';
      recommendation = `Dedicação (${timePercent}%) bem acima do peso (${examWeightPercent}%). Risco de custo de oportunidade.`;
    }

    return {
      subjectId: s.id,
      subjectName: s.name,
      hoursSpent,
      timePercent,
      examWeightPercent,
      difference,
      status,
      statusLabel,
      statusVariant,
      recommendation,
    };
  });

  // Ordenar: subalocadas primeiro (pelo maior déficit), depois superalocadas, depois equilibradas
  const statusPriority: Record<AllocationBalanceRow['status'], number> = {
    suballocated: 1,
    overallocated: 2,
    balanced: 3,
  };

  rows.sort((a, b) => {
    const pDiff = statusPriority[a.status] - statusPriority[b.status];
    if (pDiff !== 0) return pDiff;
    return a.difference - b.difference;
  });

  const suballocatedCount = rows.filter(r => r.status === 'suballocated').length;
  const overallocatedCount = rows.filter(r => r.status === 'overallocated').length;
  const balancedCount = rows.filter(r => r.status === 'balanced').length;

  let summary = 'Distribuição de estudo em conformidade com o edital.';
  if (suballocatedCount > 0) {
    summary = `${suballocatedCount} ${suballocatedCount === 1 ? 'disciplina importante subalocada' : 'disciplinas importantes subalocadas'} em relação ao peso da prova.`;
  } else if (!hasExplicitWeights) {
    summary = 'Pesos do edital não configurados explicitamente (distribuição uniforme considerada).';
  }

  return {
    rows,
    totalHours,
    hasBlueprint: hasExplicitWeights,
    suballocatedCount,
    overallocatedCount,
    balancedCount,
    summary,
  };
}
