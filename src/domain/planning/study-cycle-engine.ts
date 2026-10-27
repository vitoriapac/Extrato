/**
 * Motor do Ciclo de Estudos Flexível / Fila Rotativa (src/domain/planning/study-cycle-engine.ts)
 *
 * Oferece alternativa à agenda rígida por dia da semana para concurseiros com rotinas imprevisíveis.
 * Em vez de fixar dias no calendário (que geram falsos atrasos quando um imprevisto ocorre),
 * os estudos são organizados em uma fila circular de blocos intercalados por disciplina.
 * O não cumprimento de um dia apenas pausa o ciclo; no próximo momento de estudo,
 * o aluno retoma exatamente de onde parou.
 */

export interface StudyCycleBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  order: number;
  topicId?: string | null;
  preferredActivity?: 'study' | 'questions' | 'review';
}

export interface StudyCycleQueue {
  id: string;
  name: string;
  blocks: StudyCycleBlock[];
  currentBlockIndex: number;
  completedCyclesCount: number;
  totalDurationMinutes: number;
  updatedAt: string;
}

export interface BuildStudyCycleOptions {
  id?: string;
  name?: string;
  subjects: Array<{ id: string; name: string }>;
  /** Pesos por disciplina (1 a 5). Se não informados, assume peso 1 para todas. */
  subjectWeights?: Record<string, number>;
  /** Duração padrão de cada bloco em minutos (default: 60, min 30, max 120). */
  blockDurationMinutes?: number;
}

/**
 * Constrói uma fila rotativa intercalada de blocos de estudo.
 * Disciplinas de maior peso são repetidas ao longo do ciclo com espaçamento balanceado
 * para maximizar a prática intercalada.
 */
export function buildStudyCycleQueue({
  id = 'default-cycle',
  name = 'Ciclo de Estudos Principal',
  subjects = [],
  subjectWeights = {},
  blockDurationMinutes = 60,
}: BuildStudyCycleOptions): StudyCycleQueue {
  const duration = Math.max(30, Math.min(120, Number(blockDurationMinutes) || 60));

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return {
      id,
      name,
      blocks: [],
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalDurationMinutes: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // Monta a distribuição de repetições por disciplina com base no peso (1 a 5)
  const itemsWithCounts: Array<{ subject: { id: string; name: string }; count: number }> =
    subjects.map(s => {
      const rawWeight = Number(subjectWeights[s.id]);
      const weight =
        Number.isFinite(rawWeight) && rawWeight >= 1 ? Math.min(5, Math.round(rawWeight)) : 1;
      return {
        subject: s,
        count: weight,
      };
    });

  // Intercalação equilibrada (Round-Robin ponderado)
  const blocks: StudyCycleBlock[] = [];
  const remainingCounts = itemsWithCounts.map(item => ({ ...item }));
  let hasRemaining = true;
  let order = 1;

  while (hasRemaining) {
    hasRemaining = false;
    for (const item of remainingCounts) {
      if (item.count > 0) {
        blocks.push({
          id: `block-${item.subject.id}-${order}`,
          subjectId: item.subject.id,
          subjectName: item.subject.name,
          durationMinutes: duration,
          order,
          preferredActivity: 'study',
        });
        item.count--;
        order++;
        if (item.count > 0) hasRemaining = true;
      }
    }
  }

  const totalDurationMinutes = blocks.length * duration;

  return {
    id,
    name,
    blocks,
    currentBlockIndex: 0,
    completedCyclesCount: 0,
    totalDurationMinutes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retorna o bloco ativo atual do ciclo.
 */
export function getCurrentCycleBlock(cycle: StudyCycleQueue): StudyCycleBlock | null {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) return null;
  const index = Math.max(0, Math.min(cycle.blocks.length - 1, cycle.currentBlockIndex));
  return cycle.blocks[index] || null;
}

/**
 * Retorna uma prévia dos próximos blocos do ciclo em ordem rotativa.
 */
export function peekUpcomingCycleBlocks(cycle: StudyCycleQueue, count = 3): StudyCycleBlock[] {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) return [];

  const result: StudyCycleBlock[] = [];
  const total = cycle.blocks.length;

  for (let i = 1; i <= Math.min(count, total - 1); i++) {
    const nextIndex = (cycle.currentBlockIndex + i) % total;
    result.push(cycle.blocks[nextIndex]);
  }

  return result;
}

/**
 * Avança o ciclo para o próximo bloco da fila.
 * Se atingir o final da fila, reinicia o ciclo na posição 0 e incrementa `completedCyclesCount`.
 */
export function advanceStudyCycleQueue(cycle: StudyCycleQueue): {
  cycle: StudyCycleQueue;
  advanced: boolean;
  completedLap: boolean;
} {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) {
    return { cycle, advanced: false, completedLap: false };
  }

  const nextIndex = cycle.currentBlockIndex + 1;
  const completedLap = nextIndex >= cycle.blocks.length;

  const updatedCycle: StudyCycleQueue = {
    ...cycle,
    currentBlockIndex: completedLap ? 0 : nextIndex,
    completedCyclesCount: completedLap
      ? cycle.completedCyclesCount + 1
      : cycle.completedCyclesCount,
    updatedAt: new Date().toISOString(),
  };

  return {
    cycle: updatedCycle,
    advanced: true,
    completedLap,
  };
}
