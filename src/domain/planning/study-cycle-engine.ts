/**
 * Motor do Ciclo de Estudos Flexível / Fila Rotativa (src/domain/planning/study-cycle-engine.ts)
 *
 * Oferece alternativa à agenda rígida por dia da semana para concurseiros com rotinas imprevisíveis.
 * Em vez de fixar dias no calendário (que geram falsos atrasos quando um imprevisto ocorre),
 * os estudos são organizados em uma fila circular de blocos intercalados por disciplina.
 * O não cumprimento de um dia apenas pausa o ciclo; no próximo momento de estudo,
 * o aluno retoma exatamente de onde parou.
 */

export type StudyCycleMode = 'manual' | 'balanced' | 'adaptive';
export type StudyCycleStatus = 'active' | 'paused';
export type CycleExecutionStatus = 'completed' | 'partial' | 'skipped';
export type CycleExecutionSource = 'cycle' | 'quick' | 'regular' | 'copilot';

export interface StudyCycleBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  order: number;
  topicId?: string | null;
  preferredActivity?: 'study' | 'questions' | 'review';
  enabled?: boolean;
  remainingMinutes?: number | null;
}

export interface StudyCycleExecution {
  id: string;
  cycleId: string;
  cycleVersion: number;
  blockId: string;
  subjectId: string;
  round: number;
  sessionId: string | null;
  plannedMinutes: number;
  actualMinutes: number;
  status: CycleExecutionStatus;
  reason: string | null;
  timestamp: string;
  source: CycleExecutionSource;
}

export interface StudyCycleQueue {
  id: string;
  name: string;
  examId?: string | null;
  mode?: StudyCycleMode;
  status?: StudyCycleStatus;
  version?: number;
  blocks: StudyCycleBlock[];
  currentBlockIndex: number;
  completedCyclesCount: number;
  totalDurationMinutes: number;
  executions?: StudyCycleExecution[];
  processedSessionIds?: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface BuildStudyCycleOptions {
  id?: string;
  name?: string;
  examId?: string | null;
  mode?: StudyCycleMode;
  subjects: Array<{ id: string; name: string }>;
  /** Pesos por disciplina (1 a 5). Se não informados, assume peso 1 para todas. */
  subjectWeights?: Record<string, number>;
  /** Duração padrão de cada bloco em minutos (default: 60, min 15, max 120). */
  blockDurationMinutes?: number;
  nowISO?: string;
}

function clampBlockDuration(raw: unknown, fallback = 60): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.max(15, Math.min(120, Math.round(num)));
}

/**
 * Constrói uma fila rotativa intercalada de blocos de estudo.
 * Disciplinas de maior peso são repetidas ao longo do ciclo com espaçamento balanceado
 * para maximizar a prática intercalada.
 */
export function buildStudyCycleQueue({
  id = 'default-cycle',
  name = 'Ciclo de Estudos Principal',
  examId = null,
  mode = 'adaptive',
  subjects = [],
  subjectWeights = {},
  blockDurationMinutes = 60,
  nowISO = new Date().toISOString(),
}: BuildStudyCycleOptions): StudyCycleQueue {
  const duration = clampBlockDuration(blockDurationMinutes, 60);

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return {
      id,
      name,
      examId,
      mode,
      status: 'active',
      version: 1,
      blocks: [],
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalDurationMinutes: 0,
      executions: [],
      processedSessionIds: [],
      createdAt: nowISO,
      updatedAt: nowISO,
    };
  }

  // Monta a distribuição de repetições por disciplina conforme o modo (CIC-02)
  const itemsWithCounts: Array<{ subject: { id: string; name: string }; count: number }> =
    subjects.map(s => {
      if (mode === 'balanced' || mode === 'manual') {
        return { subject: s, count: 1 };
      }
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
          enabled: true,
          remainingMinutes: null,
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
    examId,
    mode,
    status: 'active',
    version: 1,
    blocks,
    currentBlockIndex: 0,
    completedCyclesCount: 0,
    totalDurationMinutes,
    executions: [],
    processedSessionIds: [],
    createdAt: nowISO,
    updatedAt: nowISO,
  };
}

