import { questionErrorCount } from '../diagnostics/error-categories.js';
/**
 * Motor do Caderno de Erros Ativo & Flashcards de Bolso (src/domain/notebook/error-notebook-engine.ts)
 *
 * Transforma erros em questões e simulados em flashcards de fixação imediata com:
 * - Enunciado resumido / contexto da questão
 * - Pegadinha da Banca / distrator identificado
 * - Conceito Correto / fundamento da resposta
 *
 * Utiliza algoritmo de repetição espaçada adaptativo para agendamento automático.
 */

import type {
  ErrorFlashcard,
  ErrorFlashcardStatus,
  FlashcardRating,
  QuestionRecord,
} from '../../core/types.js';

export interface CreateFlashcardInput {
  id?: string;
  topicId: string;
  subjectId: string;
  questionId?: string | null;
  statementSummary: string;
  bancaTrap?: string;
  correctConcept: string;
  errorCategory?: string;
  reference?: string | null;
  banca?: string | null;
  createdAt?: string;
  todayDate?: string;
}

export interface ReviewFlashcardOptions {
  todayDate?: string;
  nowISO?: string;
}

export interface FlashcardDeckStats {
  total: number;
  dueCount: number;
  pendingCount: number;
  reviewingCount: number;
  masteredCount: number;
}

export interface FlashcardFilters {
  subjectId?: string;
  topicId?: string;
  errorCategory?: string;
  status?: ErrorFlashcardStatus | 'all';
  query?: string;
}

/**
 * Adiciona dias a uma data no formato YYYY-MM-DD mantendo consistência de calendário local.
 */
function addDaysToDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cria um novo card de erro formatado e pronto para repetição espaçada.
 */
export function createErrorFlashcard(input: CreateFlashcardInput): ErrorFlashcard {
  const today = input.todayDate || getTodayString();
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id || 'efc_' + Math.random().toString(36).slice(2, 9),
    topicId: input.topicId,
    subjectId: input.subjectId,
    questionId: input.questionId || null,
    statementSummary: String(input.statementSummary || '').trim(),
    bancaTrap: input.bancaTrap ? String(input.bancaTrap).trim() : undefined,
    correctConcept: String(input.correctConcept || '').trim(),
    errorCategory: input.errorCategory ? String(input.errorCategory).trim() : undefined,
    reference: input.reference ? String(input.reference).trim() : null,
    banca: input.banca ? String(input.banca).trim() : null,
    status: 'pending',
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: today,
    createdAt: now,
  };
}

export const MASTERED_LONG_INTERVALS = Object.freeze([30, 60, 120] as const);

function resolveMasteredIntervalDays(card: ErrorFlashcard): number {
  if (card.status !== 'mastered') {
    return MASTERED_LONG_INTERVALS[0];
  }
  const current = Number(card.intervalDays) || 0;
  if (current < MASTERED_LONG_INTERVALS[0]) return MASTERED_LONG_INTERVALS[0];
  if (current < MASTERED_LONG_INTERVALS[1]) return MASTERED_LONG_INTERVALS[1];
  return MASTERED_LONG_INTERVALS[2];
}

export interface DueFlashcardsOptions {
  finalStretchSweep?: boolean;
}

/**
 * Processa a avaliação de um flashcard (Again, Hard, Good, Easy) e calcula o próximo agendamento.
 */
