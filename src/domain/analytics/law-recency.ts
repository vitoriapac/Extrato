import { parseLocalDate } from '../../core/date-utils.js';
import { normalizeBanca } from '../questions/bancas.js';

export interface LawRecencyInput {
  lastLawReadAt?: string | null;
  legislativeUpdatePending?: boolean;
  legislativeUpdateNote?: string | null;
  stageChecklist?: { lawOrNotesDone?: boolean } | null;
}

export interface LawRecencyStatus {
  lastLawReadAt: string | null;
  daysSinceLawRead: number | null;
  thresholdDays: number;
  isStale: boolean;
  legislativeUpdatePending: boolean;
  legislativeUpdateNote: string | null;
  needsAttention: boolean;
  label: string;
}

const LITERAL_BANCAS = new Set(['FCC', 'Vunesp', 'FGV']);

/**
 * Avalia a recência dedicada da leitura de Lei Seca / Jurisprudência, separada
 * da recência de resolução de questões. Bancas literalistas (FCC, Vunesp, FGV)
 * usam limiar mais curto (21 dias) contra 30 dias nas demais.
 */
export function evaluateLawRecency(
  topic: LawRecencyInput | null | undefined,
  todayDate: string,
  targetBanca: string | null = null
): LawRecencyStatus {
  const normalizedBanca = targetBanca ? normalizeBanca(targetBanca) : null;
  const thresholdDays = normalizedBanca && LITERAL_BANCAS.has(normalizedBanca) ? 21 : 30;
  const lastLawReadAt =
    topic?.lastLawReadAt && /^\d{4}-\d{2}-\d{2}$/.test(topic.lastLawReadAt)
      ? topic.lastLawReadAt
      : null;
  const legislativeUpdatePending = Boolean(topic?.legislativeUpdatePending);
  const legislativeUpdateNote = topic?.legislativeUpdateNote
    ? String(topic.legislativeUpdateNote).trim() || null
    : null;

  let daysSinceLawRead: number | null = null;
  if (lastLawReadAt) {
    const readDate = parseLocalDate(lastLawReadAt);
    const todayObj = parseLocalDate(todayDate);
    if (readDate && todayObj) {
      daysSinceLawRead = Math.max(
        0,
        Math.round((todayObj.getTime() - readDate.getTime()) / 86400000)
      );
    }
  }

  const isStale = daysSinceLawRead != null && daysSinceLawRead > thresholdDays;
  const needsAttention = legislativeUpdatePending || isStale;

  let label = 'Lei seca sem registro';
  if (legislativeUpdatePending) {
    label = legislativeUpdateNote
      ? `Alteração legislativa: ${legislativeUpdateNote}`
      : 'Alteração legislativa pendente';
  } else if (daysSinceLawRead != null) {
    label =
      daysSinceLawRead === 0
        ? 'Lei lida hoje'
        : `Lei lida há ${daysSinceLawRead}d${isStale ? ` (> ${thresholdDays}d)` : ''}`;
  } else if (topic?.stageChecklist?.lawOrNotesDone) {
    label = 'Lei seca marcada (sem data)';
  }

  return {
    lastLawReadAt,
    daysSinceLawRead,
    thresholdDays,
    isStale,
    legislativeUpdatePending,
    legislativeUpdateNote,
    needsAttention,
    label,
  };
}
