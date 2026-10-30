/**
 * @fileoverview Diagnóstico Pós-Simulado e Plano de Remediação.
 * Analisa a performance de um simulado recém-realizado, comparando com ponto de corte
 * e média histórica, identifica os 3 tópicos de maior sangria de pontos, gera plano de
 * 7 dias realocando 60% da carga para fechar lacunas e pré-popula rascunhos para o Caderno de Erros.
 */

export interface SimulationSubjectBreakdown {
  id: string;
  subjectId: string | null;
  topicId?: string | null;
  subjectName?: string;
  topicName?: string;
  correct: number;
  total: number;
}

export interface SimulationTargetInput {
  id: string;
  nome?: string;
  name?: string;
  date?: string;
  correct: number;
  total: number;
  breakdown?: SimulationSubjectBreakdown[];
}

export interface SimulatedRemediationInput {
  simulation: SimulationTargetInput;
  historicalSimulations?: Array<{
    id: string;
    date?: string;
    correct: number;
    total: number;
  }>;
  historicalAverageScore?: number | null;
  passingScorePercent?: number | null; // Ponto de corte do edital (ex: 70 ou 75%)
  weeklyAvailableHours?: number; // Carga horária semanal padrão (ex: 20h)
  subjectsMap?: Map<string, { id: string; name: string }>;
}

export interface DeficitTopicItem {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  name: string;
  subjectName: string;
  total: number;
  correct: number;
  lostPoints: number;
  accuracy: number;
  shareOfLostPoints: number; // Percentual relativo do total de pontos perdidos
}

export interface RemediationDailyAction {
  day: number;
  dayLabel: string;
  subjectId: string | null;
  targetName: string;
  allocatedMinutes: number;
  activityType: 'questions' | 'statute' | 'review';
  focusHeadline: string;
}

export interface ErrorCardDraft {
  id: string;
  topicId: string;
  subjectId: string;
  statementSummary: string;
  bancaTrap: string;
  correctConcept: string;
  errorCategory: string;
  sourceSimulationId: string;
}

export interface RemediationPlan7Days {
  totalRemediationHours: number;
  bleedAllocationHours: number; // 60% da carga semanal
  maintenanceAllocationHours: number; // 40% da carga semanal
  dailySchedule: RemediationDailyAction[];
}

export interface SimulatedRemediationDiagnostic {
  simulationId: string;
  simulationName: string;
  simulationDate: string;
  scorePercent: number;
  totalQuestions: number;
  correctQuestions: number;
  totalLostPoints: number;
  passingScorePercent: number | null;
  gapToCutoff: number | null;
  historicalAverageScore: number | null;
  deltaVsHistoricalAverage: number | null;
  topBleedingTopics: DeficitTopicItem[];
  remediationPlan7Days: RemediationPlan7Days;
  errorCardDrafts: ErrorCardDraft[];
}

const DEFAULT_WEEKLY_HOURS = 20;

/**
 * Gera o cronograma diário de 7 dias de remediação.
 * 60% da carga horária semanal é concentrada nos tópicos de maior sangria (dias 1 a 5),
 * e os 40% restantes distribuídos para manutenção e fechamento do ciclo (dias 6 e 7).
 */