export function reviewErrorFlashcard(
  card: ErrorFlashcard,
  rating: FlashcardRating,
  options: ReviewFlashcardOptions = {}
): ErrorFlashcard {
  const today = options.todayDate || getTodayString();
  const now = options.nowISO || new Date().toISOString();

  let intervalDays = 1;
  let easeFactor = card.easeFactor || 2.5;
  let consecutiveSuccesses = card.consecutiveSuccesses || 0;
  let status: ErrorFlashcardStatus = 'reviewing';

  switch (rating) {
    case 'again':
      intervalDays = 1;
      consecutiveSuccesses = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      status = 'reviewing';
      break;

    case 'hard':
      intervalDays = Math.max(1, Math.round((card.intervalDays || 1) * 1.2));
      consecutiveSuccesses = consecutiveSuccesses + 1;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      status = 'reviewing';
      break;

    case 'good':
      if (consecutiveSuccesses === 0) {
        intervalDays = 2;
      } else if (consecutiveSuccesses === 1) {
        intervalDays = 4;
      } else {
        intervalDays = Math.max(1, Math.round((card.intervalDays || 1) * easeFactor));
      }
      consecutiveSuccesses += 1;
      status = consecutiveSuccesses >= 3 ? 'mastered' : 'reviewing';
      if (status === 'mastered') {
        intervalDays = resolveMasteredIntervalDays(card);
      }
      break;

    case 'easy':
      if (consecutiveSuccesses === 0) {
        intervalDays = 4;
      } else {
        intervalDays = Math.max(1, Math.round((card.intervalDays || 1) * (easeFactor + 0.5)));
      }
      consecutiveSuccesses += 1;
      easeFactor = Math.min(3.5, easeFactor + 0.15);
      status = consecutiveSuccesses >= 2 ? 'mastered' : 'reviewing';
      if (status === 'mastered') {
        intervalDays = resolveMasteredIntervalDays(card);
      }
      break;
  }

  const nextReviewDate = addDaysToDate(today, intervalDays);

  return {
    ...card,
    status,
    reviewCount: (card.reviewCount || 0) + 1,
    consecutiveSuccesses,
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    lastReviewedAt: now,
    nextReviewDate,
  };
}

/**
 * Retorna os flashcards prontos para revisão na data estipulada (vencidos ou pendentes).
 * Cartões dominados retornam quando atingem seu intervalo longo (30/60/120 dias), ou
 * imediatamente durante a varredura de Reta Final (exceto os já revisados hoje).
 */
export function getDueFlashcards(
  cards: ErrorFlashcard[] = [],
  todayDate = getTodayString(),
  options: DueFlashcardsOptions = {}
): ErrorFlashcard[] {
  return cards.filter(card => {
    if (card.status === 'pending') return true;
    if (!card.nextReviewDate || card.nextReviewDate <= todayDate) return true;
    if (options.finalStretchSweep) {
      const reviewedToday = card.lastReviewedAt && card.lastReviewedAt.slice(0, 10) === todayDate;
      return !reviewedToday;
    }
    return false;
  });
}

/**
 * Calcula o sumário estatístico do deck de flashcards.
 */
export function calculateFlashcardDeckStats(
  cards: ErrorFlashcard[] = [],
  todayDate = getTodayString(),
  options: DueFlashcardsOptions = {}
): FlashcardDeckStats {
  const dueCards = getDueFlashcards(cards, todayDate, options);
  let pendingCount = 0;
  let reviewingCount = 0;
  let masteredCount = 0;

  for (const card of cards) {
    if (card.status === 'mastered') masteredCount++;
    else if (card.status === 'pending') pendingCount++;
    else reviewingCount++;
  }

  return {
    total: cards.length,
    dueCount: dueCards.length,
    pendingCount,
    reviewingCount,
    masteredCount,
  };
}

/**
 * Aplica filtros ao conjunto de flashcards.
 */
export function filterFlashcards(
  cards: ErrorFlashcard[] = [],
  filters: FlashcardFilters = {}
): ErrorFlashcard[] {
  return cards.filter(card => {
    if (filters.subjectId && card.subjectId !== filters.subjectId) return false;
    if (filters.topicId && card.topicId !== filters.topicId) return false;
    if (filters.errorCategory && card.errorCategory !== filters.errorCategory) return false;
    if (filters.status && filters.status !== 'all' && card.status !== filters.status) return false;

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const matchStatement = card.statementSummary.toLowerCase().includes(q);
      const matchTrap = card.bancaTrap ? card.bancaTrap.toLowerCase().includes(q) : false;
      const matchConcept = card.correctConcept.toLowerCase().includes(q);
      if (!matchStatement && !matchTrap && !matchConcept) return false;
    }

    return true;
  });
}

/**
 * Registro de questões com erros que ainda não originou nenhum flashcard.
 * O registro de questões é um agregado (resolvidas/acertos), sem enunciado nem conceito: por isso
 * o app apenas SUGERE o card e pré-preenche o contexto; o conteúdo é sempre escrito pelo estudante.
 */
