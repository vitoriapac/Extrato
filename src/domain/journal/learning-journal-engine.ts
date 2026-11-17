/**
 * Motor do Diário de Aprendizagem (DIA-01 a DIA-08).
 *
 * Mantém anotações opcionais vinculadas a sessões, disciplinas e tópicos com snapshots
 * leves contra arquivamento/exclusão e sanitização estrita de texto (nunca executa HTML).
 * Não recalcula domínio, retenção ou pesos pedagógicos.
 */

import type { LearningJournalEntry, LearningJournalTag } from '../../core/types.js';

export const LEARNING_JOURNAL_TAGS: readonly LearningJournalTag[] = Object.freeze([
  'entendi',
  'duvida',
  'pegadinha',
  'revisar',
  'estrategia',
]);

export const LEARNING_JOURNAL_TAG_LABELS: Record<LearningJournalTag, string> = Object.freeze({
  entendi: 'Entendi',
  duvida: 'Dúvida',
  pegadinha: 'Pegadinha',
  revisar: 'Revisar',
  estrategia: 'Estratégia',
});

export const LEARNING_JOURNAL_MAX_NOTE_LENGTH = 1000;
export const LEARNING_JOURNAL_MAX_NEXT_STEP_LENGTH = 500;

export interface UpsertLearningJournalPayload {
  id?: string | null;
  examId?: string | null;
  sessionId?: string | null;
  subjectId?: string | null;
  subjectNameSnapshot?: string | null;
  topicId?: string | null;
  topicNameSnapshot?: string | null;
  localDate?: string | null;
  difficultyRating?: 'easy' | 'medium' | 'hard' | null;
  energyRating?: 'high' | 'normal' | 'low' | null;
  tags?: unknown[];
  note?: unknown;
  nextStep?: unknown;
}

/**
 * Sanitiza texto do diário removendo sequências de script/controle e aplicando limite (DIA-03).
 */
export function sanitizeJournalText(
  input: unknown,
  maxLength = LEARNING_JOURNAL_MAX_NOTE_LENGTH
): string {
  if (typeof input !== 'string') return '';
  const withoutScripts = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '');
  const withoutControl = withoutScripts.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return withoutControl.replace(/\r\n/g, '\n').trim().slice(0, Math.max(0, maxLength));
}

function normalizeTags(raw: unknown): LearningJournalTag[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<LearningJournalTag>();
  for (const candidate of raw) {
    if (LEARNING_JOURNAL_TAGS.includes(candidate as LearningJournalTag)) {
      valid.add(candidate as LearningJournalTag);
    }
  }
  return [...valid];
}

function normalizeDifficulty(value: unknown): 'easy' | 'medium' | 'hard' | null {
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : null;
}

function normalizeEnergy(value: unknown): 'high' | 'normal' | 'low' | null {
  return value === 'high' || value === 'normal' || value === 'low' ? value : null;
}