export function generate7DayRemediationPlan(
  topTopics: DeficitTopicItem[],
  weeklyHours: number = DEFAULT_WEEKLY_HOURS
): RemediationPlan7Days {
  const totalHours = Math.max(5, weeklyHours);
  const totalMinutes = Math.round(totalHours * 60);

  // 60% para remediação das vulnerabilidades
  const bleedMinutes = Math.round(totalMinutes * 0.6);
  // 40% para manutenção e consolidação
  const maintenanceMinutes = totalMinutes - bleedMinutes;

  const bleedHours = Math.round((bleedMinutes / 60) * 10) / 10;
  const maintenanceHours = Math.round((maintenanceMinutes / 60) * 10) / 10;

  const schedule: RemediationDailyAction[] = [];
  const dailyBleedSlot = Math.round(bleedMinutes / 5);

  if (topTopics.length > 0) {
    // Dias 1 a 3: foco direto em cada um dos Top 3 tópicos
    topTopics.slice(0, 3).forEach((topic, idx) => {
      const dayNum = idx + 1;
      const isCritical = topic.accuracy < 50;
      schedule.push({
        day: dayNum,
        dayLabel: `Dia ${dayNum}`,
        subjectId: topic.subjectId,
        targetName: topic.name,
        allocatedMinutes: dailyBleedSlot,
        activityType: isCritical ? 'statute' : 'questions',
        focusHeadline: isCritical
          ? `Imersão conceitual e lei seca em ${topic.name}`
          : `Bateria intensiva de questões em ${topic.name}`,
      });
    });

    // Se houver menos de 3 tópicos, completa os 5 dias repetindo os de maior déficit
    const remainingBleedDays = 5 - Math.min(topTopics.length, 3);
    for (let i = 0; i < remainingBleedDays; i++) {
      const dayNum = 3 + i + 1;
      const target = topTopics[i % topTopics.length];
      schedule.push({
        day: dayNum,
        dayLabel: `Dia ${dayNum}`,
        subjectId: target.subjectId,
        targetName: target.name,
        allocatedMinutes: dailyBleedSlot,
        activityType: 'review',
        focusHeadline: `Revisão de pontos cegos e fixação em ${target.name}`,
      });
    }
  } else {
    // Sem tópicos discriminados: divide igualmente os 5 dias
    for (let dayNum = 1; dayNum <= 5; dayNum++) {
      schedule.push({
        day: dayNum,
        dayLabel: `Dia ${dayNum}`,
        subjectId: null,
        targetName: 'Revisão Geral do Simulado',
        allocatedMinutes: dailyBleedSlot,
        activityType: 'questions',
        focusHeadline: `Análise e resolução de questões erradas (Etapa ${dayNum})`,
      });
    }
  }

  // Dias 6 e 7: Manutenção e fechamento
  const weekendSlot = Math.round(maintenanceMinutes / 2);
  schedule.push({
    day: 6,
    dayLabel: 'Dia 6',
    subjectId: null,
    targetName: 'Manutenção Estratégica',
    allocatedMinutes: weekendSlot,
    activityType: 'review',
    focusHeadline: 'Manutenção das disciplinas regulares fora do plano de sangria',
  });

  schedule.push({
    day: 7,
    dayLabel: 'Dia 7',
    subjectId: null,
    targetName: 'Simulação Rápida de Fixação',
    allocatedMinutes: weekendSlot,
    activityType: 'questions',
    focusHeadline: 'Mini-teste dos tópicos remediados para validação da retenção',
  });

  return {
    totalRemediationHours: totalHours,
    bleedAllocationHours: bleedHours,
    maintenanceAllocationHours: maintenanceHours,
    dailySchedule: schedule,
  };
}

/**
 * Gera rascunhos de cartões para o Caderno de Erros a partir das falhas do simulado.
 */
export function generateDraftErrorCards(
  simulation: SimulationTargetInput,
  topTopics: DeficitTopicItem[]
): ErrorCardDraft[] {
  const drafts: ErrorCardDraft[] = [];
  const simName = simulation.nome || simulation.name || 'Simulado';

  topTopics.forEach((topic, topicIdx) => {
    // Gera até 2 rascunhos estruturados por tópico crítico
    const cardsToGenerate = Math.min(2, Math.max(1, topic.lostPoints));
    for (let i = 1; i <= cardsToGenerate; i++) {
      drafts.push({
        id: `draft-${simulation.id}-${topic.id}-${i}`,
        topicId: topic.topicId || topic.id,
        subjectId: topic.subjectId || 'geral',
        statementSummary: `Questão incorreta em ${topic.name} (${simName} #${topicIdx + 1}.${i})`,
        bancaTrap: `Pegadinha ou armadilha observada no simulado: ${topic.name}`,
        correctConcept: `Fundamentação teórica ou regra jurídica correta para não repetir o erro`,
        errorCategory: topic.accuracy < 50 ? 'conceitual' : 'interpretacao',
        sourceSimulationId: simulation.id,
      });
    }
  });

  return drafts;
}