export interface FlashcardDraft {
  questionId: string;
  subjectId: string;
  topicId: string | null;
  date: string;
  errorCount: number;
  errorCategory?: string;
}

function dominantErrorCategory(question: QuestionRecord): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, value] of Object.entries(question.errorBreakdown || {})) {
    const count = Number(value);
    if (Number.isFinite(count) && count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best || question.errorCategory || undefined;
}

/**
 * Lista, do mais recente para o mais antigo, os registros de questões com erro (resolvidas maior
 * que acertos) sem nenhum flashcard vinculado. Função pura: não altera as entradas.
 */
export function findQuestionsAwaitingFlashcard(
  questions: QuestionRecord[] = [],
  cards: ErrorFlashcard[] = []
): FlashcardDraft[] {
  const linked = new Set(cards.map(card => card.questionId).filter(Boolean));
  return questions
    .filter(question => {
      const resolved = Number(question.resolved);
      const correct = Number(question.correct);
      return (
        Number.isFinite(resolved) &&
        Number.isFinite(correct) &&
        resolved > correct &&
        !linked.has(question.id)
      );
    })
    .map(question => ({
      questionId: question.id,
      subjectId: question.subjectId,
      topicId: question.topicId ?? null,
      date: question.date,
      errorCount: questionErrorCount(question),
      errorCategory: dominantErrorCategory(question),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function flashcardKey(card: {
  questionId?: string | null;
  subjectId: string;
  topicId: string;
  statementSummary: string;
}): string {
  const statement = String(card.statementSummary || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return [card.questionId || '', card.subjectId, card.topicId, statement].join('|');
}

export interface AddFlashcardResult {
  cards: ErrorFlashcard[];
  card: ErrorFlashcard;
  created: boolean;
}

/**
 * Inclui um flashcard de forma idempotente, sem alterar a lista recebida. O mesmo enunciado para
 * o mesmo contexto (registro de questões, disciplina e tópico) ou o mesmo identificador não gera
 * um segundo cartão, o que também protege contra duplo clique ao salvar.
 */
export function addErrorFlashcard(
  cards: ErrorFlashcard[] = [],
  input: CreateFlashcardInput
): AddFlashcardResult {
  const candidate = createErrorFlashcard(input);
  const key = flashcardKey(candidate);
  const existing = cards.find(card => card.id === candidate.id || flashcardKey(card) === key);
  if (existing) return { cards, card: existing, created: false };
  return { cards: [candidate, ...cards], card: candidate, created: true };
}

export interface WarmupSelectionOptions {
  subjectId?: string;
  banca?: string;
  errorCategory?: string;
  limit?: number;
}

/**
 * Seleciona cartões para sessão livre de "Aquecimento Pré-Prova" por disciplina, banca ou
 * categoria de erro, ordenando pelos de menor facilidade e mais recentes.
 * Função pura: não altera `intervalDays`, `easeFactor` ou `nextReviewDate` (SM-2 intacto).
 */
export function selectWarmupFlashcards(
  cards: ErrorFlashcard[] = [],
  options: WarmupSelectionOptions = {}
): ErrorFlashcard[] {
  const { subjectId, banca, errorCategory, limit = 20 } = options;
  const bancaNorm = banca ? String(banca).trim().toLowerCase() : '';
  const maxItems = Math.max(1, Math.min(100, Math.floor(Number(limit) || 20)));

  return cards
    .filter(card => {
      if (subjectId && subjectId !== 'all' && card.subjectId !== subjectId) return false;
      if (errorCategory && errorCategory !== 'all' && card.errorCategory !== errorCategory) {
        return false;
      }
      if (bancaNorm && bancaNorm !== 'all') {
        const cardBanca = String(card.banca || '')
          .trim()
          .toLowerCase();
        if (!cardBanca || !cardBanca.includes(bancaNorm)) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      const easeDiff = (Number(a.easeFactor) || 2.5) - (Number(b.easeFactor) || 2.5);
      if (Math.abs(easeDiff) > 0.01) return easeDiff;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })
    .slice(0, maxItems);
}