function validLocalDate(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

/**
 * Política V1 (DIA-08): 1 entrada editável por `sessionId`, além de entradas avulsas separadas.
 * Preserva snapshots leves de nomes para o caso de exclusão/arquivamento (DIA-02).
 */
export function upsertLearningJournalEntry(
  entries: readonly LearningJournalEntry[],
  payload: UpsertLearningJournalPayload,
  {
    nowISO,
    todayISO,
    idGenerator = (prefix = 'journal') => `${prefix}_${Date.now()}`,
  }: {
    nowISO: () => string;
    todayISO: () => string;
    idGenerator?: (prefix?: string) => string;
  }
): { entries: LearningJournalEntry[]; entry: LearningJournalEntry; updated: boolean } {
  const list = Array.isArray(entries) ? [...entries] : [];
  const now = nowISO();
  const today = todayISO();
  const sessionId = payload.sessionId ? String(payload.sessionId) : null;

  let existingIndex = -1;
  if (payload.id) {
    existingIndex = list.findIndex(item => item.id === payload.id);
  }
  if (existingIndex < 0 && sessionId) {
    existingIndex = list.findIndex(item => item.sessionId === sessionId);
  }

  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const sanitizedNote = sanitizeJournalText(payload.note, LEARNING_JOURNAL_MAX_NOTE_LENGTH);
  const sanitizedNextStep = sanitizeJournalText(
    payload.nextStep,
    LEARNING_JOURNAL_MAX_NEXT_STEP_LENGTH
  );

  const entry: LearningJournalEntry = {
    id: existing?.id || (payload.id ? String(payload.id) : idGenerator('journal')),
    examId: payload.examId !== undefined ? (payload.examId ? String(payload.examId) : null) : existing?.examId ?? null,
    sessionId: sessionId ?? existing?.sessionId ?? null,
    subjectId:
      payload.subjectId !== undefined
        ? payload.subjectId
          ? String(payload.subjectId)
          : null
        : existing?.subjectId ?? null,
    subjectNameSnapshot: sanitizeJournalText(
      payload.subjectNameSnapshot ?? existing?.subjectNameSnapshot ?? '',
      200
    ),
    topicId:
      payload.topicId !== undefined
        ? payload.topicId
          ? String(payload.topicId)
          : null
        : existing?.topicId ?? null,
    topicNameSnapshot: sanitizeJournalText(
      payload.topicNameSnapshot ?? existing?.topicNameSnapshot ?? '',
      300
    ),
    localDate: validLocalDate(payload.localDate ?? existing?.localDate, today),
    difficultyRating:
      payload.difficultyRating !== undefined
        ? normalizeDifficulty(payload.difficultyRating)
        : existing?.difficultyRating ?? null,
    energyRating:
      payload.energyRating !== undefined
        ? normalizeEnergy(payload.energyRating)
        : existing?.energyRating ?? null,
    tags:
      payload.tags !== undefined
        ? normalizeTags(payload.tags)
        : existing?.tags ?? [],
    note: payload.note !== undefined ? sanitizedNote : existing?.note ?? '',
    nextStep: payload.nextStep !== undefined ? sanitizedNextStep : existing?.nextStep ?? '',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = entry;
  } else {
    list.unshift(entry);
  }

  return {
    entries: list,
    entry,
    updated: existingIndex >= 0,
  };
}

export function deleteLearningJournalEntry(
  entries: readonly LearningJournalEntry[],
  entryId: string
): LearningJournalEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(item => item.id !== entryId);
}

export interface LearningJournalFilterOptions {
  subjectId?: string | null;
  tag?: LearningJournalTag | string | null;
  startDate?: string | null;
  endDate?: string | null;
  query?: string | null;
}

export function filterLearningJournalEntries(
  entries: readonly LearningJournalEntry[],
  filters: LearningJournalFilterOptions = {}
): LearningJournalEntry[] {
  if (!Array.isArray(entries)) return [];
  const query = typeof filters.query === 'string' ? filters.query.trim().toLowerCase() : '';
  return entries.filter(entry => {
    if (filters.subjectId && entry.subjectId !== filters.subjectId) return false;
    if (filters.tag && (!Array.isArray(entry.tags) || !entry.tags.includes(filters.tag as LearningJournalTag)))
      return false;
    if (filters.startDate && entry.localDate < filters.startDate) return false;
    if (filters.endDate && entry.localDate > filters.endDate) return false;
    if (query) {
      const haystack = [
        entry.note,
        entry.nextStep,
        entry.subjectNameSnapshot,
        entry.topicNameSnapshot,
        ...(entry.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Gera proposta opcional de revisão a partir de uma dúvida registrada (DIA-07).
 * Exige confirmação explícita antes de chamar `reviewService.createManualReview`.
 */
export function buildJournalReviewProposal(
  entry: LearningJournalEntry | null | undefined,
  {
    todayISO,
    addDays,
  }: {
    todayISO: () => string;
    addDays: (iso: string, days: number) => string;
  }
) {
  if (!entry || !entry.topicId) return null;
  const actionable =
    Array.isArray(entry.tags) &&
    (entry.tags.includes('duvida') || entry.tags.includes('revisar') || entry.tags.includes('pegadinha'));
  if (!actionable && !entry.note) return null;

  const today = todayISO();
  return {
    entryId: entry.id,
    subjectId: entry.subjectId || null,
    topicId: entry.topicId,
    subjectName: entry.subjectNameSnapshot || 'Disciplina',
    topicName: entry.topicNameSnapshot || 'Tópico',
    scheduledDate: addDays(today, 1),
    tipo: 'Revisão 24h',
    reason: entry.note
      ? `Dúvida do diário: "${entry.note.slice(0, 90)}${entry.note.length > 90 ? '…' : ''}"`
      : 'Revisão solicitada a partir do Diário de Aprendizagem',
    requiresConfirmation: true as const,
  };
}