/**
 * Valida blocos do ciclo (CIC-01): duração entre 15 e 120 minutos e referências ativas.
 */
export function validateStudyCycleBlocks(
  blocks: Array<Partial<StudyCycleBlock>>,
  activeSubjectIds?: ReadonlySet<string> | readonly string[]
): { valid: boolean; errors: string[]; validBlocks: StudyCycleBlock[] } {
  const errors: string[] = [];
  const validBlocks: StudyCycleBlock[] = [];
  const activeSet =
    activeSubjectIds instanceof Set
      ? activeSubjectIds
      : Array.isArray(activeSubjectIds)
        ? new Set(activeSubjectIds)
        : null;

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      valid: false,
      errors: ['Adicione pelo menos um bloco para montar o ciclo.'],
      validBlocks: [],
    };
  }

  blocks.forEach((raw, idx) => {
    const position = idx + 1;
    const subjectId = String(raw?.subjectId || '').trim();
    if (!subjectId) {
      errors.push(`Bloco ${position}: selecione uma disciplina.`);
      return;
    }
    if (activeSet && !activeSet.has(subjectId)) {
      errors.push(`Bloco ${position}: a disciplina selecionada está arquivada ou inativa.`);
      return;
    }
    const mins = Number(raw?.durationMinutes);
    if (!Number.isFinite(mins) || mins < 15 || mins > 120) {
      errors.push(`Bloco ${position}: a duração deve ficar entre 15 e 120 minutos.`);
      return;
    }
    validBlocks.push({
      id: String(raw?.id || `block-${subjectId}-${position}`),
      subjectId,
      subjectName: String(raw?.subjectName || 'Disciplina'),
      durationMinutes: Math.round(mins),
      order: validBlocks.length + 1,
      topicId: raw?.topicId ?? null,
      preferredActivity: raw?.preferredActivity || 'study',
      enabled: raw?.enabled !== false,
      remainingMinutes: raw?.remainingMinutes ?? null,
    });
  });

  return {
    valid: errors.length === 0 && validBlocks.length > 0,
    errors,
    validBlocks,
  };
}

export interface StudyCycleSubjectShare {
  subjectId: string;
  subjectName: string;
  minutes: number;
  blocks: number;
  sharePct: number;
}