/**
 * Constrói o diagnóstico completo de Raio-X pós-simulado.
 */
export function buildSimulatedRemediationDiagnostic(
  input: SimulatedRemediationInput
): SimulatedRemediationDiagnostic {
  const sim = input.simulation;
  const total = Number(sim.total) || 0;
  const correct = Number(sim.correct) || 0;
  const lostPoints = Math.max(0, total - correct);
  const scorePercent = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

  // Comparação com ponto de corte
  const passingScore =
    input.passingScorePercent != null && Number.isFinite(input.passingScorePercent)
      ? Number(input.passingScorePercent)
      : null;
  const gapToCutoff =
    passingScore != null ? Math.round((scorePercent - passingScore) * 10) / 10 : null;

  // Média histórica (excluindo o atual se constar na lista)
  let historicalAverageScore: number | null =
    input.historicalAverageScore != null && Number.isFinite(input.historicalAverageScore)
      ? Number(input.historicalAverageScore)
      : null;
  let deltaVsHistoricalAverage: number | null = null;

  if (
    historicalAverageScore == null &&
    input.historicalSimulations &&
    input.historicalSimulations.length > 0
  ) {
    const validHistory = input.historicalSimulations.filter(
      h => h.id !== sim.id && Number(h.total) > 0
    );
    if (validHistory.length > 0) {
      const avg =
        validHistory.reduce((sum, h) => sum + (Number(h.correct) / Number(h.total)) * 100, 0) /
        validHistory.length;
      historicalAverageScore = Math.round(avg * 10) / 10;
    }
  }

  if (historicalAverageScore != null) {
    deltaVsHistoricalAverage = Math.round((scorePercent - historicalAverageScore) * 10) / 10;
  }

  // Identificação dos tópicos com maior número absoluto de pontos perdidos
  const breakdownRows = sim.breakdown || [];
  const subjectsMap = input.subjectsMap;

  const topicDeficits: DeficitTopicItem[] = breakdownRows
    .map(row => {
      const rowTotal = Number(row.total) || 0;
      const rowCorrect = Number(row.correct) || 0;
      const rowLost = Math.max(0, rowTotal - rowCorrect);
      const rowAcc = rowTotal > 0 ? Math.round((rowCorrect / rowTotal) * 1000) / 10 : 0;

      const subName =
        row.subjectName ||
        (row.subjectId && subjectsMap?.get(row.subjectId)?.name) ||
        'Disciplina não identificada';
      const name = row.topicName || subName;

      return {
        id: row.topicId || row.subjectId || row.id,
        subjectId: row.subjectId || null,
        topicId: row.topicId || null,
        name,
        subjectName: subName,
        total: rowTotal,
        correct: rowCorrect,
        lostPoints: rowLost,
        accuracy: rowAcc,
        shareOfLostPoints: lostPoints > 0 ? Math.round((rowLost / lostPoints) * 100) : 0,
      };
    })
    .filter(item => item.lostPoints > 0)
    .sort((a, b) => b.lostPoints - a.lostPoints || a.accuracy - b.accuracy);

  // Top 3 sangrias absolutas
  const topBleedingTopics = topicDeficits.slice(0, 3);

  // Geração do plano de 7 dias e rascunhos de cartões
  const remediationPlan7Days = generate7DayRemediationPlan(
    topBleedingTopics,
    input.weeklyAvailableHours ?? DEFAULT_WEEKLY_HOURS
  );
  const errorCardDrafts = generateDraftErrorCards(sim, topBleedingTopics);

  return {
    simulationId: sim.id,
    simulationName: sim.nome || sim.name || 'Simulado sem nome',
    simulationDate: sim.date || new Date().toISOString().slice(0, 10),
    scorePercent,
    totalQuestions: total,
    correctQuestions: correct,
    totalLostPoints: lostPoints,
    passingScorePercent: passingScore,
    gapToCutoff,
    historicalAverageScore,
    deltaVsHistoricalAverage,
    topBleedingTopics,
    remediationPlan7Days,
    errorCardDrafts,
  };
}