export function computeStudyCycleSubjectShares(
  blocks: StudyCycleBlock[] = []
): StudyCycleSubjectShare[] {
  const bySubject = new Map<
    string,
    { subjectId: string; subjectName: string; minutes: number; blocks: number }
  >();
  let totalMinutes = 0;

  for (const block of blocks) {
    if (block.enabled === false) continue;
    const duration = Math.max(0, Number(block.durationMinutes) || 0);
    const current = bySubject.get(block.subjectId) || {
      subjectId: block.subjectId,
      subjectName: block.subjectName,
      minutes: 0,
      blocks: 0,
    };
    current.minutes += duration;
    current.blocks += 1;
    totalMinutes += duration;
    bySubject.set(block.subjectId, current);
  }

  return [...bySubject.values()]
    .map(item => ({
      ...item,
      sharePct: totalMinutes > 0 ? Math.round((item.minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/**
 * Gera uma prévia não destrutiva de distribuição do ciclo (CIC-02, CIC-03).
 */
export function buildStudyCyclePreview(
  options: BuildStudyCycleOptions & {
    customBlocks?: Array<Partial<StudyCycleBlock>>;
    activeSubjectIds?: ReadonlySet<string> | readonly string[];
  }
) {
  const mode: StudyCycleMode = options.mode || 'adaptive';
  const nowISO = options.nowISO || new Date().toISOString();
  let cycle: StudyCycleQueue;
  let errors: string[] = [];

  if (mode === 'manual' && Array.isArray(options.customBlocks)) {
    const validation = validateStudyCycleBlocks(options.customBlocks, options.activeSubjectIds);
    errors = validation.errors;
    const totalDurationMinutes = validation.validBlocks.reduce(
      (sum, block) => sum + (block.enabled === false ? 0 : block.durationMinutes),
      0
    );
    cycle = {
      id: options.id || 'default-cycle',
      name: options.name || 'Ciclo de Estudos Manual',
      examId: options.examId ?? null,
      mode: 'manual',
      status: 'active',
      version: 1,
      blocks: validation.validBlocks,
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalDurationMinutes,
      executions: [],
      processedSessionIds: [],
      createdAt: nowISO,
      updatedAt: nowISO,
    };
  } else {
    cycle = buildStudyCycleQueue({ ...options, mode, nowISO });
  }

  const totalMinutes = cycle.totalDurationMinutes || 0;
  const subjectShares = computeStudyCycleSubjectShares(cycle.blocks);

  return {
    valid: errors.length === 0 && cycle.blocks.length > 0,
    errors,
    cycle,
    subjectShares,
    blocksCount: cycle.blocks.length,
    totalDurationMinutes: totalMinutes,
  };
}

/**
 * Reordena blocos do ciclo recalculando `order` sem reescrever histórico (CIC-03).
 */
export function reorderStudyCycleBlocks(
  cycle: StudyCycleQueue,
  fromIndex: number,
  toIndex: number,
  nowISO = new Date().toISOString()
): StudyCycleQueue {
  if (
    !cycle ||
    !Array.isArray(cycle.blocks) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= cycle.blocks.length ||
    toIndex >= cycle.blocks.length ||
    fromIndex === toIndex
  ) {
    return cycle;
  }

  const activeBlockId = cycle.blocks[cycle.currentBlockIndex]?.id || null;
  const nextBlocks = [...cycle.blocks];
  const [moved] = nextBlocks.splice(fromIndex, 1);
  nextBlocks.splice(toIndex, 0, moved);

  const renumbered = nextBlocks.map((block, index) => ({
    ...block,
    order: index + 1,
  }));

  const resolvedIndex = activeBlockId
    ? Math.max(0, renumbered.findIndex(b => b.id === activeBlockId))
    : 0;

  return {
    ...cycle,
    blocks: renumbered,
    currentBlockIndex: resolvedIndex,
    updatedAt: nowISO,
  };
}

/**
 * Aplica edição confirmada gerando nova versão do ciclo e preservando voltas históricas (CIC-03).
 */
export function applyStudyCycleVersion(
  currentCycle: StudyCycleQueue | null | undefined,
  nextDraft: StudyCycleQueue,
  nowISO = new Date().toISOString()
): StudyCycleQueue {
  const prevVersion = Math.max(0, Number(currentCycle?.version) || 0);
  const previousActiveId =
    currentCycle?.blocks?.[currentCycle.currentBlockIndex]?.id || null;
  const matchedIndex = previousActiveId
    ? nextDraft.blocks.findIndex(block => block.id === previousActiveId)
    : -1;
  const preservedIndex =
    matchedIndex >= 0
      ? matchedIndex
      : Math.max(
          0,
          Math.min(
            Math.max(0, nextDraft.blocks.length - 1),
            currentCycle?.currentBlockIndex || 0
          )
        );
  const totalDurationMinutes = nextDraft.blocks.reduce(
    (sum, block) => sum + (block.enabled === false ? 0 : block.durationMinutes),
    0
  );

  return {
    ...nextDraft,
    version: prevVersion + 1,
    status: currentCycle?.status || nextDraft.status || 'active',
    completedCyclesCount: currentCycle?.completedCyclesCount || 0,
    currentBlockIndex: nextDraft.blocks.length > 0 ? preservedIndex : 0,
    totalDurationMinutes,
    executions: [...(currentCycle?.executions || [])],
    processedSessionIds: [...(currentCycle?.processedSessionIds || [])],
    createdAt: currentCycle?.createdAt || nextDraft.createdAt || nowISO,
    updatedAt: nowISO,
  };
}

/**
 * Alterna o estado ativo/pausado do ciclo sem gerar atrasos ou débitos automáticos (CIC-04).
 */
export function setStudyCycleStatus(
  cycle: StudyCycleQueue,
  status: StudyCycleStatus,
  nowISO = new Date().toISOString()
): StudyCycleQueue {
  if (!cycle) return cycle;
  return {
    ...cycle,
    status: status === 'paused' ? 'paused' : 'active',
    updatedAt: nowISO,
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
export function advanceStudyCycleQueue(
  cycle: StudyCycleQueue,
  nowISO = new Date().toISOString()
): {
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
    updatedAt: nowISO,
  };

  return {
    cycle: updatedCycle,
    advanced: true,
    completedLap,
  };
}

/**
 * Registra conclusão ou execução parcial de um bloco com idempotência por sessionId (CIC-05, CIC-08).
 */
export function recordStudyCycleBlockExecution(
  cycle: StudyCycleQueue,
  {
    sessionId,
    actualMinutes,
    forceComplete = false,
    source = 'cycle',
    nowISO = new Date().toISOString(),
    executionId,
    ignorePaused = false,
  }: {
    sessionId?: string | null;
    actualMinutes: number;
    forceComplete?: boolean;
    source?: CycleExecutionSource;
    nowISO?: string;
    executionId?: string;
    ignorePaused?: boolean;
  }
): {
  cycle: StudyCycleQueue;
  advanced: boolean;
  completedLap: boolean;
  duplicate: boolean;
  status: CycleExecutionStatus | 'duplicate' | 'paused' | 'empty';
} {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) {
    return { cycle, advanced: false, completedLap: false, duplicate: false, status: 'empty' };
  }
  if (cycle.status === 'paused' && !ignorePaused) {
    return { cycle, advanced: false, completedLap: false, duplicate: false, status: 'paused' };
  }
  const processed = Array.isArray(cycle.processedSessionIds) ? cycle.processedSessionIds : [];
  if (sessionId && processed.includes(sessionId)) {
    return {
      cycle,
      advanced: false,
      completedLap: false,
      duplicate: true,
      status: 'duplicate',
    };
  }

  const index = Math.max(0, Math.min(cycle.blocks.length - 1, cycle.currentBlockIndex));
  const block = cycle.blocks[index];
  if (!block) {
    return { cycle, advanced: false, completedLap: false, duplicate: false, status: 'empty' };
  }

  const safeMinutes = Math.max(0, Math.round(Number(actualMinutes) || 0));
  const targetMinutes =
    block.remainingMinutes != null && block.remainingMinutes > 0
      ? block.remainingMinutes
      : block.durationMinutes;
  const isCompleted = Boolean(forceComplete) || safeMinutes >= targetMinutes;
  const execStatus: CycleExecutionStatus = isCompleted ? 'completed' : 'partial';
  const currentRound = (cycle.completedCyclesCount || 0) + 1;

  const executionRecord: StudyCycleExecution = {
    id: executionId || `cycle-exec-${sessionId || nowISO}`,
    cycleId: cycle.id,
    cycleVersion: cycle.version || 1,
    blockId: block.id,
    subjectId: block.subjectId,
    round: currentRound,
    sessionId: sessionId || null,
    plannedMinutes: targetMinutes,
    actualMinutes: safeMinutes,
    status: execStatus,
    reason: null,
    timestamp: nowISO,
    source,
  };

  const nextBlocks = cycle.blocks.map((item, idx) => {
    if (idx !== index) return item;
    return {
      ...item,
      remainingMinutes: isCompleted ? null : Math.max(1, targetMinutes - safeMinutes),
    };
  });

  const nextProcessed = sessionId ? [...processed, sessionId] : processed;
  const baseUpdated: StudyCycleQueue = {
    ...cycle,
    blocks: nextBlocks,
    executions: [...(cycle.executions || []), executionRecord],
    processedSessionIds: nextProcessed,
    updatedAt: nowISO,
  };

  if (!isCompleted) {
    return {
      cycle: baseUpdated,
      advanced: false,
      completedLap: false,
      duplicate: false,
      status: 'partial',
    };
  }

  const stepped = advanceStudyCycleQueue(baseUpdated, nowISO);
  return {
    cycle: stepped.cycle,
    advanced: stepped.advanced,
    completedLap: stepped.completedLap,
    duplicate: false,
    status: 'completed',
  };
}

/**
 * Pula temporariamente o bloco atual registrando motivo opcional (CIC-06).
 */
export function skipStudyCycleBlock(
  cycle: StudyCycleQueue,
  {
    reason = null,
    nowISO = new Date().toISOString(),
    executionId,
  }: {
    reason?: string | null;
    nowISO?: string;
    executionId?: string;
  } = {}
): {
  cycle: StudyCycleQueue;
  advanced: boolean;
  completedLap: boolean;
} {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) {
    return { cycle, advanced: false, completedLap: false };
  }

  const index = Math.max(0, Math.min(cycle.blocks.length - 1, cycle.currentBlockIndex));
  const block = cycle.blocks[index];
  if (!block) return { cycle, advanced: false, completedLap: false };

  const currentRound = (cycle.completedCyclesCount || 0) + 1;
  const executionRecord: StudyCycleExecution = {
    id: executionId || `cycle-skip-${nowISO}`,
    cycleId: cycle.id,
    cycleVersion: cycle.version || 1,
    blockId: block.id,
    subjectId: block.subjectId,
    round: currentRound,
    sessionId: null,
    plannedMinutes: block.remainingMinutes ?? block.durationMinutes,
    actualMinutes: 0,
    status: 'skipped',
    reason: reason ? String(reason).trim().slice(0, 200) : null,
    timestamp: nowISO,
    source: 'cycle',
  };

  const nextBlocks = cycle.blocks.map((item, idx) =>
    idx === index ? { ...item, remainingMinutes: null } : item
  );

  const stepped = advanceStudyCycleQueue(
    {
      ...cycle,
      blocks: nextBlocks,
      executions: [...(cycle.executions || []), executionRecord],
      updatedAt: nowISO,
    },
    nowISO
  );

  return stepped;
}

/**
 * Resume a volta atual ou uma volta específica distinguindo concluídos, parciais e pulados (CIC-07).
 */
export function computeStudyCycleLapSummary(
  cycle: StudyCycleQueue | null | undefined,
  roundNumber?: number
) {
  if (!cycle || !Array.isArray(cycle.blocks) || cycle.blocks.length === 0) {
    return {
      round: 1,
      totalBlocks: 0,
      completedBlocks: 0,
      skippedBlocks: 0,
      partialBlocks: 0,
      resolvedBlocks: 0,
      executedCoveragePct: 0,
      actualMinutesInRound: 0,
    };
  }

  const round = roundNumber ?? (cycle.completedCyclesCount || 0) + 1;
  const roundExecutions = (cycle.executions || []).filter(item => item.round === round);
  const completedIds = new Set(
    roundExecutions.filter(item => item.status === 'completed').map(item => item.blockId)
  );
  const skippedIds = new Set(
    roundExecutions
      .filter(item => item.status === 'skipped' && !completedIds.has(item.blockId))
      .map(item => item.blockId)
  );
  const partialIds = new Set(
    roundExecutions
      .filter(
        item =>
          item.status === 'partial' &&
          !completedIds.has(item.blockId) &&
          !skippedIds.has(item.blockId)
      )
      .map(item => item.blockId)
  );

  const totalBlocks = cycle.blocks.length;
  const completedBlocks = completedIds.size;
  const skippedBlocks = skippedIds.size;
  const resolvedBlocks = completedBlocks + skippedBlocks;
  const executedCoveragePct =
    totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
  const actualMinutesInRound = roundExecutions.reduce(
    (sum, item) => sum + Math.max(0, Number(item.actualMinutes) || 0),
    0
  );

  return {
    round,
    totalBlocks,
    completedBlocks,
    skippedBlocks,
    partialBlocks: partialIds.size,
    resolvedBlocks,
    executedCoveragePct,
    actualMinutesInRound,
  };
}

/**
 * Explica divergência entre o bloco atual do ciclo e a recomendação prioritária vigente (CIC-09).
 * Nunca substitui o próximo bloco silenciosamente.
 */
export function explainCycleVsPriority(
  cycle: StudyCycleQueue | null | undefined,
  topRecommendation: Record<string, any> | null | undefined
) {
  const currentBlock = cycle ? getCurrentCycleBlock(cycle) : null;
  if (!currentBlock || !topRecommendation) {
    return {
      diverges: false,
      currentBlockSubject: currentBlock?.subjectName || null,
      recommendedSubject: topRecommendation?.subjectName || null,
      urgentReview: false,
      explanation: currentBlock
        ? `Seu próximo passo no ciclo é ${currentBlock.subjectName} (${currentBlock.durationMinutes} min).`
        : 'Nenhum bloco ativo no ciclo e nenhuma recomendação prioritária no momento.',
      suggestedAction: 'keep_cycle' as const,
    };
  }

  const sameSubject = currentBlock.subjectId === topRecommendation.subjectId;
  const urgentReview =
    topRecommendation.studyType === 'review' ||
    (Array.isArray(topRecommendation.reasons) &&
      topRecommendation.reasons.some((r: string) => /revis[aã]o|vencid|reten/i.test(r)));

  if (sameSubject) {
    return {
      diverges: false,
      currentBlockSubject: currentBlock.subjectName,
      recommendedSubject: topRecommendation.subjectName || currentBlock.subjectName,
      urgentReview,
      explanation: `O ciclo e o diagnóstico pedagógico apontam para a mesma disciplina: ${currentBlock.subjectName}.`,
      suggestedAction: 'keep_cycle' as const,
    };
  }

  return {
    diverges: true,
    currentBlockSubject: currentBlock.subjectName,
    recommendedSubject: topRecommendation.subjectName || 'Prioridade pedagógica',
    urgentReview,
    explanation: urgentReview
      ? `O ciclo mantém a alternância planejada em ${currentBlock.subjectName}, enquanto há revisão prioritária em ${topRecommendation.subjectName}. Nada é trocado automaticamente sem sua escolha.`
      : `O ciclo segue a sequência confirmada (${currentBlock.subjectName}), enquanto o motor de prioridade destaca maior ganho imediato em ${topRecommendation.subjectName} (${topRecommendation.topicName || 'tópico prioritário'}).`,
    suggestedAction: 'open_priority_preview' as const,
  };
}

/**
 * Calcula pesos padrão por disciplina para prévia e geração do ciclo (1–5),
 * combinando pesos do edital e candidatos prioritários de estudo.
 */
export function computeDefaultCycleWeights(
  blueprintSubjects?: ReadonlyArray<Record<string, any>> | null,
  candidates?: ReadonlyArray<Record<string, any>> | null
): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const row of blueprintSubjects || []) {
    if (!row?.subjectId) continue;
    const w = Number(row.questionWeight || 1) * (row.priority === 'high' ? 1.5 : 1);
    weights[String(row.subjectId)] = Math.max(1, Math.min(5, Math.round(w * 1.5)));
  }
  for (const c of candidates || []) {
    if (c?.subjectId && (Number(c.score) || 0) >= 75) {
      const sid = String(c.subjectId);
      weights[sid] = Math.min(5, Math.max(weights[sid] || 1, 3));
    }
  }
  return weights;
}
